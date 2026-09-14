import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export function getClientIp(): string {
  const h = headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

export async function checkRateLimit(rateKey: string, maxHits: number, windowMinutes: number): Promise<boolean> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count } = await admin
    .from("rate_limit_hits")
    .select("*", { count: "exact", head: true })
    .eq("rate_key", rateKey)
    .gte("created_at", windowStart);

  await admin.from("rate_limit_hits").insert({ rate_key: rateKey });

  return (count || 0) < maxHits;
}
