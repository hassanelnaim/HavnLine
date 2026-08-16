import { getBusiness } from "@/lib/data/business";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsClient } from "@/components/dashboard/settings-client";

export default async function SettingsPage() {
  const business = await getBusiness();

  return (
    <div>
      <PageHeader title="Settings" description="Manage your business profile, account, and preferences." />
      <SettingsClient business={business} />
    </div>
  );
}
