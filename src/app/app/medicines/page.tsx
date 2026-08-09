import { MedicineWorkspace } from "@/components/medicine-workspace";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function MedicinesPage() {
  const user = await requireUser(); const supabase = await createClient();
  const { data: membership } = await supabase.from("household_members").select("household_id").limit(1).maybeSingle();
  if (!membership) return <MedicineWorkspace members={[]} medicines={[]} logs={[]} preferences={null}/>;
  const [{ data: members }, { data: medicines }, { data: logs }, { data: preferences }] = await Promise.all([
    supabase.from("family_members").select("id, full_name").eq("household_id", membership.household_id),
    supabase.from("medications").select("id, name, dosage, form, refill_date, schedule, family_members(full_name)").eq("household_id", membership.household_id).eq("is_archived", false).eq("is_paused", false),
    supabase.from("medication_logs").select("medication_id, scheduled_for, status").eq("household_id", membership.household_id).limit(500),
    supabase.from("notification_preferences").select("medication_reminders, refill_alerts, timezone").eq("user_id", user.id).maybeSingle(),
  ]);
  return <MedicineWorkspace members={members ?? []} medicines={medicines ?? []} logs={logs ?? []} preferences={preferences ?? null}/>;
}
