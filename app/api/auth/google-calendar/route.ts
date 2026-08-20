import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/supabase/business";

/**
 * GET /api/auth/google-calendar
 *
 * Starts the OAuth flow. Redirects the logged-in business owner to
 * Google's consent screen, requesting only calendar access (never their
 * Google password — that's the whole point of OAuth).
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  const businessId = await getCurrentBusinessId();
  if (!businessId) {
    return NextResponse.redirect(new URL("/onboarding", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // required to get a refresh_token
    prompt: "consent", // forces refresh_token on every connect, not just the first
    scope: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.readonly"],
    // Carry the business id through the OAuth round-trip so the callback
    // knows who this connection belongs to.
    state: businessId,
  });

  return NextResponse.redirect(url);
}
