import { NextRequest, NextResponse } from "next/server";
import { endCall } from "@/lib/ai/receptionist";
import { resolveBusinessFromPhoneNumber } from "@/lib/ai/context";
import { validateTwilioSignature } from "@/lib/integrations/telephony/twilioProvider";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * POST /api/webhooks/twilio/status
 *
 * Twilio posts here when a call ends (hangup, no-answer, etc). We use
 * it to close out the call record with the real duration Twilio
 * reports, independent of whether the AI conversation flow reached a
 * natural end.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => (params[key] = String(value)));

  // Resolve the owning business (and their sub-account auth token) from
  // the dialed number, same as the voice webhook — this endpoint is
  // registered at the phone-number level, so it's shared across every
  // call to that number, not tied to one call up front.
  const resolved = await resolveBusinessFromPhoneNumber(params.To);
  const signature = request.headers.get("x-twilio-signature");
  const fullUrl = `${SITE_URL}/api/webhooks/twilio/status`;
  if (!validateTwilioSignature(signature, fullUrl, params, resolved?.subAccountAuthToken)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const callId = request.nextUrl.searchParams.get("callId");
  const duration = parseInt(params.CallDuration || "0", 10);

  if (callId) {
    await endCall(callId, duration);
  }

  return new NextResponse("OK");
}
