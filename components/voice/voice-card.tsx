"use client";

import { useState } from "react";
import { Play, Square, Check } from "lucide-react";
import type { VoiceOption } from "@/lib/integrations/voice";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const PREVIEW_LINE = "Hi, thanks for calling! How can I help you today?";

/**
 * Per-voice pitch/rate tuning for the browser TTS preview.
 *
 * Free browser text-to-speech (window.speechSynthesis) only exposes
 * whatever voices are installed on the visitor's OS — often just 1-2
 * on Windows — so relying on voice *selection* alone to differentiate
 * our 4 HavnLine voices doesn't work reliably. Layering distinct
 * pitch/rate on top guarantees all 4 sound clearly different from each
 * other even on a machine with limited system voices.
 *
 * This still won't sound as natural as the real voice used on actual
 * phone calls (Amazon Polly neural voices via Twilio, see
 * lib/integrations/telephony/twilioProvider.ts) — browser TTS is
 * inherently more robotic. A closer-to-real preview would mean
 * generating real Polly audio server-side, which needs its own AWS
 * credentials; flagging that as a possible upgrade rather than
 * building it silently.
 */
const VOICE_TUNING: Record<string, { pitch: number; rate: number }> = {
  alex_professional: { pitch: 0.9, rate: 1.0 },
  sarah_warm: { pitch: 1.08, rate: 0.95 },
  james_calm: { pitch: 0.82, rate: 0.88 },
  emma_friendly: { pitch: 1.18, rate: 1.1 },
};

function pickBrowserVoice(genderPresentation: "male" | "female"): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  const genderHints =
    genderPresentation === "female"
      ? ["female", "samantha", "victoria", "zira", "susan", "joanna", "aria", "jenny"]
      : ["male", "daniel", "david", "mark", "alex", "fred", "guy", "matthew"];

  const matched = pool.find((v) => genderHints.some((hint) => v.name.toLowerCase().includes(hint)));
  return matched || pool[0] || null;
}

export function VoiceCard({
  voice,
  selected,
  onSelect,
}: {
  voice: VoiceOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const [previewing, setPreviewing] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  function handlePreview(e: React.MouseEvent) {
    e.stopPropagation();

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setUnsupported(true);
      setTimeout(() => setUnsupported(false), 2000);
      return;
    }

    window.speechSynthesis.cancel();
    if (previewing) {
      setPreviewing(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(PREVIEW_LINE);
    const applyVoice = () => {
      const pickedVoice = pickBrowserVoice(voice.genderPresentation);
      if (pickedVoice) utterance.voice = pickedVoice;
      const tuning = VOICE_TUNING[voice.id] || { pitch: 1, rate: 1 };
      utterance.pitch = tuning.pitch;
      utterance.rate = tuning.rate;
      utterance.onend = () => setPreviewing(false);
      utterance.onerror = () => setPreviewing(false);
      setPreviewing(true);
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = applyVoice;
    } else {
      applyVoice();
    }
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full rounded-2xl border p-4 text-left transition-colors",
        selected ? "border-brand bg-brand-soft" : "border-border bg-card hover:bg-paper"
      )}
    >
      {selected && (
        <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
          <Check className="h-3 w-3" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full font-display text-[15px] font-semibold",
            selected ? "bg-brand text-white" : "bg-ink text-white"
          )}
        >
          {voice.name[0]}
        </div>
        <div>
          <div className="text-[14px] font-semibold text-ink">{voice.name}</div>
          <div className="text-[11.5px] capitalize text-text-muted">{voice.genderPresentation} presentation</div>
        </div>
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-text-muted">{voice.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {voice.tags.map((tag) => (
          <Badge key={tag} variant="neutral">
            {tag}
          </Badge>
        ))}
      </div>
      <div
        onClick={handlePreview}
        role="button"
        tabIndex={0}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11.5px] font-medium text-text hover:bg-paper"
      >
        {previewing ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        {unsupported ? "Preview not supported on this browser" : previewing ? "Playing… (tap to stop)" : "Preview voice"}
      </div>
    </button>
  );
}
