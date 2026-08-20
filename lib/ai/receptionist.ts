import type Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBusinessContext } from "./context";
import { buildSystemPrompt } from "./systemPrompt";
import { runClaudeTurn, isClaudeConfigured } from "./claude";

/**
 * ai/receptionist.ts
 *
 * ONE receptionist brain. Test Receptionist and real phone calls both
 * call handleTurn() with the same businessId, same tools, same
 * calendar, same knowledge base — the only difference is `channel`,
 * which only affects tone (see systemPrompt.ts) and whether
 * transfer_call is usable.
 *
 * Conversation history is persisted to Supabase (`call_messages`)
 * rather than kept in memory, since serverless functions don't retain
 * state between requests — this also directly satisfies the
 * requirement that every call shows up as a real, inspectable record
 * in the dashboard.
 */

export interface HandleTurnResult {
  reply: string;
  toolCalls: { name: string; input: any; result: any }[];
}

export async function startCall(
  businessId: string,
  customerName: string,
  phone: string,
  channel: "test" | "phone"
): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("calls")
    .insert({
      business_id: businessId,
      customer_name: customerName,
      phone,
      status: "in_progress",
      handled_by: "ai",
      outcome: "no_action",
    })
    .select("id")
    .single();
  return data?.id as string;
}

export async function endCall(callId: string, durationSeconds: number) {
  const admin = createAdminClient();
  const { data: call } = await admin.from("calls").select("outcome").eq("id", callId).single();
  await admin
    .from("calls")
    .update({
      status: "completed",
      duration_seconds: durationSeconds,
    })
    .eq("id", callId);
}

export async function handleTurn(
  businessId: string,
  callId: string,
  userText: string,
  channel: "test" | "phone"
): Promise<HandleTurnResult> {
  const admin = createAdminClient();

  const context = await loadBusinessContext(businessId);
  if (!context) {
    return { reply: "Sorry, I'm having trouble accessing business information right now.", toolCalls: [] };
  }

  if (!isClaudeConfigured()) {
    return {
      reply:
        "The AI brain isn't connected yet (ANTHROPIC_API_KEY is missing) — add it in your hosting provider's environment variables to enable real conversations.",
      toolCalls: [],
    };
  }

  // Persist the customer's message.
  await admin.from("call_messages").insert({ call_id: callId, role: "customer", content: userText });

  // Rebuild conversation history from what's actually stored, so this
  // works correctly across separate serverless invocations.
  const { data: priorMessages } = await admin
    .from("call_messages")
    .select("*")
    .eq("call_id", callId)
    .order("created_at", { ascending: true });

  const history: Anthropic.MessageParam[] = (priorMessages || [])
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "customer" ? "user" : "assistant",
      content: m.content,
    }));

  const systemPrompt = buildSystemPrompt(context, channel);

  try {
    const result = await runClaudeTurn(history, systemPrompt, {
      businessId,
      callId,
      context,
      channel,
    });

    await admin.from("call_messages").insert({
      call_id: callId,
      role: "ai",
      content: result.reply,
      tool_call: result.toolCalls.length > 0 ? JSON.stringify(result.toolCalls) : null,
    });

    // If nothing else set a more specific outcome (booking/escalation),
    // mark this as a plain answered question.
    const { data: call } = await admin.from("calls").select("outcome").eq("id", callId).single();
    if (call?.outcome === "no_action") {
      await admin.from("calls").update({ outcome: "question_answered" }).eq("id", callId);
    }

    return { reply: result.reply, toolCalls: result.toolCalls };
  } catch (err) {
    console.error("AI receptionist turn failed:", err);
    await admin.from("call_messages").insert({
      call_id: callId,
      role: "ai",
      content: "Sorry, I'm having trouble right now — let me get someone to help.",
    });
    return {
      reply: "Sorry, I'm having trouble right now — let me get someone to help.",
      toolCalls: [],
    };
  }
}
