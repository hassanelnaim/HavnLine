"use client";

import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useOnboarding, type OnboardingServiceDraft } from "@/lib/onboarding/context";
import { StepShell } from "@/components/onboarding/step-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

  return (
    <StepShell
      title="What do you offer?"
      description="Add the services customers can book. Your AI will only quote prices listed here."
      backHref="/onboarding/hours"
      onContinue={() => router.push("/onboarding/ai-receptionist")}
    >
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
          <Plus className="h-3.5 w-3.5" /> Add service
        </Button>
      </div>
    </StepShell>
  );
}
