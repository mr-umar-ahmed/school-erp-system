# 🏫 EduNexus — School ERP (PWA)

A production-grade, installable School/Educational Institute ERP built as a
Progressive Web App. Five roles — Super Admin, Admin/Staff, Teacher, Student,
Parent — each with their own dashboard and modules, wrapped in a mint-green
glassmorphism design system.

> **Self-hosted by design.** This build intentionally uses no paid SaaS:
> local PostgreSQL + Prisma instead of Supabase, jose-signed session cookies
> instead of hosted auth, console-logged email instead of Resend, and
> app-level authorization instead of RLS.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| Language | TypeScript (strict) |
| Database | PostgreSQL 16 + Prisma 7 (`@prisma/adapter-pg`) |
| Auth | jose JWT in httpOnly cookies + bcryptjs, role-gated via `proxy.ts` |
| Styling | Tailwind CSS v4 + shadcn/ui, custom green glass theme |
| State | Zustand (client), React Server Components (server) |
| Forms | React Hook Form + Zod v4 |
| Charts | Recharts (CVD-validated categorical palette) |
| Animation | Framer Motion |
| PWA | `app/manifest.ts` + custom `public/sw.js` + install banner |

## Getting started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start PostgreSQL** (portable cluster) and create the database:

   ```bash
   pg_ctl start -D <pgdata>
   psql -U erp -h localhost -d postgres -c "CREATE DATABASE edunexus"
   ```

3. **Configure env** — copy `.env.example` to `.env` and set `DATABASE_URL`
   and a random `AUTH_SECRET`.

4. **Migrate + seed**

   ```bash
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

   The seed creates *Green Valley International School* with 500 students,
   300 parents, 30 teachers, 10 staff, 30 days of attendance, published exam
   results, fees, timetables, transport routes, 200 library books,
   announcements, assignments and payroll.

5. **Run**

   ```bash
   pnpm dev
   ```

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@edunexus.app` | `Admin@123` |
| Teacher | `sarah.johnson@edu.app` | `Teacher@123` |
| Student | `alex.kumar@edu.app` | `Student@123` |
| Parent | `rajesh.kumar@edu.app` | `Parent@123` |
| Staff | `priya.staff@edu.app` | `Staff@123` |

## Modules

- **Admin** — dashboard analytics, students (directory/profile/enroll),
  teachers & staff directories, attendance marking + daily stats, timetable
  builder with teacher/room/section conflict detection, examinations
  (schedules → marks entry → auto-grading → publish), fees (dues, counter
  collection with receipts, structures), communication (targeted
  announcements), HR & payroll (leave approvals, payslips), transport,
  library (issue/return + fines), hostel occupancy, inventory with low-stock
  alerts, visitor log, reports hub, settings.
- **Teacher** — today's schedule, attendance for their sections, assignments
  (create/grade), gradebook (exam marks entry), personal timetable, leave
  requests, messaging with parents.
- **Student** — attendance ring + calendar, timetable, assignments with
  online submission, published results, fees & receipts, library catalog,
  transport details, announcements.
- **Parent** — per-child dashboards, attendance calendar, results, fee dues
  with online payment (demo), transport info, teacher messaging.

## PWA

The app is installable (manifest + icons + service worker) with an in-app
install banner, iOS instructions, an offline fallback page, cache-first
static assets and network-first navigation. The service worker registers in
**production builds only** — in dev it would serve stale chunks.

```bash
pnpm build
pnpm start
```

Then open http://localhost:3000 in Chrome/Edge — the install prompt appears
in the address bar and via the green banner.

## Notes

- Emails (password reset links) are logged to the server console.
- The "Pay Now" flow records a demo online payment — integrate Razorpay or
  Stripe in `features/fees/actions.ts` for real payments.
- PDF exports use the browser's print dialog (print-friendly layouts).
