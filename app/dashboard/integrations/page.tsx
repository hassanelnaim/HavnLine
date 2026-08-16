import { CalendarDays, PhoneCall, MessageSquare, AudioLines } from "lucide-react";
import { getIntegrations } from "@/lib/data/integrations";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IntegrationStatusBadge } from "@/components/dashboard/status-badges";
import type { IntegrationProvider } from "@/lib/database/types";

const PROVIDER_META: Record<IntegrationProvider, { name: string; description: string; icon: typeof CalendarDays }> = {
  google_calendar: { name: "Google Calendar", description: "Sync availability and appointments both ways.", icon: CalendarDays },
  microsoft_outlook: { name: "Microsoft Outlook", description: "Sync availability and appointments both ways.", icon: CalendarDays },
  twilio: { name: "Twilio", description: "Powers your GetMade phone number and inbound calls.", icon: PhoneCall },
  sms: { name: "SMS", description: "Send appointment confirmations and reminders by text.", icon: MessageSquare },
  voice_provider: { name: "Voice provider", description: "Text-to-speech for your AI receptionist's voice.", icon: AudioLines },
};

export default async function IntegrationsPage() {
  const integrations = await getIntegrations();

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect the tools your AI receptionist uses behind the scenes."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {integrations.map((integration) => {
          const meta = PROVIDER_META[integration.provider];
          const Icon = meta.icon;
          return (
            <Card key={integration.id}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-text-muted">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink">{meta.name}</div>
                    <p className="mt-0.5 text-[12px] text-text-muted">{meta.description}</p>
                    <div className="mt-2">
                      <IntegrationStatusBadge status={integration.status} />
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={integration.status === "connected" ? "outline" : "brand"}
                  disabled={integration.status === "coming_soon"}
                >
                  {integration.status === "connected"
                    ? "Manage"
                    : integration.status === "coming_soon"
                      ? "Coming soon"
                      : "Connect"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
