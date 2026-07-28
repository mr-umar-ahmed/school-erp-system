import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` runs during the build on hosts (Vercel) where the real
// DATABASE_URL may not be present yet — it never connects, so a placeholder
// keeps the build green. Migrations and runtime still require the real URL.
const url =
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
