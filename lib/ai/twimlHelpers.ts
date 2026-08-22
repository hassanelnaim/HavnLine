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

export function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Builds the TwiML markup for a single spoken line. If ElevenLabs is
 * configured, this uses <Play> pointing at /api/tts, which generates
 * real premium-voice audio on the fly — either the business's own
 * hand-picked ElevenLabs voice (voice.providerVoiceRef) or one of the
 * 4 preset defaults. If ElevenLabs isn't configured, it falls back to
 * Twilio's own <Say> with the mapped Amazon Polly voice, so the app
 * keeps working exactly as before with zero extra setup.
 *
 * Every place that speaks to a caller should go through this function
 * rather than building <Say>/<Play> tags directly.
 */
export function sayLine(voice: VoiceSelection, text: string): string {
  if (isElevenLabsConfigured()) {
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
  <Gather input="speech" action="${escapeXml(gatherAction)}" method="POST" speechTimeout="auto" speechModel="phone_call">
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

export { resolveTwilioVoice };
