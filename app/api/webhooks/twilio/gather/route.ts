import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleTurn } from "@/lib/ai/receptionist";
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

/**
 * POST /api/webhooks/twilio/gather
 *
 * Fires once per back-and-forth turn: Twilio transcribes the caller's
 * speech (SpeechResult) and posts it here. We run it through the same
 * handleTurn() the Test Receptionist uses, then speak the reply back
 * and open another <Gather> to keep the conversation going — this is
 * the turn-based pattern described in the setup notes (see README for
 * the real-time streaming upgrade path).
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

  const result = await handleTurn(call.business_id, callId, speechResult, "phone");

  // If the AI decided to transfer, connect the caller to the business's
  // real phone number instead of continuing the AI conversation.
  const transferCall = result.toolCalls.find((tc) => tc.name === "transfer_call" && tc.result?.transferring);
  if (transferCall) {
    const { data: business } = await admin.from("businesses").select("phone").eq("id", call.business_id).single();
    if (business?.phone) {
      return twiml(`<Response>
  <Say voice="${voice}">One moment while I connect you.</Say>
  <Dial>${escapeXml(business.phone)}</Dial>
</Response>`);
    }
  }

  return twiml(`<Response>
  <Gather input="speech" action="${escapeXml(gatherAction)}" method="POST" speechTimeout="auto" speechModel="phone_call">
    <Say voice="${voice}">${escapeXml(result.reply)}</Say>
  </Gather>
  <Say voice="${voice}">Thanks for calling. Goodbye.</Say>
  <Hangup/>
</Response>`);
}
