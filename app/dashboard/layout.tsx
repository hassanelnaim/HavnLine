import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getBusiness } from "@/lib/data/business";
import { getAiReceptionist } from "@/lib/data/ai-receptionist";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentBusinessId, getCurrentUser } from "@/lib/supabase/business";

// The data layer computes "today" relative to request time (e.g. calls
// /appointments due today) and depends on the logged-in user's session,
// so this must always be server-rendered per request, never cached.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Auth guard — only enforced once Supabase is actually connected, so
  // the dashboard stays freely browsable in demo mode.
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      redirect("/onboarding");
    }
  }

  const [business, ai, profile] = await Promise.all([getBusiness(), getAiReceptionist(), getCurrentUserProfile()]);

  return (
    <DashboardShell
      businessName={business.name}
      employeeName={ai.name}
      initialStatus={ai.status}
      userFullName={profile.fullName}
    >
      {children}
    </DashboardShell>
  );
}
