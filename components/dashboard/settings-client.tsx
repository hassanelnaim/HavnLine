"use client";

import { useState, useTransition } from "react";
import { Building2, UserRound, Bell, Phone, CreditCard, ShieldCheck } from "lucide-react";
import type { DbBusiness } from "@/lib/database/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOutAction } from "@/app/actions/auth";
import { updateBusinessProfileAction } from "@/app/actions/business";

export function SettingsClient({ business }: { business: DbBusiness }) {
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description || "");
  const [address, setAddress] = useState(business.address || "");
  const [phone, setPhone] = useState(business.phone || "");

  const [notifyCalls, setNotifyCalls] = useState(true);
  const [notifyEscalations, setNotifyEscalations] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSaveProfile() {
    setError(null);
    startTransition(async () => {
      const result = await updateBusinessProfileAction({ name, description, address, phone });
      if (!result.success) {
        setError(result.error || "Could not save changes.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <Tabs defaultValue="business">
      <TabsList className="flex-wrap">
        <TabsTrigger value="business"><Building2 className="h-3.5 w-3.5" /> Business profile</TabsTrigger>
        <TabsTrigger value="account"><UserRound className="h-3.5 w-3.5" /> Account</TabsTrigger>
        <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
        <TabsTrigger value="phone"><Phone className="h-3.5 w-3.5" /> Phone</TabsTrigger>
        <TabsTrigger value="billing"><CreditCard className="h-3.5 w-3.5" /> Billing</TabsTrigger>
        <TabsTrigger value="security"><ShieldCheck className="h-3.5 w-3.5" /> Security</TabsTrigger>
      </TabsList>

      <TabsContent value="business">
        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>Shown to your AI receptionist and used across the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Business name</Label>
              <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Address</Label>
                <Input className="mt-1.5" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
                {error}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button variant="brand" size="sm" onClick={handleSaveProfile} disabled={isPending}>
                {isPending ? "Saving…" : "Save changes"}
              </Button>
              {saved && <span className="text-[12.5px] font-medium text-success">Saved ✓</span>}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your personal login and profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full name</Label>
              <Input className="mt-1.5" defaultValue="Jamie Rivera" />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" type="email" defaultValue="jamie@riversideautotire.example" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13.5px] font-medium text-text">Log out</div>
                <div className="text-[12px] text-text-muted">End your session on this device.</div>
              </div>
              <form action={signOutAction}>
                <Button variant="outline" size="sm" type="submit">Log out</Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose what you want to be alerted about.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "New calls", desc: "Get notified every time a call comes in.", value: notifyCalls, set: setNotifyCalls },
              { label: "Human escalations", desc: "Get notified when the AI needs your help.", value: notifyEscalations, set: setNotifyEscalations },
              { label: "Weekly digest", desc: "A summary of calls and bookings each week.", value: notifyDigest, set: setNotifyDigest },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between border-b border-border-soft py-3.5 last:border-0">
                <div>
                  <div className="text-[13.5px] font-medium text-text">{row.label}</div>
                  <div className="text-[12px] text-text-muted">{row.desc}</div>
                </div>
                <Switch checked={row.value} onCheckedChange={row.set} />
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="phone">
        <Card>
          <CardHeader>
            <CardTitle>Phone</CardTitle>
            <CardDescription>Your GetMade number and call forwarding.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border bg-paper px-4 py-6 text-center text-[13px] text-text-muted">
              No phone number provisioned yet. Finish onboarding to get one.
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="billing">
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Plan and payment details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border bg-paper px-4 py-6 text-center text-[13px] text-text-muted">
              Billing isn&apos;t set up yet — this is a placeholder for Phase 2.
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Password and account protection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>New password</Label>
              <Input className="mt-1.5" type="password" placeholder="••••••••" />
            </div>
            <Button variant="outline" size="sm">Update password</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
