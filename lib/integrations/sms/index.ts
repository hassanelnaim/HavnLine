import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms as twilioSendSms, isTwilioConfigured } from "@/lib/integrations/telephony/twilioProvider";

/**
 * integrations/sms/index.ts
 *
 * Thin wrapper the AI tools call — resolves the business's assigned
 * GetMade number as the "from" address, then delegates to the Twilio
 * provider. Falls back to a console-logged stub if Twilio isn't
 * configured, so the rest of the app keeps working without it.
 */

export interface SmsClientLike {
  send(businessId: string, to: string, message: string): Promise<{ sent: boolean; reason?: string }>;
}

class TwilioBackedSmsClient implements SmsClientLike {
  async send(businessId: string, to: string, message: string) {
    if (!isTwilioConfigured()) {
      console.log(`[sms-stub] business=${businessId} to=${to} message="${message}"`);
      return { sent: false, reason: "Twilio not configured." };
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from("integrations")
      .select("metadata")
      .eq("business_id", businessId)
      .eq("provider", "twilio")
      .eq("status", "connected")
      .maybeSingle();

    const fromNumber = (data?.metadata as Record<string, unknown> | null)?.phone_number as string | undefined;
    if (!fromNumber) {
      return { sent: false, reason: "No GetMade phone number provisioned for this business yet." };
    }

    return twilioSendSms(to, fromNumber, message);
  }
}

export const smsClient: SmsClientLike = new TwilioBackedSmsClient();
