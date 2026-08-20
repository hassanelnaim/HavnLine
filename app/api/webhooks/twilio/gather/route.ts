import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTwilioVoice, validateTwilioSignature } from "@/lib/integrations/telephony/twilioProvider";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function twiml(body: string) {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// A short, natural-sounding acknowledgment so the caller hears
// something immediately instead of dead air while the AI actually
// thinks (checks the calendar, looks up the customer, etc.) in the
// background. Varied on purpose so it doesn't sound like a canned
// "please wait" message.
const FILLERS = [
  "Mm-hmm, one sec.",
  "Sure, let me check.",
  "Okay, one moment.",
  "Got it, hang on.",
  "Let's see here.",
];

/**
 * POST /api/webhooks/twilio/gather
 *
 * Fires the instant Twilio finishes transcribing the caller's speech.
 * This route does almost nothing — it only exists to respond FAST with
 * a short spoken acknowledgment, then <Redirect>s to /process, which
 * does the actual (slower) AI work. Without this split, the caller
 * hears total silence for however long Claude + calendar/database
 * calls take, which reads as a dead line. With it, they hear a natural
 * "let me check" almost immediately, then the real answer a couple
 * seconds later — the same reason a human receptionist says "one
 * second" instead of going silent while they check something.
 */
export async function POST(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get("callId");
  if (!callId) return new NextResponse("Missing callId", { status: 400 });

  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => (params[key] = String(value)));

  const signature = request.headers.get("x-twilio-signature");
  const fullUrl = `${SITE_URL}/api/webhooks/twilio/gather?callId=${callId}`;
  if (!validateTwilioSignature(signature, fullUrl, params)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const admin = createAdminClient();
  const { data: call } = await admin.from("calls").select("business_id").eq("id", callId).single();
  if (!call) {
    return twiml(`<Response><Say>Sorry, something went wrong. Goodbye.</Say><Hangup/></Response>`);
  }

  const { data: voiceConfig } = await admin
    .from("ai_voice_configs")
    .select("voice_id")
    .eq("business_id", call.business_id)
    .maybeSingle();
  const voice = resolveTwilioVoice(voiceConfig?.voice_id as any);

  const speechResult = params.SpeechResult;
  const gatherAction = `${SITE_URL}/api/webhooks/twilio/gather?callId=${callId}`;

  if (!speechResult) {
    return twiml(`<Response>
  <Gather input="speech" action="${escapeXml(gatherAction)}" method="POST" speechTimeout="auto" speechModel="phone_call">
    <Say voice="${voice}">Sorry, could you say that again?</Say>
  </Gather>
  <Say voice="${voice}">I'm not able to hear you — please call back. Goodbye.</Say>
  <Hangup/>
</Response>`);
  }

  const filler = FILLERS[Math.floor(Math.random() * FILLERS.length)];
  const processUrl = `${SITE_URL}/api/webhooks/twilio/process?callId=${callId}&speech=${encodeURIComponent(speechResult)}`;

  return twiml(`<Response>
  <Say voice="${voice}">${escapeXml(filler)}</Say>
  <Redirect method="POST">${escapeXml(processUrl)}</Redirect>
</Response>`);
}
