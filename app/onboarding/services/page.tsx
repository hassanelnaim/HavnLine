"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Globe, Sparkles } from "lucide-react";
import { useOnboarding, type OnboardingServiceDraft } from "@/lib/onboarding/context";
import { importOnboardingServicesAction } from "@/app/actions/onboarding-services";
import { StepShell } from "@/components/onboarding/step-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function emptyService(): OnboardingServiceDraft {
  return {
    id: "svc_" + Math.random().toString(36).slice(2, 9),
    name: "",
    description: "",
    price: "",
    durationMinutes: 30,
  };
}

export default function ServicesStep() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  function addService() {
    update({ services: [...draft.services, emptyService()] });
  }

  function updateService(id: string, patch: Partial<OnboardingServiceDraft>) {
    update({
      services: draft.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function removeService(id: string) {
    update({ services: draft.services.filter((s) => s.id !== id) });
  }

  async function handleImportFromWebsite() {
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    const result = await importOnboardingServicesAction(draft.website, draft.businessName);
    setImporting(false);

    if (!result.success || !result.services) {
      setImportError(result.error || "Could not import services from that website.");
      return;
    }

    const imported: OnboardingServiceDraft[] = result.services.map((s) => ({
      id: "svc_" + Math.random().toString(36).slice(2, 9),
      name: s.name,
      description: s.description,
      price: s.priceDollars,
      durationMinutes: s.durationMinutes,
    }));
    update({ services: [...draft.services, ...imported] });
    setImportResult(`Added ${imported.length} service${imported.length === 1 ? "" : "s"} from your website — review and edit below.`);
  }

  return (
    <StepShell
      title="What do you offer?"
      description="Add the services customers can book. Your AI will only quote prices listed here."
      backHref="/onboarding/hours"
      onContinue={() => router.push("/onboarding/ai-receptionist")}
    >
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" /> Faster: import from your website
          </CardTitle>
          <CardDescription>
            Paste your website and we&apos;ll read it and pull out your real services automatically — no
            need to type each one by hand. You can still edit or add more below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {importError && (
            <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
              {importError}
            </div>
          )}
          {importResult && (
            <div className="rounded-lg border border-success/20 bg-success-soft px-3.5 py-2.5 text-[12.5px] text-success">
              {importResult}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[220px]">
              <Label>Website URL</Label>
              <Input
                className="mt-1.5"
                placeholder="yourbusiness.com or a Services/Pricing page"
                value={draft.website}
                onChange={(e) => update({ website: e.target.value })}
              />
            </div>
            <Button variant="brand" onClick={handleImportFromWebsite} disabled={importing || !draft.website.trim()}>
              <Globe className="h-3.5 w-3.5" />
              {importing ? "Reading your site…" : "Import services"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {draft.services.length === 0 && (
          <Card className="border-dashed p-8 text-center">
            <p className="text-[13.5px] text-text-muted">No services added yet.</p>
          </Card>
        )}

        {draft.services.map((service, i) => (
          <Card key={service.id} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-text-faint">
                Service {i + 1}
              </span>
              <button
                onClick={() => removeService(service.id)}
                className="rounded-md p-1 text-text-faint hover:bg-danger-soft hover:text-danger"
                aria-label="Remove service"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Oil Change"
                  value={service.name}
                  onChange={(e) => updateService(service.id, { name: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Input
                  className="mt-1.5"
                  placeholder="Full synthetic oil change with a multi-point inspection"
                  value={service.description}
                  onChange={(e) => updateService(service.id, { description: e.target.value })}
                />
              </div>
              <div>
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="mt-1.5"
                  placeholder="59"
                  value={service.price}
                  onChange={(e) => updateService(service.id, { price: e.target.value })}
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={service.durationMinutes}
                  onChange={(e) =>
                    updateService(service.id, { durationMinutes: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </Card>
        ))}

        <Button variant="outline" size="sm" onClick={addService}>
          <Plus className="h-3.5 w-3.5" /> Add service manually
        </Button>
      </div>
    </StepShell>
  );
}
