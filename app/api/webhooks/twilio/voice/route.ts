import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveBusinessFromPhoneNumber, loadBusinessContext } from "@/lib/ai/context";
import { startCall } from "@/lib/ai/receptionist";
import { validateTwilioSignature } from "@/lib/integrations/telephony/twilioProvider";
import { OPERATIONAL_SUBSCRIPTION_STATUSES } from "@/lib/billing/stripe";
import { sayLine } from "@/lib/ai/twimlHelpers";

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
 * Twilio calls this the moment someone dials a HavnLine number. We
 * resolve which business owns that number, greet the caller by name,
 * and open a <Gather> to listen for their first sentence — which gets
 * POSTed to /gather, where the real AI turn happens.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => (params[key] = String(value)));

  const dialedNumber = params.To;
  const callerNumber = params.From || "unknown";

  // Resolve which business owns this number FIRST — we need their
  // specific sub-account auth token to correctly validate the
  // signature below, since Twilio signs with the token of whichever
  // account actually owns the number that was called.
  const resolved = await resolveBusinessFromPhoneNumber(dialedNumber);
  if (!resolved) {
    return twiml(`<Response><Say>This number is not currently configured. Goodbye.</Say><Hangup/></Response>`);
  }

  const signature = request.headers.get("x-twilio-signature");
  const fullUrl = `${SITE_URL}/api/webhooks/twilio/voice`;
  if (!validateTwilioSignature(signature, fullUrl, params, resolved.subAccountAuthToken)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const businessId = resolved.businessId;

  const context = await loadBusinessContext(businessId);
  if (!context) {
    return twiml(`<Response><Say>Sorry, we're having a technical issue. Please try again later.</Say><Hangup/></Response>`);
  }

  // The backend — not the frontend toggle — is what actually decides
  // whether this business is allowed to operate right now. This check
  // only runs at the START of a new call, so an already-connected
  // caller is never abruptly cut off mid-conversation by a billing
  // state change; it just affects whether the NEXT call gets answered.
  const admin = createAdminClient();
  const { data: billingRow } = await admin
    .from("businesses")
    .select("subscription_status")
    .eq("id", businessId)
    .single();

  const isOperational =
    !billingRow || OPERATIONAL_SUBSCRIPTION_STATUSES.includes(billingRow.subscription_status);

  if (!isOperational) {
    return twiml(`<Response><Say>Sorry, this business's line is temporarily unavailable. Please try again later.</Say><Hangup/></Response>`);
  }

  if (context.ai.status !== "online") {
    return twiml(`<Response><Say>Thanks for calling ${escapeXml(context.business.name)}. We're currently unable to take your call — please try again later.</Say><Hangup/></Response>`);
  }

  const callId = await startCall(businessId, "Phone Caller", callerNumber, "phone");
  await admin.from("call_messages").insert({
    call_id: callId,
    role: "system",
    content: `Inbound call from ${callerNumber} to ${dialedNumber}`,
  });

  const greeting = `Thanks for calling ${context.business.name}, this is ${context.ai.name}. How can I help you?`;
  const gatherAction = `${SITE_URL}/api/webhooks/twilio/gather?callId=${callId}`;
  const voice = { voiceId: context.voice?.voice_id, providerVoiceRef: context.voice?.provider_voice_ref };

  return twiml(`<Response>
  <Gather input="speech" action="${escapeXml(gatherAction)}" method="POST" speechTimeout="auto" speechModel="phone_call" timeout="15">
    ${sayLine(voice, greeting)}
  </Gather>
  ${sayLine(voice, "Sorry, I didn't catch that. Please call back. Goodbye.")}
  <Hangup/>
</Response>`);
}
