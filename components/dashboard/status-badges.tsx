import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus, CallOutcome, CallStatus, IntegrationStatus } from "@/lib/database/types";

const CALL_OUTCOME_MAP: Record<CallOutcome, { label: string; variant: "success" | "danger" | "brand" | "neutral" }> = {
  appointment_booked: { label: "Booked", variant: "success" },
  question_answered: { label: "Answered", variant: "brand" },
  escalated: { label: "Escalated", variant: "danger" },
  no_action: { label: "No action", variant: "neutral" },
  missed: { label: "Missed", variant: "neutral" },
};

export function CallOutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  const { label, variant } = CALL_OUTCOME_MAP[outcome];
  return <Badge variant={variant}>{label}</Badge>;
}

const CALL_STATUS_MAP: Record<CallStatus, { label: string; variant: "success" | "danger" | "brand" | "neutral" }> = {
  completed: { label: "Completed", variant: "neutral" },
  in_progress: { label: "In progress", variant: "brand" },
  missed: { label: "Missed", variant: "danger" },
  voicemail: { label: "Voicemail", variant: "neutral" },
};

export function CallStatusBadge({ status }: { status: CallStatus }) {
  const { label, variant } = CALL_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}

const APPT_STATUS_MAP: Record<AppointmentStatus, { label: string; variant: "success" | "danger" | "brand" | "neutral" }> = {
  confirmed: { label: "Confirmed", variant: "success" },
  pending: { label: "Pending", variant: "brand" },
  cancelled: { label: "Cancelled", variant: "danger" },
  completed: { label: "Completed", variant: "neutral" },
  no_show: { label: "No-show", variant: "danger" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, variant } = APPT_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}

const INTEGRATION_STATUS_MAP: Record<IntegrationStatus, { label: string; variant: "success" | "neutral" | "brand" }> = {
  connected: { label: "Connected", variant: "success" },
  not_connected: { label: "Not connected", variant: "neutral" },
  coming_soon: { label: "Coming soon", variant: "brand" },
};

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const { label, variant } = INTEGRATION_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
