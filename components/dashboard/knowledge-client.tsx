"use client";

import { useState } from "react";
import { Plus, Trash2, HelpCircle, ScrollText, Info } from "lucide-react";
import type { DbKnowledgeItem, DbService, KnowledgeCategory } from "@/lib/database/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatCents } from "@/lib/format";

function itemsByCategory(items: DbKnowledgeItem[], category: KnowledgeCategory) {
  return items.filter((i) => i.category === category);
}

export function KnowledgeClient({
  initialItems,
  services,
}: {
  initialItems: DbKnowledgeItem[];
  services: DbService[];
}) {
  const [items, setItems] = useState(initialItems);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customContent, setCustomContent] = useState("");

  function addFaq() {
    if (!question.trim() || !answer.trim()) return;
    const item: DbKnowledgeItem = {
      id: "kb_" + Date.now(),
      business_id: "biz_demo_riverside",
      category: "faq",
      question,
      title: null,
      content: answer,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setItems((prev) => [item, ...prev]);
    setQuestion("");
    setAnswer("");
  }

  function addCustom() {
    if (!customTitle.trim() || !customContent.trim()) return;
    const item: DbKnowledgeItem = {
      id: "kb_" + Date.now(),
      business_id: "biz_demo_riverside",
      category: "custom",
      question: null,
      title: customTitle,
      content: customContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setItems((prev) => [item, ...prev]);
    setCustomTitle("");
    setCustomContent("");
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const faqs = itemsByCategory(items, "faq");
  const policies = itemsByCategory(items, "policy");
  const businessInfo = itemsByCategory(items, "business_info");
  const customItems = itemsByCategory(items, "custom");

  return (
    <Tabs defaultValue="faq">
      <TabsList>
        <TabsTrigger value="faq"><HelpCircle className="h-3.5 w-3.5" /> FAQs</TabsTrigger>
        <TabsTrigger value="services">Services &amp; Pricing</TabsTrigger>
        <TabsTrigger value="policies"><ScrollText className="h-3.5 w-3.5" /> Policies</TabsTrigger>
        <TabsTrigger value="business"><Info className="h-3.5 w-3.5" /> Business info</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
      </TabsList>

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
            <Button variant="outline" size="sm" onClick={addFaq}>
              <Plus className="h-3.5 w-3.5" /> Add FAQ
            </Button>
          </CardContent>
        </Card>

        {faqs.length === 0 ? (
          <EmptyState icon={HelpCircle} title="No FAQs yet" description="Add your first question and answer above." />
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
        <Card>
          <CardHeader>
            <CardTitle>Services &amp; pricing</CardTitle>
            <CardDescription>
              Managed from AI Employee → Services. Your AI only quotes what&apos;s listed here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border-soft px-3.5 py-2.5">
                <div>
                  <div className="text-[13.5px] font-medium text-text">{s.name}</div>
                  <div className="text-[12px] text-text-muted">{s.description}</div>
                </div>
                <div className="text-right font-mono text-[12.5px] text-text">
                  {formatCents(s.price_cents)} · {s.duration_minutes}m
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="policies">
        {policies.length === 0 ? (
          <EmptyState icon={ScrollText} title="No policies yet" description="Add warranty, cancellation, or other policy info from Custom." />
        ) : (
          <div className="space-y-2.5">
            {policies.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="text-[13.5px] font-semibold text-ink">{p.title}</div>
                  <p className="mt-1 text-[12.5px] text-text-muted">{p.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="business">
        {businessInfo.length === 0 ? (
          <EmptyState icon={Info} title="No entries yet" description="Parking, location details, and similar info goes here." />
        ) : (
          <div className="space-y-2.5">
            {businessInfo.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="text-[13.5px] font-semibold text-ink">{b.title}</div>
                  <p className="mt-1 text-[12.5px] text-text-muted">{b.content}</p>
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
            <Button variant="outline" size="sm" onClick={addCustom}>
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
