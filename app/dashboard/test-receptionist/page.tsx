import { getAiReceptionist } from "@/lib/data/ai-receptionist";
import { PageHeader } from "@/components/dashboard/page-header";
import { TestReceptionistClient } from "@/components/dashboard/test-receptionist-client";

export const dynamic = "force-dynamic";

export default async function TestReceptionistPage() {
  const ai = await getAiReceptionist();

  return (
    <div>
      <PageHeader
        title="Test Receptionist"
        description={`Talk to ${ai.name} the same way a real customer would — this uses the real AI, real calendar, and real data.`}
      />
      <TestReceptionistClient employeeName={ai.name} />
    </div>
  );
}
