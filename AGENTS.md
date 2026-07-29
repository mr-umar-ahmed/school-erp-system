<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — EduNexus School ERP

Context file for AI coding agents working in this repository. Read this
before making any changes.

## What we are building

**EduNexus** is a production-grade, multi-role **School/Educational Institute
ERP** delivered as an installable **Progressive Web App**. It is a real
product intended to be demoed to and deployed at real schools — not a toy.

Five user roles, each with their own dashboard area and permissions:

| Role | Area | What they do |
|---|---|---|
| Super Admin / Admin / Staff | `/admin` | Run the school: students, teachers, staff, attendance, timetable, exams, fees, communication, HR/payroll, transport, library, hostel, inventory, visitors, reports, settings |
| Teacher | `/teacher` | Take attendance, create/grade assignments, enter exam marks (gradebook), view timetable, request leave, message parents |
| Student | `/student` | View timetable, attendance calendar, submit assignments, see published results, fees, library, transport, announcements |
| Parent | `/parent` | Per-child view of attendance, results, fees (with demo "Pay Now"), transport, messaging teachers |

Demo tenant: **Green Valley International School** (seeded — 500 students,
300 parents, 30 teachers, 10 staff, Classes 1–10 × sections A/B/C).

## Hard rules (non-negotiable)

1. **No paid APIs or SaaS, ever.** Everything must be free, open-source, or
   self-hostable. No Resend, Sentry, paid LLM APIs, etc. (This project
   deliberately swapped the original Supabase-based spec for a self-hosted
   stack.)
   - **Managed PostgreSQL is allowed as a host** (Supabase, Neon, Vercel
     Postgres free tiers) — it is still plain Postgres behind `DATABASE_URL`.
     What stays banned is adopting a vendor's *SDK or auth*: never add
     `@supabase/supabase-js`/`@supabase/ssr`. Auth is ours (`lib/auth/*`) and
     data access is Prisma. See `DEPLOYMENT.md`.
2. **TypeScript strict, zero `any`.**
3. **Authorization on the server, always.** Every server action and query
   must call `requireRole(...)`/`requireUser()` from `lib/auth/dal.ts` and
   scope queries by `institutionScope(user)`. App-level checks replace RLS.
   A student must never see admin data; a parent only their linked children.
4. **Design language is fixed:** mint-green glassmorphism (see
   `app/globals.css`). Use the shared components (`GlassmorphicCard`,
   `ModuleIcon`, `StatCard`, `DataTable`, `EmptyState`, ...) rather than
   inventing new card/table styles. Rounded-full buttons, `rounded-3xl`
   cards, Framer Motion micro-animations.
   - **Three navigation tiers:** below `md` a hamburger drawer plus the bottom
     tab bar; `md`–`lg` a 72px icon sidebar rail (labels hidden via
     `hidden lg:block`, no hamburger, no bottom nav); `lg`+ the full 16rem
     sidebar with the collapse toggle. Two-pane page layouts split at `lg`
     (`lg:grid-cols-3` + `lg:col-span-2`) and stack below it.
5. **Never commit `.env`** (holds `AUTH_SECRET` and DB password). It is
   gitignored — keep it that way.
6. After each completed milestone: commit with a descriptive message and
   push to `origin main` (https://github.com/mr-umar-ahmed/school-erp-system).

## Tech stack

- **Next.js 16** App Router, React Server Components + Server Actions.
  Route guard lives in **`proxy.ts`** (Next 16's rename of middleware.ts).
- **Prisma 7** + **local PostgreSQL 16** via `@prisma/adapter-pg`.
  - Connection URL lives in `prisma.config.ts` (not in schema.prisma).
  - Generated client output: `lib/generated/prisma` (gitignored; run
    `pnpm prisma generate` after pulling schema changes).
- **Auth:** custom — bcryptjs password hashes, jose-signed JWT session in an
  httpOnly cookie (`lib/auth/*`). No auth provider.
- **UI:** Tailwind CSS v4 + shadcn/ui (`components/ui`), Lucide icons,
  Framer Motion, Recharts for charts, Zustand for client state,
  React Hook Form + Zod v4 for forms.
- **PWA:** `app/manifest.ts`, custom `public/sw.js`, install banner,
  `/offline` fallback. **The service worker registers in production builds
  only** — in dev its cache-first strategy serves stale chunks. Because
  Chromium requires a live service worker before it fires
  `beforeinstallprompt`, **installing is impossible under `pnpm dev`**;
  `useInstallPrompt` detects that and the UI falls back to manual
  instructions naming the missing prerequisite.
- **File uploads:** PDFs/images stored as `bytea` in `StoredFile`, uploaded
  via `POST /api/files` and served by `GET /api/files/[id]` (session +
  institution checked on every read). Client control is
  `components/forms/file-upload.tsx` (includes camera capture); render with
  `components/shared/attachment-list.tsx`. Attachment URLs coming from a
  client must always be revalidated with `verifyOwnAttachments()` from
  `lib/attachments.ts` before being persisted.
- **Spreadsheets:** `exceljs` (declared in `serverExternalPackages`).
  `lib/spreadsheet.ts` parses and builds templates; import actions live in
  `features/import/actions.ts`; templates are served from
  `/api/templates/[kind]`.
- **Email:** stubbed to server console in `lib/email.ts` (swap for SMTP in
  production).

## Repository layout

```
app/(auth)/         login, register, forgot-password
app/(onboarding)/   welcome → features → role-select flow
app/(dashboard)/    admin/, teacher/, student/, parent/ areas + shared layout
app/offline/        PWA offline fallback
components/ui/      shadcn primitives (generated — light edits only)
components/shared/  design-system components (glass cards, tables, charts...)
components/layout/  sidebar, header, bottom-nav, breadcrumbs
components/forms/   client form components (RHF + Zod or controlled state)
components/dashboard/  chart + widget components
features/<module>/  actions.ts (server actions) and queries.ts per module
lib/auth/           token/session/password/dal (authorization core)
lib/validations/    zod schemas shared client + server
lib/navigation.ts   role-aware nav config (sidebar + bottom nav)
prisma/             schema.prisma, migrations, seed.ts
scripts/            generate-icons.mjs (PWA icon set via sharp)
```

Pattern for a new feature: zod schema in `lib/validations/` → server action
in `features/<module>/actions.ts` (role check + institution scoping + zod
parse + `revalidatePath`) → server page fetching via Prisma → small client
components for interactivity. Serialize Decimals with `Number()` and dates
with `.toISOString()` before passing to client components.

## Commands

```bash
pnpm dev                 # dev server (localhost:3000)
pnpm build && pnpm start # production build (required to test PWA/SW)
pnpm exec tsc --noEmit   # typecheck
pnpm prisma migrate dev  # create/apply migrations
pnpm prisma db seed      # reseed demo data (destructive — wipes tables)
node scripts/generate-icons.mjs  # regenerate PWA icons
```

Demo logins (password pattern `<Role>@123`): `admin@edunexus.app`,
`sarah.johnson@edu.app`, `alex.kumar@edu.app`, `rajesh.kumar@edu.app`,
`priya.staff@edu.app`.

## Machine / environment quirks (this dev machine)

- **Docker does not work here.** PostgreSQL runs from a portable install at
  `%LOCALAPPDATA%\school-erp` (`pg_ctl start -D %LOCALAPPDATA%\school-erp\pgdata`),
  superuser `erp` / `erp_dev_password`, database `edunexus`. Never suggest
  `docker compose up` for local work.
- **Stop dev/prod servers before `pnpm build`** — Windows file locks make
  builds hang otherwise.
- Times of day are stored as `"HH:mm"` strings; date-only values use
  `@db.Date` at UTC midnight.
- Lucide icon components cannot cross the RSC boundary as props — pass icon
  *names* and resolve via `components/shared/icon-map.ts`.
- Zod v4 `z.coerce` breaks React Hook Form resolver types — use plain types
  plus `setValueAs` in the form instead.

## Known gaps / future work

- Payments are demo-only (`payFeeOnline` just records the payment) —
  Razorpay/Stripe integration would go in `features/fees/actions.ts`.
- PDF export = browser print dialog; a Playwright/Puppeteer render pipeline
  is the intended upgrade.
- Attachments live in Postgres (`bytea`), which is fine for a demo but will
  exhaust a 500MB free tier at scale — moving them to MinIO/Supabase Storage
  only requires changing `lib/uploads.ts` and `app/api/files/*`.
- Avatar upload still isn't wired (`avatarUrl` is unused); the `FileUpload`
  component is ready for it.
- Push notifications: service worker handlers exist; no web-push sender yet.
- Offline support is deliberately limited to the app shell and `/offline`:
  dashboard HTML is per-user, so the service worker never caches navigations
  and sign-out purges every cache. Restoring offline reads of real data needs
  a per-user cache partition, not a wider cache.
