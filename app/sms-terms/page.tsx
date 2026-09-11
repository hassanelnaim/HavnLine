import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "SMS Program Terms — HavnLine" };

export default function SmsTermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/"><Logo /></Link>
          <div className="flex items-center gap-4 text-[13px] font-medium">
            <Link href="/terms" className="text-text-muted hover:text-text">Terms of Service</Link>
            <Link href="/privacy" className="text-text-muted hover:text-text">Privacy Policy</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-[28px] font-semibold text-ink">HavnLine SMS Program Terms</h1>
        <p className="mt-2 text-[13px] text-text-muted">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mt-8 space-y-6 text-[14px] leading-relaxed text-text">
          <p>
            This page describes exactly how and when HavnLine sends text messages, and exactly how a customer
            agrees (opts in) to receive them. HavnLine is an AI phone receptionist platform used by small
            businesses — all opt-in happens verbally, during a live phone call, as described in full below.
          </p>

          <div className="rounded-xl border-2 border-brand/30 bg-brand-soft px-5 py-4">
            <h2 className="font-display text-[16px] font-semibold text-ink">The complete opt-in flow (Call to Action)</h2>
            <ol className="mt-3 list-decimal space-y-2.5 pl-5">
              <li>A customer calls a business phone number that uses HavnLine. The call is answered live by that business's AI receptionist.</li>
              <li>If the customer asks to book an appointment, the AI verbally asks for and collects the customer's name and phone number during that same live call.</li>
              <li>
                Immediately after collecting the phone number, the AI <strong>verbally states, out loud, on the call</strong>:
                <div className="mt-2 rounded-lg border border-border bg-card px-4 py-3 font-mono text-[13px] text-text">
                  "Great, and I'll text you a confirmation at that number."
                </div>
              </li>
              <li>The customer's continued participation in booking, after hearing this stated out loud, is their opt-in consent. This spoken statement is the Call to Action — there is no web form, checkbox, or written opt-in anywhere in this flow, since consent is captured verbally in real time.</li>
              <li>Immediately after the call ends, that phone number receives <strong>exactly one</strong> automated text message confirming the appointment (business name, service, date, and time).</li>
              <li>No further messages are sent to that number unless the customer calls and books again, repeating the same verbal opt-in described above.</li>
            </ol>
          </div>

          <h2 className="font-display text-[18px] font-semibold text-ink">Message frequency</h2>
          <p>One message per completed booking. Recurring messages only occur if the customer calls back and books again.</p>

          <h2 className="font-display text-[18px] font-semibold text-ink">Sample message</h2>
          <div className="rounded-lg border border-border bg-card px-4 py-3 font-mono text-[13px] text-text">
            You're booked at Riverside Auto &amp; Tire for Oil Change on 08/28/2026 at 2:00 PM. See you then!
            Msg&amp;data rates may apply. Reply HELP for help, STOP to cancel.
          </div>

          <h2 className="font-display text-[18px] font-semibold text-ink">How to opt out</h2>
          <p>Reply <strong>STOP</strong> to any message to immediately stop receiving further texts. Reply <strong>HELP</strong> for assistance. Message and data rates may apply.</p>

          <h2 className="font-display text-[18px] font-semibold text-ink">No third-party sharing</h2>
          <p className="rounded-lg border border-border bg-paper px-4 py-3 font-medium">
            No mobile information — including text messaging originator opt-in data and consent — will be shared
            with any third parties or affiliates for marketing or promotional purposes. This information is used
            solely to deliver the appointment confirmation the customer consented to receive, and for no other
            purpose.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">Where phone numbers come from</h2>
          <p>
            Every phone number is provided directly by the customer, verbally, during a live call they personally
            initiated. HavnLine never collects phone numbers through web forms, purchased lists, imports, or any
            other channel.
          </p>

          <h2 className="font-display text-[18px] font-semibold text-ink">Full legal terms</h2>
          <p>
            See the full <Link href="/terms" className="font-medium text-brand hover:underline">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="font-medium text-brand hover:underline">Privacy Policy</Link> for
            complete details. Questions: <a href="mailto:havnlinesupport@gmail.com" className="font-medium text-brand hover:underline">havnlinesupport@gmail.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
