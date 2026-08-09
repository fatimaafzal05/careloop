import { DocumentsWorkspace } from "@/components/documents-workspace";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentsPage() {
  await requireUser(); const supabase = await createClient();
  const { data: membership } = await supabase.from("household_members").select("household_id").limit(1).maybeSingle();
  if (!membership) return <DocumentsWorkspace householdId={null} members={[]} documents={[]} caregivers={[]}/>;
  const [{ data: members }, { data: documents }, { data: caregivers }] = await Promise.all([
    supabase.from("family_members").select("id, full_name").eq("household_id", membership.household_id),
    supabase.from("documents").select("id, title, category, storage_path, mime_type, byte_size, document_date, is_archived, family_members(full_name)").eq("household_id", membership.household_id).order("created_at", { ascending: false }),
    supabase.from("caregiver_access").select("caregiver_id, profiles!caregiver_access_caregiver_id_fkey(display_name)").eq("household_id", membership.household_id).is("revoked_at", null),
  ]);
  return <DocumentsWorkspace householdId={membership.household_id} members={members ?? []} documents={documents ?? []} caregivers={caregivers ?? []}/>;
}
