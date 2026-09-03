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
        <Card>
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
      )}
    </div>
  );
}
