"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toggleAiStatusAction } from "@/app/actions/business";

/**
 * Real online/offline toggle — persists to ai_receptionists.status via
 * a server action. Once Twilio is connected, "online" is what actually
 * makes the phone webhook treat inbound calls as answerable (a
 * business that's toggled off could route straight to voicemail/a
 * "currently unavailable" message in a later pass — for now this flips
 * the status the dashboard and any future call-routing logic reads).
 */
export function AiStatusToggle({
  initialStatus,
  compact = false,
}: {
  initialStatus: "online" | "offline";
  compact?: boolean;
}) {
  const [online, setOnline] = useState(initialStatus === "online");
  const [, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setOnline(next);
    startTransition(async () => {
      const result = await toggleAiStatusAction(next);
      if (!result.success) {
        // Revert on failure so the UI doesn't lie about saved state.
        setOnline(!next);
      }
    });
  }

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
      <Switch checked={online} onCheckedChange={handleChange} />
    </div>
  );
}
