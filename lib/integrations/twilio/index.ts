/**
 * integrations/twilio/index.ts
 *
 * Interface for phone number provisioning and inbound call handling.
 * Phase 1 does not place or receive real calls — this defines the
 * shape Phase 2 will implement so the "Get a GetMade phone number"
 * and "Turn receptionist on" steps in onboarding/dashboard can call
 * a real function without any UI rewrite later.
 */

export interface PhoneNumberProvisionResult {
  phoneNumber: string | null;
  status: "provisioned" | "pending" | "not_implemented";
}

export interface TwilioClientLike {
  provisionNumber(businessId: string, areaCode?: string): Promise<PhoneNumberProvisionResult>;
  releaseNumber(businessId: string): Promise<void>;
  getInboundWebhookUrl(businessId: string): string;
}

class StubTwilioClient implements TwilioClientLike {
  async provisionNumber(_businessId: string, _areaCode?: string): Promise<PhoneNumberProvisionResult> {
    // Phase 2: call the Twilio Incoming Phone Numbers API and persist
    // the result on the business's `integrations` row (provider: 'twilio').
    return { phoneNumber: null, status: "not_implemented" };
  }

  async releaseNumber(_businessId: string) {
    return;
  }

  getInboundWebhookUrl(businessId: string) {
    // Phase 2: this is the URL Twilio will POST call events to.
    return `/api/webhooks/twilio/voice?business=${businessId}`;
  }
}

export const twilioClient: TwilioClientLike = new StubTwilioClient();
