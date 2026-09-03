import { NextRequest, NextResponse } from "next/server";
import { endCall } from "@/lib/ai/receptionist";
import { resolveBusinessFromPhoneNumber } from "@/lib/ai/context";
import { validateTwilioSignature } from "@/lib/integrations/telephony/twilioProvider";
import { getRequestUrl } from "@/lib/ai/twimlHelpers";

/**
 * POST /api/webhooks/twilio/status
 *
 * Twilio posts here when a call ends. We use it to close out the call
 * record with the real duration Twilio reports.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => (params[key] = String(value)));

  const resolved = await resolveBusinessFromPhoneNumber(params.To);
  const signature = request.headers.get("x-twilio-signature");
  const fullUrl = getRequestUrl(request);
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
