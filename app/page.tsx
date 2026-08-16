import Link from "next/link";
import { ArrowRight, Phone, Calendar, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { label: "Business information", detail: "Tell GetMade who you are and what you offer." },
  { label: "AI personality", detail: "Pick a name, tone, and what it's allowed to do." },
  { label: "Go live", detail: "Get a phone number and turn your receptionist on." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-display text-[13px] font-semibold text-white">
            G
          </div>
          <span className="font-display text-[16px] font-semibold text-ink">GetMade</span>
        </div>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button variant="brand" size="sm" asChild>
            <Link href="/signup">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <section className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11.5px] font-medium text-text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-ring" />
              Now answering calls for small businesses
            </span>
            <h1 className="mt-6 max-w-xl font-display text-[42px] font-semibold leading-[1.08] text-ink sm:text-[52px]">
              An AI receptionist that actually knows your business.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-muted">
              GetMade answers your phone, books appointments, and hands off anything it
              shouldn&apos;t handle alone — so every caller gets a real answer, and nothing
              falls through the cracks.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Button variant="brand" size="lg" asChild>
                <Link href="/signup">
                  Set up your receptionist <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">I have an account</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between border-b border-border-soft pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-[13px] font-semibold text-white">
                    A
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-ink">Alex — Riverside Auto &amp; Tire</div>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-ring" />
                      Online
                    </div>
                  </div>
                </div>
                <Phone className="h-4 w-4 text-text-faint" />
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="ml-auto max-w-[80%] rounded-xl rounded-br-sm bg-ink px-3.5 py-2.5 text-[13px] text-white">
                  Hi, do you have anything open tomorrow for an oil change?
                </div>
                <div className="max-w-[85%] rounded-xl rounded-bl-sm border border-border-soft bg-paper px-3.5 py-2.5 text-[13px] text-text">
                  I have 9:00 or 9:45 AM open tomorrow for an Oil Change — $59.99, about 45
                  minutes. Which works better?
                </div>
                <div className="ml-auto max-w-[80%] rounded-xl rounded-br-sm bg-ink px-3.5 py-2.5 text-[13px] text-white">
                  9:00 works.
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-[11.5px] font-medium text-brand-dark">
                  <Calendar className="h-3.5 w-3.5" />
                  Appointment booked — 9:00 AM tomorrow
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-28">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-text-faint">
            From setup to live in three steps
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.label} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-paper font-mono text-[12px] font-medium text-text-muted">
                  {i + 1}
                </div>
                <div className="mt-4 font-display text-[15px] font-semibold text-ink">
                  {step.label}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 flex items-center gap-3 rounded-2xl border border-border bg-card p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
            <MessageSquareText className="h-[18px] w-[18px]" />
          </div>
          <p className="text-[13.5px] text-text-muted">
            No APIs, no prompts, no webhooks to configure. You describe your business in
            plain language — GetMade handles the technical part behind the scenes.
          </p>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-[12px] text-text-faint">
          <span>© {new Date().getFullYear()} GetMade</span>
          <span>Front desk, automated.</span>
        </div>
      </footer>
    </div>
  );
}
