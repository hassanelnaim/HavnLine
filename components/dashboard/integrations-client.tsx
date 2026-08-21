"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarDays, PhoneCall, MessageSquare, AudioLines, PhoneForwarded, Copy, Check, Globe } from "lucide-react";
import type { DbIntegration, IntegrationProvider } from "@/lib/database/types";
import { provisionPhoneNumberAction, changePhoneNumberAction } from "@/app/actions/business";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntegrationStatusBadge } from "@/components/dashboard/status-badges";

const PROVIDER_META: Record<IntegrationProvider, { name: string; description: string; icon: typeof CalendarDays }> = {
  google_calendar: { name: "Google Calendar", description: "Sync availability and appointments both ways.", icon: CalendarDays },
  microsoft_outlook: { name: "Microsoft Outlook", description: "Sync availability and appointments both ways.", icon: CalendarDays },
  twilio: { name: "Phone (Twilio)", description: "Powers your GetMade phone number and inbound calls.", icon: PhoneCall },
  sms: { name: "SMS confirmations", description: "Sent automatically from your GetMade number once you have one.", icon: MessageSquare },
  voice_provider: { name: "Receptionist voice", description: "Pick your AI's voice from AI Employee → Voice.", icon: AudioLines },
};

function CopyableNumber({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard API may be blocked — the number is still visible to copy manually.
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-paper px-2.5 py-1 font-mono text-[13px] text-ink hover:bg-border-soft"
    >
      {value}
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-text-faint" />}
    </button>
  );
}

export function IntegrationsClient({
  initialIntegrations,
  calendarConnected,
  calendarError,
  existingBusinessNumber,
}: {
  initialIntegrations: DbIntegration[];
  calendarConnected: boolean;
  calendarError?: string;
  existingBusinessNumber: string | null;
}) {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [areaCode, setAreaCode] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleGetNumber() {
    setProvisioning(true);
    setPhoneError(null);
    startTransition(async () => {
      const result = await provisionPhoneNumberAction(areaCode.trim() || undefined);
      setProvisioning(false);
      if (!result.success) {
        setPhoneError(result.error || "Could not provision a number.");
        return;
      }
      setIntegrations((prev) =>
        prev.map((i) =>
          i.provider === "twilio"
            ? { ...i, status: "connected", metadata: { phone_number: result.phoneNumber } }
            : i
        )
      );
    });
  }

  function handleChangeNumber() {
    setProvisioning(true);
    setPhoneError(null);
    startTransition(async () => {
      const result = await changePhoneNumberAction(areaCode.trim() || undefined);
      setProvisioning(false);
      if (!result.success) {
        setPhoneError(result.error || "Could not get a new number.");
        return;
      }
      setIntegrations((prev) =>
        prev.map((i) =>
          i.provider === "twilio"
            ? { ...i, status: "connected", metadata: { phone_number: result.phoneNumber } }
            : i
        )
      );
    });
  }

  const twilioIntegration = integrations.find((i) => i.provider === "twilio");
  const twilioConnected = twilioIntegration?.status === "connected";
  const getMadeNumber = (twilioIntegration?.metadata as Record<string, unknown> | null)?.phone_number as
    | string
    | undefined;

  return (
    <div>
      {calendarConnected && (
        <div className="mb-4 rounded-lg border border-success/20 bg-success-soft px-3.5 py-2.5 text-[12.5px] text-success">
          Google Calendar connected successfully.
        </div>
      )}
      {calendarError && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
          Couldn&apos;t connect Google Calendar ({calendarError}). Try again, or check your Google Cloud OAuth
          setup.
        </div>
      )}
      {phoneError && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
          {phoneError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {integrations.map((integration) => {
          const meta = PROVIDER_META[integration.provider];
          const Icon = meta.icon;
          const phoneNumber =
            integration.provider === "twilio"
              ? (integration.metadata as Record<string, unknown> | null)?.phone_number
              : null;

          return (
            <Card key={integration.id} className={integration.provider === "twilio" ? "sm:col-span-2" : undefined}>
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-text-muted">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink">{meta.name}</div>
                    <p className="mt-0.5 text-[12px] text-text-muted">
                      {phoneNumber ? `Your number: ${phoneNumber}` : meta.description}
                    </p>
                    <div className="mt-2">
                      <IntegrationStatusBadge status={integration.status} />
                    </div>
                  </div>
                </div>

                {integration.provider === "google_calendar" ? (
                  <Button size="sm" variant={integration.status === "connected" ? "outline" : "brand"} asChild>
                    <a href="/api/auth/google-calendar">
                      {integration.status === "connected" ? "Reconnect" : "Connect"}
                    </a>
                  </Button>
                ) : integration.provider === "twilio" ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Area code (e.g. 734)"
                      value={areaCode}
                      onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      className="w-40"
                    />
                    <Button
                      size="sm"
                      variant={twilioConnected ? "outline" : "brand"}
                      onClick={twilioConnected ? handleChangeNumber : handleGetNumber}
                      disabled={provisioning}
                    >
                      {provisioning ? "Working…" : twilioConnected ? "Get a different number" : "Get a number"}
                    </Button>
                  </div>
                ) : integration.provider === "voice_provider" ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/dashboard/ai-employee">Choose voice</Link>
                  </Button>
                ) : integration.provider === "sms" ? (
                  <span className="text-[12px] text-text-faint">
                    {integration.status === "connected" ? "Automatic" : "Needs a phone number first"}
                  </span>
                ) : (
                  <Button size="sm" variant="brand" disabled={integration.status === "coming_soon"}>
                    {integration.status === "coming_soon" ? "Coming soon" : "Connect"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-text-faint" /> Import knowledge from your website
          </CardTitle>
          <CardDescription>
            Let GetMade read your website and automatically pull in FAQs, services, and business info — so
            your AI can answer questions that were never manually typed in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" variant="brand" asChild>
            <Link href="/dashboard/knowledge">Go to Knowledge → Import</Link>
          </Button>
        </CardContent>
      </Card>

      {twilioConnected && getMadeNumber && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneForwarded className="h-4 w-4 text-text-faint" /> Keep your current business number
            </CardTitle>
            <CardDescription>
              Customers can keep calling the number they already know — you just forward it to your GetMade
              number behind the scenes. No need to update your website, Google listing, or business cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-text-muted">Forward calls from</span>
              <CopyableNumber value={existingBusinessNumber || "your existing business number"} />
              <span className="text-text-muted">to your GetMade number</span>
              <CopyableNumber value={getMadeNumber} />
            </div>

            {!existingBusinessNumber && (
              <div className="rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2.5 text-[12.5px] text-brand-dark">
                Add your current business phone number in Settings → Business profile first, so it shows here.
              </div>
            )}

            <div className="rounded-lg border border-border bg-paper p-4">
              <div className="text-[12px] font-semibold uppercase tracking-wide text-text-faint">
                How to set up forwarding
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-text">
                This is a setting on your <em>existing</em> phone line, not something GetMade can turn on for
                you — every carrier and phone system does it slightly differently:
              </p>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-text">
                <li>
                  <strong>Most US mobile carriers</strong> (Verizon, AT&amp;T, T-Mobile): dial{" "}
                  <code className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-[12px]">*72</code> followed
                  by your GetMade number, then call. To turn it back off later, dial{" "}
                  <code className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-[12px]">*73</code>.
                </li>
                <li>
                  <strong>Landline or business phone system</strong> (e.g. RingCentral, a desk phone, an office
                  PBX): look for &quot;call forwarding&quot; in your provider&apos;s online account settings or
                  admin panel, and enter your GetMade number there.
                </li>
                <li>
                  <strong>Google Voice:</strong> Settings → Phones → add your GetMade number as a linked number.
                </li>
              </ul>
              <p className="mt-3 text-[12px] text-text-faint">
                Exact steps vary by provider — if these don&apos;t match yours, search &quot;[your carrier] call
                forwarding&quot; or contact their support.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
