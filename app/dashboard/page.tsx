import Link from "next/link";
import { PhoneCall, CalendarCheck, AlertTriangle, ArrowUpRight } from "lucide-react";
import { getBusiness } from "@/lib/data/business";
import { getAiReceptionist } from "@/lib/data/ai-receptionist";
import { getCalls } from "@/lib/data/calls";
import { getAppointments } from "@/lib/data/appointments";
import { getCustomers } from "@/lib/data/customers";
import { CallOutcomeBadge, AppointmentStatusBadge } from "@/components/dashboard/status-badges";
import { EmptyState } from "@/components/dashboard/empty-state";
import { NewCustomersCard } from "@/components/dashboard/new-customers-card";
import { formatDateTime } from "@/lib/format";
import { CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [business, ai, calls, appointments, customers] = await Promise.all([
    getBusiness(), getAiReceptionist(), getCalls(), getAppointments(), getCustomers(),
  ]);

  const today = new Date().toDateString();
  const callsToday = calls.filter((c) => new Date(c.started_at).toDateString() === today).length;
  const appointmentsToday = appointments.filter((a) => a.date === new Date().toISOString().slice(0, 10)).length;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const escalationsLast30 = calls.filter((c) => c.outcome === "escalated" && new Date(c.started_at).getTime() >= thirtyDaysAgo).length;

  const recentCalls = calls.slice(0, 5);
  const upcomingAppointments = appointments.filter((a) => a.status === "confirmed").slice(0, 5);

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-ink">Overview</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">Here&apos;s what&apos;s happened with {ai.name} recently.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Calls today</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-dark"><PhoneCall className="h-4 w-4" /></div>
          </div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{callsToday}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Appointments today</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-dark"><CalendarClock className="h-4 w-4" /></div>
          </div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{appointmentsToday}</div>
        </div>

        <NewCustomersCard customers={customers} />

        <Link href="/dashboard/escalations" className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-danger/40 hover:bg-danger-soft/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Human escalations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-soft text-danger"><AlertTriangle className="h-4 w-4" /></div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 font-display text-[28px] font-semibold text-ink">
            {escalationsLast30}
            <ArrowUpRight className="h-4 w-4 text-text-faint opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="mt-1 text-[11.5px] text-text-faint">Last 30 days — click to view</div>
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-ink">Recent calls</h2>
            <Link href="/dashboard/calls" className="flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          {recentCalls.length === 0 ? (
            <EmptyState icon={PhoneCall} title="No calls yet" description="Calls your AI answers will show up here." />
          ) : (
            <div className="space-y-1">
              {recentCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-paper">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">PC</div>
                    <div>
                      <div className="text-[13px] font-medium text-text">{call.customer_name}</div>
                      <div className="text-[11.5px] text-text-faint">{formatDateTime(call.started_at)}</div>
                    </div>
                  </div>
                  <CallOutcomeBadge outcome={call.outcome} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-ink">Upcoming appointments</h2>
            <Link href="/dashboard/appointments" className="flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          {upcomingAppointments.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No upcoming appointments" description="Bookings your AI makes will appear here." />
          ) : (
            <div className="space-y-1">
              {upcomingAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-paper">
                  <div>
                    <div className="text-[13px] font-medium text-text">{appt.customer_name} — {appt.service_name}</div>
                    <div className="text-[11.5px] text-text-faint">{appt.date} at {appt.time}</div>
                  </div>
                  <AppointmentStatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
