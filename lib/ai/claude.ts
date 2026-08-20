import Anthropic from "@anthropic-ai/sdk";
import { toolDefinitions, executeTool, type ToolExecContext } from "./tools";

/**
 * ai/claude.ts
 *
 * The only file that talks to the Anthropic API directly. Runs the
 * full tool-use loop: send messages, execute any tool Claude calls,
 * feed results back, repeat until Claude produces a final text answer.
 */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export interface ClaudeTurnResult {
  reply: string;
  toolCalls: { name: string; input: any; result: any }[];
  rawMessages: Anthropic.MessageParam[];
}

export async function runClaudeTurn(
  history: Anthropic.MessageParam[],
  systemPrompt: string,
  toolCtx: ToolExecContext
): Promise<ClaudeTurnResult> {
  const client = getClient();
  if (!client) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const messages = [...history];
  const toolCallLog: { name: string; input: any; result: any }[] = [];

  let loopGuard = 0;
  while (loopGuard < 8) {
    loopGuard++;
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: toolDefinitions as Anthropic.Tool[],
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      const textBlock = response.content.find((b) => b.type === "text");
      return {
        reply: textBlock && textBlock.type === "text" ? textBlock.text : "",
        toolCalls: toolCallLog,
        rawMessages: messages,
      };
    }

    const toolResults: Anthropic.MessageParam["content"] = [];
    for (const block of response.content) {
      if (block.type === "tool_use") {
        const result = await executeTool(block.name, block.input, toolCtx);
        toolCallLog.push({ name: block.name, input: block.input, result });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }

  return {
    reply: "I'm having trouble processing that right now — let me get a human to help.",
    toolCalls: toolCallLog,
    rawMessages: messages,
  };
}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
