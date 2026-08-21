import { getIntegrations } from "@/lib/data/integrations";
import { getBusiness } from "@/lib/data/business";
import { PageHeader } from "@/components/dashboard/page-header";
import { IntegrationsClient } from "@/components/dashboard/integrations-client";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { calendar_connected?: string; calendar_error?: string };
}) {
  const [integrations, business] = await Promise.all([getIntegrations(), getBusiness()]);

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect the tools your AI receptionist uses behind the scenes."
      />
      <IntegrationsClient
        initialIntegrations={integrations}
        calendarConnected={!!searchParams.calendar_connected}
        calendarError={searchParams.calendar_error}
        existingBusinessNumber={business.phone}
      />
    </div>
  );
}
