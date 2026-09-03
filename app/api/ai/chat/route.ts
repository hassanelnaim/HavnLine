import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";
import { startTestSession, handleTurn } from "@/lib/ai/receptionist";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const businessId = await getCurrentBusinessId();
  if (!businessId) return NextResponse.json({ error: "No business found." }, { status: 400 });

  const { message, callId: existingCallId } = await request.json();
  if (!message) return NextResponse.json({ error: "Missing message." }, { status: 400 });

  let callId = existingCallId;
  if (!callId) {
    callId = await startTestSession(businessId);
  }

  const result = await handleTurn(businessId, callId, message, "test");
  return NextResponse.json({ reply: result.reply, callId });
}
