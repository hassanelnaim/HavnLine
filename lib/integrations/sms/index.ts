import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms as twilioSendSms, isTwilioConfigured } from "@/lib/integrations/telephony/twilioProvider";

/**
 * integrations/sms/index.ts
 *
 * Thin wrapper the AI tools call — resolves the business's own
 * sub-account credentials and assigned number, then delegates to the
 * Twilio provider so the message sends (and bills) under that
 * specific business's sub-account, not the shared master account.
 * Falls back to a console-logged stub if Twilio isn't configured.
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

    const meta = data?.metadata as Record<string, unknown> | null;
    const fromNumber = meta?.phone_number as string | undefined;
    const subAccountSid = meta?.subaccount_sid as string | undefined;
    const subAccountAuthToken = meta?.subaccount_auth_token as string | undefined;

    if (!fromNumber) {
      return { sent: false, reason: "No HavnLine phone number provisioned for this business yet." };
    }

    const creds = subAccountSid && subAccountAuthToken ? { accountSid: subAccountSid, authToken: subAccountAuthToken } : null;
    return twilioSendSms(creds, to, fromNumber, message);
  }
}

export const smsClient: SmsClientLike = new TwilioBackedSmsClient();
