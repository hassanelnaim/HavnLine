export interface AvailabilitySlot {
  start: string;
  end: string;
  label: string;
}

export interface GetAvailabilityInput {
  businessId: string;
  date: string;
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
  startTime: string;
  endTime: string;
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
