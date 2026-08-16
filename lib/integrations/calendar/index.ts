/**
 * integrations/calendar/index.ts
 *
 * The interface a real calendar provider (Google Calendar, Microsoft
 * Outlook) will implement. For Phase 1, both providers report as
 * "not connected" and their connect() calls are stubs — no OAuth
 * happens yet. The dashboard/integrations UI and onboarding calendar
 * step are written against this interface so wiring up real OAuth
 * later doesn't require touching any UI code.
 */

export type CalendarProviderId = "google_calendar" | "microsoft_outlook";

export interface CalendarConnectionStatus {
  provider: CalendarProviderId;
  connected: boolean;
  accountEmail?: string;
}

export interface CalendarProvider {
  id: CalendarProviderId;
  displayName: string;
  getStatus(businessId: string): Promise<CalendarConnectionStatus>;
  connect(businessId: string): Promise<{ redirectUrl?: string; error?: string }>;
  disconnect(businessId: string): Promise<void>;
}

class StubCalendarProvider implements CalendarProvider {
  constructor(public id: CalendarProviderId, public displayName: string) {}

  async getStatus(_businessId: string): Promise<CalendarConnectionStatus> {
    return { provider: this.id, connected: false };
  }

  async connect(_businessId: string) {
    // Phase 2: kick off real OAuth here and return a redirectUrl.
    return { error: "not_implemented" };
  }

  async disconnect(_businessId: string) {
    // Phase 2: revoke tokens and clear the integrations row.
    return;
  }
}

export const googleCalendarProvider: CalendarProvider = new StubCalendarProvider(
  "google_calendar",
  "Google Calendar"
);

export const microsoftOutlookProvider: CalendarProvider = new StubCalendarProvider(
  "microsoft_outlook",
  "Microsoft Outlook"
);

export const calendarProviders: CalendarProvider[] = [googleCalendarProvider, microsoftOutlookProvider];
