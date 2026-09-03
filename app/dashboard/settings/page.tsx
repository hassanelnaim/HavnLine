import { getBusiness, getBusinessHours } from "@/lib/data/business";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsClient } from "@/components/dashboard/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [business, profile, hours] = await Promise.all([getBusiness(), getCurrentUserProfile(), getBusinessHours()]);
  return (
    <div>
      <PageHeader title="Settings" description="Manage your business profile, account, and preferences." />
      <SettingsClient business={business} profile={profile} hours={hours} />
    </div>
  );
}
