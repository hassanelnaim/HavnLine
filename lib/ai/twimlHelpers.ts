import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTwilioVoice } from "@/lib/integrations/telephony/twilioProvider";
import type { HandleTurnResult } from "@/lib/ai/receptionist";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function twiml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
  voice: string
): Promise<Response> {
  const transferCall = result.toolCalls.find((tc) => tc.name === "transfer_call" && tc.result?.transferring);
  if (transferCall) {
    const admin = createAdminClient();
    const { data: business } = await admin.from("businesses").select("phone").eq("id", businessId).single();
    if (business?.phone) {
      return twiml(`<Response>
  <Say voice="${voice}">One moment while I connect you.</Say>
  <Dial>${escapeXml(business.phone)}</Dial>
</Response>`);
    }
  }

  const gatherAction = `${SITE_URL}/api/webhooks/twilio/gather?callId=${callId}`;

  return twiml(`<Response>
  <Gather input="speech" action="${escapeXml(gatherAction)}" method="POST" speechTimeout="auto" speechModel="phone_call">
    <Say voice="${voice}">${escapeXml(result.reply)}</Say>
  </Gather>
  <Say voice="${voice}">Thanks for calling. Goodbye.</Say>
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
