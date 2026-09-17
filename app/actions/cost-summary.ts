import { createAdminClient } from "@/lib/supabase/admin";

export async function getTotalSpentThisMonth(): Promise<number> {
  const admin = createAdminClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: usageRecords }, { data: calls }] = await Promise.all([
    admin.from("usage_records").select("estimated_cost_cents").gte("created_at", startOfMonth.toISOString()),
    admin.from("calls").select("duration_seconds").gte("started_at", startOfMonth.toISOString()),
  ]);

  const aiCostCents = (usageRecords || []).reduce((sum, r) => sum + Number(r.estimated_cost_cents), 0);
  const totalMinutes = (calls || []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60;
  const twilioCostCents = totalMinutes * 4.85; // ~$0.0485/min, same rate used elsewhere

  return (aiCostCents + twilioCostCents) / 100;
}
