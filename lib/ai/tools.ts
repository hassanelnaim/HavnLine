import { createAdminClient } from "@/lib/supabase/admin";
import { getCalendarProviderForBusiness } from "@/lib/integrations/calendar";
import { smsClient } from "@/lib/integrations/sms";
import type { BusinessContext } from "./context";

export interface ToolExecContext {
  businessId: string;
  callId: string | null;
  context: BusinessContext;
  channel: "test" | "phone";
}

export const toolDefinitions = [
  {
    name: "get_business_information",
    description: "Get the business's name, description, address, phone, website, and hours. Use when a customer asks general questions about the business.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_services",
    description: "Get the list of services this business offers, with prices and durations.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "lookup_customer",
    description: "Search for an existing customer by phone number, email, or name. Call this before create_customer to avoid duplicates.",
    input_schema: {
      type: "object",
      properties: {
        phone: { type: "string" },
        email: { type: "string" },
        name: { type: "string" },
      },
    },
  },
  {
    name: "create_customer",
    description: "Create a new customer profile. Only call this after lookup_customer confirms they don't already exist.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        notes: { type: "string" },
      },
      required: ["name", "phone"],
    },
  },
  {
    name: "check_availability",
    description: "Check real open appointment slots for a date and service. ALWAYS call this before offering or confirming any time to a customer.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        service: { type: "string", description: "Exact service name" },
      },
      required: ["date", "service"],
    },
  },
  {
    name: "book_appointment",
    description: "Book an appointment. Only call this after check_availability confirmed the slot is open and you have the customer's name and phone.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        time: { type: "string", description: "e.g. '2:00 PM', must match a slot returned by check_availability" },
        service: { type: "string" },
        customerName: { type: "string" },
        customerPhone: { type: "string" },
        notes: { type: "string" },
      },
      required: ["date", "time", "service", "customerName", "customerPhone"],
    },
  },
  {
    name: "cancel_appointment",
    description: "Cancel an existing appointment.",
    input_schema: {
      type: "object",
      properties: {
        appointmentId: { type: "string", description: "If known" },
        customerPhone: { type: "string" },
        date: { type: "string" },
      },
      required: ["customerPhone"],
    },
  },
  {
    name: "reschedule_appointment",
    description: "Move an existing appointment to a new available time. Call check_availability first for the new time.",
    input_schema: {
      type: "object",
      properties: {
        appointmentId: { type: "string" },
        customerPhone: { type: "string" },
        newDate: { type: "string" },
        newTime: { type: "string" },
      },
      required: ["customerPhone", "newDate", "newTime"],
    },
  },
  {
    name: "escalate_to_human",
    description: "Log a message for the business to follow up on later — like leaving a voicemail, not urgent. Use for refund requests, complaints, angry customers, or anything genuinely outside your enabled responsibilities. Do NOT use this for discount questions — check the active promotions list in your instructions first and answer directly from there.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string" },
        details: { type: "string" },
        customerName: { type: "string" },
        customerPhone: { type: "string" },
      },
      required: ["reason", "details"],
    },
  },
  {
    name: "transfer_call",
    description: "Connect the customer to a real person LIVE, right now. Only use this when the customer explicitly asks to speak with a human/person/someone else — never just because a question is hard. Only usable on real phone calls, not the text preview.",
    input_schema: {
      type: "object",
      properties: { reason: { type: "string" } },
      required: ["reason"],
    },
  },
  {
    name: "send_sms",
    description: "Send a text message confirmation to the customer, e.g. after booking. Only send if the business has SMS confirmations enabled and you have the customer's phone number.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string" },
        message: { type: "string" },
      },
      required: ["to", "message"],
    },
  },
];

export async function executeTool(name: string, input: any, ctx: ToolExecContext): Promise<any> {
  const admin = createAdminClient();
  const { businessId, context } = ctx;

  switch (name) {
    case "get_business_information": {
      return {
        name: context.business.name,
        description: context.business.description,
        address: context.business.address,
        phone: context.business.phone,
        website: context.business.website,
        hours: context.hours.map((h) => ({ day: h.weekday, open: h.is_open, openTime: h.open_time, closeTime: h.close_time })),
      };
    }

    case "get_services": {
      return {
        services: context.services.map((s) => ({
          name: s.name,
          priceDollars: (s.price_cents / 100).toFixed(2),
          durationMinutes: s.duration_minutes,
          description: s.description,
        })),
      };
    }

    case "lookup_customer": {
      let query = admin.from("customers").select("*").eq("business_id", businessId);
      if (input.phone) query = query.eq("phone", input.phone);
      else if (input.email) query = query.eq("email", input.email);
      else if (input.name) query = query.ilike("name", `%${input.name}%`);
      const { data, error } = await query.limit(5);
      if (error) return { found: false };
      return { found: (data || []).length > 0, customers: data || [] };
    }

    case "create_customer": {
      const { data, error } = await admin
        .from("customers")
        .insert({
          business_id: businessId,
          name: input.name,
          phone: input.phone,
          email: input.email || null,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, customer: data };
    }

    case "check_availability": {
      const service = context.services.find((s) => s.name.toLowerCase() === (input.service || "").toLowerCase());
      if (!service) {
        return { open: false, reason: `"${input.service}" is not a service this business offers.`, slots: [] };
      }
      const provider = await getCalendarProviderForBusiness(businessId);
      const result = await provider.getAvailability({
        businessId,
        date: input.date,
        durationMinutes: service.duration_minutes,
      });
      return {
        open: result.open,
        reason: result.reason,
        slots: result.slots.map((s) => s.label),
      };
    }

    case "book_appointment": {
      const service = context.services.find((s) => s.name.toLowerCase() === (input.service || "").toLowerCase());
      if (!service) {
        return { success: false, reason: `"${input.service}" is not a service this business offers.` };
      }

      const provider = await getCalendarProviderForBusiness(businessId);
      const availability = await provider.getAvailability({
        businessId,
        date: input.date,
        durationMinutes: service.duration_minutes,
      });
      const matchedSlot = availability.slots.find((s) => s.label.toLowerCase() === input.time.toLowerCase());
      if (!availability.open || !matchedSlot) {
        return {
          success: false,
          reason: `${input.time} is not available on ${input.date}.`,
          availableSlots: availability.slots.map((s) => s.label),
        };
      }

      // Find or create the customer.
      let customerId: string | null = null;
      const { data: existingCustomer } = await admin
        .from("customers")
        .select("*")
        .eq("business_id", businessId)
        .eq("phone", input.customerPhone)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer } = await admin
          .from("customers")
          .insert({ business_id: businessId, name: input.customerName, phone: input.customerPhone })
          .select()
          .single();
        customerId = newCustomer?.id || null;
      }

      const eventResult = await provider.createEvent({
        businessId,
        title: `${service.name} — ${input.customerName}`,
        description: `Customer: ${input.customerName}\nPhone: ${input.customerPhone}\nService: ${service.name} (${service.duration_minutes} min)\nBusiness: ${context.business.name}${input.notes ? `\nNotes: ${input.notes}` : ""}`,
        startTime: matchedSlot.start,
        endTime: matchedSlot.end,
      });

      if (!eventResult.success) {
        return { success: false, reason: eventResult.reason || "Could not create the calendar event." };
      }

      const { data: appointment, error: apptError } = await admin
        .from("appointments")
        .insert({
          business_id: businessId,
          customer_id: customerId,
          customer_name: input.customerName,
          phone: input.customerPhone,
          service_id: service.id,
          service_name: service.name,
          date: input.date,
          time: input.time,
          status: "confirmed",
          created_via: ctx.channel === "phone" ? "ai" : "ai",
        })
        .select()
        .single();

      if (apptError || !appointment) {
        return { success: false, reason: apptError?.message || "Could not save the appointment." };
      }

      if (ctx.callId) {
        await admin
          .from("calls")
          .update({ outcome: "appointment_booked", customer_id: customerId })
          .eq("id", ctx.callId);
      }

      // Send the confirmation text automatically — this should never
      // depend on the AI separately deciding to call send_sms. If SMS
      // sending fails for any reason (Twilio not connected yet, etc.),
      // that's logged but never blocks the booking itself from succeeding.
      let smsSent = false;
      try {
        const smsResult = await smsClient.send(
          businessId,
          input.customerPhone,
          `You're booked at ${context.business.name} for ${service.name} on ${input.date} at ${input.time}. See you then! Msg&data rates may apply. Reply HELP for help, STOP to cancel.`
        );
        smsSent = smsResult.sent;
      } catch (err) {
        console.error("Booking confirmation SMS failed:", err);
      }

      return {
        success: true,
        appointment: {
          id: appointment.id,
          date: appointment.date,
          time: appointment.time,
          service: appointment.service_name,
          customerName: appointment.customer_name,
        },
        confirmationTextSent: smsSent,
      };
    }

    case "cancel_appointment": {
      let query = admin
        .from("appointments")
        .select("*")
        .eq("business_id", businessId)
        .eq("phone", input.customerPhone)
        .neq("status", "cancelled");
      if (input.appointmentId) query = query.eq("id", input.appointmentId);
      if (input.date) query = query.eq("date", input.date);

      const { data: matches } = await query;
      if (!matches || matches.length === 0) {
        return { success: false, reason: "No matching appointment found." };
      }
      const target = matches[0];
      const { error } = await admin.from("appointments").update({ status: "cancelled" }).eq("id", target.id);
      if (error) return { success: false, reason: error.message };
      return { success: true, cancelled: { date: target.date, time: target.time, service: target.service_name } };
    }

    case "reschedule_appointment": {
      let query = admin
        .from("appointments")
        .select("*")
        .eq("business_id", businessId)
        .eq("phone", input.customerPhone)
        .neq("status", "cancelled");
      if (input.appointmentId) query = query.eq("id", input.appointmentId);

      const { data: matches } = await query;
      if (!matches || matches.length === 0) {
        return { success: false, reason: "No matching appointment found." };
      }
      const target = matches[0];
      const service = context.services.find((s) => s.name === target.service_name);
      const provider = await getCalendarProviderForBusiness(businessId);
      const availability = await provider.getAvailability({
        businessId,
        date: input.newDate,
        durationMinutes: service?.duration_minutes || 30,
      });
      const matchedSlot = availability.slots.find((s) => s.label.toLowerCase() === input.newTime.toLowerCase());
      if (!availability.open || !matchedSlot) {
        return {
          success: false,
          reason: `${input.newTime} is not available on ${input.newDate}.`,
          availableSlots: availability.slots.map((s) => s.label),
        };
      }

      const { error } = await admin
        .from("appointments")
        .update({ date: input.newDate, time: input.newTime })
        .eq("id", target.id);
      if (error) return { success: false, reason: error.message };
      return { success: true, appointment: { date: input.newDate, time: input.newTime, service: target.service_name } };
    }

    case "escalate_to_human": {
      const { data, error } = await admin
        .from("calls")
        .select("id")
        .eq("id", ctx.callId || "")
        .maybeSingle();

      if (ctx.callId) {
        await admin
          .from("calls")
          .update({ outcome: "escalated", escalation_reason: `${input.reason}: ${input.details}` })
          .eq("id", ctx.callId);
      }

      return { success: true, escalated: true, reason: input.reason };
    }

    case "transfer_call": {
      if (ctx.channel !== "phone") {
        return { success: false, reason: "Call transfer is only available on real phone calls." };
      }
      return { success: true, transferring: true, reason: input.reason };
    }

    case "send_sms": {
      const result = await smsClient.send(businessId, input.to, input.message);
      return result;
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
