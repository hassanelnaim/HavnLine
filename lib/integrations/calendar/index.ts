/**
 * integrations/calendar/index.ts
 *
 * CalendarProvider is the single interface the AI's check_availability
 * and book_appointment tools talk to. Three implementations exist:
 *
 *  - SupabaseCalendarProvider: computes availability from
 *    business_hours + existing `appointments` rows. Always works, no
 *    external account needed — this is the default for every business.
 *
 *  - GoogleCalendarProvider: once a business connects Google Calendar
 *    (Integrations page), this takes over — it additionally checks the
 *    owner's real Google Calendar for busy blocks, and creates a real
 *    event when booking.
 *
 *  - ICloudCalendarProvider: same idea, for a business owner who uses
 *    Apple/iCloud Calendar instead — connected via CalDAV with an
 *    app-specific password rather than OAuth.
 *
 * getCalendarProviderForBusiness() picks the right one automatically.
 * If a business has both connected, Google takes priority since it was
 * the first supported provider — nothing else in the app should import
 * a specific provider directly.
 */

export interface AvailabilitySlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  label: string; // human-readable, e.g. "2:00 PM"
}

export interface GetAvailabilityInput {
  businessId: string;
  date: string; // YYYY-MM-DD, in the business's timezone
  durationMinutes: number;
}

export interface GetAvailabilityResult {
  open: boolean;
  reason?: string;
  slots: AvailabilitySlot[];
}

export interface CreateEventInput {
  businessId: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
}

export interface CreateEventResult {
  success: boolean;
  eventId?: string;
  reason?: string;
}

export interface CalendarProvider {
  id: "supabase" | "google_calendar" | "icloud_calendar";
  getAvailability(input: GetAvailabilityInput): Promise<GetAvailabilityResult>;
  createEvent(input: CreateEventInput): Promise<CreateEventResult>;
  updateEvent(eventId: string, businessId: string, input: Partial<CreateEventInput>): Promise<CreateEventResult>;
  deleteEvent(eventId: string, businessId: string): Promise<{ success: boolean; reason?: string }>;
}

import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseCalendarProvider } from "./supabaseCalendarProvider";
import { getGoogleCalendarProvider } from "./googleCalendarProvider";
import { getICloudCalendarProvider } from "./icloudCalendarProvider";

export async function getCalendarProviderForBusiness(businessId: string): Promise<CalendarProvider> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("integrations")
    .select("provider")
    .eq("business_id", businessId)
    .in("provider", ["google_calendar", "icloud_calendar"])
    .eq("status", "connected");

  const connected = (data || []).map((r) => r.provider);

  if (connected.includes("google_calendar")) {
    return getGoogleCalendarProvider();
  }
  if (connected.includes("icloud_calendar")) {
    return getICloudCalendarProvider();
  }
  return supabaseCalendarProvider;
}
