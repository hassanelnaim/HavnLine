"use server";

import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SubmitReviewResult {
  success: boolean;
  error?: string;
}

export async function submitReviewAction(input: {
  businessName: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
}): Promise<SubmitReviewResult> {
  if (!isSupabaseConfigured()) return { success: true };

  if (!input.businessName.trim() || !input.reviewerName.trim() || !input.reviewText.trim()) {
    return { success: false, error: "All fields are required." };
  }
  if (input.rating < 1 || input.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("reviews").insert({
    business_name: input.businessName,
    reviewer_name: input.reviewerName,
    rating: input.rating,
    review_text: input.reviewText,
    status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
