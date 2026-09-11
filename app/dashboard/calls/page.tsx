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
        <>
          {/* Desktop/tablet: real table, unchanged. */}
          <Card className="hidden md:block">
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

          {/* Mobile: same data, stacked cards instead of a cramped table. */}
          <div className="space-y-2.5 md:hidden">
            {calls.map((call) => (
              <Card key={call.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold text-ink">{call.customer_name}</div>
                    <div className="mt-0.5 text-[12px] text-text-muted">{formatDateTime(call.started_at)}</div>
                  </div>
                  <CallOutcomeBadge outcome={call.outcome} />
                </div>
                <div className="mt-2.5 flex items-center gap-3 border-t border-border-soft pt-2.5 text-[12px] text-text-muted">
                  <span className="font-mono">{call.phone}</span>
                  <span>·</span>
                  <span>{formatDuration(Math.round(call.duration_seconds / 60))}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
