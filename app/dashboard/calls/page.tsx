import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { getCalls } from "@/lib/data/calls";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CallOutcomeBadge, CallStatusBadge } from "@/components/dashboard/status-badges";
import { formatDateTime, formatDuration } from "@/lib/format";

export default async function CallsPage() {
  const calls = await getCalls();

  return (
    <div>
      <PageHeader title="Calls" description="Every call your AI receptionist has answered." />

      {calls.length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title="No calls yet"
          description="Once your receptionist is live, incoming calls will show up here."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Date &amp; time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => (
                <TableRow key={call.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/dashboard/calls/${call.id}`} className="font-medium text-text hover:text-brand">
                      {call.customer_name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-text-muted">{call.phone}</TableCell>
                  <TableCell className="font-mono text-text-muted">{formatDateTime(call.started_at)}</TableCell>
                  <TableCell className="font-mono text-text-muted">{formatDuration(call.duration_seconds)}</TableCell>
                  <TableCell><CallOutcomeBadge outcome={call.outcome} /></TableCell>
                  <TableCell><CallStatusBadge status={call.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
