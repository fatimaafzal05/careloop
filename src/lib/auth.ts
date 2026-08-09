import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "./supabase/env";
import { createClient } from "./supabase/server";

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app");
  return user;
}
