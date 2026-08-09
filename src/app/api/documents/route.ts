import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const documentPayload = z.object({
  id: z.uuid(), familyMemberId: z.uuid(), category: z.enum(["prescription", "lab_report", "imaging", "vaccination", "insurance", "other"]),
  title: z.string().trim().min(1).max(200), storagePath: z.string().trim().min(1).max(1000), mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]), byteSize: z.number().int().positive().max(10485760), documentDate: z.string().date().optional(), clinicianName: z.string().trim().max(160).optional(), notes: z.string().trim().max(4000).optional(),
});

export async function POST(request: Request) {
  const parsed = documentPayload.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid document details." }, { status: 400 });
  const supabase = await createClient(); const { data: claims } = await supabase.auth.getClaims(); const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: membership } = await supabase.from("household_members").select("household_id").limit(1).maybeSingle();
  if (!membership || !parsed.data.storagePath.startsWith(`${membership.household_id}/${parsed.data.id}/`)) return NextResponse.json({ error: "Invalid document storage path." }, { status: 403 });
  const { error } = await supabase.from("documents").insert({ id: parsed.data.id, household_id: membership.household_id, family_member_id: parsed.data.familyMemberId, category: parsed.data.category, title: parsed.data.title, storage_path: parsed.data.storagePath, mime_type: parsed.data.mimeType, byte_size: parsed.data.byteSize, document_date: parsed.data.documentDate || null, clinician_name: parsed.data.clinicianName || null, notes: parsed.data.notes || null, created_by: userId });
  if (error) return NextResponse.json({ error: "Document metadata could not be saved." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id"); if (!id || !z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid document." }, { status: 400 });
  const supabase = await createClient(); const { data: document } = await supabase.from("documents").select("storage_path").eq("id", id).maybeSingle();
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const { error: storageError } = await supabase.storage.from("medical-records").remove([document.storage_path]);
  if (storageError) return NextResponse.json({ error: "File could not be deleted." }, { status: 400 });
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Document record could not be deleted." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const body = await request.json(); const id = z.uuid().safeParse(body.id); const archived = z.boolean().safeParse(body.archived);
  if (!id.success || !archived.success) return NextResponse.json({ error: "Invalid document update." }, { status: 400 });
  const supabase = await createClient(); const { error } = await supabase.from("documents").update({ is_archived: archived.data }).eq("id", id.data);
  if (error) return NextResponse.json({ error: "Document could not be updated." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
