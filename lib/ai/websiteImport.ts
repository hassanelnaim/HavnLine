import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import type { KnowledgeCategory } from "@/lib/database/types";

const MAX_CHARS = 15000;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export interface ExtractedKnowledgeItem {
  category: KnowledgeCategory;
  question?: string;
  title?: string;
  content: string;
}

export async function fetchWebsiteText(url: string): Promise<string> {
  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Could not load that website (HTTP ${response.status}).`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, nav, footer").remove();

  const text = $("body").text().replace(/\s+/g, " ").trim();

  if (text.length < 50) {
    throw new Error("Couldn't find enough readable content on that page.");
  }

  return text.slice(0, MAX_CHARS);
}

export async function extractKnowledgeFromText(businessName: string, websiteText: string): Promise<ExtractedKnowledgeItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You extract factual business knowledge from raw website text for "${businessName}". Only extract information that is genuinely present in the text — never invent, guess, or embellish. Respond with ONLY a JSON array, no other text, no markdown fences. Each item: {"category": "faq"|"business_info"|"policy"|"services"|"custom", "question": string (only for category "faq"), "title": string (for non-faq categories), "content": string}. Aim for 5-15 concise, genuinely useful items. Skip navigation text, cookie notices, and anything not substantive.`,
    messages: [{ role: "user", content: `Extract knowledge items from this website text:\n\n${websiteText}` }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.content === "string" && item.content.trim())
      .map((item) => ({
        category: (["faq", "business_info", "policy", "services", "custom"].includes(item.category) ? item.category : "custom") as KnowledgeCategory,
        question: typeof item.question === "string" ? item.question : undefined,
        title: typeof item.title === "string" ? item.title : undefined,
        content: item.content,
      }));
  } catch {
    return [];
  }
}

export interface ExtractedService {
  name: string;
  description: string;
  priceDollars: string;
  durationMinutes: number;
}

export async function extractServicesFromText(businessName: string, websiteText: string): Promise<ExtractedService[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: `You extract a list of SERVICES (things customers can book/buy) from raw website text for "${businessName}". Only include services that are genuinely mentioned in the text — never invent a service, price, or duration that isn't there. Respond with ONLY a JSON array, no other text, no markdown fences. Each item: {"name": string, "description": string (short, one line), "priceDollars": string (just the number as a string — empty string "" if no price is stated), "durationMinutes": number (your best reasonable estimate if not explicitly stated)}. Skip navigation text and anything that isn't really a bookable service.`,
    messages: [{ role: "user", content: `Extract the list of services from this website text:\n\n${websiteText}` }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.name === "string" && item.name.trim())
      .map((item) => ({
        name: item.name,
        description: typeof item.description === "string" ? item.description : "",
        priceDollars: typeof item.priceDollars === "string" ? item.priceDollars : "",
        durationMinutes: typeof item.durationMinutes === "number" ? item.durationMinutes : 30,
      }));
  } catch {
    return [];
  }
}
