import { FamilyWorkspace } from "@/components/family-workspace";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function FamilyPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("household_members").select("household_id, role").limit(1).maybeSingle();
  if (!membership) return <FamilyWorkspace household={null} members={[]} caregivers={[]} activity={[]} />;
  const [{ data: household }, { data: members }, { data: caregivers }, { data: activity }] = await Promise.all([
    supabase.from("households").select("id, name").eq("id", membership.household_id).maybeSingle(),
    supabase.from("family_members").select("id, full_name, relationship, date_of_birth, blood_group, allergies, conditions").eq("household_id", membership.household_id).order("created_at"),
    supabase.from("caregiver_access").select("caregiver_id, permission, granted_at, profiles!caregiver_access_caregiver_id_fkey(display_name, email)").eq("household_id", membership.household_id).is("revoked_at", null),
    supabase.from("activity_log").select("id, action, occurred_at, details, profiles!activity_log_actor_id_fkey(display_name)").eq("household_id", membership.household_id).order("occurred_at", { ascending: false }).limit(8),
  ]);
  return <FamilyWorkspace household={household ?? null} members={members ?? []} caregivers={caregivers ?? []} activity={activity ?? []} />;
}
