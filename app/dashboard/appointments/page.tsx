import { CalendarCheck } from "lucide-react";
import { getAppointments } from "@/lib/data/appointments";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AppointmentStatusBadge } from "@/components/dashboard/status-badges";
import { Badge } from "@/components/ui/badge";
import { formatDateWithWeekday } from "@/lib/format";

export default async function AppointmentsPage() {
  const appointments = await getAppointments();

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Everything your AI receptionist has booked, rescheduled, or cancelled."
      />

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No appointments yet"
          description="Once customers start booking, appointments will show up here."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Booked by</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-mono">{formatDateWithWeekday(apt.date)}</TableCell>
                  <TableCell className="font-mono">{apt.time}</TableCell>
                  <TableCell className="font-medium text-text">{apt.customer_name}</TableCell>
                  <TableCell className="font-mono text-text-muted">{apt.phone}</TableCell>
                  <TableCell>{apt.service_name}</TableCell>
                  <TableCell>
                    <Badge variant={apt.created_via === "ai" ? "brand" : "neutral"}>
                      {apt.created_via === "ai" ? "AI" : "Human"}
                    </Badge>
                  </TableCell>
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
