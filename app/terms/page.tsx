import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata = {
  title: "Terms of Service — HavnLine",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 text-[13px] font-medium">
            <Link href="/privacy" className="text-text-muted hover:text-text">Privacy Policy</Link>
            <Link href="/" className="text-text-muted hover:text-text">Back to home</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-[30px] font-semibold text-ink">Terms of Service</h1>
        <p className="mt-2 text-[13px] text-text-muted">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-[12.5px] leading-relaxed text-brand-dark">
          This is a starting template covering what HavnLine actually does — it is not a substitute for review by
          a qualified attorney. Have a lawyer review and customize this before relying on it for a public launch.
        </div>

        <section className="mt-8 space-y-5 text-[14px] leading-relaxed text-text">
          <p>
            These Terms of Service ("Terms") govern your use of HavnLine (the "Service"), an AI receptionist
            platform that answers phone calls, answers questions, and books appointments on behalf of the
            business that subscribes to it. By creating an account or using the Service, you agree to these
            Terms.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">1. Your account</h2>
          <p>
            You must provide accurate information when creating an account and keep your login credentials
            secure. You're responsible for all activity that happens under your account, including everything
            your AI receptionist does on calls connected to your business.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">2. Subscription &amp; billing</h2>
          <p>
            The Service is offered as a monthly subscription, billed through our payment processor (Stripe). New
            subscriptions may include a free trial period; unless you cancel before the trial ends, you will be
            automatically charged the full subscription price when it ends and every billing period after that.
            You can cancel anytime through your account's Billing page — your subscription remains active until
            the end of the current billing period, and we don't provide partial-period refunds.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">3. What the AI does — and its limits</h2>
          <p>
            Your AI receptionist answers calls and takes actions (like booking appointments) based on the
            business information, services, hours, and rules you provide. You're responsible for keeping that
            information accurate and up to date. Like any AI system, it can occasionally misunderstand a request
            or make a mistake — you should review calls, appointments, and escalations regularly rather than
            treating the AI as infallible.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">4. Call recording &amp; monitoring notice</h2>
          <p>
            The Service records, transcribes, and stores phone conversations handled by your AI receptionist so
            they can appear in your dashboard. <strong>You are responsible for complying with call recording and
            monitoring laws in your jurisdiction</strong> — many places require notifying callers, or obtaining
            their consent, that a call may be recorded or monitored (for example, via an automated notice at the
            start of the call). Consult a lawyer about what's required where you operate.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">5. SMS messaging</h2>
          <p>
            With your consent, customers who book an appointment receive a one-time SMS confirmation. Message
            and data rates may apply. Reply STOP to any message to opt out of future texts, or HELP for
            assistance.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">6. Acceptable use</h2>
          <p>
            You agree not to use the Service for anything illegal, to send unsolicited spam calls or texts, to
            impersonate another business or person, or to attempt to interfere with or reverse-engineer the
            Service. We may suspend or terminate accounts that violate this.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">7. Third-party services</h2>
          <p>
            HavnLine relies on third-party providers to function, including telephony and SMS (Twilio), AI
            language processing (Anthropic), voice generation (ElevenLabs), calendar sync (Google), payments
            (Stripe), and database hosting (Supabase). Your use of the Service is also subject to the relevant
            terms of these providers where applicable.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">8. Disclaimer &amp; limitation of liability</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. To the fullest extent permitted by
            law, HavnLine is not liable for indirect, incidental, or consequential damages arising from your use
            of the Service, including missed calls, booking errors, or business losses, beyond the amount you
            paid us in the preceding three months.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">9. Termination</h2>
          <p>
            You may stop using the Service and cancel your subscription at any time. We may suspend or terminate
            your access if you violate these Terms or fail to pay.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">10. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes take effect
            means you accept the updated Terms.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">11. Contact us</h2>
          <p>
            Questions about these Terms? Contact us at{" "}
            <a href="mailto:havnlinesupport@gmail.com" className="font-medium text-brand hover:underline">
              havnlinesupport@gmail.com
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
