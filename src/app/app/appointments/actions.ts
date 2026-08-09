"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AppointmentState = { error?: string; message?: string };
export const initialAppointmentState: AppointmentState = {};

async function context() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) throw new Error("Please sign in again.");
  const { data: membership } = await supabase.from("household_members").select("household_id").limit(1).maybeSingle();
  if (!membership) throw new Error("Create a household before adding appointments.");
  return { supabase, householdId: membership.household_id, userId };
}

export async function addAppointment(_: AppointmentState, formData: FormData): Promise<AppointmentState> {
  const parsed = z.object({ family_member_id: z.uuid(), doctor_name: z.string().trim().max(160).optional(), specialty: z.string().trim().max(120).optional(), facility_name: z.string().trim().max(160).optional(), starts_at: z.string().datetime(), location: z.string().trim().max(300).optional(), purpose: z.string().trim().min(1).max(500), notes: z.string().trim().max(4000).optional(), follow_up_at: z.string().datetime().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choose a family member, date and time, and purpose for this appointment." };
  try {
    const { supabase, householdId, userId } = await context();
    const { error } = await supabase.from("appointments").insert({ household_id: householdId, ...parsed.data, doctor_name: parsed.data.doctor_name || null, specialty: parsed.data.specialty || null, facility_name: parsed.data.facility_name || null, location: parsed.data.location || null, notes: parsed.data.notes || null, follow_up_at: parsed.data.follow_up_at || null, created_by: userId });
    if (error) return { error: "We couldn’t save this appointment. Check your access and try again." };
    revalidatePath("/app/appointments"); revalidatePath("/app");
    return { message: "Appointment added to the calendar." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to add appointment." }; }
}

export async function addHealthEvent(_: AppointmentState, formData: FormData): Promise<AppointmentState> {
  const parsed = z.object({ family_member_id: z.uuid(), type: z.enum(["vaccination", "symptom", "health_note", "other"]), occurred_at: z.string().datetime(), title: z.string().trim().min(1).max(180), notes: z.string().trim().max(4000).optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choose a profile, event type, date, and title." };
  try {
    const { supabase, householdId, userId } = await context();
    const { error } = await supabase.from("health_events").insert({ household_id: householdId, ...parsed.data, notes: parsed.data.notes || null, created_by: userId });
    if (error) return { error: "We couldn’t add this timeline event. Check your access and try again." };
    revalidatePath("/app/appointments");
    return { message: "Timeline event added." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to add the event." }; }
}
