"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StepShell({
  title, description, children, backHref, onContinue, continueLabel = "Continue", continueDisabled = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  backHref?: string;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}) {
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-[24px] font-semibold text-ink">{title}</h1>
      <p className="mt-1.5 text-[13.5px] text-text-muted">{description}</p>
      <div className="mt-7">{children}</div>
      <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
        {backHref ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={backHref}><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
          </Button>
        ) : <span />}
        <Button variant="brand" size="lg" onClick={onContinue} disabled={continueDisabled}>{continueLabel}</Button>
      </div>
    </div>
  );
}
