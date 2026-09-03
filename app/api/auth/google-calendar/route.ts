import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getCurrentBusinessId } from "@/lib/supabase/business";

export async function GET() {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return NextResponse.redirect(new URL("/onboarding", process.env.NEXT_PUBLIC_SITE_URL));

  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
    state: businessId,
  });

  return NextResponse.redirect(url);
}
