import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CalendarProvider,
  CreateEventInput,
  CreateEventResult,
  GetAvailabilityInput,
  GetAvailabilityResult,
} from "./index";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseTimeToMinutes(timeStr: string): number | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}
function minutesToLabel(mins: number): string {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function dateAtMinutes(dateStr: string, mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

async function getAvailability(input: GetAvailabilityInput): Promise<GetAvailabilityResult> {
  const admin = createAdminClient();
  const { businessId, date, durationMinutes } = input;

  const weekday = DAY_NAMES[new Date(date + "T00:00:00").getDay()];

  const { data: hoursRows } = await admin
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId)
    .eq("weekday", weekday)
    .maybeSingle();

  if (!hoursRows || !hoursRows.is_open || !hoursRows.open_time || !hoursRows.close_time) {
    return { open: false, reason: `The business is closed on ${weekday}.`, slots: [] };
  }

  const openMin = parseTimeToMinutes(hoursRows.open_time);
  const closeMin = parseTimeToMinutes(hoursRows.close_time);
  if (openMin === null || closeMin === null) {
    return { open: false, reason: "Could not read business hours.", slots: [] };
  }

  const { data: existingAppointments } = await admin
    .from("appointments")
    .select("time, service_id, service_name")
    .eq("business_id", businessId)
    .eq("date", date)
    .neq("status", "cancelled");

  const { data: services } = await admin.from("services").select("*").eq("business_id", businessId);

  const existingRanges = (existingAppointments || []).map((appt) => {
    const startMatch = appt.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    let start = 0;
    if (startMatch) {
      let h = parseInt(startMatch[1], 10);
      const m = parseInt(startMatch[2], 10);
      const ampm = startMatch[3].toUpperCase();
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      start = h * 60 + m;
    }
    const matchedService = services?.find((s) => s.id === appt.service_id || s.name === appt.service_name);
    const duration = matchedService ? matchedService.duration_minutes : 30;
    return { start, end: start + duration };
  });

  const slots = [];
  const step = 30;
  for (let start = openMin; start + durationMinutes <= closeMin; start += step) {
    const end = start + durationMinutes;
    const overlaps = existingRanges.some((r) => start < r.end && end > r.start);
    if (!overlaps) {
      slots.push({
        start: dateAtMinutes(date, start),
        end: dateAtMinutes(date, end),
        label: minutesToLabel(start),
      });
    }
  }

  return { open: true, slots };
}

async function createEvent(input: CreateEventInput): Promise<CreateEventResult> {
  // The Supabase provider doesn't have an external calendar to write to —
  // the appointment row itself (created by the book_appointment tool) IS
  // the record. Nothing further to do here; report success so the
  // caller's flow continues uniformly with the Google provider.
  return { success: true, eventId: undefined };
}

async function updateEvent(): Promise<CreateEventResult> {
  return { success: true };
}

async function deleteEvent(): Promise<{ success: boolean; reason?: string }> {
  return { success: true };
}

export const supabaseCalendarProvider: CalendarProvider = {
  id: "supabase",
  getAvailability,
  createEvent,
  updateEvent,
  deleteEvent,
};
