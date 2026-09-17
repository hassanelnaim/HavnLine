"use server";

import { isPlatformAdmin } from "@/lib/supabase/platform-admin";

export interface ProviderHealthResult {
  provider: string;
  status: "operational" | "error" | "not_configured";
  responseTimeMs: number | null;
  message: string;
  checkedAt: string;
}

/**
 * Real, live checks — not a stored/cached status shown as if it were
 * current. Each one makes a genuine, minimal request to the actual
 * provider right now. Anthropic's check uses max_tokens: 1 to keep
 * the real cost of checking as close to zero as possible, while still
 * being a real verification, not a fake green checkmark.
 */

async function checkAnthropic(): Promise<ProviderHealthResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { provider: "Anthropic", status: "not_configured", responseTimeMs: null, message: "ANTHROPIC_API_KEY not set.", checkedAt: new Date().toISOString() };
  }

  const start = Date.now();
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
    });
    const responseTimeMs = Date.now() - start;

    if (!response.ok) {
      const body = await response.text();
      return { provider: "Anthropic", status: "error", responseTimeMs, message: `HTTP ${response.status}: ${body.slice(0, 150)}`, checkedAt: new Date().toISOString() };
    }
    return { provider: "Anthropic", status: "operational", responseTimeMs, message: "Responding normally.", checkedAt: new Date().toISOString() };
  } catch (err) {
    return { provider: "Anthropic", status: "error", responseTimeMs: Date.now() - start, message: err instanceof Error ? err.message : "Unknown error.", checkedAt: new Date().toISOString() };
  }
}

async function checkElevenLabs(): Promise<ProviderHealthResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { provider: "ElevenLabs", status: "not_configured", responseTimeMs: null, message: "ELEVENLABS_API_KEY not set.", checkedAt: new Date().toISOString() };
  }

  const start = Date.now();
  try {
    // /v1/user is free — doesn't consume any character credits, purely an account-info check.
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": apiKey },
    });
    const responseTimeMs = Date.now() - start;

    if (!response.ok) {
      return { provider: "ElevenLabs", status: "error", responseTimeMs, message: `HTTP ${response.status}`, checkedAt: new Date().toISOString() };
    }
    return { provider: "ElevenLabs", status: "operational", responseTimeMs, message: "Responding normally.", checkedAt: new Date().toISOString() };
  } catch (err) {
    return { provider: "ElevenLabs", status: "error", responseTimeMs: Date.now() - start, message: err instanceof Error ? err.message : "Unknown error.", checkedAt: new Date().toISOString() };
  }
}

async function checkTwilio(): Promise<ProviderHealthResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    return { provider: "Twilio", status: "not_configured", responseTimeMs: null, message: "TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set.", checkedAt: new Date().toISOString() };
  }

  const start = Date.now();
  try {
    // Basic account-info fetch — free, doesn't place any call or send any message.
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: { Authorization: `Basic ${credentials}` },
    });
    const responseTimeMs = Date.now() - start;

    if (!response.ok) {
      return { provider: "Twilio", status: "error", responseTimeMs, message: `HTTP ${response.status}`, checkedAt: new Date().toISOString() };
    }
    return { provider: "Twilio", status: "operational", responseTimeMs, message: "Responding normally.", checkedAt: new Date().toISOString() };
  } catch (err) {
    return { provider: "Twilio", status: "error", responseTimeMs: Date.now() - start, message: err instanceof Error ? err.message : "Unknown error.", checkedAt: new Date().toISOString() };
  }
}

export async function checkAllProvidersHealth(): Promise<ProviderHealthResult[]> {
  const allowed = await isPlatformAdmin();
  if (!allowed) throw new Error("Not authorized.");

  // Run all three concurrently — no reason to wait for one before
  // checking the next.
  return Promise.all([checkAnthropic(), checkElevenLabs(), checkTwilio()]);
}
