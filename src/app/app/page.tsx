import { AppDashboard } from "@/components/app-dashboard";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: membership } = await supabase.from("household_members").select("household_id").limit(1).maybeSingle();
  const householdId = membership?.household_id;
  const [{ data: profile }, { data: household }, { count: memberCount }, { count: medicineCount }, { count: documentCount }, { data: upcomingAppointments }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    householdId ? supabase.from("households").select("name").eq("id", householdId).maybeSingle() : Promise.resolve({ data: null }),
    householdId ? supabase.from("family_members").select("id", { count: "exact", head: true }).eq("household_id", householdId) : Promise.resolve({ count: 0 }),
    householdId ? supabase.from("medications").select("id", { count: "exact", head: true }).eq("household_id", householdId).eq("is_archived", false) : Promise.resolve({ count: 0 }),
    householdId ? supabase.from("documents").select("id", { count: "exact", head: true }).eq("household_id", householdId).eq("is_archived", false) : Promise.resolve({ count: 0 }),
    householdId ? supabase.from("appointments").select("id, starts_at, purpose, doctor_name, family_members(full_name)").eq("household_id", householdId).gte("starts_at", new Date().toISOString()).order("starts_at").limit(3) : Promise.resolve({ data: [] }),
  ]);
  return <AppDashboard userName={profile?.display_name ?? user.email?.split("@")[0] ?? "there"} household={household ?? null} memberCount={memberCount ?? 0} medicineCount={medicineCount ?? 0} documentCount={documentCount ?? 0} upcomingAppointments={upcomingAppointments ?? []} />;
}
