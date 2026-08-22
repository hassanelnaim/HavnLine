import type { VoiceId } from "@/lib/database/types";

/**
 * integrations/telephony/elevenlabsProvider.ts
 *
 * Maps GetMade's internal voice IDs to real ElevenLabs voices and
 * synthesizes speech from them. The business owner still only ever
 * sees "Alex", "Sarah", "James", "Emma" — never ElevenLabs or any
 * provider name — same principle as the Twilio/Polly mapping this
 * replaces when configured.
 *
 * The four voice IDs below default to ElevenLabs' well-known premade
 * voices (present in every account), but can be overridden with real
 * voice IDs from your own ElevenLabs voice library via env vars —
 * useful if you want to pick specific voices rather than the defaults.
 */

const DEFAULT_VOICE_MAP: Record<VoiceId, string> = {
  alex_professional: process.env.ELEVENLABS_VOICE_ALEX || "pNInz6obpgDQGcFmaJgB", // "Adam" — confident male
  sarah_warm: process.env.ELEVENLABS_VOICE_SARAH || "21m00Tcm4TlvDq8ikWAM", // "Rachel" — warm female
  james_calm: process.env.ELEVENLABS_VOICE_JAMES || "VR6AewLTigWG4xSOukaG", // "Arnold" — calm male
  emma_friendly: process.env.ELEVENLABS_VOICE_EMMA || "EXAVITQu4vr4xnSDxMaL", // "Bella" — friendly female
};

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export function resolveElevenLabsVoiceId(voiceId: VoiceId | null | undefined): string {
  return (voiceId && DEFAULT_VOICE_MAP[voiceId]) || DEFAULT_VOICE_MAP.alex_professional;
}

/**
 * Synthesizes speech for a line of text, returning raw MP3 audio
 * bytes. Uses ElevenLabs' fastest model (Turbo) specifically to keep
 * phone-call latency as low as possible — quality is still a large
 * step up from Twilio's built-in voices, but generation speed matters
 * more here than on a one-off preview.
 */
export async function synthesizeSpeech(text: string, voiceId: VoiceId | null | undefined): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  const elevenVoiceId = resolveElevenLabsVoiceId(voiceId);

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
