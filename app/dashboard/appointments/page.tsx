import { CalendarCheck } from "lucide-react";
import { getAppointments } from "@/lib/data/appointments";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AppointmentStatusBadge } from "@/components/dashboard/status-badges";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDateWithWeekday } from "@/lib/format";
import type { DbAppointment } from "@/lib/database/types";

export const dynamic = "force-dynamic";

function AppointmentsList({ appointments, emptyMessage }: { appointments: DbAppointment[]; emptyMessage: string }) {
  if (appointments.length === 0) {
    return <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-[13px] text-text-muted">{emptyMessage}</div>;
  }

  return (
    <>
      {/* Desktop/tablet: real table. */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Service</TableHead><TableHead>Booked by</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {appointments.map((apt) => (
              <TableRow key={apt.id}>
                <TableCell className="font-mono">{formatDateWithWeekday(apt.date)}</TableCell>
                <TableCell>{apt.time}</TableCell>
                <TableCell className="font-medium">{apt.customer_name}</TableCell>
                <TableCell className="font-mono text-text-muted">{apt.phone}</TableCell>
                <TableCell>{apt.service_name}</TableCell>
                <TableCell><Badge variant="brand">{apt.created_via.toUpperCase()}</Badge></TableCell>
                <TableCell><AppointmentStatusBadge status={apt.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: same data, stacked cards. */}
      <div className="space-y-2.5 md:hidden">
        {appointments.map((apt) => (
          <Card key={apt.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold text-ink">{apt.customer_name}</div>
                <div className="mt-0.5 text-[13px] font-medium text-brand">{formatDateWithWeekday(apt.date)} · {apt.time}</div>
              </div>
              <AppointmentStatusBadge status={apt.status} />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border-soft pt-2.5 text-[12px] text-text-muted">
              <span>{apt.service_name}</span>
              <span>·</span>
              <span className="font-mono">{apt.phone}</span>
              <Badge variant="brand">{apt.created_via.toUpperCase()}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export default async function AppointmentsPage() {
  const appointments = await getAppointments();
  const today = new Date().toISOString().slice(0, 10);

  // "Upcoming" is what you actually check this page for day to day —
  // real, still-relevant bookings. Anything in the past, or already
  // cancelled, moves to History instead of cluttering the main view.
  const upcoming = appointments
    .filter((apt) => apt.date >= today && apt.status !== "cancelled")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const history = appointments
    .filter((apt) => apt.date < today || apt.status === "cancelled")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <div>
      <PageHeader title="Appointments" description="Everything your AI receptionist has booked, rescheduled, or cancelled." />
      {appointments.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No appointments yet" description="Bookings your AI makes will appear here." />
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="history">History ({history.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            <AppointmentsList appointments={upcoming} emptyMessage="No upcoming appointments right now." />
          </TabsContent>
          <TabsContent value="history">
            <AppointmentsList appointments={history} emptyMessage="No past appointments yet." />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
