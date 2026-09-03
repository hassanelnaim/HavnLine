import Link from "next/link";
import {
  ArrowRight,
  Phone,
  PhoneMissed,
  PhoneCall,
  MessageSquareText,
  BookOpen,
  ShieldCheck,
  Mic2,
  CalendarClock,
  Check,
  Globe,
  Wrench,
  Scissors,
  Stethoscope,
  Scale,
  Hammer,
  UtensilsCrossed,
  HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

const FEATURES = [
  {
    icon: Phone,
    title: "Answers every call, day or night",
    detail: "Whether it's 2pm or 2am, HavnLine picks up, sounds natural, and knows exactly what your business offers.",
  },
  {
    icon: CalendarClock,
    title: "Books real appointments",
    detail: "Checks your actual calendar, confirms a time that works, and only ever offers slots during your real hours.",
  },
  {
    icon: Globe,
    title: "Learns your business in minutes",
    detail: "Paste your website and HavnLine reads it — pulling in your FAQs, services, and policies automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Knows when to hand off",
    detail: "Refunds, complaints, or a customer who just wants a person — HavnLine escalates the right things to you, and handles everything else on its own.",
  },
  {
    icon: MessageSquareText,
    title: "Texts a confirmation automatically",
    detail: "Every booking gets a real SMS confirmation, sent the moment the call ends — no extra step for you.",
  },
  {
    icon: Mic2,
    title: "Sounds like a real person",
    detail: "Pick from a library of natural voices, or connect your own — not a robotic phone tree.",
  },
];

const INDUSTRIES = [
  { icon: Wrench, label: "Auto Repair" },
  { icon: Scissors, label: "Salon & Spa" },
  { icon: HeartPulse, label: "Dental Practice" },
  { icon: Stethoscope, label: "Medical Practice" },
  { icon: Scale, label: "Law Firm" },
  { icon: Hammer, label: "Home Services" },
  { icon: UtensilsCrossed, label: "Restaurant" },
];

const STEPS = [
  { label: "Business information", detail: "Tell HavnLine who you are, what you offer, and your real hours." },
  { label: "AI personality", detail: "Pick a name, a voice, a tone, and exactly what it's allowed to do." },
  { label: "Go live", detail: "Get a phone number — or keep your current one — and turn it on." },
];

const FAQS = [
  {
    q: "Will it sound like a robot?",
    a: "No. HavnLine uses natural, realistic voices — not an old-school phone tree. Customers talk to it the way they'd talk to a person, and it responds the same way.",
  },
  {
    q: "What if it can't answer something?",
    a: "It hands off to you instead of guessing. HavnLine never invents prices, policies, or availability — if it doesn't know, it says so honestly and flags it for you to follow up on.",
  },
  {
    q: "Do I need a new phone number or new hardware?",
    a: "No. Forward your existing business number, or use a new one we provide — either way, customers keep calling the number they already know.",
  },
  {
    q: "What happens after my free trial?",
    a: "You're billed automatically once the trial ends, unless you cancel first. No surprise commitment — cancel anytime from your dashboard.",
  },
  {
    q: "Can I control what it says?",
    a: "Yes. You set its personality, voice, rules, and exactly what it's allowed to do — no prompt-writing or technical setup required.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
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

      <main>
        {/* ---------- Problem: real, sourced stat — centered, text-only ---------- */}
        <section className="bg-ink py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[#8A93A6]">
              <PhoneMissed className="h-4 w-4" />
              <span className="text-[12px] font-semibold uppercase tracking-wide">The real cost of an unanswered phone</span>
            </div>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-[32px] font-semibold leading-[1.2] text-white sm:text-[40px]">
              <span className="text-brand-light">62%</span> of calls to small businesses go
              unanswered.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#B8C0D0]">
              Every one of those calls is a customer who was ready to book — a leaking pipe, a
              toothache, a car that won&apos;t start. Most won&apos;t leave a voicemail.
              Research consistently shows most callers who reach voicemail never call back —
              they just call the next name on the list.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[#B8C0D0]">
              You can&apos;t answer the phone every single time — you&apos;re running the
              business, not sitting by it. HavnLine can. It picks up every call, every time,
              and handles it the way you would.
            </p>
            <p className="mt-5 text-[11.5px] text-[#6B7488]">
              Source: 411 Locals study, 85 businesses across 58 industries.
            </p>
          </div>
        </section>

        {/* ---------- Hero: paired with a visual, stays left-aligned ---------- */}
        <section className="mx-auto max-w-6xl px-6 pb-14 pt-12">
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11.5px] font-medium text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-ring" />
                Now answering calls for small businesses
              </span>
              <h1 className="mt-6 max-w-xl font-display text-[42px] font-semibold leading-[1.08] text-ink sm:text-[52px]">
                An AI receptionist that actually knows your business.
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-muted">
                HavnLine answers your phone, books real appointments, and hands off anything
                it shouldn&apos;t handle alone — so every caller gets a real answer, day or
                night, and nothing falls through the cracks.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button variant="brand" size="lg" asChild>
                  <Link href="/signup">
                    Start your free trial <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login">I have an account</Link>
                </Button>
              </div>
              <p className="mt-3 text-[12px] text-text-faint">
                7 days free, then $199/month. Cancel anytime.
              </p>
            </div>

            {/* Before/after: same call, two outcomes */}
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-card p-5 opacity-80">
                <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
                  Without HavnLine
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                    <PhoneMissed className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium text-text">Tuesday, 9:47 PM — missed call</div>
                    <div className="mt-0.5 text-[12.5px] text-text-muted">No voicemail left.</div>
                    <div className="mt-1.5 text-[12px] text-danger">Customer called a competitor 12 minutes later.</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-brand bg-card p-5 shadow-card">
                <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-wide text-brand">
                  With HavnLine
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                    <PhoneCall className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium text-text">Tuesday, 9:47 PM — answered by Alex</div>
                    <div className="mt-0.5 text-[12.5px] text-text-muted">Booked for Wednesday, 9:00 AM.</div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-brand-dark">
                      <Check className="h-3.5 w-3.5" /> Confirmation texted automatically
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Built for your industry ---------- */}
        <section className="border-y border-border bg-card py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-text-faint">Built for real businesses</p>
            <h2 className="mt-3 font-display text-[26px] font-semibold text-ink">
              If you take appointments over the phone, this is for you.
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {INDUSTRIES.map((ind) => (
                <div
                  key={ind.label}
                  className="flex items-center gap-2 rounded-full border border-border bg-paper px-4 py-2 text-[13px] font-medium text-text"
                >
                  <ind.icon className="h-4 w-4 text-brand" />
                  {ind.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-text-faint">What it actually does</p>
            <h2 className="mt-3 font-display text-[30px] font-semibold leading-tight text-ink">
              Everything a great front-desk hire would do — without the payroll.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
                  <f.icon className="h-4.5 w-4.5" />
                </div>
                <div className="mt-4 font-display text-[15px] font-semibold text-ink">{f.title}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{f.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="border-y border-border bg-card py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-text-faint">
                From setup to live in three steps
              </p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.label} className="rounded-2xl border border-border bg-paper p-5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card font-mono text-[12px] font-medium text-text-muted">
                    {i + 1}
                  </div>
                  <div className="mt-4 font-display text-[15px] font-semibold text-ink">{step.label}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{step.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-paper p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                <BookOpen className="h-[18px] w-[18px]" />
              </div>
              <p className="text-[13.5px] text-text-muted">
                No APIs, no prompts, no webhooks to configure. You describe your business in
                plain language — HavnLine handles the technical part behind the scenes.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Pricing: centered, single focal card ---------- */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-text-faint">Pricing</p>
            <h2 className="mt-3 font-display text-[30px] font-semibold text-ink">One plan. Everything included.</h2>
          </div>
          <div className="mx-auto mt-7 max-w-md rounded-2xl border-2 border-brand bg-card p-8 text-center shadow-card">
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="font-display text-[44px] font-semibold text-ink">$199</span>
              <span className="text-[14px] text-text-muted">/month</span>
            </div>
            <p className="mt-1 text-[13px] text-text-muted">7 days free, then billed monthly. Cancel anytime.</p>
            <ul className="mx-auto mt-6 inline-block space-y-2.5 text-left">
              {[
                "Unlimited calls answered",
                "Real appointment booking",
                "Automatic SMS confirmations",
                "Google Calendar sync",
                "Custom AI voice & personality",
                "Escalation to you when it matters",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[13.5px] text-text">
                  <Check className="h-4 w-4 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <Button variant="brand" size="lg" className="mt-7 w-full" asChild>
              <Link href="/signup">
                Start your free trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="border-t border-border bg-card py-16">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-text-faint">Questions</p>
              <h2 className="mt-3 font-display text-[30px] font-semibold text-ink">Before you get started</h2>
            </div>
            <div className="mt-8 divide-y divide-border-soft">
              {FAQS.map((item) => (
                <div key={item.q} className="py-5">
                  <div className="font-display text-[15px] font-semibold text-ink">{item.q}</div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <section className="bg-ink py-16">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="font-display text-[30px] font-semibold text-white sm:text-[36px]">
              Stop losing customers to a phone that doesn&apos;t answer.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] text-[#8A93A6]">
              Set up your receptionist in minutes. First 7 days are free.
            </p>
            <Button variant="brand" size="lg" className="mt-7" asChild>
              <Link href="/signup">
                Start your free trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-[12px] text-text-faint">
          <span>© {new Date().getFullYear()} HavnLine</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-text">Terms</Link>
            <Link href="/privacy" className="hover:text-text">Privacy</Link>
            <span>Front desk, automated.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
