import { getKnowledgeItems } from "@/lib/data/knowledge";
import { getServices } from "@/lib/data/business";
import { PageHeader } from "@/components/dashboard/page-header";
import { KnowledgeClient } from "@/components/dashboard/knowledge-client";

export default async function KnowledgePage() {
  const [items, services] = await Promise.all([getKnowledgeItems(), getServices()]);

  return (
    <div>
      <PageHeader
        title="Knowledge"
        description="What your AI receptionist knows about your business, services, and policies."
      />
      <KnowledgeClient initialItems={items} services={services} />
    </div>
  );
}
