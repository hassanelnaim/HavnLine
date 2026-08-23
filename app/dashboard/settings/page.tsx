import { getBusiness } from "@/lib/data/business";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsClient } from "@/components/dashboard/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [business, profile] = await Promise.all([getBusiness(), getCurrentUserProfile()]);

  return (
    <div>
      <PageHeader title="Settings" description="Manage your business profile, account, and preferences." />
      <SettingsClient business={business} profile={profile} />
    </div>
  );
}
