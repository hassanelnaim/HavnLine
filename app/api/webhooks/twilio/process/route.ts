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
 * POST /api/webhooks/twilio/process
 *
 * Reached via <Redirect> from /gather, right after the caller has
 * already heard a quick "one moment" acknowledgment. This is where the
 * actual (slower) work happens: the real Claude call, tool execution,
 * calendar checks, etc. — the same handleTurn() Test Receptionist uses.
 */
export async function POST(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get("callId");
  const speechResult = request.nextUrl.searchParams.get("speech");
  if (!callId || !speechResult) return new NextResponse("Missing callId or speech", { status: 400 });

  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => (params[key] = String(value)));

  const signature = request.headers.get("x-twilio-signature");
  const fullUrl = request.nextUrl.toString();
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

  const gatherAction = `${SITE_URL}/api/webhooks/twilio/gather?callId=${callId}`;

  return twiml(`<Response>
  <Gather input="speech" action="${escapeXml(gatherAction)}" method="POST" speechTimeout="auto" speechModel="phone_call">
    <Say voice="${voice}">${escapeXml(result.reply)}</Say>
  </Gather>
  <Say voice="${voice}">Thanks for calling. Goodbye.</Say>
  <Hangup/>
</Response>`);
}
