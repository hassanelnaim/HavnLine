"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Building2, UserRound, Bell, Phone, CreditCard, ShieldCheck } from "lucide-react";
import type { DbBusiness } from "@/lib/database/types";
import type { UserProfile } from "@/lib/data/profile";
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
import { updateProfileNameAction, updateEmailAction, updatePasswordAction } from "@/app/actions/profile";

export function SettingsClient({ business, profile }: { business: DbBusiness; profile: UserProfile }) {
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

  // Account
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  function handleSaveName() {
    setNameError(null);
    startTransition(async () => {
      const result = await updateProfileNameAction(fullName);
      if (!result.success) {
        setNameError(result.error || "Could not save your name.");
        return;
      }
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 1800);
    });
  }

  function handleSaveEmail() {
    setEmailError(null);
    startTransition(async () => {
      const result = await updateEmailAction(email);
      if (!result.success) {
        setEmailError(result.error || "Could not update your email.");
        return;
      }
      setEmailSaved(true);
    });
  }

  function handleSavePassword() {
    setPasswordError(null);
    startTransition(async () => {
      const result = await updatePasswordAction(newPassword);
      if (!result.success) {
        setPasswordError(result.error || "Could not update your password.");
        return;
      }
      setPasswordSaved(true);
      setNewPassword("");
      setTimeout(() => setPasswordSaved(false), 2500);
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
                <Label>Phone (used for call transfers)</Label>
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
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your profile</CardTitle>
              <CardDescription>Your personal login and display name.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full name</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  <Button variant="outline" size="sm" onClick={handleSaveName} disabled={isPending}>
                    Save
                  </Button>
                </div>
                {nameError && <p className="mt-1.5 text-[12px] text-danger">{nameError}</p>}
                {nameSaved && <p className="mt-1.5 text-[12px] text-success">Saved ✓</p>}
              </div>

              <div>
                <Label>Email</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Button variant="outline" size="sm" onClick={handleSaveEmail} disabled={isPending}>
                    Save
                  </Button>
                </div>
                {emailError && <p className="mt-1.5 text-[12px] text-danger">{emailError}</p>}
                {emailSaved && (
                  <p className="mt-1.5 text-[12px] text-success">
                    Check your new email address for a confirmation link — the change won&apos;t take effect until
                    you click it.
                  </p>
                )}
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
        </div>
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
            <p className="pt-3 text-[11.5px] text-text-faint">
              These preferences aren&apos;t wired to real notifications yet — a future update.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="phone">
        <Card>
          <CardHeader>
            <CardTitle>Phone</CardTitle>
            <CardDescription>Your HavnLine number and call forwarding.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-paper px-4 py-5 text-center text-[13px] text-text-muted">
              Get a phone number, set up call forwarding from your existing number, and manage everything from{" "}
              <Link href="/dashboard/integrations" className="font-medium text-brand hover:underline">
                Integrations
              </Link>
              .
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
            <div className="rounded-lg border border-border bg-paper px-4 py-5 text-center text-[13px] text-text-muted">
              Manage your subscription, payment method, and billing history from{" "}
              <Link href="/dashboard/billing" className="font-medium text-brand hover:underline">
                Billing
              </Link>
              .
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
              <Input
                className="mt-1.5"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {passwordError && <p className="text-[12px] text-danger">{passwordError}</p>}
            {passwordSaved && <p className="text-[12px] text-success">Password updated ✓</p>}
            <Button variant="outline" size="sm" onClick={handleSavePassword} disabled={isPending || newPassword.length === 0}>
              Update password
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
