"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecheckButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRecheck() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRecheck} disabled={isPending}>
      <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} /> {isPending ? "Checking…" : "Recheck now"}
    </Button>
  );
}
