/**
 * integrations/sms/index.ts
 *
 * Interface for outbound SMS (appointment confirmations, reminders).
 * No real messages are sent in Phase 1.
 */

export interface SmsClientLike {
  send(businessId: string, to: string, message: string): Promise<{ sent: boolean }>;
}

class StubSmsClient implements SmsClientLike {
  async send(_businessId: string, to: string, message: string) {
    console.log(`[stub-sms] to=${to} message="${message}"`);
    return { sent: false };
  }
}

export const smsClient: SmsClientLike = new StubSmsClient();
