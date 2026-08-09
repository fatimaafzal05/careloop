import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const required = [
  "supabase/migrations/20260809190000_phase_2_foundation.sql",
  "supabase/migrations/20260809260000_phase_9_privacy_admin.sql",
  "src/app/api/ai/process/route.ts",
  "src/app/emergency/[token]/page.tsx",
  "src/app/api/privacy/export/route.ts",
  "SUPABASE_SETUP.md",
  ".env.example",
];
const failures = required.filter((file) => !existsSync(resolve(root, file))).map((file) => `Missing required release file: ${file}`);
for (const file of ["src/components/ai-workspace.tsx", "src/app/emergency/[token]/page.tsx", "next.config.ts"]) {
  const text = readFileSync(resolve(root, file), "utf8");
  if (file.includes("ai") && !text.includes("not medical advice")) failures.push("AI disclaimer is missing.");
  if (file.includes("emergency") && !text.includes("does not provide medical advice")) failures.push("Public emergency-card disclaimer is missing.");
  if (file === "next.config.ts" && !text.includes("Content-Security-Policy")) failures.push("Security headers are missing.");
}
const env = readFileSync(resolve(root, ".env.example"), "utf8");
if (env.includes("SERVICE_ROLE")) failures.push("Service-role key must not appear in browser environment template.");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Release static checks passed.");
