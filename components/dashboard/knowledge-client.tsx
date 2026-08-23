"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, HelpCircle, ScrollText, Info, Globe, Sparkles, Tag } from "lucide-react";
import type { DbKnowledgeItem, DbPromotion, DbService, KnowledgeCategory } from "@/lib/database/types";
import {
  addKnowledgeItemAction,
  deleteKnowledgeItemAction,
  importWebsiteKnowledgeAction,
  addPromotionAction,
  togglePromotionAction,
  deletePromotionAction,
} from "@/app/actions/knowledge";
import { addServiceAction, deleteServiceAction } from "@/app/actions/services";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatCents } from "@/lib/format";

function itemsByCategory(items: DbKnowledgeItem[], category: KnowledgeCategory) {
  return items.filter((i) => i.category === category);
}

export function KnowledgeClient({
  initialItems,
  initialServices,
  initialPromotions,
}: {
  initialItems: DbKnowledgeItem[];
  initialServices: DbService[];
  initialPromotions: DbPromotion[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Promotions
  const [promotions, setPromotions] = useState(initialPromotions);
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [promoAppliesTo, setPromoAppliesTo] = useState("");
  const [promoStart, setPromoStart] = useState("");
  const [promoEnd, setPromoEnd] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    setPromotions(initialPromotions);
  }, [initialPromotions]);

  // Services
  const [services, setServices] = useState(initialServices);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [serviceError, setServiceError] = useState<string | null>(null);

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  function addService() {
    if (!newServiceName.trim()) {
      setServiceError("Service name is required.");
      return;
    }
    setServiceError(null);
    startTransition(async () => {
      const result = await addServiceAction({
        name: newServiceName,
        description: newServiceDescription,
        priceDollars: newServicePrice,
        durationMinutes: newServiceDuration,
      });
      if (!result.success) {
        setServiceError(result.error || "Could not save that service.");
        return;
      }
      setNewServiceName("");
      setNewServiceDescription("");
      setNewServicePrice("");
      setNewServiceDuration(30);
      router.refresh();
    });
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
    startTransition(async () => {
      await deleteServiceAction(id);
    });
  }

  function addPromotion() {
    if (!promoTitle.trim() || !promoDescription.trim() || !promoStart || !promoEnd) {
      setPromoError("Fill in the title, description, and both dates.");
      return;
    }
    setPromoError(null);
    startTransition(async () => {
      const result = await addPromotionAction({
        title: promoTitle,
        description: promoDescription,
        appliesTo: promoAppliesTo,
        startDate: promoStart,
        endDate: promoEnd,
      });
      if (!result.success) {
        setPromoError(result.error || "Could not save that promotion.");
        return;
      }
      setPromoTitle("");
      setPromoDescription("");
      setPromoAppliesTo("");
      setPromoStart("");
      setPromoEnd("");
      router.refresh();
    });
  }

  function togglePromotion(id: string, active: boolean) {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: active } : p)));
    startTransition(async () => {
      await togglePromotionAction(id, active);
    });
  }

  function removePromotion(id: string) {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      await deletePromotionAction(id);
    });
  }

  // Keep local state in sync whenever the server sends fresh items
  // (e.g. after a website import triggers router.refresh()).
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  function addFaq() {
    if (!question.trim() || !answer.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addKnowledgeItemAction({ category: "faq", question, content: answer });
      if (!result.success) {
        setError(result.error || "Could not save that FAQ.");
        return;
      }
      setItems((prev) => [
        {
          id: "kb_" + Date.now(),
          business_id: "",
          category: "faq",
          question,
          title: null,
          content: answer,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setQuestion("");
      setAnswer("");
    });
  }

  function addCustom() {
    if (!customTitle.trim() || !customContent.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addKnowledgeItemAction({ category: "custom", title: customTitle, content: customContent });
      if (!result.success) {
        setError(result.error || "Could not save that entry.");
        return;
      }
      setItems((prev) => [
        {
          id: "kb_" + Date.now(),
          business_id: "",
          category: "custom",
          question: null,
          title: customTitle,
          content: customContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCustomTitle("");
      setCustomContent("");
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      await deleteKnowledgeItemAction(id);
    });
  }

  function handleImportWebsite() {
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    startTransition(async () => {
      const result = await importWebsiteKnowledgeAction(websiteUrl);
      setImporting(false);
      if (!result.success) {
        setImportError(result.error || "Could not import from that website.");
        return;
      }
      setImportResult(`Added ${result.imported} item${result.imported === 1 ? "" : "s"} from your website.`);
      setWebsiteUrl("");
      router.refresh();
    });
  }

  const faqs = itemsByCategory(items, "faq");
  const policies = itemsByCategory(items, "policy");
  const businessInfo = itemsByCategory(items, "business_info");
  const customItems = itemsByCategory(items, "custom");

  return (
    <Tabs defaultValue="import">
      {error && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
          {error}
        </div>
      )}
      <TabsList className="flex-wrap">
        <TabsTrigger value="import"><Globe className="h-3.5 w-3.5" /> Import from website</TabsTrigger>
        <TabsTrigger value="promotions"><Tag className="h-3.5 w-3.5" /> Promotions</TabsTrigger>
        <TabsTrigger value="faq"><HelpCircle className="h-3.5 w-3.5" /> FAQs</TabsTrigger>
        <TabsTrigger value="services">Services &amp; Pricing</TabsTrigger>
        <TabsTrigger value="policies"><ScrollText className="h-3.5 w-3.5" /> Policies</TabsTrigger>
        <TabsTrigger value="business"><Info className="h-3.5 w-3.5" /> Business info</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
      </TabsList>

      <TabsContent value="import">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" /> Import from your website
            </CardTitle>
            <CardDescription>
              Paste your website URL and HavnLine will read it and automatically pull out real FAQs, services,
              and business info — so your AI can answer questions that were never manually typed in here. It
              only adds what&apos;s actually written on your site, never invented.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {importResult && (
              <div className="rounded-lg border border-success/20 bg-success-soft px-3.5 py-2.5 text-[12.5px] text-success">
                {importResult}
              </div>
            )}
            {importError && (
              <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
                {importError}
              </div>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[240px]">
                <Label>Website URL</Label>
                <Input
                  className="mt-1.5"
                  placeholder="yourbusiness.com or a specific page like yourbusiness.com/faq"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              <Button variant="brand" onClick={handleImportWebsite} disabled={importing || !websiteUrl.trim()}>
                {importing ? "Reading your site…" : "Import"}
              </Button>
            </div>
            <p className="text-[11.5px] text-text-faint">
              Tip: for the best results, point this at a page with real content — an FAQ, About, or Services
              page usually works better than just the homepage.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="promotions">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand" /> Add a promotion
            </CardTitle>
            <CardDescription>
              Your AI answers discount questions directly from this list — it will never invent a discount
              that isn&apos;t listed here, and it won&apos;t need to escalate discount questions to you as
              long as something relevant is active.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {promoError && (
              <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
                {promoError}
              </div>
            )}
            <div>
              <Label>Title</Label>
              <Input className="mt-1.5" placeholder="Fall oil change special" value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} />
            </div>
            <div>
              <Label>What it is (the AI reads this to customers)</Label>
              <Textarea rows={2} className="mt-1.5" placeholder="15% off any oil change, no appointment restrictions." value={promoDescription} onChange={(e) => setPromoDescription(e.target.value)} />
            </div>
            <div>
              <Label>Applies to (optional)</Label>
              <Input className="mt-1.5" placeholder="Oil changes only, or leave blank for all services" value={promoAppliesTo} onChange={(e) => setPromoAppliesTo(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start date</Label>
                <Input type="date" className="mt-1.5" value={promoStart} onChange={(e) => setPromoStart(e.target.value)} />
              </div>
              <div>
                <Label>End date</Label>
                <Input type="date" className="mt-1.5" value={promoEnd} onChange={(e) => setPromoEnd(e.target.value)} />
              </div>
            </div>
            <Button variant="brand" size="sm" onClick={addPromotion} disabled={isPending}>
              <Plus className="h-3.5 w-3.5" /> Add promotion
            </Button>
          </CardContent>
        </Card>

        {promotions.length === 0 ? (
          <EmptyState icon={Tag} title="No promotions yet" description="Add one above — your AI will apply it automatically while it's active." />
        ) : (
          <div className="space-y-2.5">
            {promotions.map((p) => {
              const today = new Date().toISOString().slice(0, 10);
              const isCurrentlyInRange = p.start_date <= today && p.end_date >= today;
              return (
                <Card key={p.id}>
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-ink">{p.title}</span>
                        {p.is_active && isCurrentlyInRange && <Badge variant="success">Live now</Badge>}
                        {p.is_active && !isCurrentlyInRange && <Badge variant="neutral">Scheduled</Badge>}
                        {!p.is_active && <Badge variant="neutral">Paused</Badge>}
                      </div>
                      <p className="mt-1 text-[12.5px] text-text-muted">{p.description}</p>
                      <p className="mt-1 font-mono text-[11px] text-text-faint">
                        {p.start_date} – {p.end_date}
                        {p.applies_to ? ` · ${p.applies_to}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={p.is_active} onCheckedChange={(checked) => togglePromotion(p.id, checked)} />
                      <button onClick={() => removePromotion(p.id)} className="rounded-md p-1 text-text-faint hover:bg-danger-soft hover:text-danger">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="faq">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Add a question &amp; answer</CardTitle>
            <CardDescription>Your AI will use these to answer callers directly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Question</Label>
              <Input className="mt-1.5" placeholder='"Do you offer same-day appointments?"' value={question} onChange={(e) => setQuestion(e.target.value)} />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea rows={2} className="mt-1.5" placeholder='"Yes, when availability allows."' value={answer} onChange={(e) => setAnswer(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={addFaq} disabled={isPending}>
              <Plus className="h-3.5 w-3.5" /> Add FAQ
            </Button>
          </CardContent>
        </Card>

        {faqs.length === 0 ? (
          <EmptyState icon={HelpCircle} title="No FAQs yet" description="Add your first question and answer above, or import from your website." />
        ) : (
          <div className="space-y-2.5">
            {faqs.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink">{f.question}</div>
                    <p className="mt-1 text-[12.5px] text-text-muted">{f.content}</p>
                  </div>
                  <button onClick={() => removeItem(f.id)} className="rounded-md p-1 text-text-faint hover:bg-danger-soft hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="services">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Add a service</CardTitle>
            <CardDescription>Your AI only quotes prices and durations listed here — never invents them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceError && (
              <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
                {serviceError}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Name</Label>
                <Input className="mt-1.5" placeholder="Oil Change" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Input className="mt-1.5" placeholder="Full synthetic oil change" value={newServiceDescription} onChange={(e) => setNewServiceDescription(e.target.value)} />
              </div>
              <div>
                <Label>Price ($)</Label>
                <Input type="number" step="0.01" className="mt-1.5" placeholder="59.99" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input type="number" className="mt-1.5" value={newServiceDuration} onChange={(e) => setNewServiceDuration(parseInt(e.target.value) || 30)} />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={addService} disabled={isPending}>
              <Plus className="h-3.5 w-3.5" /> Add service
            </Button>
          </CardContent>
        </Card>

        {services.length === 0 ? (
          <EmptyState icon={Tag} title="No services yet" description="Add your first service above." />
        ) : (
          <div className="space-y-2.5">
            {services.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <div className="text-[13.5px] font-medium text-text">{s.name}</div>
                    <div className="text-[12px] text-text-muted">{s.description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono text-[12.5px] text-text">
                      {formatCents(s.price_cents)} · {s.duration_minutes}m
                    </div>
                    <button onClick={() => removeService(s.id)} className="rounded-md p-1 text-text-faint hover:bg-danger-soft hover:text-danger">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="policies">
        {policies.length === 0 ? (
          <EmptyState icon={ScrollText} title="No policies yet" description="Add warranty, cancellation, or other policy info from Custom, or import from your website." />
        ) : (
          <div className="space-y-2.5">
            {policies.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink">{p.title}</div>
                    <p className="mt-1 text-[12.5px] text-text-muted">{p.content}</p>
                  </div>
                  <button onClick={() => removeItem(p.id)} className="rounded-md p-1 text-text-faint hover:bg-danger-soft hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="business">
        {businessInfo.length === 0 ? (
          <EmptyState icon={Info} title="No entries yet" description="Parking, location details, and similar info goes here, or import from your website." />
        ) : (
          <div className="space-y-2.5">
            {businessInfo.map((b) => (
              <Card key={b.id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink">{b.title}</div>
                    <p className="mt-1 text-[12.5px] text-text-muted">{b.content}</p>
                  </div>
                  <button onClick={() => removeItem(b.id)} className="rounded-md p-1 text-text-faint hover:bg-danger-soft hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="custom">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Add custom instructions</CardTitle>
            <CardDescription>Anything else your AI should know that doesn&apos;t fit elsewhere.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input className="mt-1.5" placeholder="Loaner vehicles" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
            </div>
            <div>
              <Label>Details</Label>
              <Textarea rows={2} className="mt-1.5" value={customContent} onChange={(e) => setCustomContent(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={addCustom} disabled={isPending}>
              <Plus className="h-3.5 w-3.5" /> Add entry
            </Button>
          </CardContent>
        </Card>

        {customItems.length === 0 ? (
          <EmptyState icon={Plus} title="Nothing here yet" description="Add your first custom entry above." />
        ) : (
          <div className="space-y-2.5">
            {customItems.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink">{c.title}</div>
                    <p className="mt-1 text-[12.5px] text-text-muted">{c.content}</p>
                  </div>
                  <button onClick={() => removeItem(c.id)} className="rounded-md p-1 text-text-faint hover:bg-danger-soft hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
