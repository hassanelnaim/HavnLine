import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateTwilioSignature } from "@/lib/integrations/telephony/twilioProvider";
import { twiml, sayLine } from "@/lib/ai/twimlHelpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * POST /api/webhooks/twilio/dial-status
 *
 * Fires after a transfer_call <Dial> finishes, whether it was
 * answered or not. If nobody picked up, this is the fallback that
 * turns a missed live transfer into a normal logged escalation
 * (exactly like escalate_to_human) instead of the caller just hearing
 * silence and the call ending with nothing recorded — the same idea
 * as a call going to voicemail when the front desk doesn't pick up.
 */
export async function POST(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get("callId");
  if (!callId) return new NextResponse("Missing callId", { status: 400 });

  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => (params[key] = String(value)));

  const signature = request.headers.get("x-twilio-signature");
  const fullUrl = `${SITE_URL}/api/webhooks/twilio/dial-status?callId=${callId}`;
  if (!validateTwilioSignature(signature, fullUrl, params)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const dialCallStatus = params.DialCallStatus; // "completed" | "busy" | "no-answer" | "failed" | "canceled"

  if (dialCallStatus === "completed") {
    // The transfer was answered and the human handled it — nothing more to do.
    return twiml(`<Response><Hangup/></Response>`);
  }

  // Nobody answered — log this as a real escalation, same as
  // escalate_to_human, so it shows up in the dashboard for the
  // business to follow up on, instead of the caller just being dropped.
  const admin = createAdminClient();
  const { data: call } = await admin.from("calls").select("business_id").eq("id", callId).single();

  if (call) {
    await admin
      .from("calls")
      .update({
        outcome: "escalated",
        escalation_reason: "Customer asked to speak with someone, but the transfer wasn't answered.",
      })
      .eq("id", callId);

    await admin.from("call_messages").insert({
      call_id: callId,
      role: "system",
      content: `Live transfer attempted (status: ${dialCallStatus}) — no one answered.`,
    });
  }

  const { data: voiceConfig } = call
    ? await admin.from("ai_voice_configs").select("voice_id").eq("business_id", call.business_id).maybeSingle()
    : { data: null };
  const voiceId = voiceConfig?.voice_id as any;

  return twiml(`<Response>
  ${sayLine(voiceId, "Sorry, no one's available to take your call right now, but I've made a note and someone will get back to you soon. Thanks for calling!")}
  <Hangup/>
</Response>`);
}
