import { redirect } from "next/navigation";

// Kept as a redirect so any previously-shared /policies link (e.g. in a
// Twilio A2P submission) still resolves — real content now lives at the
// dedicated /terms and /privacy URLs, which are easier for automated
// compliance reviewers to find and verify than a single combined page.
export default function PoliciesRedirect() {
  redirect("/terms");
}
