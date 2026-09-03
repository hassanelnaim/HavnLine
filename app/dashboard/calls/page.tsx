import { Phone } from "lucide-react";
import { getCalls } from "@/lib/data/calls";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CallOutcomeBadge } from "@/components/dashboard/status-badges";
import { formatDateTime, formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const calls = await getCalls();

  return (
    <div>
      <PageHeader title="Calls" description="Every call your AI receptionist has answered." />
      {calls.length === 0 ? (
        <EmptyState icon={Phone} title="No calls yet" description="Calls your AI answers will show up here." />
      ) : (
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Caller</TableHead><TableHead>Phone</TableHead><TableHead>When</TableHead><TableHead>Duration</TableHead><TableHead>Outcome</TableHead></TableRow></TableHeader>
            <TableBody>
              {calls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="font-medium">{call.customer_name}</TableCell>
                  <TableCell className="font-mono text-text-muted">{call.phone}</TableCell>
                  <TableCell>{formatDateTime(call.started_at)}</TableCell>
                  <TableCell>{formatDuration(Math.round(call.duration_seconds / 60))}</TableCell>
                  <TableCell><CallOutcomeBadge outcome={call.outcome} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
