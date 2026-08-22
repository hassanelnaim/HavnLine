import type { VoiceId } from "@/lib/database/types";

/**
 * integrations/telephony/elevenlabsProvider.ts
 *
 * Two things live here:
 *  - The 4 built-in preset voices (Alex/Sarah/James/Emma), mapped to
 *    sensible default ElevenLabs voices.
 *  - listVoices(), which fetches the business owner's OWN real
 *    ElevenLabs voice library, so they can pick any voice they have
 *    access to — not just the 4 presets. When a business picks a real
 *    voice this way, it's stored as voice_id: "custom" with the real
 *    ElevenLabs voice id in provider_voice_ref (see
 *    lib/database/types.ts), which takes priority over the preset map.
 */

const DEFAULT_VOICE_MAP: Record<Exclude<VoiceId, "custom">, string> = {
  alex_professional: process.env.ELEVENLABS_VOICE_ALEX || "pNInz6obpgDQGcFmaJgB", // "Adam"
  sarah_warm: process.env.ELEVENLABS_VOICE_SARAH || "21m00Tcm4TlvDq8ikWAM", // "Rachel"
  james_calm: process.env.ELEVENLABS_VOICE_JAMES || "VR6AewLTigWG4xSOukaG", // "Arnold"
  emma_friendly: process.env.ELEVENLABS_VOICE_EMMA || "EXAVITQu4vr4xnSDxMaL", // "Bella"
};

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

/**
 * Resolves the real ElevenLabs voice id to use for a given business's
 * voice config. If they picked a specific real voice (voice_id ===
 * "custom"), that always wins. Otherwise falls back to the preset map.
 */
export function resolveElevenLabsVoiceId(
  voiceId: VoiceId | null | undefined,
  providerVoiceRef?: string | null
): string {
  if (voiceId === "custom" && providerVoiceRef) return providerVoiceRef;
  if (voiceId && voiceId !== "custom") return DEFAULT_VOICE_MAP[voiceId];
  return DEFAULT_VOICE_MAP.alex_professional;
}

export async function synthesizeSpeech(text: string, elevenVoiceId: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed: ${response.status} ${errText}`);
  }

  return response.arrayBuffer();
}

export interface ElevenLabsVoice {
  voiceId: string;
  name: string;
  previewUrl: string | null;
  category: string | null;
  description: string | null;
}

/**
 * Fetches every voice the connected ElevenLabs account has access to
 * — their own cloned/added voices plus ElevenLabs' shared library
 * voices. This is what powers the "browse voices" picker in AI
 * Employee settings.
 */
export async function listVoices(): Promise<ElevenLabsVoice[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`ElevenLabs list voices failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const voices: any[] = data.voices || [];

  return voices.map((v) => ({
    voiceId: v.voice_id,
    name: v.name,
    previewUrl: v.preview_url || null,
    category: v.category || null,
    description: v.labels?.description || v.labels?.accent || null,
  }));
}
