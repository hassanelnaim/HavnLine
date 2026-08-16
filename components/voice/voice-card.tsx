"use client";

import { useState } from "react";
import { Play, Check } from "lucide-react";
import type { VoiceOption } from "@/lib/integrations/voice";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

  function handlePreview(e: React.MouseEvent) {
    e.stopPropagation();
    setPreviewing(true);
    // Placeholder only — Phase 2 wires this to a real voice provider.
    setTimeout(() => setPreviewing(false), 1200);
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
        <Play className="h-3 w-3" />
        {previewing ? "Playing preview…" : "Preview voice"}
      </div>
    </button>
  );
}
