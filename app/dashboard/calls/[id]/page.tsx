import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TriangleAlert, Mic } from "lucide-react";
import { getCallById, getCallMessages } from "@/lib/data/calls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CallOutcomeBadge, CallStatusBadge } from "@/components/dashboard/status-badges";
import { formatDateTime, formatDuration, formatTimeOnly } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function CallDetailPage({ params }: { params: { id: string } }) {
  const call = await getCallById(params.id);
  if (!call) notFound();

  const messages = await getCallMessages(call.id);

  return (
    <div>
      <Link
        href="/dashboard/calls"
        className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to calls
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink">{call.customer_name}</h1>
          <p className="mt-1 font-mono text-[13px] text-text-muted">
            {call.phone} · {formatDateTime(call.started_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CallOutcomeBadge outcome={call.outcome} />
          <CallStatusBadge status={call.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-[13px] text-text-muted">
                No transcript available for this call yet.
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id}>
                    {m.role !== "system" && (
                      <div
                        className={cn(
                          "max-w-[80%] rounded-xl px-3.5 py-2.5 text-[13px]",
                          m.role === "customer"
                            ? "ml-auto rounded-br-sm bg-ink text-white"
                            : "rounded-bl-sm border border-border-soft bg-paper text-text"
                        )}
                      >
                        {m.content}
                      </div>
                    )}
                    {m.tool_call && (
                      <div className="mt-1.5 max-w-[85%] rounded-lg bg-brand-soft px-3 py-1.5 font-mono text-[11px] text-brand-dark">
                        ⚙ {JSON.parse(m.tool_call).name}
                      </div>
                    )}
                    <div
                      className={cn(
                        "mt-1 text-[10.5px] text-text-faint",
                        m.role === "customer" ? "text-right" : "text-left"
                      )}
                    >
                      {formatTimeOnly(m.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call recording</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-paper px-3 py-3 text-[12.5px] text-text-faint">
                <Mic className="h-4 w-4" />
                Recording playback connects once a voice provider is wired up.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-[13px] text-text">
                <li>Handled by: <span className="font-medium capitalize">{call.handled_by}</span></li>
                <li>Duration: <span className="font-medium">{formatDuration(call.duration_seconds)}</span></li>
                {call.outcome === "appointment_booked" && (
                  <li className="text-success">✓ Appointment created</li>
                )}
              </ul>
            </CardContent>
          </Card>

          {call.escalation_reason && (
            <Card className="border-danger/30 bg-danger-soft">
              <CardContent className="flex gap-2.5 p-4">
                <TriangleAlert className="h-4 w-4 shrink-0 text-danger" />
                <div>
                  <div className="text-[12.5px] font-semibold text-danger">Escalation reason</div>
                  <p className="mt-1 text-[12.5px] text-danger/90">{call.escalation_reason}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
