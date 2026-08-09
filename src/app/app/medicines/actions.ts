"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MedicineState = { error?: string; message?: string };

async function context() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) throw new Error("Please sign in again.");
  const { data: membership } = await supabase.from("household_members").select("household_id").limit(1).maybeSingle();
  if (!membership) throw new Error("Create a household before adding medicines.");
  return { supabase, householdId: membership.household_id, userId };
}

export async function addMedicine(_: MedicineState, formData: FormData): Promise<MedicineState> {
  const parsed = z.object({
    family_member_id: z.uuid(), name: z.string().trim().min(1).max(160), dosage: z.string().trim().min(1).max(120),
    form: z.string().trim().max(80).optional(), times: z.string().trim().min(1).max(200), meal_instruction: z.string().trim().max(300).optional(),
    start_date: z.string().optional(), end_date: z.string().optional(), refill_date: z.string().optional(), notes: z.string().trim().max(4000).optional(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Provide a family member, medicine name, dose, and at least one daily time." };
  try {
    const { supabase, householdId, userId } = await context();
    const times = parsed.data.times.split(",").map(value => value.trim()).filter(Boolean);
    if (times.some(time => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) return { error: "Use 24-hour times, for example 09:00 or 20:30." };
    const { error } = await supabase.from("medications").insert({ household_id: householdId, family_member_id: parsed.data.family_member_id, name: parsed.data.name, dosage: parsed.data.dosage, form: parsed.data.form || null, schedule: { times, frequency: "daily" }, meal_instruction: parsed.data.meal_instruction || null, start_date: parsed.data.start_date || null, end_date: parsed.data.end_date || null, refill_date: parsed.data.refill_date || null, notes: parsed.data.notes || null, created_by: userId });
    if (error) return { error: "We couldn’t save this medicine. Check your access and try again." };
    revalidatePath("/app/medicines"); revalidatePath("/app");
    return { message: "Medicine added to the schedule." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to add medicine." }; }
}

export async function logMedicine(_: MedicineState, formData: FormData): Promise<MedicineState> {
  const parsed = z.object({ medication_id: z.uuid(), status: z.enum(["taken", "skipped", "snoozed"]), scheduled_for: z.string().datetime() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid dose log." };
  try {
    const { supabase, householdId, userId } = await context();
    const { error } = await supabase.from("medication_logs").upsert({ medication_id: parsed.data.medication_id, household_id: householdId, scheduled_for: parsed.data.scheduled_for, status: parsed.data.status, recorded_by: userId }, { onConflict: "medication_id,scheduled_for" });
    if (error) return { error: "We couldn’t record this dose. Check your caregiver permission." };
    revalidatePath("/app/medicines"); revalidatePath("/app");
    return { message: parsed.data.status === "taken" ? "Dose marked as taken." : `Dose marked as ${parsed.data.status}.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to log this dose." }; }
}

export async function updateReminderPreferences(_: MedicineState, formData: FormData): Promise<MedicineState> {
  try {
    const { supabase, userId } = await context();
    const { error } = await supabase.from("notification_preferences").upsert({ user_id: userId, medication_reminders: formData.get("medication_reminders") === "on", refill_alerts: formData.get("refill_alerts") === "on", timezone: String(formData.get("timezone") || "UTC") });
    if (error) return { error: "Reminder preferences could not be saved." };
    revalidatePath("/app/medicines");
    return { message: "Reminder preferences saved." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to save preferences." }; }
}
