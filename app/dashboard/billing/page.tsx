import { getBusiness } from "@/lib/data/business";
import { PageHeader } from "@/components/dashboard/page-header";
import { BillingClient } from "@/components/dashboard/billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const business = await getBusiness();
  return (
    <div>
      <PageHeader title="Billing" description="Your subscription and payment details." />
      <BillingClient business={business} />
    </div>
  );
}
