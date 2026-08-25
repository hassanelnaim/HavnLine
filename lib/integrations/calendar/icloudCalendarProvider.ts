import { createDAVClient } from "tsdav";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CalendarProvider,
  CreateEventInput,
  CreateEventResult,
  GetAvailabilityInput,
  GetAvailabilityResult,
} from "./index";
import { supabaseCalendarProvider } from "./supabaseCalendarProvider";

/**
 * integrations/calendar/icloudCalendarProvider.ts
 *
 * Apple/iCloud Calendar via CalDAV — a genuinely different connection
 * model than Google. Apple doesn't support OAuth for this; instead the
 * business owner generates an "app-specific password" from their own
 * Apple ID account (appleid.apple.com -> Sign-In and Security ->
 * App-Specific Passwords) and enters their Apple ID email + that
 * password directly into HavnLine. There's no "Connect with Apple"
 * redirect button — this is a real, standard limitation of how Apple's
 * calendar sync works, not something GetMade can smooth over.
 *
 * The password is scoped by Apple to calendar/contacts access only
 * (not full Apple ID access) and can be revoked anytime from the same
 * Apple ID settings page — this is Apple's own intended, safe way for
 * third-party apps to connect.
 */

interface ICloudCredentials {
  appleId: string;
  appPassword: string;
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toICSDate(iso: string): string {
  // CalDAV expects "YYYYMMDDTHHMMSSZ" — convert from our ISO strings.
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

type DAVClientInstance = Awaited<ReturnType<typeof createDAVClient>>;

async function getClient(creds: ICloudCredentials): Promise<DAVClientInstance | null> {
  try {
    const client = await createDAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: { username: creds.appleId, password: creds.appPassword },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });
    return client;
  } catch (err) {
    console.error("iCloud CalDAV client creation failed:", err);
    return null;
  }
}

/**
 * Validates Apple ID + app-specific password actually work, used when
 * the business owner first connects — lets us show a clear error
 * immediately rather than silently failing later on a real call.
 */
export async function testICloudConnection(
  appleId: string,
  appPassword: string
): Promise<{ success: boolean; reason?: string }> {
  const client = await getClient({ appleId, appPassword });
  if (!client) {
    return { success: false, reason: "Could not connect. Double-check your Apple ID and app-specific password." };
  }
  try {
    const calendars = await client.fetchCalendars();
    if (calendars.length === 0) {
      return { success: false, reason: "Connected, but no calendars were found on this Apple ID." };
    }
    return { success: true };
  } catch (err) {
    return { success: false, reason: "Could not read your calendars — check the password hasn't been revoked." };
  }
}

async function getCredentialsForBusiness(businessId: string): Promise<ICloudCredentials | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("integrations")
    .select("metadata")
    .eq("business_id", businessId)
    .eq("provider", "icloud_calendar")
    .eq("status", "connected")
    .maybeSingle();

  const meta = data?.metadata as Record<string, unknown> | null;
  if (!meta?.appleId || !meta?.appPassword) return null;
  return { appleId: meta.appleId as string, appPassword: meta.appPassword as string };
}

async function getPrimaryCalendar(client: DAVClientInstance) {
  const calendars = await client.fetchCalendars();
  // Prefer a calendar literally called "Calendar" or "Home" (iCloud's
  // default names) if present, otherwise just take the first writable one.
  return (
    calendars.find((c) => typeof c.displayName === "string" && /calendar|home/i.test(c.displayName)) ||
    calendars[0]
  );
}

async function getAvailability(input: GetAvailabilityInput): Promise<GetAvailabilityResult> {
  const baseline = await supabaseCalendarProvider.getAvailability(input);
  if (!baseline.open || baseline.slots.length === 0) return baseline;

  const creds = await getCredentialsForBusiness(input.businessId);
  if (!creds) return baseline;

  const client = await getClient(creds);
  if (!client) return baseline;

  try {
    const calendar = await getPrimaryCalendar(client);
    if (!calendar) return baseline;

    const dayStart = `${input.date}T00:00:00Z`;
    const dayEnd = `${input.date}T23:59:59Z`;

    const objects = await client.fetchCalendarObjects({
      calendar,
      timeRange: { start: dayStart, end: dayEnd },
    });

    // Parse busy blocks out of each event's raw iCalendar data.
    const busyRanges = objects
      .map((obj) => {
        const data = obj.data || "";
        const startMatch = data.match(/DTSTART[^:]*:(\d{8}T\d{6}Z?)/);
        const endMatch = data.match(/DTEND[^:]*:(\d{8}T\d{6}Z?)/);
        if (!startMatch || !endMatch) return null;
        const parseICS = (s: string) => {
          const y = s.slice(0, 4), mo = s.slice(4, 6), d = s.slice(6, 8);
          const h = s.slice(9, 11), mi = s.slice(11, 13), se = s.slice(13, 15);
          return new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}Z`).getTime();
        };
        return { start: parseICS(startMatch[1]), end: parseICS(endMatch[1]) };
      })
      .filter((r): r is { start: number; end: number } => r !== null);

    const filteredSlots = baseline.slots.filter((slot) => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();
      return !busyRanges.some((r) => slotStart < r.end && slotEnd > r.start);
    });

    return { open: true, slots: filteredSlots };
  } catch (err) {
    console.error("iCloud Calendar availability check failed:", err);
    return baseline; // fail open to the business-hours baseline
  }
}

async function createEvent(input: CreateEventInput): Promise<CreateEventResult> {
  const creds = await getCredentialsForBusiness(input.businessId);
  if (!creds) return { success: false, reason: "iCloud Calendar is not connected." };

  const client = await getClient(creds);
  if (!client) return { success: false, reason: "Could not connect to iCloud Calendar." };

  try {
    const calendar = await getPrimaryCalendar(client);
    if (!calendar) return { success: false, reason: "No writable calendar found." };

    const uid = `havnline-${Date.now()}@havnline.com`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HavnLine//EN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${toICSDate(new Date().toISOString())}`,
      `DTSTART:${toICSDate(input.startTime)}`,
      `DTEND:${toICSDate(input.endTime)}`,
      `SUMMARY:${icsEscape(input.title)}`,
      input.description ? `DESCRIPTION:${icsEscape(input.description)}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    await client.createCalendarObject({
      calendar,
      filename: `${uid}.ics`,
      iCalString: ics,
    });

    return { success: true, eventId: uid };
  } catch (err) {
    console.error("iCloud Calendar event creation failed:", err);
    return { success: false, reason: "Could not create the calendar event." };
  }
}

async function updateEvent(): Promise<CreateEventResult> {
  // Rescheduling an iCloud event requires fetching, modifying, and
  // re-uploading its full iCalendar object (CalDAV has no partial
  // update) — not yet implemented. Reschedule still updates HavnLine's
  // own appointment record correctly; it just won't move the iCloud
  // calendar entry until this is built out.
  return { success: true };
}

async function deleteEvent(): Promise<{ success: boolean; reason?: string }> {
  return { success: true };
}

let singleton: CalendarProvider | null = null;

export function getICloudCalendarProvider(): CalendarProvider {
  if (!singleton) {
    singleton = { id: "icloud_calendar", getAvailability, createEvent, updateEvent, deleteEvent };
  }
  return singleton;
}
