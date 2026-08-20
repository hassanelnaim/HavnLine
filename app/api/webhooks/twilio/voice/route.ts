import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveBusinessIdFromPhoneNumber, loadBusinessContext } from "@/lib/ai/context";
import { startCall } from "@/lib/ai/receptionist";
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
 * POST /api/webhooks/twilio/voice
 *
 * Twilio calls this the moment someone dials a GetMade number. We
 * resolve which business owns that number, greet the caller by name,
 * and open a <Gather> to listen for their first sentence — which gets
 * POSTed to /gather, where the real AI turn happens.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => (params[key] = String(value)));

  const signature = request.headers.get("x-twilio-signature");
  const fullUrl = `${SITE_URL}/api/webhooks/twilio/voice`;
  if (!validateTwilioSignature(signature, fullUrl, params)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const dialedNumber = params.To;
  const callerNumber = params.From || "unknown";

  const businessId = await resolveBusinessIdFromPhoneNumber(dialedNumber);
  if (!businessId) {
    return twiml(`<Response><Say>This number is not currently configured. Goodbye.</Say><Hangup/></Response>`);
  }

  const context = await loadBusinessContext(businessId);
  if (!context) {
    return twiml(`<Response><Say>Sorry, we're having a technical issue. Please try again later.</Say><Hangup/></Response>`);
  }

  const callId = await startCall(businessId, "Phone Caller", callerNumber, "phone");
  const admin = createAdminClient();
  await admin.from("call_messages").insert({
    call_id: callId,
    role: "system",
    content: `Inbound call from ${callerNumber} to ${dialedNumber}`,
  });

  const voice = resolveTwilioVoice(context.voice?.voice_id);
  const greeting = `Thanks for calling ${context.business.name}, this is ${context.ai.name}. How can I help you?`;
  const gatherAction = `${SITE_URL}/api/webhooks/twilio/gather?callId=${callId}`;

  return twiml(`<Response>
  <Gather input="speech" action="${escapeXml(gatherAction)}" method="POST" speechTimeout="auto" speechModel="phone_call">
    <Say voice="${voice}">${escapeXml(greeting)}</Say>
  </Gather>
  <Say voice="${voice}">Sorry, I didn't catch that. Please call back. Goodbye.</Say>
  <Hangup/>
</Response>`);
}
