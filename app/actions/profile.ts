"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "./business";

export async function updateProfileNameAction(fullName: string): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return { success: false, error: "You need to be logged in." };

  const { error: authError } = await supabase.auth.updateUser({ data: { full_name: fullName } });
  if (authError) return { success: false, error: authError.message };

  const admin = createAdminClient();
  await admin.from("users").upsert({ id: user.id, email: user.email || "", full_name: fullName }, { onConflict: "id" });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateEmailAction(newEmail: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePasswordAction(newPassword: string): Promise<ActionResult> {
  if (newPassword.length < 8) return { success: false, error: "Password must be at least 8 characters." };
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
