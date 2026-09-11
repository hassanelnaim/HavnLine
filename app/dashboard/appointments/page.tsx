import { CalendarCheck } from "lucide-react";
import { getAppointments } from "@/lib/data/appointments";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AppointmentStatusBadge } from "@/components/dashboard/status-badges";
import { Badge } from "@/components/ui/badge";
import { formatDateWithWeekday } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const appointments = await getAppointments();

  return (
    <div>
      <PageHeader title="Appointments" description="Everything your AI receptionist has booked, rescheduled, or cancelled." />
      {appointments.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No appointments yet" description="Bookings your AI makes will appear here." />
      ) : (
        <>
          {/* Desktop/tablet: real table, unchanged. */}
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

          {/* Mobile: same data, stacked cards — date/time and customer name lead, since that's what you actually check this page for. */}
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
      )}
    </div>
  );
}
