import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, StickyNote } from "lucide-react";
import { getCustomerAppointments, getCustomerById, getCustomerCalls } from "@/lib/data/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CallOutcomeBadge, AppointmentStatusBadge } from "@/components/dashboard/status-badges";
import { formatDate, formatDateTime, initials } from "@/lib/format";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCustomerById(params.id);
  if (!customer) notFound();

  const [calls, appointments] = await Promise.all([
    getCustomerCalls(customer.id),
    getCustomerAppointments(customer.id),
  ]);

  return (
    <div>
      <Link
        href="/dashboard/customers"
        className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to customers
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-[18px]">{initials(customer.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink">{customer.name}</h1>
          <p className="mt-0.5 text-[13px] text-text-muted">Customer since {formatDate(customer.created_at)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2.5 text-[13px] text-text">
                <Phone className="h-4 w-4 text-text-faint" /> {customer.phone}
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-text">
                <Mail className="h-4 w-4 text-text-faint" /> {customer.email || "No email on file"}
              </div>
              {customer.notes && (
                <div className="flex items-start gap-2.5 text-[13px] text-text-muted">
                  <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" /> {customer.notes}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointments ({appointments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-[13px] text-text-muted">No appointments yet.</p>
              ) : (
                <div className="space-y-2">
                  {appointments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border-soft px-3 py-2.5">
                      <div>
                        <div className="text-[13px] font-medium text-text">{a.service_name}</div>
                        <div className="font-mono text-[11.5px] text-text-faint">{a.date} · {a.time}</div>
                      </div>
                      <AppointmentStatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calls ({calls.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <p className="text-[13px] text-text-muted">No calls yet.</p>
              ) : (
                <div className="space-y-2">
                  {calls.map((c) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/calls/${c.id}`}
                      className="flex items-center justify-between rounded-lg border border-border-soft px-3 py-2.5 hover:bg-paper"
                    >
                      <div className="font-mono text-[12px] text-text-muted">{formatDateTime(c.started_at)}</div>
                      <CallOutcomeBadge outcome={c.outcome} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
