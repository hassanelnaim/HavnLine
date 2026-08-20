import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * GET /api/auth/google-calendar/callback
 *
 * Google redirects here after the owner approves (or denies) access.
 * Exchanges the one-time code for real tokens and stores them
 * server-side only — the browser never sees an OAuth token.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const businessId = searchParams.get("state");
  const error = searchParams.get("error");

  const integrationsUrl = new URL("/dashboard/integrations", SITE_URL);

  if (error || !code || !businessId) {
    integrationsUrl.searchParams.set("calendar_error", error || "missing_code");
    return NextResponse.redirect(integrationsUrl);
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      // Google only returns a refresh_token the FIRST time a user
      // consents (or when prompt=consent forces it). If this happens,
      // the owner needs to revoke access in their Google account and
      // reconnect so we can get a fresh refresh_token.
      integrationsUrl.searchParams.set("calendar_error", "no_refresh_token");
      return NextResponse.redirect(integrationsUrl);
    }

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const profile = await oauth2.userinfo.get();

    const admin = createAdminClient();
    await admin.from("integrations").upsert(
      {
        business_id: businessId,
        provider: "google_calendar",
        status: "connected",
        external_account_id: profile.data.email || null,
        connected_at: new Date().toISOString(),
        metadata: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          calendar_id: "primary",
        },
      },
      { onConflict: "business_id,provider" }
    );

    integrationsUrl.searchParams.set("calendar_connected", "1");
    return NextResponse.redirect(integrationsUrl);
  } catch (err) {
    console.error("Google Calendar OAuth callback failed:", err);
    integrationsUrl.searchParams.set("calendar_error", "exchange_failed");
    return NextResponse.redirect(integrationsUrl);
  }
}
