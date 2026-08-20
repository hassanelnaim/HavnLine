import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { startCall, handleTurn, endCall } from "@/lib/ai/receptionist";

/**
 * POST /api/ai/chat
 *
 * Body: { action: "start" } -> { callId }
 *       { action: "message", callId, message } -> { reply, toolCalls }
 *       { action: "end", callId, durationSeconds }
 *
 * The businessId is ALWAYS resolved from the authenticated owner's own
 * session — never accepted from the request body. This is the guard
 * against one business ever running "test calls" against another
 * business's data.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const businessId = await getCurrentBusinessId();
  if (!businessId) {
    return NextResponse.json({ error: "No business found for this account." }, { status: 400 });
  }

  const body = await request.json();

  if (body.action === "start") {
    const callId = await startCall(businessId, "Test Caller", "test-preview", "test");
    return NextResponse.json({ callId });
  }

  if (body.action === "message") {
    if (!body.callId || !body.message) {
      return NextResponse.json({ error: "callId and message are required." }, { status: 400 });
    }
    const result = await handleTurn(businessId, body.callId, body.message, "test");
    return NextResponse.json(result);
  }

  if (body.action === "end") {
    if (body.callId) {
      await endCall(body.callId, body.durationSeconds || 0);
    }
    return NextResponse.json({ ended: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
