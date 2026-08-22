import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingProvider } from "@/lib/onboarding/context";
import { StepperNav } from "@/components/onboarding/stepper-nav";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/business";
import { Logo } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  // Once Supabase is connected, you need to be logged in to set up a
  // business — in demo mode this is skipped so the wizard stays browsable.
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }
  }

  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-paper">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
            <Link href="/">
              <Logo wordmarkClassName="text-[15px]" />
            </Link>
            <span className="text-[12px] text-text-faint">Setup</span>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-6 py-12">
          <StepperNav />
          {children}
        </main>
      </div>
    </OnboardingProvider>
  );
}
