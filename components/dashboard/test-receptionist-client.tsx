"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "customer" | "ai" | "tool";
  content: string;
}

export function TestReceptionistClient({ employeeName }: { employeeName: string }) {
  const [callId, setCallId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startCall() {
    setStarting(true);
    setMessages([]);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages([{ role: "ai", content: `⚠ ${data.error}` }]);
      } else {
        setCallId(data.callId);
      }
    } catch {
      setMessages([{ role: "ai", content: "⚠ Couldn't start a test call. Check your connection." }]);
    }
    setStarting(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || !callId || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "customer", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", callId, message: text }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: "ai", content: `⚠ ${data.error}` }]);
      } else {
        const toolLines: ChatMessage[] = (data.toolCalls || []).map((tc: any) => ({
          role: "tool",
          content: `⚙ ${tc.name}(${JSON.stringify(tc.input)})`,
        }));
        setMessages((prev) => [...prev, ...toolLines, { role: "ai", content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "⚠ Something went wrong reaching the AI." }]);
    }
    setLoading(false);
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border bg-paper px-5 py-3">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span className={cn("h-2 w-2 rounded-full", callId ? "bg-success animate-pulse-ring" : "bg-text-faint")} />
          {callId ? `Active — talking with ${employeeName}` : "No active call"}
        </div>
        <Button size="sm" variant="outline" onClick={startCall} disabled={starting}>
          {starting ? "Starting…" : callId ? "Start new call" : "Start call"}
        </Button>
      </div>

      <div className="flex h-[420px] flex-col gap-2.5 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="m-auto text-center text-[13px] text-text-muted">
            {callId ? "Say something to get started, e.g. \"What are your hours?\"" : "Press \"Start call\" to begin."}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[75%] rounded-xl px-3.5 py-2.5 text-[13px]",
              m.role === "customer" && "ml-auto rounded-br-sm bg-ink text-white",
              m.role === "ai" && "rounded-bl-sm border border-border-soft bg-paper text-text",
              m.role === "tool" && "mx-auto max-w-[90%] rounded-md bg-brand-soft text-brand-dark font-mono text-[11px]"
            )}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 text-[12px] text-text-faint">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={callId ? "Type what the customer says…" : "Start a call first"}
          disabled={!callId || loading}
        />
        <Button type="submit" disabled={!callId || loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
