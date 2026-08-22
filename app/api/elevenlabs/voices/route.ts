import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listVoices, isElevenLabsConfigured } from "@/lib/integrations/telephony/elevenlabsProvider";

/**
 * GET /api/elevenlabs/voices
 *
 * Returns the logged-in owner's real ElevenLabs voice library, for
 * the "browse voices" picker in AI Employee settings. Requires login
 * (not tied to a specific business — the ElevenLabs account itself is
 * shared infrastructure, same as the Twilio/Anthropic accounts).
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!isElevenLabsConfigured()) {
    return NextResponse.json({ error: "ElevenLabs is not connected yet.", voices: [] }, { status: 200 });
  }

  try {
    const voices = await listVoices();
    return NextResponse.json({ voices });
  } catch (err) {
    console.error("Failed to list ElevenLabs voices:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load voices.", voices: [] },
      { status: 200 }
    );
  }
}
