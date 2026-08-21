import { getBillingInfo } from "@/lib/data/billing";
import { PageHeader } from "@/components/dashboard/page-header";
import { BillingClient } from "@/components/dashboard/billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
  const billing = await getBillingInfo();

  return (
    <div>
      <PageHeader title="Billing" description="Manage your GetMade subscription." />
      <BillingClient billing={billing} checkoutResult={searchParams.checkout} />
    </div>
  );
}
