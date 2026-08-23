import twilio from "twilio";
import type { VoiceId } from "@/lib/database/types";

/**
 * integrations/telephony/twilioProvider.ts
 *
 * All direct Twilio SDK usage lives here — nothing else in the app
 * imports the `twilio` package directly.
 *
 * TWILIO SUB-ACCOUNTS — real per-business isolation
 * --------------------------------------------------
 * Every business gets its own Twilio SUB-ACCOUNT (its own account SID
 * + auth token, created under your one master account), and its phone
 * number lives inside that sub-account, not the master one. This
 * means:
 *   - Each business's calls, SMS, and usage are cleanly separated in
 *     Twilio's own records — not just in our database.
 *   - If one business's number is ever flagged for abuse or spam, it
 *     can't affect any other business's number or reputation.
 *   - Webhook signature validation for a given business's calls uses
 *     THAT business's sub-account auth token, not the master one —
 *     this is a real security detail, not just organizational: Twilio
 *     signs webhook requests using the auth token of whichever account
 *     actually owns the number that was called.
 *
 * IMPORTANT — what sub-accounts do NOT do: they don't create separate
 * billing wallets. Every sub-account's usage still bills to your one
 * master account's payment method — sub-accounts are for isolation and
 * organization, not per-customer credit cards. That's what the Stripe
 * subscription side of this app is for.
 */

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
}

function getMasterCredentials(): TwilioCredentials | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return { accountSid, authToken };
}

function getClient(creds?: TwilioCredentials | null) {
  const resolved = creds || getMasterCredentials();
  if (!resolved) return null;
  return twilio(resolved.accountSid, resolved.authToken);
}

export function isTwilioConfigured(): boolean {
  return Boolean(getMasterCredentials());
}

/**
 * Creates a new Twilio sub-account for a business. Called once, the
 * first time a business provisions a phone number.
 */
export async function createSubAccount(
  businessName: string
): Promise<{ success: boolean; accountSid?: string; authToken?: string; reason?: string }> {
  const masterClient = getClient();
  if (!masterClient) return { success: false, reason: "Twilio is not configured." };

  try {
    const subAccount = await masterClient.api.v2010.accounts.create({
      friendlyName: `HavnLine — ${businessName}`.slice(0, 64),
    });
    return { success: true, accountSid: subAccount.sid, authToken: subAccount.authToken };
  } catch (err) {
    console.error("Twilio sub-account creation failed:", err);
    return { success: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Maps GetMade's internal, business-owner-facing voice IDs to a real
 * Twilio <Say> voice, used only as a fallback when ElevenLabs isn't
 * configured. The business owner never sees "Polly" or "Twilio"
 * anywhere, only their chosen name (Alex, Sarah, James, Emma).
 */
const VOICE_MAP: Record<VoiceId, string> = {
  alex_professional: "Polly.Matthew-Neural",
  sarah_warm: "Polly.Joanna-Neural",
  james_calm: "Polly.Stephen-Neural",
  emma_friendly: "Polly.Kendra-Neural",
  custom: "Polly.Matthew-Neural",
};

export function resolveTwilioVoice(voiceId: VoiceId | null | undefined): string {
  return (voiceId && VOICE_MAP[voiceId]) || "Polly.Matthew-Neural";
}

export interface ProvisionNumberResult {
  success: boolean;
  phoneNumber?: string;
  reason?: string;
}

/**
 * Searches for and purchases a real phone number UNDER THE GIVEN
 * SUB-ACCOUNT (not the master account), then points its voice webhook
 * at HavnLine's inbound-call route. Requires a funded Twilio account —
 * this makes a real, billable API call.
 */
export async function provisionNumber(
  subAccountCreds: TwilioCredentials,
  areaCode?: string
): Promise<ProvisionNumberResult> {
  const client = getClient(subAccountCreds);
  if (!client) return { success: false, reason: "Twilio is not configured." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return { success: false, reason: "NEXT_PUBLIC_SITE_URL is not set." };

  try {
    const available = await client.availablePhoneNumbers("US").local.list({
      areaCode: areaCode ? parseInt(areaCode, 10) : undefined,
      limit: 1,
    });

    if (available.length === 0) {
      return { success: false, reason: "No numbers available for that area code." };
    }

    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
      voiceUrl: `${siteUrl}/api/webhooks/twilio/voice`,
      voiceMethod: "POST",
      statusCallback: `${siteUrl}/api/webhooks/twilio/status`,
      statusCallbackMethod: "POST",
    });

    return { success: true, phoneNumber: purchased.phoneNumber };
  } catch (err) {
    console.error("Twilio number provisioning failed:", err);
    return { success: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function sendSms(
  subAccountCreds: TwilioCredentials | null,
  to: string,
  from: string,
  body: string
): Promise<{ sent: boolean; reason?: string }> {
  const client = getClient(subAccountCreds);
  if (!client) {
    console.log(`[twilio-sms-stub] to=${to} body="${body}"`);
    return { sent: false, reason: "Twilio not configured (logged instead)." };
  }
  try {
    await client.messages.create({ to, from, body });
    return { sent: true };
  } catch (err) {
    console.error("Twilio SMS send failed:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function releaseNumber(
  subAccountCreds: TwilioCredentials | null,
  phoneNumber: string
): Promise<{ success: boolean; reason?: string }> {
  const client = getClient(subAccountCreds);
  if (!client) return { success: false, reason: "Twilio is not configured." };

  try {
    const numbers = await client.incomingPhoneNumbers.list({ phoneNumber, limit: 1 });
    if (numbers.length === 0) {
      return { success: false, reason: "Number not found on this sub-account." };
    }
    await client.incomingPhoneNumbers(numbers[0].sid).remove();
    return { success: true };
  } catch (err) {
    console.error("Twilio number release failed:", err);
    return { success: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Validates that an inbound webhook request really came from Twilio.
 * Takes the auth token explicitly — for a sub-account's number, this
 * MUST be that sub-account's own auth token, not the master account's,
 * since that's what Twilio actually signed the request with.
 */
export function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>,
  authToken?: string | null
): boolean {
  const token = authToken || process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature) return false;
  return twilio.validateRequest(token, signature, url, params);
}
