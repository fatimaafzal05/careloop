import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/app";
  if (!url || !key) return NextResponse.redirect(new URL("/login?error=configuration", request.url));

  const response = NextResponse.redirect(new URL(safeNext, request.url));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const code = request.nextUrl.searchParams.get("code");
  if (code) await supabase.auth.exchangeCodeForSession(code);
  return response;
}
