import { AppointmentsWorkspace } from "@/components/appointments-workspace";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppointmentsPage() {
  await requireUser(); const supabase = await createClient();
  const { data: membership } = await supabase.from("household_members").select("household_id").limit(1).maybeSingle();
  if (!membership) return <AppointmentsWorkspace members={[]} appointments={[]} events={[]}/>;
  const [{ data: members }, { data: appointments }, { data: events }] = await Promise.all([
    supabase.from("family_members").select("id, full_name").eq("household_id", membership.household_id),
    supabase.from("appointments").select("id, starts_at, doctor_name, specialty, facility_name, purpose, follow_up_at, status, family_members(full_name)").eq("household_id", membership.household_id).order("starts_at"),
    supabase.from("health_events").select("id, occurred_at, title, type, notes, family_members(full_name)").eq("household_id", membership.household_id).order("occurred_at", { ascending: false }).limit(50),
  ]);
  return <AppointmentsWorkspace members={members ?? []} appointments={appointments ?? []} events={events ?? []}/>;
}
