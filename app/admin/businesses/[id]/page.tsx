import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, DollarSign, Phone, CalendarCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessCostBreakdown } from "@/lib/usage/tracking";
import { formatDate, formatDateTime, formatDuration } from "@/lib/format";
import { StatusEditor } from "@/components/admin/status-editor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function PlatformBusinessDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();

  const [{ data: business }, { data: calls }, { data: appointments }, { data: aiReceptionist }] = await Promise.all([
    admin.from("businesses").select("*").eq("id", params.id).maybeSingle(),
    admin.from("calls").select("*").eq("business_id", params.id).order("started_at", { ascending: false }).limit(50),
    admin.from("appointments").select("*").eq("business_id", params.id).order("date", { ascending: false }).limit(50),
    admin.from("ai_receptionists").select("*").eq("business_id", params.id).maybeSingle(),
  ]);

  if (!business) notFound();

  const costs = await getBusinessCostBreakdown(params.id);
  const timezone = business.timezone || "America/New_York";
  const callCount = calls?.length || 0;
  const appointmentCount = appointments?.filter((a) => a.status !== "cancelled").length || 0;

  return (
    <div>
      <Link href="/admin" className="flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-text">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Command Center
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-ink">{business.name}</h1>
          <p className="mt-1 text-[13px] text-text-muted">{business.phone || "No phone"} · Joined {formatDate(business.created_at)}</p>
        </div>
        <StatusEditor businessId={business.id} currentStatus={business.subscription_status} />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Calls ({callCount})</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({appointmentCount})</TabsTrigger>
          <TabsTrigger value="ai">AI Config</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-[12.5px] text-text-muted">Calls handled</div>
              <div className="mt-2 font-display text-[26px] font-semibold text-ink">{callCount}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-[12.5px] text-text-muted">Appointments booked</div>
              <div className="mt-2 font-display text-[26px] font-semibold text-ink">{appointmentCount}</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-brand" />
              <h2 className="font-display text-[15px] font-semibold text-ink">AI cost breakdown</h2>
            </div>
            <p className="mt-1 text-[12px] text-text-faint">
              Anthropic and ElevenLabs bill HavnLine as one shared account — these figures are HavnLine's own internal estimates for what this specific business is costing, calculated from real usage at each provider's current published rate. Not a real provider invoice.
            </p>

            <div className="mt-4 divide-y divide-border-soft">
              <div className="flex items-center justify-between py-3">
                <span className="text-[13px] text-text">Anthropic (Claude conversations)</span>
                <span className="font-mono text-[13px] font-medium text-text">${(costs.anthropicCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[13px] text-text">ElevenLabs (voice generation)</span>
                <span className="font-mono text-[13px] font-medium text-text">${(costs.elevenLabsCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[13px] text-text">Twilio (calls, from real minutes)</span>
                <span className="font-mono text-[13px] font-medium text-text">${(costs.twilioCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink"><DollarSign className="h-3.5 w-3.5" /> Total estimated cost</span>
                <span className="font-mono text-[15px] font-semibold text-ink">${(costs.totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calls">
          <div className="rounded-2xl border border-border bg-card shadow-card">
            {(!calls || calls.length === 0) ? (
              <div className="p-8 text-center text-[13px] text-text-muted">No calls yet.</div>
            ) : (
              <div className="divide-y divide-border-soft">
                {calls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-text-faint" />
                      <div>
                        <div className="text-[13px] font-medium text-text">{call.customer_name || "Phone Caller"}</div>
                        <div className="text-[11.5px] text-text-faint">{call.phone} · {formatDateTime(call.started_at, timezone)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[12px]">
                      <span className="text-text-muted">{formatDuration(Math.round((call.duration_seconds || 0) / 60))}</span>
                      <span className={`rounded-full px-2 py-0.5 font-medium ${call.outcome === "escalated" ? "bg-danger-soft text-danger" : "bg-border-soft text-text-muted"}`}>{call.outcome || "no action"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <div className="rounded-2xl border border-border bg-card shadow-card">
            {(!appointments || appointments.length === 0) ? (
              <div className="p-8 text-center text-[13px] text-text-muted">No appointments yet.</div>
            ) : (
              <div className="divide-y divide-border-soft">
                {appointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="h-4 w-4 text-text-faint" />
                      <div>
                        <div className="text-[13px] font-medium text-text">{apt.customer_name} — {apt.service_name}</div>
                        <div className="text-[11.5px] text-text-faint">{apt.date} at {apt.time}</div>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${apt.status === "cancelled" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>{apt.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            {!aiReceptionist ? (
              <div className="text-center text-[13px] text-text-muted">No AI receptionist configured for this business.</div>
            ) : (
              <div className="divide-y divide-border-soft">
                <div className="flex items-center justify-between py-3">
                  <span className="text-[13px] text-text-muted">Name</span>
                  <span className="text-[13px] font-medium text-text">{aiReceptionist.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[13px] text-text-muted">Status</span>
                  <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${aiReceptionist.is_online ? "bg-success-soft text-success" : "bg-border-soft text-text-muted"}`}>{aiReceptionist.is_online ? "Online" : "Offline"}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[13px] text-text-muted">Personality</span>
                  <span className="text-[13px] font-medium text-text">{aiReceptionist.personality || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[13px] text-text-muted">Voice</span>
                  <span className="text-[13px] font-medium text-text">{aiReceptionist.voice_id || "—"}</span>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}