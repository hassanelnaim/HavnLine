"use client";

import { useState, useTransition } from "react";
import { CalendarDays, PhoneCall, MessageSquare, AudioLines } from "lucide-react";
import type { DbIntegration, IntegrationProvider } from "@/lib/database/types";
import { provisionPhoneNumberAction, changePhoneNumberAction } from "@/app/actions/business";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntegrationStatusBadge } from "@/components/dashboard/status-badges";

const PROVIDER_META: Record<IntegrationProvider, { name: string; description: string; icon: typeof CalendarDays }> = {
  google_calendar: { name: "Google Calendar", description: "Sync availability and appointments both ways.", icon: CalendarDays },
  microsoft_outlook: { name: "Microsoft Outlook", description: "Sync availability and appointments both ways.", icon: CalendarDays },
  twilio: { name: "Phone (Twilio)", description: "Powers your GetMade phone number and inbound calls.", icon: PhoneCall },
  sms: { name: "SMS", description: "Send appointment confirmations and reminders by text.", icon: MessageSquare },
  voice_provider: { name: "Voice", description: "Your AI receptionist's voice on real phone calls.", icon: AudioLines },
};

export function IntegrationsClient({
  initialIntegrations,
  calendarConnected,
  calendarError,
}: {
  initialIntegrations: DbIntegration[];
  calendarConnected: boolean;
  calendarError?: string;
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
    </div>
  );
}
