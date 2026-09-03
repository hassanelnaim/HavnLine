import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata = {
  title: "Privacy Policy — HavnLine",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 text-[13px] font-medium">
            <Link href="/terms" className="text-text-muted hover:text-text">Terms of Service</Link>
            <Link href="/" className="text-text-muted hover:text-text">Back to home</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-[30px] font-semibold text-ink">Privacy Policy</h1>
        <p className="mt-2 text-[13px] text-text-muted">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-[12.5px] leading-relaxed text-brand-dark">
          This is a starting template covering what HavnLine actually does — it is not a substitute for review by
          a qualified attorney. Have a lawyer review and customize this before relying on it for a public launch.
        </div>

        <section className="mt-8 space-y-5 text-[14px] leading-relaxed text-text">
          <p>
            This Privacy Policy explains what information HavnLine collects, how it's used, and who it's shared
            with.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">1. Information we collect</h2>
          <ul className="ml-5 list-disc space-y-1.5">
            <li><strong>Account information:</strong> your name and email address.</li>
            <li><strong>Business information:</strong> business name, address, hours, services, and any content you add to your AI's knowledge base.</li>
            <li>
              <strong>Call and customer data:</strong> phone numbers, call recordings/transcripts, appointment
              details, and any information your customers share with the AI during a call or text.
            </li>
            <li><strong>Payment information:</strong> handled entirely by Stripe — we never see or store your full card details.</li>
          </ul>

          <h2 className="font-display text-[18px] font-semibold text-ink">2. SMS messaging &amp; consent</h2>
          <p>
            Customers consent to receive a text message verbally, over the phone, at the moment they provide
            their phone number to book an appointment with a business's AI receptionist. No phone numbers are
            collected, purchased, or imported from any other source. Message frequency is one confirmation per
            booked appointment. Customers can reply STOP at any time to opt out, or HELP for assistance.
          </p>
          <p className="rounded-lg border border-border bg-paper px-4 py-3 font-medium">
            No mobile information — including text messaging originator opt-in data and consent — will be
            shared with any third parties or affiliates for marketing or promotional purposes. This information
            is used solely to deliver the appointment confirmation the customer consented to and for no other
            purpose.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">3. How we use this information</h2>
          <p>
            We use it to operate the Service — answering calls, generating AI responses, booking appointments,
            processing payments, and showing you your own business's data in the dashboard. We do not sell your
            data.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">4. Who we share it with</h2>
          <p>
            We share the minimum necessary data with the service providers that power HavnLine: Twilio (calls and
            SMS), Anthropic (processes conversation text to generate AI responses), ElevenLabs (converts AI
            responses to speech), Google (only if you connect Google Calendar), Stripe (payment processing), and
            Supabase (secure database hosting). Each of these providers has its own privacy practices governing
            how they handle data. As stated above, mobile opt-in and consent data specifically is never shared
            with any party for marketing or promotional purposes.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">5. Data isolation between businesses</h2>
          <p>
            If you're a business using HavnLine, your data — customers, calls, appointments, and knowledge base —
            is kept separate from every other business on the platform through database-level access controls.
            One business cannot see another's data.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">6. Data retention</h2>
          <p>
            We retain your data for as long as your account is active. You can request deletion of your account
            and associated data by contacting us.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">7. Your rights</h2>
          <p>
            You can access, correct, or request deletion of your personal information at any time from your
            account settings, or by contacting us directly.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">8. Children's privacy</h2>
          <p>The Service is intended for business use and is not directed at children under 13.</p>

          <h2 className="font-display text-[18px] font-semibold text-ink">9. Changes to this policy</h2>
          <p>We may update this Privacy Policy from time to time. We'll update the date at the top of this page when we do.</p>

          <h2 className="font-display text-[18px] font-semibold text-ink">10. Contact us</h2>
          <p>
            Questions about this Privacy Policy? Contact us at{" "}
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
