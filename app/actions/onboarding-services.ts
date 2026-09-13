"use server";

import { fetchWebsiteText, extractServicesFromText, extractServicesFromImage } from "@/lib/ai/websiteImport";

export interface ImportOnboardingServicesResult {
  success: boolean;
  error?: string;
  services?: { name: string; description: string; priceDollars: string; durationMinutes: number }[];
}

export async function importOnboardingServicesAction(url: string, businessName: string): Promise<ImportOnboardingServicesResult> {
  if (!url.trim()) return { success: false, error: "Enter a website URL first." };

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
    return { success: false, error: "Couldn't find any services on that page — try a Services or Pricing page specifically, or add them manually below." };
  }

  return { success: true, services };
}

export interface ImportFromImageResult {
  success: boolean;
  error?: string;
  services?: { name: string; description: string; priceDollars: string; durationMinutes: number }[];
}

/**
 * The photo equivalent of importOnboardingServicesAction — for
 * businesses with no website, or whose real service/price list only
 * exists as a physical menu, sign, or handwritten sheet.
 */
export async function importServicesFromImageAction(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  businessName: string
): Promise<ImportFromImageResult> {
  if (!imageBase64) return { success: false, error: "No photo provided." };

  let services;
  try {
    services = await extractServicesFromImage(businessName || "this business", imageBase64, mediaType);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Could not process that photo." };
  }

  if (services.length === 0) {
    return { success: false, error: "Couldn't clearly read any services or prices in that photo — try a clearer, well-lit picture, or add services manually below." };
  }

  return { success: true, services };
}
