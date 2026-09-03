import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const businessId = request.nextUrl.searchParams.get("state");

  if (!code || !businessId) {
    return NextResponse.redirect(`${SITE_URL}/dashboard/integrations?error=missing_params`);
  }

  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const admin = createAdminClient();
    await admin.from("integrations").upsert(
      {
        business_id: businessId,
        provider: "google_calendar",
        status: "connected",
        external_account_id: userInfo.email,
        connected_at: new Date().toISOString(),
        metadata: { access_token: tokens.access_token, refresh_token: tokens.refresh_token, expiry_date: tokens.expiry_date, calendar_id: "primary" },
      },
      { onConflict: "business_id,provider" }
    );

    return NextResponse.redirect(`${SITE_URL}/dashboard/integrations?connected=google_calendar`);
  } catch (err) {
    console.error("Google Calendar OAuth callback failed:", err);
    return NextResponse.redirect(`${SITE_URL}/dashboard/integrations?error=oauth_failed`);
  }
}
