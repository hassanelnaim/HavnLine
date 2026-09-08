import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, DollarSign } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessCostBreakdown } from "@/lib/usage/tracking";
import { formatDate } from "@/lib/format";
import { StatusEditor } from "@/components/admin/status-editor";

export const dynamic = "force-dynamic";

export default async function PlatformBusinessDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();

  const [{ data: business }, { count: callCount }, { count: appointmentCount }] = await Promise.all([
    admin.from("businesses").select("*").eq("id", params.id).maybeSingle(),
    admin.from("calls").select("*", { count: "exact", head: true }).eq("business_id", params.id),
    admin.from("appointments").select("*", { count: "exact", head: true }).eq("business_id", params.id).neq("status", "cancelled"),
  ]);

  if (!business) notFound();

  const costs = await getBusinessCostBreakdown(params.id);

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

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="text-[12.5px] text-text-muted">Calls handled</div>
          <div className="mt-2 font-display text-[26px] font-semibold text-ink">{callCount || 0}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="text-[12.5px] text-text-muted">Appointments booked</div>
          <div className="mt-2 font-display text-[26px] font-semibold text-ink">{appointmentCount || 0}</div>
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
    </div>
  );
}
