import type { VoiceId } from "@/lib/database/types";

/**
 * integrations/voice/index.ts
 *
 * GetMade's voice picker shows internal voice IDs, never a specific
 * vendor's voice name. This keeps the door open to switch TTS
 * providers (ElevenLabs, PlayHT, OpenAI, etc.) without changing what
 * the business owner selected. `resolveProviderVoice` is where that
 * mapping will live once a provider is connected — for now it's
 * unimplemented on purpose.
 */

export interface VoiceOption {
  id: VoiceId;
  name: string;
  description: string;
  genderPresentation: "male" | "female";
  tags: string[];
}

export const VOICE_CATALOG: VoiceOption[] = [
  {
    id: "alex_professional",
    name: "Alex",
    description: "Confident and polished — a strong first impression for service businesses.",
    genderPresentation: "male",
    tags: ["Professional", "Confident"],
  },
  {
    id: "sarah_warm",
    name: "Sarah",
    description: "Friendly and warm, great for businesses that want a personal touch.",
    genderPresentation: "female",
    tags: ["Friendly", "Warm"],
  },
  {
    id: "james_calm",
    name: "James",
    description: "Calm and even-keeled, reassuring for appointment-heavy practices.",
    genderPresentation: "male",
    tags: ["Calm", "Professional"],
  },
  {
    id: "emma_friendly",
    name: "Emma",
    description: "Energetic and upbeat, a lively front desk presence.",
    genderPresentation: "female",
    tags: ["Energetic", "Friendly"],
  },
];

export interface ProviderVoiceRef {
  provider: string;
  voiceRef: string;
}

/**
 * Maps an internal voice_id to a real provider voice reference.
 * Intentionally unimplemented in Phase 1 — no voice provider is
 * connected yet. Phase 2 fills this in once one is chosen.
 */
export async function resolveProviderVoice(_voiceId: VoiceId): Promise<ProviderVoiceRef | null> {
  return null;
}
