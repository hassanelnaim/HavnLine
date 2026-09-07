import { redirect } from "next/navigation";
import Link from "next/link";
import { isPlatformAdmin } from "@/lib/supabase/platform-admin";
import { Logo } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const allowed = await isPlatformAdmin();
  if (!allowed) redirect("/dashboard");

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
