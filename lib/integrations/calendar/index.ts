/**
 * integrations/calendar/index.ts
 *
 * CalendarProvider is the single interface the AI's check_availability
 * and book_appointment tools talk to. Two implementations exist:
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
 * getCalendarProviderForBusiness() picks the right one automatically.
 * Nothing else in the app should import a specific provider directly.
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
  id: "supabase" | "google_calendar";
  getAvailability(input: GetAvailabilityInput): Promise<GetAvailabilityResult>;
  createEvent(input: CreateEventInput): Promise<CreateEventResult>;
  updateEvent(eventId: string, businessId: string, input: Partial<CreateEventInput>): Promise<CreateEventResult>;
  deleteEvent(eventId: string, businessId: string): Promise<{ success: boolean; reason?: string }>;
}

import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseCalendarProvider } from "./supabaseCalendarProvider";
import { getGoogleCalendarProvider } from "./googleCalendarProvider";

export async function getCalendarProviderForBusiness(businessId: string): Promise<CalendarProvider> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("integrations")
    .select("*")
    .eq("business_id", businessId)
    .eq("provider", "google_calendar")
    .eq("status", "connected")
    .maybeSingle();

  if (data) {
    return getGoogleCalendarProvider();
  }
  return supabaseCalendarProvider;
}
