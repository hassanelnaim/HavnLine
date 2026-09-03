import Link from "next/link";
import {
  ArrowRight, Phone, PhoneMissed, PhoneCall, MessageSquareText, BookOpen, ShieldCheck,
  Mic2, CalendarClock, Check, Globe, Wrench, Scissors, Stethoscope, Scale, Hammer,
  UtensilsCrossed, HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

const FEATURES = [
  { icon: Phone, title: "Answers every call, day or night", detail: "Picks up 24/7 and knows your business." },
  { icon: CalendarClock, title: "Books real appointments", detail: "Checks your real calendar, only offers open times." },
  { icon: Globe, title: "Learns your business in minutes", detail: "Paste your website — services and FAQs import automatically." },
  { icon: ShieldCheck, title: "Knows when to hand off", detail: "Escalates refunds and complaints to you, handles the rest itself." },
  { icon: MessageSquareText, title: "Texts a confirmation automatically", detail: "Every booking gets a real SMS, no extra step for you." },
  { icon: Mic2, title: "Sounds like a real person", detail: "Natural voices, not a robotic phone tree." },
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
  { label: "Business information", detail: "Tell us who you are and your hours." },
  { label: "AI personality", detail: "Pick a voice and what it's allowed to do." },
  { label: "Go live", detail: "Get a number, or keep your own, and turn it on." },
];

const FAQS = [
  { q: "Will it sound like a robot?", a: "No — natural voices, not an old-school phone tree." },
  { q: "What if it can't answer something?", a: "It hands off to you instead of guessing. It never invents prices or policies." },
  { q: "Do I need a new phone number?", a: "No. Forward your existing number, or use a new one we provide." },
  { q: "What happens after my free trial?", a: "You're billed automatically unless you cancel first. No surprise commitment." },
  { q: "Can I control what it says?", a: "Yes — personality, voice, and rules are all yours to set. No prompt-writing needed." },
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
            <Link href="/signup">Get started <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </nav>
      </header>

      <main>
        <section className="bg-ink py-14">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex items-center gap-2 text-[#8A93A6]">
              <PhoneMissed className="h-4 w-4" />
              <span className="text-[11.5px] font-semibold uppercase tracking-wide">The cost of an unanswered phone</span>
            </div>
            <h2 className="mt-3 font-display text-[28px] font-semibold leading-[1.2] text-white sm:text-[36px]">
              <span className="text-brand-light">62%</span> of small business calls go unanswered.
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#B8C0D0]">
              Every missed call is a customer who was ready to book — and most won&apos;t call back. They&apos;ll
              just call the next name on the list. HavnLine picks up every time, so you never have to choose
              between running your business and answering the phone.
            </p>
            <p className="mt-4 text-[11px] text-[#6B7488]">Source: 411 Locals, 85 businesses across 58 industries.</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14 pt-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-ring" />
                Now answering calls for small businesses
              </span>
              <h1 className="mt-5 max-w-xl font-display text-[34px] font-semibold leading-[1.1] text-ink sm:text-[48px]">
                An AI receptionist that actually knows your business.
              </h1>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-text-muted">
                Answers your phone, books real appointments, and hands off anything it shouldn&apos;t handle
                alone — day or night.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button variant="brand" size="lg" asChild>
                  <Link href="/signup">Start your free trial <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login">I have an account</Link>
                </Button>
              </div>
              <p className="mt-3 text-[11.5px] text-text-faint">7 days free, then $199/month. Cancel anytime.</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-card p-4 opacity-80">
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-text-faint">Without HavnLine</div>
                <div className="mt-2.5 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                    <PhoneMissed className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-text">9:47 PM — missed call</div>
                    <div className="mt-1 text-[11.5px] text-danger">Customer called a competitor.</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-brand bg-card p-4 shadow-card">
                <div className="text-[10.5px] font-semibold uppercase tracking-wide text-brand">With HavnLine</div>
                <div className="mt-2.5 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                    <PhoneCall className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-text">9:47 PM — answered by Alex</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-brand-dark">
                      <Check className="h-3.5 w-3.5" /> Booked, confirmation texted
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card py-14">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-text-faint">Built for real businesses</p>
            <h2 className="mt-2.5 font-display text-[22px] font-semibold text-ink">If you take appointments by phone, this is for you.</h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {INDUSTRIES.map((ind) => (
                <div key={ind.label} className="flex items-center gap-1.5 rounded-full border border-border bg-paper px-3.5 py-1.5 text-[12.5px] font-medium text-text">
                  <ind.icon className="h-3.5 w-3.5 text-brand" />
                  {ind.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-text-faint">What it actually does</p>
            <h2 className="mt-2.5 font-display text-[26px] font-semibold leading-tight text-ink">A great front-desk hire — without the payroll.</h2>
          </div>
          <div className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
                  <f.icon className="h-4 w-4" />
                </div>
                <div className="mt-3 font-display text-[14px] font-semibold text-ink">{f.title}</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">{f.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-text-faint">Live in three steps</p>
            </div>
            <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.label} className="rounded-2xl border border-border bg-paper p-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-card font-mono text-[11.5px] font-medium text-text-muted">{i + 1}</div>
                  <div className="mt-3 font-display text-[14px] font-semibold text-ink">{step.label}</div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-14">
          <div className="text-center">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-text-faint">Questions</p>
            <h2 className="mt-2.5 font-display text-[26px] font-semibold text-ink">Before you get started</h2>
          </div>
          <div className="mt-7 divide-y divide-border-soft">
            {FAQS.map((item) => (
              <div key={item.q} className="py-4">
                <div className="font-display text-[14px] font-semibold text-ink">{item.q}</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-card py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11.5px] font-semibold uppercase tracking-wide text-text-faint">Pricing</p>
              <h2 className="mt-2.5 font-display text-[26px] font-semibold text-ink">One plan. Everything included.</h2>
            </div>
            <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-brand bg-paper p-7 text-center shadow-card">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="font-display text-[38px] font-semibold text-ink">$199</span>
                <span className="text-[13px] text-text-muted">/month</span>
              </div>
              <p className="mt-1 text-[12px] text-text-muted">7 days free, then billed monthly. Cancel anytime.</p>
              <ul className="mx-auto mt-5 inline-block space-y-2 text-left">
                {["Unlimited calls answered", "Real appointment booking", "Automatic SMS confirmations", "Google Calendar sync", "Custom AI voice & personality", "Escalation to you when it matters"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[13px] text-text">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="brand" size="lg" className="mt-6 w-full" asChild>
                <Link href="/signup">Start your free trial <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-ink py-14">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="font-display text-[26px] font-semibold text-white sm:text-[32px]">Stop losing customers to a phone that doesn&apos;t answer.</h2>
            <p className="mx-auto mt-2.5 max-w-md text-[13px] text-[#8A93A6]">Set up your receptionist in minutes. First 7 days are free.</p>
            <Button variant="brand" size="lg" className="mt-6" asChild>
              <Link href="/signup">Start your free trial <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-[11.5px] text-text-faint">
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
