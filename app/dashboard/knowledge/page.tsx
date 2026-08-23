import { getKnowledgeItems } from "@/lib/data/knowledge";
import { getServices } from "@/lib/data/business";
import { getPromotions } from "@/lib/data/promotions";
import { PageHeader } from "@/components/dashboard/page-header";
import { KnowledgeClient } from "@/components/dashboard/knowledge-client";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const [items, services, promotions] = await Promise.all([
    getKnowledgeItems(),
    getServices(),
    getPromotions(),
  ]);

  return (
    <div>
      <PageHeader
        title="Knowledge"
        description="What your AI receptionist knows about your business, services, and policies."
      />
      <KnowledgeClient initialItems={items} initialServices={services} initialPromotions={promotions} />
    </div>
  );
}
