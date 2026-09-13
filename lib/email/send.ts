/**
 * Real email sending via Resend. If RESEND_API_KEY isn't configured,
 * every function here quietly no-ops rather than throwing — a
 * business owner's notification preferences still save correctly
 * either way, but actual delivery only happens once a real provider
 * is connected. This follows the same "never fake a working
 * integration" rule as the rest of the platform.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.NOTIFICATION_FROM_EMAIL || "HavnLine <notifications@havnline.com>";

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured — skipping email send:", subject);
    return { success: false, error: "Email provider not configured." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { success: false, error: `Resend API error: ${body}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown email error." };
  }
}

export async function sendEscalationEmail(ownerEmail: string, businessName: string, callerName: string, reason: string, summary: string): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2 style="color: #0B1220;">A caller needs your attention</h2>
      <p><strong>${businessName}</strong> — your AI receptionist escalated a call it couldn't fully resolve.</p>
      <p><strong>Caller:</strong> ${callerName || "Unknown"}<br/>
      <strong>Reason:</strong> ${reason}<br/>
      <strong>Summary:</strong> ${summary}</p>
      <p style="color: #5B6472; font-size: 13px;">Log in to HavnLine to see the full call details.</p>
    </div>
  `;
  const result = await sendEmail(ownerEmail, `Action needed: ${businessName} call escalated`, html);
  if (!result.success) console.error("Failed to send escalation email:", result.error);
}
