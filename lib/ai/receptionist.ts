import { createAdminClient } from "@/lib/supabase/admin";
import { loadBusinessContext } from "./context";
import { runTurn, type ConversationMessage } from "./claude";
import type { ToolContext } from "./tools";

export interface HandleTurnResult {
  reply: string;
  toolCalls: { name: string; input: unknown; result: any }[];
}

export async function startCall(businessId: string, callerNumber: string, dialedNumber: string): Promise<string> {
  const admin = createAdminClient();
  const { data: call, error } = await admin
    .from("calls")
    .insert({
      business_id: businessId,
      customer_name: "Phone Caller",
      phone: callerNumber,
      started_at: new Date().toISOString(),
      duration_seconds: 0,
      outcome: "no_action",
      status: "in_progress",
      handled_by: "ai",
    })
    .select()
    .single();

  if (error || !call) throw new Error(error?.message || "Could not start call.");
  return call.id;
}

export async function startTestSession(businessId: string): Promise<string> {
  const admin = createAdminClient();
  const { data: call, error } = await admin
    .from("calls")
    .insert({
      business_id: businessId,
      customer_name: "Test Session",
      phone: "test",
      started_at: new Date().toISOString(),
      duration_seconds: 0,
      outcome: "no_action",
      status: "in_progress",
      handled_by: "ai",
    })
    .select()
    .single();

  if (error || !call) throw new Error(error?.message || "Could not start test session.");
  return call.id;
}

export async function handleTurn(
  businessId: string,
  callId: string,
  userMessage: string,
  channel: "test" | "phone"
): Promise<HandleTurnResult> {
  const admin = createAdminClient();

  const context = await loadBusinessContext(businessId);
  if (!context) {
    return { reply: "Sorry, I'm having trouble accessing business information right now.", toolCalls: [] };
  }

  const { data: priorMessages } = await admin
    .from("call_messages")
    .select("role, content")
    .eq("call_id", callId)
    .neq("role", "system")
    .order("created_at", { ascending: true });

  const history: ConversationMessage[] = (priorMessages || []).map((m) => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.content,
  }));

  await admin.from("call_messages").insert({ call_id: callId, role: "customer", content: userMessage });

  const toolCtx: ToolContext = { businessId, callId, channel, context };
  const result = await runTurn(history, userMessage, toolCtx);

  await admin.from("call_messages").insert({
    call_id: callId,
    role: "ai",
    content: result.reply,
    tool_call: result.toolCalls.length > 0 ? JSON.stringify(result.toolCalls.map((t) => t.name)) : null,
  });

  return result;
}

export async function endCall(callId: string, durationSeconds: number): Promise<void> {
  const admin = createAdminClient();
  await admin.from("calls").update({ status: "completed", duration_seconds: durationSeconds }).eq("id", callId);
}
