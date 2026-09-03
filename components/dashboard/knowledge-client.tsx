"use client";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Globe, Tag, Percent } from "lucide-react";
import type { DbKnowledgeItem, DbService, DbPromotion, KnowledgeCategory } from "@/lib/database/types";
import { addKnowledgeItemAction, deleteKnowledgeItemAction, importWebsiteKnowledgeAction, addPromotionAction, togglePromotionAction, deletePromotionAction } from "@/app/actions/knowledge";
import { addServiceAction, deleteServiceAction } from "@/app/actions/services";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatCents } from "@/lib/format";

export function KnowledgeClient({ initialItems, initialServices, initialPromotions }: { initialItems: DbKnowledgeItem[]; initialServices: DbService[]; initialPromotions: DbPromotion[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => { setItems(initialItems); }, [initialItems]);

  // Knowledge item form
  const [category, setCategory] = useState<KnowledgeCategory>("faq");
  const [question, setQuestion] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function addItem() {
    setIsPending(true);
    startTransition(async () => {
      await addKnowledgeItemAction({ category, question: question || undefined, title: title || undefined, content });
      setQuestion(""); setTitle(""); setContent("");
      setIsPending(false);
      router.refresh();
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => { await deleteKnowledgeItemAction(id); });
  }

  // Website import
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function handleImport() {
    setImporting(true);
    setImportMsg(null);
    startTransition(async () => {
      const result = await importWebsiteKnowledgeAction(websiteUrl);
      setImporting(false);
      setImportMsg(result.success ? `Added ${result.itemsAdded} items.` : result.error || "Import failed.");
      if (result.success) router.refresh();
    });
  }

  // Services
  const [services, setServices] = useState(initialServices);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [serviceError, setServiceError] = useState<string | null>(null);

  useEffect(() => { setServices(initialServices); }, [initialServices]);

  function addService() {
    if (!newServiceName.trim()) { setServiceError("Service name is required."); return; }
    setServiceError(null);
    startTransition(async () => {
      const result = await addServiceAction({ name: newServiceName, description: newServiceDescription, priceDollars: newServicePrice, durationMinutes: newServiceDuration });
      if (!result.success) { setServiceError(result.error || "Could not save that service."); return; }
      setNewServiceName(""); setNewServiceDescription(""); setNewServicePrice(""); setNewServiceDuration(30);
      router.refresh();
    });
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
    startTransition(async () => { await deleteServiceAction(id); });
  }

  // Promotions
  const [promotions, setPromotions] = useState(initialPromotions);
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [promoAppliesTo, setPromoAppliesTo] = useState("");
  const [promoStart, setPromoStart] = useState("");
  const [promoEnd, setPromoEnd] = useState("");

  useEffect(() => { setPromotions(initialPromotions); }, [initialPromotions]);

  function addPromo() {
    startTransition(async () => {
      await addPromotionAction({ title: promoTitle, description: promoDescription, appliesTo: promoAppliesTo, startDate: promoStart, endDate: promoEnd });
      setPromoTitle(""); setPromoDescription(""); setPromoAppliesTo(""); setPromoStart(""); setPromoEnd("");
      router.refresh();
    });
  }

  function togglePromo(id: string, active: boolean) {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: active } : p)));
    startTransition(async () => { await togglePromotionAction(id, active); });
  }

  function removePromo(id: string) {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => { await deletePromotionAction(id); });
  }

  const policies = items.filter((i) => i.category === "policy");

  return (
    <Tabs defaultValue="faqs">
      <TabsList className="flex-wrap">
        <TabsTrigger value="faqs">FAQs</TabsTrigger>
        <TabsTrigger value="services"><Tag className="h-3.5 w-3.5" /> Services</TabsTrigger>
        <TabsTrigger value="promotions"><Percent className="h-3.5 w-3.5" /> Promotions</TabsTrigger>
        <TabsTrigger value="policies">Policies</TabsTrigger>
        <TabsTrigger value="import"><Globe className="h-3.5 w-3.5" /> Import</TabsTrigger>
      </TabsList>

      <TabsContent value="faqs">
        <Card className="mb-4">
          <CardHeader><CardTitle>Add knowledge</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Category</Label>
              <select className="mt-1.5 flex h-9 w-full rounded-lg border border-border bg-card px-3 text-[13.5px] text-text" value={category} onChange={(e) => setCategory(e.target.value as KnowledgeCategory)}>
                <option value="faq">FAQ</option>
                <option value="business_info">Business info</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {category === "faq" ? (
              <div><Label>Question</Label><Input className="mt-1.5" value={question} onChange={(e) => setQuestion(e.target.value)} /></div>
            ) : (
              <div><Label>Title</Label><Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            )}
            <div><Label>Content</Label><Textarea rows={3} className="mt-1.5" value={content} onChange={(e) => setContent(e.target.value)} /></div>
            <Button variant="outline" size="sm" onClick={addItem} disabled={isPending || !content.trim()}><Plus className="h-3.5 w-3.5" /> Add</Button>
          </CardContent>
        </Card>
        {items.filter((i) => i.category !== "policy").length === 0 ? (
          <EmptyState icon={Tag} title="No knowledge yet" description="Add FAQs and info above, or import from your website." />
        ) : (
          <div className="space-y-2">
            {items.filter((i) => i.category !== "policy").map((item) => (
              <Card key={item.id}><CardContent className="flex items-start justify-between gap-4 p-4">
                <div><div className="text-[13.5px] font-medium text-text">{item.question || item.title}</div><p className="mt-1 text-[12.5px] text-text-muted">{item.content}</p></div>
                <button onClick={() => removeItem(item.id)} className="rounded-md p-1 text-text-faint hover:bg-danger-soft hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
              </CardContent></Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="services">
        <Card className="mb-4">
          <CardHeader><CardTitle>Add a service</CardTitle><CardDescription>Your AI only quotes prices and durations listed here.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {serviceError && <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">{serviceError}</div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Name</Label><Input className="mt-1.5" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Input className="mt-1.5" value={newServiceDescription} onChange={(e) => setNewServiceDescription(e.target.value)} /></div>
              <div><Label>Price ($)</Label><Input type="number" step="0.01" className="mt-1.5" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} /></div>
              <div><Label>Duration (minutes)</Label><Input type="number" className="mt-1.5" value={newServiceDuration} onChange={(e) => setNewServiceDuration(parseInt(e.target.value) || 30)} /></div>
            </div>
            <Button variant="outline" size="sm" onClick={addService} disabled={isPending}><Plus className="h-3.5 w-3.5" /> Add service</Button>
          </CardContent>
        </Card>
        {services.length === 0 ? (
          <EmptyState icon={Tag} title="No services yet" description="Add your first service above." />
        ) : (
          <div className="space-y-2.5">
            {services.map((s) => (
              <Card key={s.id}><CardContent className="flex items-center justify-between gap-4 p-4">
                <div><div className="text-[13.5px] font-medium text-text">{s.name}</div><div className="text-[12px] text-text-muted">{s.description}</div></div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-mono text-[12.5px] text-text">{formatCents(s.price_cents)} · {s.duration_minutes}m</div>
                  <button onClick={() => removeService(s.id)} className="rounded-md p-1 text-text-faint hover:bg-danger-soft hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="promotions">
        <Card className="mb-4">
          <CardHeader><CardTitle>Add a promotion</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Title</Label><Input className="mt-1.5" value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} /></div>
              <div><Label>Applies to</Label><Input className="mt-1.5" value={promoAppliesTo} onChange={(e) => setPromoAppliesTo(e.target.value)} /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Input className="mt-1.5" value={promoDescription} onChange={(e) => setPromoDescription(e.target.value)} /></div>
              <div><Label>Start date</Label><Input type="date" className="mt-1.5" value={promoStart} onChange={(e) => setPromoStart(e.target.value)} /></div>
              <div><Label>End date</Label><Input type="date" className="mt-1.5" value={promoEnd} onChange={(e) => setPromoEnd(e.target.value)} /></div>
            </div>
            <Button variant="outline" size="sm" onClick={addPromo} disabled={!promoTitle.trim()}><Plus className="h-3.5 w-3.5" /> Add promotion</Button>
          </CardContent>
        </Card>
        {promotions.length === 0 ? (
          <EmptyState icon={Percent} title="No promotions" description="Add one above so your AI can mention it." />
        ) : (
          <div className="space-y-2.5">
            {promotions.map((p) => (
              <Card key={p.id}><CardContent className="flex items-center justify-between gap-4 p-4">
                <div><div className="text-[13.5px] font-medium text-text">{p.title}</div><div className="text-[12px] text-text-muted">{p.description} · {p.start_date} to {p.end_date}</div></div>
                <div className="flex items-center gap-3">
                  <Switch checked={p.is_active} onCheckedChange={(checked) => togglePromo(p.id, checked)} />
                  <button onClick={() => removePromo(p.id)} className="rounded-md p-1 text-text-faint hover:bg-danger-soft hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="policies">
        {policies.length === 0 ? (
          <EmptyState icon={Tag} title="No policies yet" description="Add policies from the FAQs tab (category: Custom) or import from your website." />
        ) : (
          <div className="space-y-2">
            {policies.map((item) => (
              <Card key={item.id}><CardContent className="p-4"><div className="text-[13.5px] font-medium text-text">{item.title}</div><p className="mt-1 text-[12.5px] text-text-muted">{item.content}</p></CardContent></Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="import">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4 text-text-faint" /> Import knowledge from your website</CardTitle><CardDescription>Let HavnLine read your website and automatically pull in FAQs, services, and business info.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {importMsg && <div className="rounded-lg border border-border bg-paper px-3.5 py-2.5 text-[12.5px] text-text-muted">{importMsg}</div>}
            <div className="flex gap-2">
              <Input placeholder="yourbusiness.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
              <Button variant="brand" onClick={handleImport} disabled={importing || !websiteUrl.trim()}>{importing ? "Reading…" : "Import"}</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
