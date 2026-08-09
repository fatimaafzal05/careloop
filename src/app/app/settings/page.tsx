import { SettingsWorkspace } from "@/components/settings-workspace";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, { data: preferences }] = await Promise.all([
    supabase.from("profiles").select("display_name, email, timezone").eq("id", user.id).maybeSingle(),
    supabase.from("notification_preferences").select("medication_reminders, refill_alerts, appointment_reminders, timezone").eq("user_id", user.id).maybeSingle(),
  ]);
  return <SettingsWorkspace profile={profile ?? { display_name: user.email?.split("@")[0] ?? "CareLoop member", email: user.email, timezone: "UTC" }} preferences={preferences ?? null} />;
}
