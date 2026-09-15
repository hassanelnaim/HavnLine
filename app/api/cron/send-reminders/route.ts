import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { smsClient } from "@/lib/integrations/sms";

export const dynamic = "force-dynamic";

/**
 * Sends "your appointment is tomorrow" reminder texts, once per day.
 * Runs on Vercel's free-tier-compatible once-daily cron schedule (see
 * vercel.json). "Tomorrow" is computed separately for EACH business
 * in that business's own real timezone, not the fixed UTC time the
 * cron itself fires at — those are two different things and shouldn't
 * be conflated.
 */
export async function GET(request: NextRequest) {
  // Vercel automatically sends this header on real cron invocations —
  // verifying it stops anyone else from triggering mass reminder
  // sends just by hitting this URL directly.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: businesses } = await admin.from("businesses").select("id, name, timezone");

  let remindersSent = 0;

  for (const business of businesses || []) {
    const tomorrowDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: business.timezone || "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));

    const { data: appointments } = await admin
      .from("appointments")
      .select("id, phone, customer_name, service_name, time")
      .eq("business_id", business.id)
      .eq("date", tomorrowDateStr)
      .eq("status", "confirmed")
      .eq("sms_consent", true)
      .is("reminder_sent_at", null);

    for (const appt of appointments || []) {
      const smsBody = `Reminder: you have an appointment at ${business.name} tomorrow for ${appt.service_name} at ${appt.time}. Reply STOP to opt out.`;
      const result = await smsClient.send(business.id, appt.phone, smsBody);
      if (result.sent) {
        await admin.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", appt.id);
        remindersSent++;
      }
    }
  }

  return NextResponse.json({ success: true, remindersSent });
}
