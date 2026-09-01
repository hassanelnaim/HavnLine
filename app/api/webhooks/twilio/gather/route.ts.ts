import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleTurn } from "@/lib/ai/receptionist";
import { getBusinessTwilioAuthToken } from "@/lib/ai/context";
import { validateTwilioSignature } from "@/lib/integrations/telephony/twilioProvider";
import {
  twiml,
  escapeXml,
  buildTurnResponseTwiml,
  lastTurnUsedTool,
  textLikelyNeedsTool,
  sayLine,
  getRequestUrl,
  resolveTwilioVoice,
} from "@/lib/ai/twimlHelpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// A short, natural-sounding acknowledgment so the caller hears
// something immediately instead of dead air while the AI genuinely
// needs a few seconds (checking the calendar, looking up a customer,
// etc.). This ALWAYS uses Twilio's own instant built-in voice, not
// ElevenLabs — even with ElevenLabs configured for the real answer
// that follows. Generating premium audio takes a couple of real
// seconds even for a short phrase, which was making the "quick"
// acknowledgment itself arrive 2-3 seconds late — completely
// defeating the point of having one. The real substantive answer
// right after this still uses the premium voice as normal.
const FILLERS = [
  "Sure, let me check that for you.",
  "Great, one moment.",
  "Okay, let's see here.",
  "Got it, give me a second.",
  "Sure thing, one sec.",
];

/**
 * POST /api/webhooks/twilio/gather
 *
 * Fires the instant Twilio finishes transcribing the caller's speech.
 * Decides, per turn, whether the upcoming AI response is likely to
 * take a moment — based on whether the previous turn used a tool, OR
 * whether the caller's own words sound like they'll need one — and
 * either answers immediately (fast path, most casual turns) or plays
 * a brief, INSTANT acknowledgment first and redirects to /process for
 * the real work.
 */
export async function POST(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get("callId");
  if (!callId) return new NextResponse("Missing callId", { status: 400 });

  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => (params[key] = String(value)));

  const admin = createAdminClient();
  const { data: call } = await admin.from("calls").select("business_id").eq("id", callId).single();
  if (!call) {
    return twiml(`<Response><Say>Sorry, something went wrong. Goodbye.</Say><Hangup/></Response>`);
  }

  // Validate using THIS business's own sub-account auth token — not a
  // shared master token — since that's what Twilio actually signed
  // the request with.
  const authToken = await getBusinessTwilioAuthToken(call.business_id);
  const signature = request.headers.get("x-twilio-signature");
  const fullUrl = getRequestUrl(request);
  if (!validateTwilioSignature(signature, fullUrl, params, authToken)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const { data: voiceConfig } = await admin
    .from("ai_voice_configs")
    .select("voice_id, provider_voice_ref")
    .eq("business_id", call.business_id)
    .maybeSingle();
  const voice = { voiceId: voiceConfig?.voice_id as any, providerVoiceRef: voiceConfig?.provider_voice_ref };

  const speechResult = params.SpeechResult;
  const gatherAction = `${SITE_URL}/api/webhooks/twilio/gather?callId=${callId}`;

  if (!speechResult) {
    return twiml(`<Response>
  <Gather input="speech" action="${escapeXml(gatherAction)}" method="POST" speechTimeout="auto" speechModel="phone_call" timeout="15">
    ${sayLine(voice, "Sorry, could you say that again?")}
  </Gather>
  ${sayLine(voice, "I'm not able to hear you — please call back. Goodbye.")}
  <Hangup/>
</Response>`);
  }

  const likelySlow = (await lastTurnUsedTool(callId)) || textLikelyNeedsTool(speechResult);

  if (!likelySlow) {
    // Fast path: answer directly, no filler. Most simple/casual turns
    // land here and feel snappy since there's no extra round trip.
    const result = await handleTurn(call.business_id, callId, speechResult, "phone");
    return buildTurnResponseTwiml(call.business_id, callId, result, voice);
  }

  // Slow path: acknowledge INSTANTLY (Twilio's own voice, zero
  // generation delay), then do the real work in /process, which still
  // speaks the real answer in the business's actual chosen voice.
  const filler = FILLERS[Math.floor(Math.random() * FILLERS.length)];
  const instantVoice = resolveTwilioVoice(voice.voiceId as any);
  const processUrl = `${SITE_URL}/api/webhooks/twilio/process?callId=${callId}&speech=${encodeURIComponent(speechResult)}`;

  return twiml(`<Response>
  <Say voice="${instantVoice}">${escapeXml(filler)}</Say>
  <Redirect method="POST">${escapeXml(processUrl)}</Redirect>
</Response>`);
}
