"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarDays, PhoneCall, MessageSquare, AudioLines, Copy, Check, Globe, Apple } from "lucide-react";
import type { DbIntegration, IntegrationProvider } from "@/lib/database/types";
import { provisionPhoneNumberAction, changePhoneNumberAction } from "@/app/actions/business";
import { connectICloudCalendarAction, disconnectICloudCalendarAction } from "@/app/actions/icloud-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegrationStatusBadge } from "@/components/dashboard/status-badges";

const PROVIDER_META: Record<IntegrationProvider, { name: string; description: string; icon: typeof CalendarDays }> = {
  google_calendar: { name: "Google Calendar", description: "Sync availability and appointments both ways.", icon: CalendarDays },
  icloud_calendar: { name: "iCloud Calendar", description: "Sync with your Apple Calendar using an app-specific password.", icon: Apple },
  microsoft_outlook: { name: "Microsoft Outlook", description: "Sync availability and appointments both ways.", icon: CalendarDays },
  twilio: { name: "Phone (Twilio)", description: "Powers your HavnLine phone number and inbound calls.", icon: PhoneCall },
  sms: { name: "SMS confirmations", description: "Sent automatically from your HavnLine number once you have one.", icon: MessageSquare },
  voice_provider: { name: "Receptionist voice", description: "Pick your AI's voice from AI Employee → Voice.", icon: AudioLines },
};

export function IntegrationsClient({ initialIntegrations }: { initialIntegrations: DbIntegration[] }) {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [areaCode, setAreaCode] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const [icloudExpanded, setIcloudExpanded] = useState(false);
  const [appleId, setAppleId] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [icloudConnecting, setIcloudConnecting] = useState(false);
  const [icloudError, setIcloudError] = useState<string | null>(null);

  const twilioIntegration = integrations.find((i) => i.provider === "twilio");
  const twilioConnected = twilioIntegration?.status === "connected";
  const phoneNumber = (twilioIntegration?.metadata as Record<string, unknown> | null)?.phone_number as string | undefined;

  function handleGetNumber() {
    setProvisioning(true);
    setPhoneError(null);
    startTransition(async () => {
      const result = await provisionPhoneNumberAction(areaCode.trim() || undefined);
      setProvisioning(false);
      if (!result.success) { setPhoneError(result.error || "Could not provision a number."); return; }
      setIntegrations((prev) => prev.map((i) => (i.provider === "twilio" ? { ...i, status: "connected", metadata: { phone_number: result.phoneNumber } } : i)));
    });
  }

  function handleChangeNumber() {
    setProvisioning(true);
    setPhoneError(null);
    startTransition(async () => {
      const result = await changePhoneNumberAction(areaCode.trim() || undefined);
      setProvisioning(false);
      if (!result.success) { setPhoneError(result.error || "Could not provision a new number."); return; }
      setIntegrations((prev) => prev.map((i) => (i.provider === "twilio" ? { ...i, status: "connected", metadata: { phone_number: result.phoneNumber } } : i)));
    });
  }

  function handleConnectICloud() {
    setIcloudConnecting(true);
    setIcloudError(null);
    startTransition(async () => {
      const result = await connectICloudCalendarAction(appleId, appPassword);
      setIcloudConnecting(false);
      if (!result.success) { setIcloudError(result.error || "Could not connect iCloud Calendar."); return; }
      setAppleId(""); setAppPassword(""); setIcloudExpanded(false);
      setIntegrations((prev) => prev.map((i) => (i.provider === "icloud_calendar" ? { ...i, status: "connected" } : i)));
    });
  }

  function handleDisconnectICloud() {
    startTransition(async () => {
      await disconnectICloudCalendarAction();
      setIntegrations((prev) => prev.map((i) => (i.provider === "icloud_calendar" ? { ...i, status: "not_connected" } : i)));
    });
  }

  function copyNumber() {
    if (!phoneNumber) return;
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const calendarIntegrations = integrations.filter((i) => i.provider === "google_calendar" || i.provider === "icloud_calendar");
  const commsIntegrations = integrations.filter((i) => i.provider === "twilio" || i.provider === "sms" || i.provider === "voice_provider");

  function renderCard(integration: DbIntegration) {
    const meta = PROVIDER_META[integration.provider];
    const Icon = meta.icon;
    const phoneNum = integration.provider === "twilio" ? (integration.metadata as Record<string, unknown> | null)?.phone_number : null;

    return (
      <Card key={integration.id} className={integration.provider === "icloud_calendar" && icloudExpanded ? "sm:col-span-2" : undefined}>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-text-muted"><Icon className="h-4.5 w-4.5" /></div>
            <div>
              <div className="text-[13.5px] font-semibold text-ink">{meta.name}</div>
              <p className="mt-0.5 text-[12px] text-text-muted">{phoneNum ? `Your number: ${phoneNum}` : meta.description}</p>
              <div className="mt-2"><IntegrationStatusBadge status={integration.status} /></div>
            </div>
          </div>

          {integration.provider === "google_calendar" ? (
            <Button size="sm" variant={integration.status === "connected" ? "outline" : "brand"} asChild>
              <a href="/api/auth/google-calendar">{integration.status === "connected" ? "Reconnect" : "Connect"}</a>
            </Button>
          ) : integration.provider === "icloud_calendar" ? (
            integration.status === "connected" ? (
              <Button size="sm" variant="outline" onClick={handleDisconnectICloud}>Disconnect</Button>
            ) : (
              <Button size="sm" variant="brand" onClick={() => setIcloudExpanded((v) => !v)}>{icloudExpanded ? "Cancel" : "Connect"}</Button>
            )
          ) : integration.provider === "twilio" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input placeholder="Area code" value={areaCode} onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))} className="w-24" />
              <Button size="sm" variant={twilioConnected ? "outline" : "brand"} onClick={twilioConnected ? handleChangeNumber : handleGetNumber} disabled={provisioning}>
                {provisioning ? "Working…" : twilioConnected ? "New number" : "Get a number"}
              </Button>
            </div>
          ) : integration.provider === "voice_provider" ? (
            <Button size="sm" variant="outline" asChild><Link href="/dashboard/ai-employee">Choose voice</Link></Button>
          ) : integration.provider === "sms" ? (
            <span className="text-[12px] text-text-faint">{integration.status === "connected" ? "Automatic" : "Needs a phone number first"}</span>
          ) : (
            <Button size="sm" variant="brand" disabled={integration.status === "coming_soon"}>{integration.status === "coming_soon" ? "Coming soon" : "Connect"}</Button>
          )}
        </CardContent>

        {integration.provider === "icloud_calendar" && icloudExpanded && (
          <CardContent className="border-t border-border-soft pt-4">
            {icloudError && <div className="mb-3 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">{icloudError}</div>}
            <div className="rounded-lg border border-border bg-paper px-3.5 py-3 text-[12px] leading-relaxed text-text-muted">
              Apple requires a separate <strong>app-specific password</strong> — not your real Apple ID password. Generate one at{" "}
              <a href="https://appleid.apple.com" target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">appleid.apple.com</a> → Sign-In and Security → App-Specific Passwords.
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><Label>Apple ID</Label><Input className="mt-1.5" type="email" value={appleId} onChange={(e) => setAppleId(e.target.value)} /></div>
              <div><Label>App-specific password</Label><Input className="mt-1.5" type="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} /></div>
            </div>
            <Button size="sm" variant="brand" className="mt-3" onClick={handleConnectICloud} disabled={icloudConnecting}>{icloudConnecting ? "Connecting…" : "Connect iCloud Calendar"}</Button>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {phoneError && <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">{phoneError}</div>}

      <div>
        <h3 className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-text-faint">Calendar</h3>
        <div className="grid gap-3 sm:grid-cols-2">{calendarIntegrations.map(renderCard)}</div>
      </div>
      <div>
        <h3 className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-text-faint">Phone, SMS &amp; Voice</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{commsIntegrations.map(renderCard)}</div>
      </div>

      {phoneNumber && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-[13.5px] font-semibold text-ink"><Globe className="h-4 w-4 text-text-faint" /> Keep your current business number</div>
            <p className="mt-2 text-[13px] leading-relaxed text-text">Customers can keep calling the number they already know — just forward it to your HavnLine number.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
              <span>Forward calls to</span>
              <button onClick={copyNumber} className="flex items-center gap-1.5 rounded-lg border border-border bg-paper px-2.5 py-1 font-mono text-[12.5px]">
                {phoneNumber} {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 text-text-faint" />}
              </button>
            </div>
            <div className="mt-4 rounded-lg border border-border bg-paper px-4 py-3 text-[13px] leading-relaxed text-text">
              <div className="mb-2 font-semibold text-text">How to set up forwarding</div>
              <p>This is a setting on your <em>existing</em> phone line — every carrier does it slightly differently. Find yours below:</p>
              <ul className="mt-3 space-y-3 text-[13px] leading-relaxed text-text">
                <li><span className="font-semibold">- Verizon or US Cellular:</span> dial <code className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-[12px]">*72</code> followed by your HavnLine number, then call. To turn off, dial <code className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-[12px]">*73</code>.</li>
                <li><span className="font-semibold">- AT&amp;T:</span> dial <code className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-[12px]">*21*</code> + number + <code className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-[12px]">#</code>, then call. Off: <code className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-[12px]">##21#</code>.</li>
                <li><span className="font-semibold">- T-Mobile:</span> dial <code className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-[12px]">**21*</code> + number + <code className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-[12px]">#</code>. Off: <code className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-[12px]">##21#</code>.</li>
                <li><span className="font-semibold">- Landline/business system:</span> use your provider's call forwarding settings.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-[13.5px] font-semibold text-ink"><Globe className="h-4 w-4 text-text-faint" /> Import knowledge from your website</div>
          <p className="mt-2 text-[13px] text-text-muted">Manage this from Knowledge → Import.</p>
          <Button size="sm" variant="outline" className="mt-3" asChild><Link href="/dashboard/knowledge">Go to Knowledge → Import</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
