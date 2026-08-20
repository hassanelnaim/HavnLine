"use client";

import { useState } from "react";
import { Play, Square, Check } from "lucide-react";
import type { VoiceOption } from "@/lib/integrations/voice";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const PREVIEW_LINE = "Hi, thanks for calling! How can I help you today?";

/**
 * Picks the closest-matching browser voice for a quick preview.
 *
 * This is NOT the exact voice used on real phone calls — real calls
 * use Twilio's Amazon Polly neural voices (see
 * lib/integrations/telephony/twilioProvider.ts), while this preview
 * uses the browser's own built-in text-to-speech, which varies by
 * device/OS. It's a reasonable stand-in for "does this sound roughly
 * right" without needing a paid voice API call just to preview.
 */
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
      utterance.rate = 1;
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