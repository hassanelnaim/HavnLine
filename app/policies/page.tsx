import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata = {
  title: "Policies — HavnLine",
};

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/" className="text-[13px] font-medium text-text-muted hover:text-text">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-[30px] font-semibold text-ink">Policies</h1>
        <p className="mt-2 text-[13px] text-text-muted">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-[12.5px] leading-relaxed text-brand-dark">
          This is a starting template covering what HavnLine actually does — it is not a substitute for review by
          a qualified attorney. Have a lawyer review and customize this before relying on it for a public launch.
        </div>

        <nav className="mt-6 flex gap-4 text-[13px] font-medium text-brand">
          <a href="#terms" className="hover:underline">Terms of Service</a>
          <a href="#privacy" className="hover:underline">Privacy Policy</a>
        </nav>

        <section id="terms" className="mt-10 scroll-mt-8 space-y-5 text-[14px] leading-relaxed text-text">
          <h2 className="font-display text-[22px] font-semibold text-ink">Terms of Service</h2>

          <p>
            These Terms of Service ("Terms") govern your use of HavnLine (the "Service"), an AI receptionist
            platform that answers phone calls, answers questions, and books appointments on behalf of the
            business that subscribes to it. By creating an account or using the Service, you agree to these
            Terms.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">1. Your account</h3>
          <p>
            You must provide accurate information when creating an account and keep your login credentials
            secure. You're responsible for all activity that happens under your account, including everything
            your AI receptionist does on calls connected to your business.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">2. Subscription &amp; billing</h3>
          <p>
            The Service is offered as a monthly subscription, billed through our payment processor (Stripe). New
            subscriptions may include a free trial period; unless you cancel before the trial ends, you will be
            automatically charged the full subscription price when it ends and every billing period after that.
            You can cancel anytime through your account's Billing page — your subscription remains active until
            the end of the current billing period, and we don't provide partial-period refunds.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">3. What the AI does — and its limits</h3>
          <p>
            Your AI receptionist answers calls and takes actions (like booking appointments) based on the
            business information, services, hours, and rules you provide. You're responsible for keeping that
            information accurate and up to date. Like any AI system, it can occasionally misunderstand a request
            or make a mistake — you should review calls, appointments, and escalations regularly rather than
            treating the AI as infallible.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">4. Call recording &amp; monitoring notice</h3>
          <p>
            The Service records, transcribes, and stores phone conversations handled by your AI receptionist so
            they can appear in your dashboard. <strong>You are responsible for complying with call recording and
            monitoring laws in your jurisdiction</strong> — many places require notifying callers, or obtaining
            their consent, that a call may be recorded or monitored (for example, via an automated notice at the
            start of the call). Consult a lawyer about what's required where you operate.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">5. Acceptable use</h3>
          <p>
            You agree not to use the Service for anything illegal, to send unsolicited spam calls or texts, to
            impersonate another business or person, or to attempt to interfere with or reverse-engineer the
            Service. We may suspend or terminate accounts that violate this.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">6. Third-party services</h3>
          <p>
            HavnLine relies on third-party providers to function, including telephony and SMS (Twilio), AI
            language processing (Anthropic), voice generation (ElevenLabs), calendar sync (Google), payments
            (Stripe), and database hosting (Supabase). Your use of the Service is also subject to the relevant
            terms of these providers where applicable.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">7. Disclaimer &amp; limitation of liability</h3>
          <p>
            The Service is provided "as is" without warranties of any kind. To the fullest extent permitted by
            law, HavnLine is not liable for indirect, incidental, or consequential damages arising from your use
            of the Service, including missed calls, booking errors, or business losses, beyond the amount you
            paid us in the preceding three months.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">8. Termination</h3>
          <p>
            You may stop using the Service and cancel your subscription at any time. We may suspend or terminate
            your access if you violate these Terms or fail to pay.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">9. Changes to these Terms</h3>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes take effect
            means you accept the updated Terms.
          </p>
        </section>

        <section id="privacy" className="mt-14 scroll-mt-8 space-y-5 text-[14px] leading-relaxed text-text">
          <h2 className="font-display text-[22px] font-semibold text-ink">Privacy Policy</h2>

          <p>
            This Privacy Policy explains what information HavnLine collects, how it's used, and who it's shared
            with.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">1. Information we collect</h3>
          <ul className="ml-5 list-disc space-y-1.5">
            <li><strong>Account information:</strong> your name and email address.</li>
            <li><strong>Business information:</strong> business name, address, hours, services, and any content you add to your AI's knowledge base.</li>
            <li>
              <strong>Call and customer data:</strong> phone numbers, call recordings/transcripts, appointment
              details, and any information your customers share with the AI during a call or text.
            </li>
            <li><strong>Payment information:</strong> handled entirely by Stripe — we never see or store your full card details.</li>
          </ul>

          <h3 className="font-display text-[16px] font-semibold text-ink">2. How we use this information</h3>
          <p>
            We use it to operate the Service — answering calls, generating AI responses, booking appointments,
            processing payments, and showing you your own business's data in the dashboard. We do not sell your
            data.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">3. Who we share it with</h3>
          <p>
            We share the minimum necessary data with the service providers that power HavnLine: Twilio (calls and
            SMS), Anthropic (processes conversation text to generate AI responses), ElevenLabs (converts AI
            responses to speech), Google (only if you connect Google Calendar), Stripe (payment processing), and
            Supabase (secure database hosting). Each of these providers has its own privacy practices governing
            how they handle data.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">4. Data isolation between businesses</h3>
          <p>
            If you're a business using HavnLine, your data — customers, calls, appointments, and knowledge base —
            is kept separate from every other business on the platform through database-level access controls.
            One business cannot see another's data.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">5. Data retention</h3>
          <p>
            We retain your data for as long as your account is active. You can request deletion of your account
            and associated data by contacting us.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">6. Your rights</h3>
          <p>
            You can access, correct, or request deletion of your personal information at any time from your
            account settings, or by contacting us directly.
          </p>

          <h3 className="font-display text-[16px] font-semibold text-ink">7. Children's privacy</h3>
          <p>The Service is intended for business use and is not directed at children under 13.</p>

          <h3 className="font-display text-[16px] font-semibold text-ink">8. Changes to this policy</h3>
          <p>We may update this Privacy Policy from time to time. We'll update the date at the top of this page when we do.</p>

          <h3 className="font-display text-[16px] font-semibold text-ink">9. Contact us</h3>
          <p>
            Questions about these policies? Contact us at{" "}
            <span className="font-medium text-text-muted">[add your support email here]</span>.
          </p>
        </section>
      </main>
    </div>
  );
}
