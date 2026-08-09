"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };
const emailSchema = z.email("Enter a valid email address.").trim().toLowerCase();
const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .regex(/[A-Za-z]/, "Include a letter.")
  .regex(/[0-9]/, "Include a number.");

function configurationError() {
  return { error: "CareLoop is not connected to Supabase yet. Add the required environment variables." };
}

async function siteUrl() {
  const headersList = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? headersList.get("origin") ?? "http://localhost:3000";
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!hasSupabaseEnv()) return configurationError();
  const parsed = z.object({
    name: z.string().trim().min(2, "Enter your name.").max(120),
    email: emailSchema,
    password: passwordSchema,
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=/app`,
    },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/app");
  return { message: "Check your email to verify your CareLoop account." };
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!hasSupabaseEnv()) return configurationError();
  const parsed = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "We couldn't sign you in with those details." };
  const next = String(formData.get("next") ?? "/app");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/app");
}

export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!hasSupabaseEnv()) return configurationError();
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteUrl()}/reset-password`,
  });
  if (error) return { error: "We couldn't start the password reset. Please try again." };
  return { message: "If an account exists, password-reset instructions are on their way." };
}

export async function updatePassword(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!hasSupabaseEnv()) return configurationError();
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Choose a stronger password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: "Your password could not be updated. Request a new reset link and try again." };
  redirect("/app");
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestAccountDeletion(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!hasSupabaseEnv()) return configurationError();
  const reason = z.string().trim().max(1000).optional().safeParse(formData.get("reason") || undefined);
  if (!reason.success) return { error: "Please keep the request under 1,000 characters." };
  const supabase = await createClient();
  const { error } = await supabase.from("account_deletion_requests").insert({ reason: reason.data ?? null });
  if (error) return { error: "Your request could not be saved. Please try again." };
  return { message: "Your account-deletion request has been recorded." };
}
