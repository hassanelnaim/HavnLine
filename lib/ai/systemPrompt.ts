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
  const { business, hours, services, ai, knowledge, activePromotions } = ctx;

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

  const promotionsText = activePromotions.length
    ? activePromotions
        .map(
          (p) =>
            `- ${p.title}${p.applies_to ? ` (${p.applies_to})` : ""}: ${p.description} [valid ${p.start_date} to ${p.end_date}]`
        )
        .join("\n")
    : "(no active promotions right now)";

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
  }).format(now);

  // Whether the shop is physically open RIGHT NOW, this exact moment —
  // separate from whether it CAN book an appointment for some other
  // time. The AI answers calls 24/7 regardless of this; it's only used
  // so it can naturally mention "we're closed right now" the way a
  // real receptionist would, without ever refusing to help.
  const currentWeekday = new Intl.DateTimeFormat("en-US", { timeZone: business.timezone, weekday: "long" })
    .format(now)
    .toLowerCase();
  const currentTimeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: business.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now); // "HH:MM" 24-hour, comparable directly against stored "HH:MM[:SS]" hours
  const todayHours = hours.find((h) => h.weekday === currentWeekday);
  const isOpenRightNow = Boolean(
    todayHours?.is_open &&
      todayHours.open_time &&
      todayHours.close_time &&