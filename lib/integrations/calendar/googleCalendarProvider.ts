import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CalendarProvider,
  CreateEventInput,
  CreateEventResult,
  GetAvailabilityInput,
  GetAvailabilityResult,
} from "./index";
import { supabaseCalendarProvider } from "./supabaseCalendarProvider";

interface GoogleTokenMetadata {
  access_token: string;
  refresh_token: string;
  expiry_date?: number;
  calendar_id?: string; // defaults to "primary"
}

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

async function getTokensForBusiness(businessId: string): Promise<GoogleTokenMetadata | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("integrations")
    .select("metadata")
    .eq("business_id", businessId)
    .eq("provider", "google_calendar")
    .eq("status", "connected")
    .maybeSingle();

  const meta = data?.metadata as GoogleTokenMetadata | undefined;
  if (!meta?.access_token || !meta?.refresh_token) return null;
  return meta;
}

async function getCalendarClient(businessId: string) {
  const tokens = await getTokensForBusiness(businessId);
  if (!tokens) return null;

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  // Persist a refreshed access token back to Supabase if googleapis rotates it.
  oauth2Client.on("tokens", async (newTokens) => {
    if (!newTokens.access_token) return;
    const admin = createAdminClient();
    await admin
      .from("integrations")
      .update({
        metadata: {
          ...tokens,
          access_token: newTokens.access_token,
          expiry_date: newTokens.expiry_date,
          refresh_token: newTokens.refresh_token || tokens.refresh_token,
        },
      })
      .eq("business_id", businessId)
      .eq("provider", "google_calendar");
  });

  return { calendar: google.calendar({ version: "v3", auth: oauth2Client }), calendarId: tokens.calendar_id || "primary" };
}

async function getAvailability(input: GetAvailabilityInput): Promise<GetAvailabilityResult> {
  // Start from business-hours-aware slots (same logic as the Supabase
  // provider), then remove anything that overlaps a busy block on the
  // connected Google Calendar.
  const baseline = await supabaseCalendarProvider.getAvailability(input);
  if (!baseline.open || baseline.slots.length === 0) return baseline;

  const client = await getCalendarClient(input.businessId);
  if (!client) return baseline; // connection dropped/misconfigured — fall back gracefully

  try {
    const dayStart = `${input.date}T00:00:00Z`;
    const dayEnd = `${input.date}T23:59:59Z`;
    const freebusy = await client.calendar.freebusy.query({
      requestBody: {
        timeMin: dayStart,
        timeMax: dayEnd,
        items: [{ id: client.calendarId }],
      },
    });

    const busy = freebusy.data.calendars?.[client.calendarId]?.busy || [];
    const filteredSlots = baseline.slots.filter((slot) => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();
      return !busy.some((b) => {
        const busyStart = new Date(b.start || 0).getTime();
        const busyEnd = new Date(b.end || 0).getTime();
        return slotStart < busyEnd && slotEnd > busyStart;
      });
    });

    return { open: true, slots: filteredSlots };
  } catch (err) {
    console.error("Google Calendar freebusy check failed:", err);
    return baseline; // fail open to the business-hours baseline rather than blocking booking entirely
  }
}

async function createEvent(input: CreateEventInput): Promise<CreateEventResult> {
  const client = await getCalendarClient(input.businessId);
  if (!client) return { success: false, reason: "Google Calendar is not connected." };

  try {
    const res = await client.calendar.events.insert({
      calendarId: client.calendarId,
      requestBody: {
        summary: input.title,
        description: input.description,
        start: { dateTime: input.startTime },
        end: { dateTime: input.endTime },
      },
    });
    return { success: true, eventId: res.data.id || undefined };
  } catch (err) {
    console.error("Google Calendar event creation failed:", err);
    return { success: false, reason: "Could not create the calendar event." };
  }
}

async function updateEvent(
  eventId: string,
  businessId: string,
  input: Partial<CreateEventInput>
): Promise<CreateEventResult> {
  const client = await getCalendarClient(businessId);
  if (!client) return { success: false, reason: "Google Calendar is not connected." };

  try {
    await client.calendar.events.patch({
      calendarId: client.calendarId,
      eventId,
      requestBody: {
        summary: input.title,
        description: input.description,
        start: input.startTime ? { dateTime: input.startTime } : undefined,
        end: input.endTime ? { dateTime: input.endTime } : undefined,
      },
    });
    return { success: true, eventId };
  } catch (err) {
    console.error("Google Calendar event update failed:", err);
    return { success: false, reason: "Could not update the calendar event." };
  }
}

async function deleteEvent(eventId: string, businessId: string): Promise<{ success: boolean; reason?: string }> {
  const client = await getCalendarClient(businessId);
  if (!client) return { success: false, reason: "Google Calendar is not connected." };

  try {
    await client.calendar.events.delete({ calendarId: client.calendarId, eventId });
    return { success: true };
  } catch (err) {
    console.error("Google Calendar event deletion failed:", err);
    return { success: false, reason: "Could not remove the calendar event." };
  }
}

let singleton: CalendarProvider | null = null;

export function getGoogleCalendarProvider(): CalendarProvider {
  if (!singleton) {
    singleton = { id: "google_calendar", getAvailability, createEvent, updateEvent, deleteEvent };
  }
  return singleton;
}
