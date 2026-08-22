"use client";

import { useState, useTransition } from "react";
import { Bot, Mic, Sliders, Clock, ShieldAlert, Sparkles } from "lucide-react";
import type { AiResponsibilities, DbAiReceptionist, DbAiVoiceConfig, DbBusinessHours, Personality } from "@/lib/database/types";
import { VOICE_CATALOG } from "@/lib/integrations/voice";
import { updateAiEmployeeAction } from "@/app/actions/business";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceCard } from "@/components/voice/voice-card";
import { ElevenLabsVoiceBrowser } from "@/components/voice/elevenlabs-voice-browser";
import { AiStatusToggle } from "@/components/dashboard/ai-status-toggle";
import { cn } from "@/lib/utils";

const PERSONALITIES: { id: Personality; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "warm", label: "Warm" },
  { id: "energetic", label: "Energetic" },
  { id: "calm", label: "Calm" },
];

const RESPONSIBILITY_ITEMS: { key: keyof AiResponsibilities; label: string }[] = [
  { key: "answer_questions", label: "Answering questions" },
  { key: "schedule_appointments", label: "Scheduling appointments" },
  { key: "reschedule_appointments", label: "Rescheduling appointments" },
  { key: "cancel_appointments", label: "Cancelling appointments" },
  { key: "collect_customer_info", label: "Collecting customer info" },
  { key: "escalate_to_human", label: "Escalating to a human" },
];

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export function AiEmployeeClient({
  ai,
  voice,
  hours,
}: {
  ai: DbAiReceptionist;
  voice: DbAiVoiceConfig;
  hours: DbBusinessHours[];
}) {
  const [name, setName] = useState(ai.name);
  const [personality, setPersonality] = useState(ai.personality);
  const [responsibilities, setResponsibilities] = useState(ai.responsibilities);
  const [voiceId, setVoiceId] = useState(voice.voice_id);
  const [customVoiceRef, setCustomVoiceRef] = useState<string | null>(
    voice.voice_id === "custom" ? voice.provider_voice_ref : null
  );
  const [customVoiceName, setCustomVoiceName] = useState<string | null>(
    voice.voice_id === "custom" ? voice.provider_voice_name : null
  );
  const [bookingRules, setBookingRules] = useState(ai.booking_rules || "");
  const [escalationRules, setEscalationRules] = useState(ai.escalation_rules || "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleResponsibility(key: keyof AiResponsibilities) {
    setResponsibilities((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateAiEmployeeAction({
        name,
        personality,
        responsibilities,
        voiceId,
        bookingRules,
        escalationRules,
        customVoice:
          customVoiceRef && customVoiceName
            ? { providerVoiceRef: customVoiceRef, providerVoiceName: customVoiceName }
            : null,
      });
      if (!result.success) {
        setError(result.error || "Could not save changes.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <div>
      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink font-display text-[16px] font-semibold text-white">
              {(name || ai.name)[0]}
            </div>
            <div>
              <div className="text-[15px] font-semibold text-ink">{name || ai.name}</div>
              <div className="text-[12px] capitalize text-text-muted">{personality}</div>
            </div>
          </div>
          <AiStatusToggle initialStatus={ai.status} />
        </CardContent>
      </Card>

      <Tabs defaultValue="personality">
        <TabsList>
          <TabsTrigger value="personality"><Sliders className="h-3.5 w-3.5" /> Personality</TabsTrigger>
          <TabsTrigger value="voice"><Mic className="h-3.5 w-3.5" /> Voice</TabsTrigger>
          <TabsTrigger value="responsibilities"><Bot className="h-3.5 w-3.5" /> Responsibilities</TabsTrigger>
          <TabsTrigger value="behavior"><ShieldAlert className="h-3.5 w-3.5" /> Business behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="personality">
          <Card>
            <CardHeader>
              <CardTitle>Identity &amp; personality</CardTitle>
              <CardDescription>The name and tone {name || ai.name} uses on every call.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Receptionist name</Label>
                <Input className="mt-1.5 max-w-xs" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersonality(p.id)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-[13px] font-medium transition-colors",
                      personality === p.id
                        ? "border-brand bg-brand-soft text-brand-dark"
                        : "border-border bg-card text-text hover:bg-paper"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Voice</CardTitle>
              <CardDescription>
                {customVoiceRef && customVoiceName
                  ? `Currently using your own ElevenLabs voice: ${customVoiceName}`
                  : `Currently selected: ${VOICE_CATALOG.find((v) => v.id === voiceId)?.name}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {VOICE_CATALOG.map((v) => (
                  <VoiceCard
                    key={v.id}
                    voice={v}
                    selected={!customVoiceRef && voiceId === v.id}
                    onSelect={() => {
                      setVoiceId(v.id);
                      setCustomVoiceRef(null);
                      setCustomVoiceName(null);
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" /> Or pick your own real voice
              </CardTitle>
              <CardDescription>
                Browse your connected ElevenLabs voice library and use any voice you have access to — real
                previews, not an approximation. This overrides the 4 presets above when selected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ElevenLabsVoiceBrowser
                selectedVoiceRef={customVoiceRef}
                onSelect={(id, name) => {
                  setCustomVoiceRef(id);
                  setCustomVoiceName(name);
                }}
              />
              {customVoiceRef && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => {
                    setCustomVoiceRef(null);
                    setCustomVoiceName(null);
                  }}
                >
                  Clear selection, use a preset instead
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responsibilities">
          <Card>
            <CardHeader>
              <CardTitle>Enabled capabilities</CardTitle>
              <CardDescription>What {ai.name} is allowed to do without asking.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border-soft">
                {RESPONSIBILITY_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-[13.5px] font-medium text-text">{item.label}</span>
                    <Switch
                      checked={responsibilities[item.key]}
                      onCheckedChange={() => toggleResponsibility(item.key)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-faint" /> Business hours
                </CardTitle>
                <CardDescription>Edit these from Settings → Business profile.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {hours.map((h) => (
                  <Badge key={h.weekday} variant={h.is_open ? "neutral" : "danger"}>
                    {WEEKDAY_LABELS[h.weekday]} {h.is_open ? `${h.open_time}–${h.close_time}` : "Closed"}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking rules</CardTitle>
                <CardDescription>Plain-language guidance for how appointments should be handled.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea rows={3} value={bookingRules} onChange={(e) => setBookingRules(e.target.value)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Escalation rules</CardTitle>
                <CardDescription>When {ai.name} should hand off to a human instead of guessing.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea rows={3} value={escalationRules} onChange={(e) => setEscalationRules(e.target.value)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
          {error}
        </div>
      )}
      <div className="mt-6 flex items-center gap-3">
        <Button variant="brand" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        {saved && <span className="text-[12.5px] font-medium text-success">Saved ✓</span>}
      </div>
    </div>
  );
}
