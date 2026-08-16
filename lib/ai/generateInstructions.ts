import type {
  AiResponsibilities,
  DbBusiness,
  DbBusinessHours,
  DbService,
  Personality,
} from "@/lib/database/types";

/**
 * generateInstructions.ts
 *
 * The business owner never writes a prompt. They flip toggles and pick a
 * personality; this module turns those settings — plus the business's
 * services, hours, and knowledge — into the system instructions an AI
 * model would actually receive. This mirrors how the Phase 1 prototype's
 * aiEngine.js built its system prompt, but is now a pure function so it
 * can be called from a Server Action whenever settings are saved and the
 * result stored in ai_receptionists.generated_instructions.
 *
 * No model call happens here — Phase 2 wires this string into the actual
 * Claude/Twilio call.
 */

const PERSONALITY_COPY: Record<Personality, string> = {
  professional: "Polished, precise, and businesslike. Keeps things efficient without being cold.",
  friendly: "Approachable and easygoing, like a well-liked coworker at the front desk.",
  warm: "Caring and reassuring, especially with anxious or upset callers.",
  energetic: "Upbeat and enthusiastic, with a bit of extra pep in every response.",
  calm: "Steady and unhurried, never rattled even when a caller is frustrated.",
};

const RESPONSIBILITY_COPY: Record<keyof AiResponsibilities, string> = {
  answer_questions: "Answer customer questions using only the business's provided information.",
  schedule_appointments: "Check availability and schedule new appointments.",
  reschedule_appointments: "Reschedule existing appointments when a customer asks.",
  cancel_appointments: "Cancel existing appointments when a customer asks.",
  collect_customer_info: "Collect the customer's name and phone number before booking anything.",
  escalate_to_human: "Escalate to a human for anything outside these responsibilities or the rules below.",
};

export interface GenerateInstructionsInput {
  business: Pick<DbBusiness, "name" | "description">;
  receptionistName: string;
  personality: Personality;
  responsibilities: AiResponsibilities;
  services: Pick<DbService, "name" | "price_cents" | "duration_minutes">[];
  hours: Pick<DbBusinessHours, "weekday" | "is_open" | "open_time" | "close_time">[];
  bookingRules?: string | null;
  escalationRules?: string | null;
}

export function generateInstructions(input: GenerateInstructionsInput): string {
  const {
    business,
    receptionistName,
    personality,
    responsibilities,
    services,
    hours,
    bookingRules,
    escalationRules,
  } = input;

  const enabledResponsibilities = (Object.keys(responsibilities) as (keyof AiResponsibilities)[])
    .filter((key) => responsibilities[key])
    .map((key) => `- ${RESPONSIBILITY_COPY[key]}`)
    .join("\n");

  const servicesText = services.length
    ? services
        .map(
          (s) =>
            `- ${s.name}: $${(s.price_cents / 100).toFixed(2)}, ${s.duration_minutes} minutes`
        )
        .join("\n")
    : "(no services configured yet)";

  const hoursText = hours.length
    ? hours
        .map((h) =>
          h.is_open
            ? `- ${capitalize(h.weekday)}: ${h.open_time ?? "?"} – ${h.close_time ?? "?"}`
            : `- ${capitalize(h.weekday)}: Closed`
        )
        .join("\n")
    : "(no hours configured yet)";

  return `You are ${receptionistName}, the AI front-desk receptionist for ${business.name}.

Personality: ${PERSONALITY_COPY[personality]}

Business description: ${business.description || "(no description provided)"}

Your responsibilities:
${enabledResponsibilities || "(no responsibilities enabled — escalate everything to a human)"}

Services offered (the ONLY services this business offers):
${servicesText}

Business hours:
${hoursText}

Booking rules: ${bookingRules || "(none set — use standard availability checks before booking)"}

Escalation rules: ${escalationRules || "(none set — escalate anything you cannot confidently answer from the information above)"}

CRITICAL: Never invent prices, services, availability, or policies that are not listed above. If a responsibility is not enabled, do not attempt it — offer to have a human help instead.`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const DEFAULT_RESPONSIBILITIES: AiResponsibilities = {
  answer_questions: true,
  schedule_appointments: true,
  reschedule_appointments: true,
  cancel_appointments: false,
  collect_customer_info: true,
  escalate_to_human: true,
};
