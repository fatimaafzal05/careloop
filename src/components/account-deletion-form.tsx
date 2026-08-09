"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestAccountDeletion, type AuthState } from "@/app/auth/actions";

export function AccountDeletionForm() {
  const [state, action, pending] = useActionState(requestAccountDeletion, {} as AuthState);
  return <main className="mesh flex min-h-screen items-center justify-center p-4"><section className="soft-card w-full max-w-xl rounded-3xl border border-white bg-white p-6 sm:p-9"><Link href="/app" className="text-sm font-bold text-[#27815b]">← Back to CareLoop</Link><p className="mt-8 text-xs font-bold uppercase tracking-[.12em] text-[#b56148]">Account deletion</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#19332f]">Request account deletion</h1><p className="mt-3 text-sm leading-6 text-[#688077]">This creates a deletion request for review. It does not immediately delete your account or health records.</p><form action={action} className="mt-6 space-y-4"><label htmlFor="reason" className="block text-sm font-semibold text-[#25443d]">Reason (optional)</label><textarea id="reason" name="reason" maxLength={1000} rows={4} className="w-full rounded-xl border border-[#dce7df] p-3 text-sm outline-none focus:border-[#56a979] focus:ring-3 focus:ring-[#dff2e6]" placeholder="Tell us anything that would help us process your request." />{state.error && <p role="alert" className="rounded-xl bg-[#fff0ec] px-3 py-2.5 text-xs font-medium text-[#a14f3b]">{state.error}</p>}{state.message && <p role="status" className="rounded-xl bg-[#eaf6ed] px-3 py-2.5 text-xs font-medium text-[#23724e]">{state.message}</p>}<button type="submit" disabled={pending} className="rounded-xl bg-[#a6503d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Submitting…" : "Request account deletion"}</button></form></section></main>;
}
