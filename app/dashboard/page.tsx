import Link from "next/link";
import { PhoneCall, CalendarCheck, UserPlus, TriangleAlert, ArrowUpRight } from "lucide-react";
import { getCalls } from "@/lib/data/calls";
import { getUpcomingAppointments } from "@/lib/data/appointments";
import { getCustomers } from "@/lib/data/customers";
import { getAiReceptionist } from "@/lib/data/ai-receptionist";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import {
  CallOutcomeBadge,
  AppointmentStatusBadge,
} from "@/components/dashboard/status-badges";
import { formatDateTime, formatDuration, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function OverviewPage() {
  const [calls, upcoming, customers, ai] = await Promise.all([
    getCalls(),
    getUpcomingAppointments(),
    getCustomers(),
    getAiReceptionist(),
  ]);

  const today = new Date().toDateString();
  const callsToday = calls.filter((c) => new Date(c.started_at).toDateString() === today);
  const appointmentsToday = upcoming.filter(
    (a) => new Date(a.date + "T00:00:00").toDateString() === today
  );
  const newCustomers = customers.filter((c) => {
    const created = new Date(c.created_at);
    const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 14;
  });
  const escalations = calls.filter((c) => c.outcome === "escalated");

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`Here's what's happened with ${ai.name} recently.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Calls today" value={callsToday.length} icon={PhoneCall} tone="brand" />
        <StatCard
          label="Appointments today"
          value={appointmentsToday.length}
          icon={CalendarCheck}
          tone="brand"
        />
        <StatCard label="New customers" value={newCustomers.length} icon={UserPlus} />
        <StatCard
          label="Human escalations"
          value={escalations.length}
          icon={TriangleAlert}
          tone={escalations.length > 0 ? "danger" : "neutral"}
          foot="Last 30 days"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between p-5 pb-0">
            <h3 className="font-display text-[15px] font-semibold text-ink">Recent calls</h3>
            <Link
              href="/dashboard/calls"
              className="flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {calls.length === 0 ? (
              <EmptyState
                icon={PhoneCall}
                title="No calls yet"
                description="Once your receptionist is live, calls will show up here."
              />
            ) : (
              <div className="space-y-1">
                {calls.slice(0, 5).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-paper"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[11px]">
                          {initials(call.customer_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-[13px] font-medium text-text">{call.customer_name}</div>
                        <div className="font-mono text-[11px] text-text-faint">
                          {formatDateTime(call.started_at)} · {formatDuration(call.duration_seconds)}
                        </div>
                      </div>
                    </div>
                    <CallOutcomeBadge outcome={call.outcome} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-5 pb-0">
            <h3 className="font-display text-[15px] font-semibold text-ink">
              Upcoming appointments
            </h3>
            <Link
              href="/dashboard/appointments"
              className="flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No upcoming appointments"
                description="Bookings your AI makes will appear here."
              />
            ) : (
              <div className="space-y-1">
                {upcoming.slice(0, 5).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-paper"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-text">{apt.customer_name}</div>
                      <div className="text-[11.5px] text-text-muted">{apt.service_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[12px] text-text">
                        {apt.date} · {apt.time}
                      </div>
                      <div className="mt-0.5">
                        <AppointmentStatusBadge status={apt.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
