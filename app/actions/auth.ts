"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const NOT_CONFIGURED_MESSAGE =
  "Supabase isn't connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env to enable real accounts.";

export async function signUpAction(formData: FormData) {
  const fullName = String(formData.get("fullName") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!isSupabaseConfigured()) {
    redirect(`/signup?error=${encodeURIComponent(NOT_CONFIGURED_MESSAGE)}`);
  }
  if (!email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Email and password are required.")}`);
  }

  const supabase = createClient();

  // Critical: if there's already an active session (e.g. testing a
  // second business while still logged into the first), sign it out
  // BEFORE creating the new account. Without this, Supabase can create
  // the new user for real but leave the browser's session cookie
  // pointed at the OLD account — meaning everything done afterward
  // (onboarding, business creation) gets silently attributed to
  // whoever was already logged in, not the new signup. This is exactly
  // what caused two different test businesses to end up linked to the
  // same account despite using two different emails.
  await supabase.auth.signOut();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding");
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!isSupabaseConfigured()) {
    redirect(`/login?error=${encodeURIComponent(NOT_CONFIGURED_MESSAGE)}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "");

  if (!isSupabaseConfigured()) {
    redirect(`/forgot-password?error=${encodeURIComponent(NOT_CONFIGURED_MESSAGE)}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
      : undefined,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/forgot-password?sent=1`);
}
