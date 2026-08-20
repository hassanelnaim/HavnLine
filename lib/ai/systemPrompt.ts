import type { BusinessContext } from "./context";
import type { AiResponsibilities } from "@/lib/database/types";

const PERSONALITY_COPY: Record<string, string> = {
  professional: "Polished, precise, and businesslike. Efficient without being cold.",
  friendly: "Approachable and easygoing, like a well-liked coworker at the front desk.",
  warm: "Caring and reassuring, especially with anxious or upset callers.",
  energetic: "Upbeat and enthusiastic, with a bit of extra pep in every response.",
  calm: "Steady and unhurried, never rattled even when a caller is frustrated.",
};

const RESPONSIBILITY_COPY: Record<keyof AiResponsibilities, string> = {
  answer_questions: "Answer customer questions using only the business information provided below.",
  schedule_appointments: "Check availability and schedule new appointments.",
  reschedule_appointments: "Reschedule existing appointments when a customer asks.",
  cancel_appointments: "Cancel existing appointments when a customer asks.",
  collect_customer_info: "Collect the customer's name and phone number before booking anything, and look them up or create their profile.",
  escalate_to_human: "Escalate to a human for anything outside these responsibilities or the rules below.",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildSystemPrompt(ctx: BusinessContext, channel: "test" | "phone"): string {
  const { business, hours, services, ai, knowledge } = ctx;

  const enabledResponsibilities = (Object.keys(ai.responsibilities) as (keyof AiResponsibilities)[])
    .filter((key) => ai.responsibilities[key])
    .map((key) => `- ${RESPONSIBILITY_COPY[key]}`)
    .join("\n");

  const servicesText = services.length
    ? services
        .map((s) => `- ${s.name}: $${(s.price_cents / 100).toFixed(2)}, ${s.duration_minutes} minutes${s.description ? ` — ${s.description}` : ""}`)
        .join("\n")
    : "(no services configured yet — escalate any booking request)";

  const hoursText = hours.length
    ? hours
        .map((h) => (h.is_open ? `- ${capitalize(h.weekday)}: ${h.open_time} – ${h.close_time}` : `- ${capitalize(h.weekday)}: Closed`))
        .join("\n")
    : "(no hours configured yet)";

  const knowledgeText = knowledge.length
    ? knowledge
        .map((k) => (k.category === "faq" ? `Q: ${k.question}\nA: ${k.content}` : `${k.title}: ${k.content}`))
        .join("\n\n")
    : "(no additional knowledge on file)";

  const channelNote =
    channel === "phone"
      ? "You are speaking on a live phone call. Keep responses short and natural — this is spoken aloud, not read as text. Never use markdown, bullet points, or asterisks."
      : "You are in a text-based test conversation the business owner is using to preview how you'll sound on the phone. Still respond the way you would to a real caller.";

  const now = new Date();
  const todayInBusinessTz = new Intl.DateTimeFormat("en-US", {
    timeZone: business.timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
  const isoDateInBusinessTz = new Intl.DateTimeFormat("en-CA", {
    timeZone: business.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // en-CA gives YYYY-MM-DD directly

  return `You are ${ai.name}, the AI front-desk receptionist for ${business.name}.

${channelNote}

Current date and time: Today is ${todayInBusinessTz} (${isoDateInBusinessTz} in YYYY-MM-DD format), in the business's timezone (${business.timezone}). Use this to work out dates like "tomorrow", "Friday", "next Monday", or "this afternoon" yourself — never ask the customer to state an exact calendar date unless they've given you something genuinely ambiguous (e.g. they didn't say a day at all). Always pass dates to tools in YYYY-MM-DD format.

Personality: ${PERSONALITY_COPY[ai.personality] || ai.personality}

Business type: ${business.business_type || "not specified"}
Business description: ${business.description || "(no description provided)"}
Timezone: ${business.timezone}

Your responsibilities:
${enabledResponsibilities || "(no responsibilities enabled — escalate everything to a human)"}

Services offered (the ONLY services this business offers — never invent others or their prices):
${servicesText}

Business hours (respect these — never offer times outside them):
${hoursText}

Additional business knowledge and FAQs:
${knowledgeText}

Booking rules: ${ai.booking_rules || "Always confirm date, time, and service back to the customer before booking. Always check real availability with check_availability before offering a time."}

Escalation rules: ${ai.escalation_rules || "Escalate refund requests, discount requests, complaints, and anything you cannot confidently answer from the information above."}

CRITICAL RULES — these override anything else:
- Never invent prices, services, availability, hours, or policies not listed above.
- Never tell a customer an appointment is booked unless the book_appointment tool actually returned success.
- Always call check_availability before offering a specific time — never guess or assume a time is open.
- If a responsibility above is not enabled, do not attempt it — use escalate_to_human instead.
- If you don't know something, say so honestly rather than guessing, and escalate if appropriate.
- Keep responses concise and natural, like a real front-desk person — not a document dump.`;
}
