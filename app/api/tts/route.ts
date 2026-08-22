import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech, resolveElevenLabsVoiceId } from "@/lib/integrations/telephony/elevenlabsProvider";
import type { VoiceId } from "@/lib/database/types";

/**
 * GET /api/tts?text=...&voiceId=...&providerVoiceRef=...
 *
 * Twilio's <Play> verb fetches audio from a URL — this route generates
 * that audio on the fly via ElevenLabs and streams it back as MP3
 * bytes. providerVoiceRef (if present) is a specific real ElevenLabs
 * voice the business picked themselves and always takes priority over
 * the 4 built-in presets.
 */
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text");
  const voiceId = request.nextUrl.searchParams.get("voiceId") as VoiceId | null;
  const providerVoiceRef = request.nextUrl.searchParams.get("providerVoiceRef");

  if (!text) {
    return new NextResponse("Missing text", { status: 400 });
  }

  try {
    const elevenVoiceId = resolveElevenLabsVoiceId(voiceId, providerVoiceRef);
    const audioBuffer = await synthesizeSpeech(text, elevenVoiceId);
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("TTS synthesis failed:", err);
    return new NextResponse("TTS failed", { status: 500 });
  }
}
