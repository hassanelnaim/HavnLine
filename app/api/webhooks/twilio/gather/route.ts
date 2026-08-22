import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleTurn } from "@/lib/ai/receptionist";
import { validateTwilioSignature } from "@/lib/integrations/telephony/twilioProvider";
import { twiml, escapeXml, buildTurnResponseTwiml, lastTurnUsedTool, sayLine } from "@/lib/ai/twimlHelpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// A short, natural-sounding acknowledgment so the caller hears
// something immediately instead of dead air while the AI genuinely
// needs a few seconds (checking the calendar, looking up a customer,
// etc.). Only used when the last AI turn on this call actually used a
// tool — see lastTurnUsedTool() — so it doesn't play before every
// single response, only the ones actually likely to take a moment.
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
 * Decides, per turn, whether the upcoming AI response is likely to
 * take a moment (based on whether the previous turn used a tool) and
 * either answers immediately (fast path, most casual turns) or plays a
 * brief acknowledgment first and redirects to /process for the real
 * work (booking/availability/lookup-heavy turns).
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
  const voiceId = voiceConfig?.voice_id as any;

  const speechResult = params.SpeechResult;
  const gatherAction = `${SITE_URL}/api/webhooks/twilio/gather?callId=${callId}`;

  if (!speechResult) {
    return twiml(`<Response>
  <Gather input="speech" action="${escapeXml(gatherAction)}" method="POST" speechTimeout="auto" speechModel="phone_call">
    ${sayLine(voiceId, "Sorry, could you say that again?")}
  </Gather>
  ${sayLine(voiceId, "I'm not able to hear you — please call back. Goodbye.")}
  <Hangup/>
</Response>`);
  }

  const likelySlow = await lastTurnUsedTool(callId);

  if (!likelySlow) {
    // Fast path: answer directly, no filler. Most simple/casual turns
    // land here and feel snappy since there's no extra round trip.
    const result = await handleTurn(call.business_id, callId, speechResult, "phone");
    return buildTurnResponseTwiml(call.business_id, callId, result, voiceId);
  }

  // Slow path: acknowledge immediately, then do the real work in /process.
  const filler = FILLERS[Math.floor(Math.random() * FILLERS.length)];
  const processUrl = `${SITE_URL}/api/webhooks/twilio/process?callId=${callId}&speech=${encodeURIComponent(speechResult)}`;

  return twiml(`<Response>
  ${sayLine(voiceId, filler)}
  <Redirect method="POST">${escapeXml(processUrl)}</Redirect>
</Response>`);
}
