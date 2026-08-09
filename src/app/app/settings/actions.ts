"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { error?: string; message?: string };
export const initialSettingsState: SettingsState = {};

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Please sign in again.");
  return { supabase, userId };
}

export async function updateProfile(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const parsed = z.object({ display_name: z.string().trim().min(2).max(120), timezone: z.string().trim().min(1).max(80) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a name and time zone." };
  try {
    const { supabase, userId } = await currentUserId();
    const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
    if (error) return { error: "Profile details could not be saved." };
    revalidatePath("/app/settings"); revalidatePath("/app");
    return { message: "Profile details saved." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to save profile." }; }
}

export async function updateNotifications(_: SettingsState, formData: FormData): Promise<SettingsState> {
  try {
    const { supabase, userId } = await currentUserId();
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: userId,
      medication_reminders: formData.get("medication_reminders") === "on",
      refill_alerts: formData.get("refill_alerts") === "on",
      appointment_reminders: formData.get("appointment_reminders") === "on",
      timezone: String(formData.get("timezone") || "UTC"),
    });
    if (error) return { error: "Notification preferences could not be saved." };
    revalidatePath("/app/settings"); revalidatePath("/app/medicines");
    return { message: "Notification preferences saved." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to save preferences." }; }
}
