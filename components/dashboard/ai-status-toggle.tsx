"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * UI-state only for Phase 1 — flips a local boolean. Phase 2 will call a
 * server action that updates ai_receptionists.status and (once Twilio is
 * connected) actually starts/stops routing calls to the AI.
 */
export function AiStatusToggle({
  initialStatus,
  compact = false,
}: {
  initialStatus: "online" | "offline";
  compact?: boolean;
}) {
  const [online, setOnline] = useState(initialStatus === "online");

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex items-center gap-1.5 text-[12.5px] font-medium",
          online ? "text-success" : "text-text-faint",
          compact && "text-[11.5px]"
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            online ? "bg-success animate-pulse-ring" : "bg-text-faint"
          )}
        />
        {online ? "Online" : "Offline"}
      </span>
      <Switch checked={online} onCheckedChange={setOnline} />
    </div>
  );
}
