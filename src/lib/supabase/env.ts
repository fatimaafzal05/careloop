// These are browser-safe Supabase project identifiers, not privileged secrets.
// Deployment environment variables always take precedence, so forks and custom
// deployments can point to their own project without changing application code.
const managedPublicConfig = {
  url: "https://tcujkjrewxaisuoptbrf.supabase.co",
  key: "sb_publishable_wt6Eb_rmNTVEJOOhBQg-6g_Jo6g6RVS",
};

export function hasSupabaseEnv() {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? managedPublicConfig.url) &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? managedPublicConfig.key),
  );
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? managedPublicConfig.url;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? managedPublicConfig.key;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return { url, key };
}
