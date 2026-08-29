"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Apple, Check } from "lucide-react";
import { useOnboarding } from "@/lib/onboarding/context";
import { connectICloudCalendarAction } from "@/app/actions/icloud-calendar";
import { StepShell } from "@/components/onboarding/step-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function CalendarStep() {
  const router = useRouter();
  const { draft } = useOnboarding();

  const [icloudExpanded, setIcloudExpanded] = useState(false);
  const [appleId, setAppleId] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [icloudConnecting, setIcloudConnecting] = useState(false);
  const [icloudConnected, setIcloudConnected] = useState(false);
  const [icloudError, setIcloudError] = useState<string | null>(null);

  async function handleConnectICloud() {
    setIcloudConnecting(true);
    setIcloudError(null);
    const result = await connectICloudCalendarAction(appleId, appPassword);
    setIcloudConnecting(false);

    if (!result.success) {
      setIcloudError(result.error || "Could not connect iCloud Calendar.");
      return;
    }
    setIcloudConnected(true);
    setIcloudExpanded(false);
  }

  return (
    <StepShell
      title="Connect your calendar"
      description="Optional — your receptionist already checks real availability with zero setup. Connecting syncs it with the calendar you already use."
      backHref="/onboarding/voice"
      onContinue={() => router.push("/onboarding/complete")}
      continueLabel="Continue"
    >
      <div className="space-y-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-text-muted">
                <CalendarDays className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-ink">Google Calendar</div>
                <div className="text-[12px] text-text-muted">Sync availability and bookings automatically.</div>
              </div>
            </div>
            {draft.businessId ? (
              <Button size="sm" variant="brand" asChild>
                <a href="/api/auth/google-calendar">Connect</a>
              </Button>
            ) : (
              <span className="text-[12px] text-text-faint">Save step 1 first</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-text-muted">
                  <Apple className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">iCloud Calendar</div>
                  <div className="text-[12px] text-text-muted">For Apple/iCloud Calendar users.</div>
                </div>
              </div>
              {icloudConnected ? (
                <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-success">
                  <Check className="h-4 w-4" /> Connected
                </span>
              ) : (
                <Button size="sm" variant="brand" onClick={() => setIcloudExpanded((v) => !v)}>
                  {icloudExpanded ? "Cancel" : "Connect"}
                </Button>
              )}
            </div>

            {icloudExpanded && !icloudConnected && (
              <div className="mt-4 border-t border-border-soft pt-4">
                {icloudError && (
                  <div className="mb-3 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
                    {icloudError}
                  </div>
                )}
                <div className="rounded-lg border border-border bg-paper px-3.5 py-3 text-[12px] leading-relaxed text-text-muted">
                  Apple requires a separate <strong>app-specific password</strong> — not your real Apple ID
                  password. Generate one at{" "}
                  <a
                    href="https://appleid.apple.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand hover:underline"
                  >
                    appleid.apple.com
                  </a>{" "}
                  → Sign-In and Security → App-Specific Passwords.
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Apple ID</Label>
                    <Input
                      className="mt-1.5"
                      type="email"
                      placeholder="you@icloud.com"
                      value={appleId}
                      onChange={(e) => setAppleId(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>App-specific password</Label>
                    <Input
                      className="mt-1.5"
                      type="password"
                      placeholder="xxxx-xxxx-xxxx-xxxx"
                      value={appPassword}
                      onChange={(e) => setAppPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="brand"
                  className="mt-3"
                  onClick={handleConnectICloud}
                  disabled={icloudConnecting}
                >
                  {icloudConnecting ? "Connecting…" : "Connect iCloud Calendar"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[12px] text-text-faint">
          Either can also be connected later from Dashboard → Integrations if you&apos;d rather skip this now.
        </p>
      </div>
    </StepShell>
  );
}
