import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/supabase/platform-admin";
import { Logo } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const allowed = await isPlatformAdmin();

  if (!allowed) {
    // Fail loudly instead of silently redirecting — a silent bounce
    // back to the normal dashboard looks identical to "this page does
    // nothing," which is exactly the confusing symptom this caused.
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const configuredEmail = process.env.PLATFORM_ADMIN_EMAIL;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-6 shadow-card">
          <h1 className="font-display text-[16px] font-semibold text-ink">Access restricted</h1>
          <p className="mt-2 text-[13px] text-text-muted">
            {!configuredEmail
              ? "PLATFORM_ADMIN_EMAIL isn't set in this deployment's environment variables yet."
              : "The logged-in email doesn't match the configured platform admin email."}
          </p>
          {configuredEmail && (
            <div className="mt-3 space-y-1 rounded-lg border border-border bg-paper px-3 py-2.5 text-left text-[12px]">
              <div>Logged in as: <span className="font-mono font-medium text-text">{user?.email || "—"}</span></div>
              <div>Configured admin: <span className="font-mono font-medium text-text">{configuredEmail}</span></div>
            </div>
          )}
          <Link href="/dashboard" className="mt-4 inline-block text-[13px] font-medium text-brand hover:underline">Back to my dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-ink">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo tone="light" wordmarkClassName="text-[14px]" />
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white">Platform Admin</span>
          </div>
          <Link href="/dashboard" className="text-[13px] font-medium text-[#B8C0D0] hover:text-white">Back to my dashboard</Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
