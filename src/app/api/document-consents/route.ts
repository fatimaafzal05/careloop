import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const payload = z.object({ documentId: z.uuid(), caregiverId: z.uuid() });

export async function POST(request: Request) {
  const parsed = payload.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid consent request." }, { status: 400 });
  const supabase = await createClient(); const { data: claims } = await supabase.auth.getClaims(); const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { error } = await supabase.from("document_caregiver_consents").upsert({ document_id: parsed.data.documentId, caregiver_id: parsed.data.caregiverId, approved_by: userId, revoked_at: null }, { onConflict: "document_id,caregiver_id" });
  if (error) return NextResponse.json({ error: "Document consent could not be saved." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const parsed = payload.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid consent request." }, { status: 400 });
  const supabase = await createClient(); const { error } = await supabase.from("document_caregiver_consents").update({ revoked_at: new Date().toISOString() }).eq("document_id", parsed.data.documentId).eq("caregiver_id", parsed.data.caregiverId);
  if (error) return NextResponse.json({ error: "Document consent could not be revoked." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
