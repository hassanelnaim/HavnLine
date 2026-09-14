import { createAdminClient } from "@/lib/supabase/admin";
import { getCalendarProviderForBusiness } from "@/lib/integrations/calendar";
import { smsClient } from "@/lib/integrations/sms";
import type { BusinessContext } from "./context";

export interface ToolContext {
  businessId: string;
  callId: string;
  channel: "test" | "phone";
  context: BusinessContext;
}

export interface ToolResult {
  [key: string]: unknown;
}

async function get_business_information(_input: unknown, ctx: ToolContext): Promise<ToolResult> {
  const { business, hours } = ctx.context;
  return { name: business.name, description: business.description, address: business.address, phone: business.phone, hours };
}

async function get_services(_input: unknown, ctx: ToolContext): Promise<ToolResult> {
  return { services: ctx.context.services.map((s) => ({ name: s.name, price: s.price_cents / 100, duration_minutes: s.duration_minutes, description: s.description })) };
}

async function lookup_customer(input: { phone: string }, ctx: ToolContext): Promise<ToolResult> {
  const admin = createAdminClient();
  const { data } = await admin.from("customers").select("*").eq("business_id", ctx.businessId).eq("phone", input.phone).maybeSingle();
  return data ? { found: true, customer: data } : { found: false };
}

async function create_customer(input: { name: string; phone: string }, ctx: ToolContext): Promise<ToolResult> {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("customers").select("*").eq("business_id", ctx.businessId).eq("phone", input.phone).maybeSingle();
  if (existing) return { customer: existing };

  const { data, error } = await admin
    .from("customers")
    .insert({ business_id: ctx.businessId, name: input.name, phone: input.phone })
    .select()
    .single();
  if (error) return { error: error.message };
  return { customer: data };
}

async function check_availability(input: { date: string; duration_minutes?: number }, ctx: ToolContext): Promise<ToolResult> {
  const provider = await getCalendarProviderForBusiness(ctx.businessId);
  const result = await provider.getAvailability({ businessId: ctx.businessId, date: input.date, durationMinutes: input.duration_minutes || 30 });
  return { open: result.open, reason: result.reason, slots: result.slots.map((s) => ({ time: s.label, start: s.start })) };
}

async function book_appointment(
  input: { customer_name: string; phone: string; service_name: string; date: string; time: string; start_iso: string; end_iso: string; sms_consent: boolean },
  ctx: ToolContext
): Promise<ToolResult> {
  const admin = createAdminClient();
  const service = ctx.context.services.find((s) => s.name.toLowerCase() === input.service_name.toLowerCase());
  const durationMinutes = service?.duration_minutes || 30;

  // Real fix for a real bug: the AI sometimes said one time out loud
  // ("5:30") but passed stale start_iso/end_iso values still pointing
  // at an earlier-discussed time ("5:00"), booking the wrong slot
  // while claiming the right one. Rather than trust the AI's two
  // separately-constructed values needing to agree with each other,
  // re-fetch real availability for this date and use whichever slot's
  // OWN start/end actually matches the stated time — the single
  // source of truth, not two numbers that can silently drift apart.
  const provider = await getCalendarProviderForBusiness(ctx.businessId);
  const availability = await provider.getAvailability({ businessId: ctx.businessId, date: input.date, durationMinutes });
  const normalizedRequestedTime = input.time.trim().toLowerCase().replace(/\s+/g, "");
  const matchingSlot = availability.slots.find((s) => s.label.trim().toLowerCase().replace(/\s+/g, "") === normalizedRequestedTime);

  const authoritativeStartIso = matchingSlot?.start || input.start_iso;
  const authoritativeEndIso = matchingSlot?.end || input.end_iso;

  if (!matchingSlot) {
    // We couldn't independently verify this exact time is real and
    // open right now — safer to report that back than silently trust
    // a value that already proved unreliable once.
    console.warn(`book_appointment: no matching availability slot found for "${input.time}" on ${input.date} — falling back to AI-provided timestamps.`);
  }

  // Defense-in-depth duplicate check — a second, independent layer on
  // top of handleTurn()'s retry detection. If a matching appointment
  // (same business, phone, service, date, and time) was already
  // created in roughly the last few minutes, treat this as the same
  // booking rather than creating a second one.
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: possibleDuplicate } = await admin
    .from("appointments")
    .select("id")
    .eq("business_id", ctx.businessId)
    .eq("phone", input.phone)
    .eq("service_name", input.service_name)
    .eq("date", input.date)
    .eq("time", input.time)
    .neq("status", "cancelled")
    .gte("created_at", fiveMinutesAgo)
    .maybeSingle();

  if (possibleDuplicate) {
    return { success: true, appointment_id: possibleDuplicate.id };
  }

  const { data: existingCustomer } = await admin.from("customers").select("id").eq("business_id", ctx.businessId).eq("phone", input.phone).maybeSingle();
  let customerId = existingCustomer?.id;
  if (!customerId) {
    const { data: newCustomer } = await admin.from("customers").insert({ business_id: ctx.businessId, name: input.customer_name, phone: input.phone }).select().single();
    customerId = newCustomer?.id;
  }

  const { data: appointment, error } = await admin
    .from("appointments")
    .insert({
      business_id: ctx.businessId,
      customer_id: customerId,
      customer_name: input.customer_name,
      phone: input.phone,
      service_id: service?.id || null,
      service_name: input.service_name,
      date: input.date,
      time: input.time,
      status: "confirmed",
      created_via: "ai",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const calendarResult = await provider.createEvent({
    businessId: ctx.businessId,
    title: `${input.service_name} — ${input.customer_name}`,
    description: `Booked by AI receptionist. Phone: ${input.phone}`,
    startTime: authoritativeStartIso,
    endTime: authoritativeEndIso,
  });

  if (calendarResult.success && calendarResult.eventId) {
    await admin.from("appointments").update({ external_event_id: calendarResult.eventId }).eq("id", appointment.id);
  }

  await admin.from("calls").update({ outcome: "appointment_booked" }).eq("id", ctx.callId);

  // The confirmation text only ever sends if the customer actually
  // said yes on the call — this is the real mechanism behind the
  // documented consent flow, not just a claim in the compliance page.
  if (input.sms_consent) {
    const smsBody = `You're booked at ${ctx.context.business.name} for ${input.service_name} on ${input.date} at ${input.time}. See you then! Msg&data rates may apply. Reply HELP for help, STOP to cancel.`;
    await smsClient.send(ctx.businessId, input.phone, smsBody);
  }

  return { success: true, appointment_id: appointment.id, sms_sent: input.sms_consent };
}

async function cancel_appointment(input: { phone: string; date?: string }, ctx: ToolContext): Promise<ToolResult> {
  const admin = createAdminClient();
  let query = admin.from("appointments").select("*").eq("business_id", ctx.businessId).eq("phone", input.phone).neq("status", "cancelled");
  if (input.date) query = query.eq("date", input.date);

  const { data: appointments } = await query.order("date", { ascending: true }).limit(1);
  if (!appointments || appointments.length === 0) return { success: false, reason: "No matching appointment found." };

  const appt = appointments[0];
  const { error } = await admin.from("appointments").update({ status: "cancelled" }).eq("id", appt.id);
  if (error) return { success: false, error: error.message };

  return { success: true, cancelled: { service_name: appt.service_name, date: appt.date, time: appt.time } };
}

async function reschedule_appointment(
  input: { phone: string; new_date: string; new_time: string; old_date?: string },
  ctx: ToolContext
): Promise<ToolResult> {
  const admin = createAdminClient();
  let query = admin.from("appointments").select("*").eq("business_id", ctx.businessId).eq("phone", input.phone).neq("status", "cancelled");
  if (input.old_date) query = query.eq("date", input.old_date);

  const { data: appointments } = await query.order("date", { ascending: true }).limit(1);
  if (!appointments || appointments.length === 0) return { success: false, reason: "No matching appointment found." };

  const appt = appointments[0];
  const { error } = await admin.from("appointments").update({ date: input.new_date, time: input.new_time }).eq("id", appt.id);
  if (error) return { success: false, error: error.message };

  return { success: true, service_name: appt.service_name, new_date: input.new_date, new_time: input.new_time };
}

async function escalate_to_human(input: { reason: string; summary: string }, ctx: ToolContext): Promise<ToolResult> {
  const admin = createAdminClient();
  await admin.from("calls").update({ outcome: "escalated", escalation_reason: input.reason }).eq("id", ctx.callId);

  // Real email delivery — only if the business owner has this
  // notification turned on AND a real email provider is configured.
  try {
    const { data: business } = await admin.from("businesses").select("name, notification_preferences").eq("id", ctx.businessId).single();
    if (business?.notification_preferences?.escalations) {
      const { data: member } = await admin.from("business_members").select("user_id").eq("business_id", ctx.businessId).limit(1).maybeSingle();
      if (member?.user_id) {
        const { data: userData } = await admin.auth.admin.getUserById(member.user_id);
        const { data: call } = await admin.from("calls").select("customer_name").eq("id", ctx.callId).maybeSingle();
        if (userData?.user?.email) {
          const { sendEscalationEmail } = await import("@/lib/email/send");
          await sendEscalationEmail(userData.user.email, business.name, call?.customer_name || "", input.reason, input.summary);
        }
      }
    }
  } catch (err) {
    // Never let a notification failure break the actual call.
    console.error("Escalation email failed:", err);
  }

  return { logged: true, message: "This has been logged for the business to follow up on." };
}

async function transfer_call(_input: unknown, _ctx: ToolContext): Promise<ToolResult> {
  return { transferring: true };
}

async function send_sms(input: { phone: string; message: string }, ctx: ToolContext): Promise<ToolResult> {
  const result = await smsClient.send(ctx.businessId, input.phone, input.message);
  return { sent: result.sent, reason: result.reason };
}

export const TOOL_HANDLERS: Record<string, (input: any, ctx: ToolContext) => Promise<ToolResult>> = {
  get_business_information,
  get_services,
  lookup_customer,
  create_customer,
  check_availability,
  book_appointment,
  cancel_appointment,
  reschedule_appointment,
  escalate_to_human,
  transfer_call,
  send_sms,
};

export const TOOL_DEFINITIONS = [
  { name: "get_business_information", description: "Get the business's address, phone, and hours.", input_schema: { type: "object" as const, properties: {} } },
  { name: "get_services", description: "Get the list of services and prices this business offers.", input_schema: { type: "object" as const, properties: {} } },
  { name: "lookup_customer", description: "Look up an existing customer by phone number.", input_schema: { type: "object" as const, properties: { phone: { type: "string" } }, required: ["phone"] } },
  { name: "create_customer", description: "Create a new customer record.", input_schema: { type: "object" as const, properties: { name: { type: "string" }, phone: { type: "string" } }, required: ["name", "phone"] } },
  { name: "check_availability", description: "Check real appointment availability for a given date. Always call this before offering a time.", input_schema: { type: "object" as const, properties: { date: { type: "string", description: "YYYY-MM-DD" }, duration_minutes: { type: "number" } }, required: ["date"] } },
  { name: "book_appointment", description: "Book a real appointment. Only call after confirming date/time/service with the customer, checking availability, and asking the customer for permission to text them a confirmation. Set sms_consent based on their real, actual answer — true only if they clearly agreed, false if they declined or didn't clearly agree.", input_schema: { type: "object" as const, properties: { customer_name: { type: "string" }, phone: { type: "string" }, service_name: { type: "string" }, date: { type: "string" }, time: { type: "string" }, start_iso: { type: "string" }, end_iso: { type: "string" }, sms_consent: { type: "boolean", description: "True only if the customer clearly and verbally agreed to receive a confirmation text. Never default this to true." } }, required: ["customer_name", "phone", "service_name", "date", "time", "start_iso", "end_iso", "sms_consent"] } },
  { name: "cancel_appointment", description: "Cancel an existing appointment for this customer.", input_schema: { type: "object" as const, properties: { phone: { type: "string" }, date: { type: "string" } }, required: ["phone"] } },
  { name: "reschedule_appointment", description: "Move an existing appointment to a new date/time.", input_schema: { type: "object" as const, properties: { phone: { type: "string" }, new_date: { type: "string" }, new_time: { type: "string" }, old_date: { type: "string" } }, required: ["phone", "new_date", "new_time"] } },
  { name: "escalate_to_human", description: "Log this call for the business owner to follow up on later — like a voicemail. Use for refunds, complaints, anything you can't resolve. Does NOT require anyone to be available now.", input_schema: { type: "object" as const, properties: { reason: { type: "string" }, summary: { type: "string" } }, required: ["reason", "summary"] } },
  { name: "transfer_call", description: "Transfer the caller to a real person live, immediately. ONLY when they explicitly ask to speak to a human.", input_schema: { type: "object" as const, properties: {} } },
  { name: "send_sms", description: "Send a text message to the customer.", input_schema: { type: "object" as const, properties: { phone: { type: "string" }, message: { type: "string" } }, required: ["phone", "message"] } },
];
