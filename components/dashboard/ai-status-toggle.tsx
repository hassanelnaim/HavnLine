"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toggleAiStatusAction } from "@/app/actions/business";

/**
 * Real online/offline toggle — persists to ai_receptionists.status via
 * a server action. The server (not this component) is the actual
 * authority on whether a business is allowed to go online — see the
 * subscription check in toggleAiStatusAction. If the server rejects
 * the request (e.g. no active subscription), the switch reverts AND
 * surfaces exactly why, instead of silently flipping back with no
 * explanation.
 */
export function AiStatusToggle({
  initialStatus,
  compact = false,
}: {
  initialStatus: "online" | "offline";
  compact?: boolean;
}) {
  const [online, setOnline] = useState(initialStatus === "online");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setOnline(next);
    setError(null);
    startTransition(async () => {
      const result = await toggleAiStatusAction(next);
      if (!result.success) {
        setOnline(!next);
        setError(result.error || "Could not update status.");
        setTimeout(() => setError(null), 6000);
      }
    });
  }

  return (
    <div className="relative flex items-center gap-2.5">
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
      {error && (
        <div className="absolute left-0 top-full z-10 mt-2 w-56 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[11.5px] text-danger shadow-popover">
          {error}
        </div>
      )}
    </div>
  );
}
