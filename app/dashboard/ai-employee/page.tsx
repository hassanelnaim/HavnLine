import { getAiReceptionist, getVoiceConfig } from "@/lib/data/ai-receptionist";
import { getBusinessHours } from "@/lib/data/business";
import { PageHeader } from "@/components/dashboard/page-header";
import { AiEmployeeClient } from "@/components/dashboard/ai-employee-client";

export default async function AiEmployeePage() {
  const [ai, voice, hours] = await Promise.all([
    getAiReceptionist(),
    getVoiceConfig(),
    getBusinessHours(),
  ]);

  return (
    <div>
      <PageHeader
        title="AI Employee"
        description="The control center for your receptionist — status, voice, personality, and rules."
      />
      <AiEmployeeClient ai={ai} voice={voice} hours={hours} />
    </div>
  );
}
