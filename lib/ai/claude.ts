import Anthropic from "@anthropic-ai/sdk";
import { toolDefinitions, executeTool, type ToolExecContext } from "./tools";

/**
 * ai/claude.ts
 *
 * The only file that talks to the Anthropic API directly. Runs the
 * full tool-use loop: send messages, execute any tool Claude calls,
 * feed results back, repeat until Claude produces a final text answer.
 *
 * Phone calls use a faster model and a shorter max_tokens by default —
 * spoken responses should be brief anyway, and every second of "thinking"
 * is dead air on a live call. Test Receptionist can afford to use the
 * stronger default model since there's no real-time pressure there.
 */

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const PHONE_MODEL = process.env.ANTHROPIC_PHONE_MODEL || "claude-haiku-4-5-20251001";

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

export interface RunClaudeTurnOptions {
  model?: string;
  maxTokens?: number;
}

export async function runClaudeTurn(
  history: Anthropic.MessageParam[],
  systemPrompt: string,
  toolCtx: ToolExecContext,
  options: RunClaudeTurnOptions = {}
): Promise<ClaudeTurnResult> {
  const client = getClient();
  if (!client) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const model = options.model || (toolCtx.channel === "phone" ? PHONE_MODEL : DEFAULT_MODEL);
  const maxTokens = options.maxTokens || (toolCtx.channel === "phone" ? 150 : 1024);

  const messages = [...history];
  const toolCallLog: { name: string; input: any; result: any }[] = [];

  let loopGuard = 0;
  while (loopGuard < 8) {
    loopGuard++;
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
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
