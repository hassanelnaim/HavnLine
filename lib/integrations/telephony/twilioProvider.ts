import twilio from "twilio";
import type { VoiceId } from "@/lib/database/types";

/**
 * integrations/telephony/twilioProvider.ts
 *
 * All direct Twilio SDK usage lives here — nothing else in the app
 * imports the `twilio` package directly. This keeps Twilio swappable
 * and keeps API credentials out of the rest of the codebase.
 */

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

/**
 * Maps GetMade's internal, business-owner-facing voice IDs to a real
 * Twilio <Say> voice. Twilio's built-in Say verb supports Amazon Polly
 * neural voices out of the box — no separate voice-provider account
 * needed for Phase 2. The business owner never sees "Polly" or
 * "Twilio" anywhere, only their chosen name (Alex, Sarah, James, Emma).
 */
const VOICE_MAP: Record<VoiceId, string> = {
  alex_professional: "Polly.Matthew-Neural",
  sarah_warm: "Polly.Joanna-Neural",
  james_calm: "Polly.Stephen-Neural",
  emma_friendly: "Polly.Kendra-Neural",
  // Falls back to a sensible default if a business picked a custom
  // ElevenLabs voice but ElevenLabs isn't configured for some reason
  // (e.g. the key was removed) — should rarely actually be hit.
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
 * Searches for and purchases a real phone number, then points its voice
 * webhook at GetMade's inbound-call route. Requires a funded/trial
 * Twilio account — this makes a real, billable API call.
 */
export async function provisionNumber(areaCode?: string): Promise<ProvisionNumberResult> {
  const client = getClient();
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

export async function sendSms(to: string, from: string, body: string): Promise<{ sent: boolean; reason?: string }> {
  const client = getClient();
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

export async function releaseNumber(phoneNumber: string): Promise<{ success: boolean; reason?: string }> {
  const client = getClient();
  if (!client) return { success: false, reason: "Twilio is not configured." };

  try {
    const numbers = await client.incomingPhoneNumbers.list({ phoneNumber, limit: 1 });
    if (numbers.length === 0) {
      return { success: false, reason: "Number not found on this account." };
    }
    await client.incomingPhoneNumbers(numbers[0].sid).remove();
    return { success: true };
  } catch (err) {
    console.error("Twilio number release failed:", err);
    return { success: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}

export function isTwilioConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Validates that an inbound webhook request really came from Twilio,
 * using the account's auth token to verify the X-Twilio-Signature
 * header. Every webhook route calls this before trusting the payload.
 */
export function validateTwilioSignature(signature: string | null, url: string, params: Record<string, string>): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature) return false;
  return twilio.validateRequest(token, signature, url, params);
}
