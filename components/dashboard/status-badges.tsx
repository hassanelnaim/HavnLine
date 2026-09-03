import { Badge } from "@/components/ui/badge";

export function CallOutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, { label: string; variant: "brand" | "success" | "danger" | "neutral" }> = {
    appointment_booked: { label: "Booked", variant: "success" },
    question_answered: { label: "Answered", variant: "brand" },
    escalated: { label: "Escalated", variant: "danger" },
    no_action: { label: "No action", variant: "neutral" },
    missed: { label: "Missed", variant: "danger" },
  };
  const entry = map[outcome] || { label: outcome, variant: "neutral" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function AppointmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "brand" | "success" | "danger" | "neutral" }> = {
    confirmed: { label: "Confirmed", variant: "success" },
    pending: { label: "Pending", variant: "brand" },
    cancelled: { label: "Cancelled", variant: "danger" },
    completed: { label: "Completed", variant: "neutral" },
    no_show: { label: "No-show", variant: "danger" },
  };
  const entry = map[status] || { label: status, variant: "neutral" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function IntegrationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "brand" | "success" | "danger" | "neutral" }> = {
    connected: { label: "Connected", variant: "success" },
    not_connected: { label: "Not connected", variant: "neutral" },
    coming_soon: { label: "Coming soon", variant: "neutral" },
  };
  const entry = map[status] || { label: status, variant: "neutral" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
