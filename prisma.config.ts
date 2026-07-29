import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` runs during the build on hosts (Vercel) where the real
// DATABASE_URL may not be present yet — it never connects, so a placeholder
// keeps the build green. Migrations and runtime still require the real URL.
//
// Managed Postgres (Supabase, Neon, ...) puts a connection pooler in front of
// the database. The pooler is right for the app at runtime but cannot run
// schema migrations, so DIRECT_URL — the unpooled 5432 connection — is used
// here when it is set. Locally neither is set and both are the same server.
const url =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url },
});
