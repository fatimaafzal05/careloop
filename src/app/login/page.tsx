import { AuthCard } from "@/components/auth-card";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthCard mode="login" next={next ?? "/app"} />;
}
