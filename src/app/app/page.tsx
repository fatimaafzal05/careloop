import { CareLoopApp } from "@/components/careloop-app";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  return <CareLoopApp initialPage="dashboard" userName={profile?.display_name ?? user.email?.split("@")[0] ?? "there"} />;
}
