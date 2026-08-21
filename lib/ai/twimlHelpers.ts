import { createAdminClient } from "@/lib/supabase/admin";
import { resolveTwilioVoice } from "@/lib/integrations/telephony/twilioProvider";
import type { HandleTurnResult } from "@/lib/ai/receptionist";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function twiml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function buildTurnResponseTwiml(
  businessId: string,
  callId: string,
  result: HandleTurnResult,
  voice: string
): Promise<Response> {
  const transferCall = result.toolCalls.find((tc) => tc.name === "transfer_call" && tc.result?.transferring);
  if (transferCall) {
    const admin = createAdminClient();
    const [{ data: business }, { data: twilioIntegration }] = await Promise.all([
      admin.from("businesses").select("phone").eq("id", businessId).single(),
      admin.from("integrations").select("metadata").eq("business_id", businessId).eq("provider", "twilio").maybeSingle(),
    ]);

    const getMadeNumber = (twilioIntegration?.metadata as Record<string, unknown> | null)?.phone_number as
      | string
      | undefined;

    if (business?.phone) {
      const callerIdAttr = getMadeNumber ? ` callerId="${escapeXml(getMadeNumber)}"` : "";
      return twiml(`<Response>
  <Say voice="${voice}">One moment while I connect you.</Say>
  <Dial${callerIdAttr}>${escapeXml(business.phone)}</Dial>
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

export async function lastTurnUsedTool(callId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("call_messages")
    .select("tool_call")
    .eq("call_id", callId)
    .eq("role", "ai")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Boolean(data?.tool_call);
}

export { resolveTwilioVoice };