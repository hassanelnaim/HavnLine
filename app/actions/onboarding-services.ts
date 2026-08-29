"use server";

import { fetchWebsiteText, extractServicesFromText } from "@/lib/ai/websiteImport";

export interface ImportOnboardingServicesResult {
  success: boolean;
  error?: string;
  services?: { name: string; description: string; priceDollars: string; durationMinutes: number }[];
}

/**
 * Used on the onboarding "What do you offer?" step — reads the
 * business's real website and returns a structured list of services
 * for the owner to review/edit, instead of typing each one by hand.
 * Doesn't save anything itself — the caller merges the results into
 * the onboarding draft, same as manually-typed services, and they're
 * saved for real when onboarding completes.
 */
export async function importOnboardingServicesAction(
  url: string,
  businessName: string
): Promise<ImportOnboardingServicesResult> {
  if (!url.trim()) {
    return { success: false, error: "Enter a website URL first." };
  }

  let websiteText: string;
  try {
    websiteText = await fetchWebsiteText(url);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not read that website." };
  }

  let services;
  try {
    services = await extractServicesFromText(businessName || "this business", websiteText);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not process that website." };
  }

  if (services.length === 0) {
    return {
      success: false,
      error: "Couldn't find any services on that page — try a Services or Pricing page specifically, or add them manually below.",
    };
  }

  return { success: true, services };
}
