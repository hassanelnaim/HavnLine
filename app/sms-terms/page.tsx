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
                Immediately after collecting the phone number, the AI <strong>verbally asks for permission, out loud, on the call</strong> — this is a real request, not a notification, and the customer can decline:
                <div className="mt-2 rounded-lg border border-border bg-card px-4 py-3 font-mono text-[13px] text-text">
                  "Is it okay if I text you about this appointment — confirmation, and a reminder the day before? You can reply STOP anytime to opt out."
                </div>
              </li>
              <li>The customer verbally agrees ("yes," "sure," "sounds good," etc.) before any message is sent. If the customer declines or doesn't agree, no text is ever sent to that number for that appointment — this is enforced by the system itself, not just a described intention. This verbal agreement is the Call to Action — there is no web form or checkbox anywhere in this flow, since consent is requested and captured verbally, in real time, on the same call.</li>
              <li>Only after receiving that verbal "yes" is that phone number eligible to receive messages about that specific appointment: one confirmation, one reminder the day before, and an update if the appointment is later cancelled or rescheduled.</li>
              <li>No unrelated or marketing messages are ever sent. No further messages are sent to that number for a different, new appointment unless the customer calls and books again, repeating the same verbal consent request described above.</li>
            </ol>
          </div>

          <h2 className="font-display text-[18px] font-semibold text-ink">Message types and frequency</h2>
          <p>Every message is tied to a specific appointment the customer booked by phone and consented to be texted about. Up to three messages per appointment:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li><strong>Confirmation</strong> — sent once, immediately after booking.</li>
            <li><strong>Reminder</strong> — sent once, the day before the appointment.</li>
            <li><strong>Update</strong> — sent only if the appointment is cancelled or rescheduled after being booked.</li>
          </ul>

          <h2 className="font-display text-[18px] font-semibold text-ink">Sample messages</h2>
          <div className="space-y-2">
            <div className="rounded-lg border border-border bg-card px-4 py-3 font-mono text-[13px] text-text">
              You're booked at Riverside Auto &amp; Tire for Oil Change on 08/28/2026 at 2:00 PM. See you then!
              Msg&amp;data rates may apply. Reply HELP for help, STOP to cancel.
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3 font-mono text-[13px] text-text">
              Reminder: you have an appointment at Riverside Auto &amp; Tire tomorrow for Oil Change at 2:00 PM. Reply STOP to opt out.
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3 font-mono text-[13px] text-text">
              Your appointment at Riverside Auto &amp; Tire for Oil Change on 08/28/2026 at 2:00 PM has been cancelled. Call us if you'd like to rebook.
            </div>
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
