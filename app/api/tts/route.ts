import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/integrations/telephony/elevenlabsProvider";
import type { VoiceId } from "@/lib/database/types";

/**
 * GET /api/tts?text=...&voiceId=...
 *
 * Twilio's <Play> verb fetches audio from a URL — this route generates
 * that audio on the fly via ElevenLabs and streams it back as MP3
 * bytes. No storage/hosting needed: each call is synthesized fresh at
 * the moment Twilio requests it.
 */
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text");
  const voiceId = request.nextUrl.searchParams.get("voiceId") as VoiceId | null;

  if (!text) {
    return new NextResponse("Missing text", { status: 400 });
  }

  try {
    const audioBuffer = await synthesizeSpeech(text, voiceId);
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
