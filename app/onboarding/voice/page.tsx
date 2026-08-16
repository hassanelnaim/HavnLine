"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "@/lib/onboarding/context";
import { VOICE_CATALOG } from "@/lib/integrations/voice";
import { StepShell } from "@/components/onboarding/step-shell";
import { VoiceCard } from "@/components/voice/voice-card";

export default function VoiceStep() {
  const router = useRouter();
  const { draft, update } = useOnboarding();

  return (
    <StepShell
      title="Choose a voice"
      description="Pick how your receptionist sounds on the phone. You can change this anytime."
      backHref="/onboarding/ai-receptionist"
      onContinue={() => router.push("/onboarding/calendar")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {VOICE_CATALOG.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            selected={draft.voiceId === voice.id}
            onSelect={() => update({ voiceId: voice.id })}
          />
        ))}
      </div>
    </StepShell>
  );
}
