"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FamilyState = { error?: string; message?: string };
const text = (min: number, max: number) => z.string().trim().min(min).max(max);

async function currentHouseholdId() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("household_members").select("household_id").limit(1).maybeSingle();
  if (error || !data?.household_id) throw new Error("Create a household before managing family profiles.");
  return { supabase, householdId: data.household_id };
}

export async function createHousehold(_: FamilyState, formData: FormData): Promise<FamilyState> {
  const name = text(2, 120).safeParse(formData.get("name"));
  if (!name.success) return { error: "Enter a household name between 2 and 120 characters." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_household", { household_name: name.data });
  if (error) return { error: "We couldn’t create your household. Please try again." };
  revalidatePath("/app/family"); revalidatePath("/app");
  return { message: "Your household is ready." };
}

export async function addFamilyMember(_: FamilyState, formData: FormData): Promise<FamilyState> {
  const parsed = z.object({
    full_name: text(1, 160), relationship: text(1, 60), date_of_birth: z.string().optional(),
    blood_group: z.string().trim().max(10).optional(), allergies: z.string().trim().max(4000).optional(),
    conditions: z.string().trim().max(4000).optional(), insurance_notes: z.string().trim().max(4000).optional(),
    health_notes: z.string().trim().max(4000).optional(),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the family profile details." };
  try {
    const { supabase, householdId } = await currentHouseholdId();
    const { error } = await supabase.from("family_members").insert({
      household_id: householdId, ...parsed.data,
      date_of_birth: parsed.data.date_of_birth || null,
      blood_group: parsed.data.blood_group || null, allergies: parsed.data.allergies || null,
      conditions: parsed.data.conditions || null, insurance_notes: parsed.data.insurance_notes || null,
      health_notes: parsed.data.health_notes || null,
    });
    if (error) return { error: "We couldn’t save this profile. Please try again." };
    revalidatePath("/app/family");
    return { message: "Family profile added." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to save the profile." }; }
}

export async function inviteCaregiver(_: FamilyState, formData: FormData): Promise<FamilyState> {
  const parsed = z.object({
    email: z.email("Enter a valid email address.").trim().toLowerCase(),
    permission: z.enum(["view", "medicines", "appointments", "emergency", "full"]),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the invitation details." };
  try {
    const { supabase, householdId } = await currentHouseholdId();
    const { error } = await supabase.rpc("invite_registered_caregiver", {
      target_household: householdId, recipient_email: parsed.data.email, requested_permission: parsed.data.permission,
    });
    if (error) return { error: error.message.includes("registered") ? "That person needs a registered CareLoop account before you can invite them." : "We couldn’t send this invitation." };
    revalidatePath("/app/family");
    return { message: "Caregiver invitation sent." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to send the invitation." }; }
}

export async function revokeCaregiver(_: FamilyState, formData: FormData): Promise<FamilyState> {
  const caregiverId = z.uuid().safeParse(formData.get("caregiver_id"));
  if (!caregiverId.success) return { error: "Invalid caregiver." };
  try {
    const { supabase, householdId } = await currentHouseholdId();
    const { error } = await supabase.rpc("revoke_caregiver", { target_household: householdId, target_caregiver: caregiverId.data });
    if (error) return { error: "We couldn’t revoke access. Please try again." };
    revalidatePath("/app/family");
    return { message: "Caregiver access revoked." };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to revoke access." }; }
}
