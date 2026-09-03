import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTwilioVoice } from "@/lib/integrations/telephony/twilioProvider";
import { isElevenLabsConfigured } from "@/lib/integrations/telephony/elevenlabsProvider";
import type { HandleTurnResult } from "@/lib/ai/receptionist";
import type { VoiceId } from "@/lib/database/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export interface VoiceSelection {
  voiceId: VoiceId | null | undefined;
  providerVoiceRef?: string | null;
}

export function twiml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: { "Content-Type": "text/xml" },
  });
}

/**
 * Reconstructs the EXACT public URL Twilio actually requested, built
 * directly from the incoming request's own headers rather than
 * `request.nextUrl` or an env var. This matters specifically for
 * Twilio signature validation: Twilio computes its signature based on
 * the literal URL it called, and behind Vercel's proxy layer (or right
 * after switching to a custom domain), Next.js's own URL parsing can
 * sometimes report something subtly different from what the client
 * actually addressed. Reading straight from the `host` and
 * `x-forwarded-proto` headers is the most reliable way to match
 * exactly what Twilio signed against.
 */
export function getRequestUrl(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}${url.pathname}${url.search}`;
}

export function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Builds the TwiML markup for a single spoken line. If ElevenLabs is
 * configured, this uses <Play> pointing at /api/tts, which generates
 * real premium-voice audio on the fly. If not configured — OR if
 * forceInstant is true — it uses Twilio's own instant built-in <Say>
 * voice instead, with zero generation delay.
 *
 * forceInstant exists specifically for short filler acknowledgments
 * ("one sec", "let me check that") where even a few seconds of
 * ElevenLabs generation time defeats the entire purpose of having a
 * quick acknowledgment at all. This deliberately reuses the exact same
 * <Say> code path that already runs whenever ElevenLabs isn't
 * configured — not new, separate logic — specifically to avoid
 * introducing an untested branch into a webhook this critical.
 */
export function sayLine(voice: VoiceSelection, text: string, forceInstant: boolean = false): string {
  if (isElevenLabsConfigured() && !forceInstant) {
    const params = new URLSearchParams({ text, voiceId: voice.voiceId || "alex_professional" });
    if (voice.providerVoiceRef) params.set("providerVoiceRef", voice.providerVoiceRef);
    const ttsUrl = `${SITE_URL}/api/tts?${params.toString()}`;
    return `<Play>${escapeXml(ttsUrl)}</Play>`;
  }
  const twilioVoice = resolveTwilioVoice(voice.voiceId as any);
  return `<Say voice="${twilioVoice}">${escapeXml(text)}</Say>`;
}

/**
 * Builds the TwiML for a completed AI turn — either a transfer to a
 * real human, or the spoken reply plus another <Gather> to keep
 * listening. Shared by both the "answered immediately" fast path and
 * the "answered after a filler" path so they behave identically.
 */
export async function buildTurnResponseTwiml(
  businessId: string,
  callId: string,
  result: HandleTurnResult,
  voice: VoiceSelection
): Promise<Response> {
  const transferCall = result.toolCalls.find((tc) => tc.name === "transfer_call" && tc.result?.transferring);
  if (transferCall) {
    const admin = createAdminClient();
    const [{ data: business }, { data: twilioIntegration }] = await Promise.all([
      admin.from("businesses").select("phone").eq("id", businessId).single(),
      admin.from("integrations").select("metadata").eq("business_id", businessId).eq("provider", "twilio").maybeSingle(),
    ]);

    const getMadeNumber = (twilioIntegration?.metadata as Record<string, unknown> | null)?.phone_number as
      | string
      | undefined;

    if (business?.phone) {
      const callerIdAttr = getMadeNumber ? ` callerId="${escapeXml(getMadeNumber)}"` : "";
      const dialStatusAction = `${SITE_URL}/api/webhooks/twilio/dial-status?callId=${callId}`;
      return twiml(`<Response>
  ${sayLine(voice, "One moment while I connect you.")}
  <Dial${callerIdAttr} timeout="20" action="${escapeXml(dialStatusAction)}" method="POST">${escapeXml(business.phone)}</Dial>
</Response>`);
    }
  }

  const gatherAction = `${SITE_URL}/api/webhooks/twilio/gather?callId=${callId}`;

  return twiml(`<Response>
  <Gather input="speech" action="${escapeXml(gatherAction)}" method="POST" speechTimeout="auto" speechModel="phone_call" timeout="15">
    ${sayLine(voice, result.reply)}
  </Gather>
  ${sayLine(voice, "Thanks for calling. Goodbye.")}
  <Hangup/>
</Response>`);
}

/**
 * Whether the AI's most recent turn on this call used a tool. This is
 * the real signal for "the next turn is likely to take a few seconds
 * too" — booking/availability/lookup flows tend to have several
 * tool-using turns in a row, while small talk and simple follow-ups
 * ("thanks", "okay") don't. Used to decide whether to play the "one
 * moment" filler, instead of playing it before every single response
 * regardless of whether it's actually needed.
 */
export async function lastTurnUsedTool(callId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("call_messages")
    .select("tool_call")
    .eq("call_id", callId)
    .eq("role", "ai")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Boolean(data?.tool_call);
}

/**
 * Catches the specific gap lastTurnUsedTool() alone misses: the FIRST
 * message in a conversation that will need a tool (e.g. "I'd like to
 * book an appointment" right after the greeting) has no previous
 * tool-using turn to predict from, so it was falling through to the
 * fast/no-filler path and hitting a real multi-second silent gap.
 * Checking the customer's own words for booking/lookup-shaped language
 * catches this directly, on top of the previous-turn signal.
 */
const LIKELY_SLOW_KEYWORDS = [
  "book", "appointment", "schedule", "reschedule", "cancel",
  "available", "availability", "price", "cost", "how much",
  "hours", "open", "closed", "service", "refund", "talk to", "speak to", "human", "person",
];

export function textLikelyNeedsTool(text: string): boolean {
  const lower = text.toLowerCase();
  return LIKELY_SLOW_KEYWORDS.some((kw) => lower.includes(kw));
}

export { resolveTwilioVoice };
