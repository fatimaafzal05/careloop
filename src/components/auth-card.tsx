"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword, type AuthState } from "@/app/auth/actions";

type Mode = "login" | "signup" | "forgot" | "reset";
const initialState: AuthState = {};

const content: Record<Mode, { eyebrow: string; title: string; description: string; submit: string }> = {
  login: { eyebrow: "Welcome back", title: "Sign in to CareLoop", description: "Your private family-care space is waiting.", submit: "Sign in" },
  signup: { eyebrow: "Start your family’s care space", title: "Create your CareLoop", description: "A calm, shared place for the health details that matter.", submit: "Create account" },
  forgot: { eyebrow: "Password reset", title: "Restore your access", description: "We’ll send a secure reset link if an account exists for this email.", submit: "Send reset link" },
  reset: { eyebrow: "Choose a new password", title: "Set a secure password", description: "Use a unique password with at least 12 characters, including a letter and a number.", submit: "Update password" },
};

export function AuthCard({ mode, next = "/app" }: { mode: Mode; next?: string }) {
  const action = mode === "login" ? signIn : mode === "signup" ? signUp : mode === "forgot" ? requestPasswordReset : updatePassword;
  const [state, formAction, pending] = useActionState(action, initialState);
  const copy = content[mode];

  return <main className="mesh flex min-h-screen items-center justify-center p-4">
    <div className="soft-card w-full max-w-[440px] rounded-[28px] border border-white bg-white p-6 sm:p-9">
      <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#19332f]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#d8f0df] text-[#167052]">♥</span>careloop</Link>
      <div className="mb-7 mt-8"><p className="text-sm font-semibold text-[#27815b]">{copy.eyebrow}</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-[#19332f]">{copy.title}</h1><p className="mt-2 text-sm leading-6 text-[#688077]">{copy.description}</p></div>
      <form action={formAction} className="space-y-4">
        {mode === "signup" && <FormField label="Your name" name="name" placeholder="Ayesha Khan" autoComplete="name" />}
        {mode !== "reset" && <FormField label="Email address" name="email" placeholder="you@example.com" type="email" autoComplete="email" />}
        {(mode === "login" || mode === "signup" || mode === "reset") && <FormField label={mode === "reset" ? "New password" : "Password"} name="password" placeholder={mode === "reset" ? "At least 12 characters" : "Enter your password"} type="password" autoComplete={mode === "signup" || mode === "reset" ? "new-password" : "current-password"} />}
        {mode === "signup" && <label className="flex items-start gap-2 text-xs leading-5 text-[#688077]"><input required name="terms" type="checkbox" className="mt-0.5 h-4 w-4 accent-[#27815b]"/>I agree to the Terms and understand CareLoop is not medical advice.</label>}
        {mode === "login" && <input type="hidden" name="next" value={next} />}
        {state.error && <p role="alert" className="rounded-xl bg-[#fff0ec] px-3 py-2.5 text-xs font-medium text-[#a14f3b]">{state.error}</p>}
        {state.message && <p role="status" className="rounded-xl bg-[#eaf6ed] px-3 py-2.5 text-xs font-medium text-[#23724e]">{state.message}</p>}
        <button disabled={pending} type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-[#1b7152] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(27,113,82,.18)] transition hover:bg-[#155c43] disabled:cursor-wait disabled:opacity-70">{pending ? "Please wait…" : copy.submit}</button>
      </form>
      {mode === "login" && <Link href="/forgot-password" className="mt-4 inline-block text-xs font-semibold text-[#27815b]">Forgot your password?</Link>}
      {mode === "login" && <p className="mt-7 text-center text-sm text-[#688077]">New to CareLoop? <Link href="/signup" className="font-bold text-[#27815b]">Create an account</Link></p>}
      {mode === "signup" && <p className="mt-7 text-center text-sm text-[#688077]">Already have an account? <Link href="/login" className="font-bold text-[#27815b]">Sign in</Link></p>}
      {(mode === "forgot" || mode === "reset") && <p className="mt-7 text-center text-sm text-[#688077]"><Link href="/login" className="font-bold text-[#27815b]">Back to sign in</Link></p>}
      <p className="mt-6 rounded-xl bg-[#f5f8f5] p-3 text-[11px] leading-5 text-[#71877f]">Your credentials are handled by Supabase Auth. Do not enter real health information until your project is configured and reviewed.</p>
    </div>
  </main>;
}

function FormField({ label, name, placeholder, type = "text", autoComplete }: { label: string; name: string; placeholder: string; type?: string; autoComplete?: string }) {
  return <div><label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-[#25443d]">{label}</label><input id={name} name={name} required type={type} placeholder={placeholder} autoComplete={autoComplete} className="w-full rounded-xl border border-[#dce7df] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#9aaca5] focus:border-[#56a979] focus:ring-3 focus:ring-[#dff2e6]" /></div>;
}
