# Deploying EduNexus

Everything below stays on free tiers. Two things need to exist in production:
a **PostgreSQL database** and the **Next.js app on Vercel**.

---

## 1. Do I need to switch database?

**The database engine does not change — only where it runs.**

Right now `DATABASE_URL` points at the portable PostgreSQL cluster on this
Windows machine (`localhost:5432`). Vercel can't reach `localhost`, so for a
deployed app you need PostgreSQL hosted somewhere with a public URL.

Nothing in the code has to change. Prisma talks plain PostgreSQL, so you swap
one environment variable and the whole app — auth, imports, file uploads —
works exactly as it does locally.

### About the Supabase snippet you pasted

That snippet installs `@supabase/supabase-js` + `@supabase/ssr` and wires
Supabase Auth through middleware. **Do not run it on this project.** EduNexus
already has its own auth (bcrypt + jose JWT in an httpOnly cookie) and its own
data layer (Prisma). Adding Supabase Auth would create a second, conflicting
session system, and `utils/supabase/middleware.ts` would collide with the
existing route guard in `proxy.ts`.

What you *should* take from Supabase is just **the Postgres database**. Every
Supabase project is a real PostgreSQL 15+ instance with a normal connection
string. Point Prisma at it and you're done — no SDK, no middleware, no MCP
server required.

### Which host to pick

| Host | Free tier | Notes |
|---|---|---|
| **Supabase** | 500 MB database, project pauses after 7 days idle | You already have a project — good default |
| **Neon** | 0.5 GB, scale-to-zero, no pausing | Best fit if the demo sits idle between visits |
| **Vercel Postgres** | 256 MB | Fewest moving parts, smallest storage |

Any of them works. The steps below use Supabase; for Neon/Vercel Postgres only
the connection strings differ.

---

## 2. Set up the hosted database

### 2.1 Get the two connection strings

In the Supabase dashboard: **Project Settings → Database → Connection string →
URI**, and copy both modes.

- **Transaction pooler**, port `6543` → used by the running app.
  Serverless functions open many short-lived connections; the pooler is what
  keeps a small Postgres instance from running out of them.
- **Direct connection**, port `5432` → used by `prisma migrate`.
  Poolers can't run schema changes (DDL), so migrations need the direct one.

Replace `[YOUR-PASSWORD]` in both with your database password (Settings →
Database → Reset database password if you don't have it).

### 2.2 Put them in `.env`

```bash
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

The `?pgbouncer=true&connection_limit=1` on the pooled URL matters — without
it Prisma tries to use prepared statements the transaction pooler doesn't
support.

`prisma.config.ts` automatically prefers `DIRECT_URL` for migrations and falls
back to `DATABASE_URL`, so locally you can leave `DIRECT_URL` unset.

### 2.3 Create the tables and demo data

```bash
pnpm prisma migrate deploy
```

```bash
pnpm prisma db seed
```

Seeding is destructive — it wipes and repopulates the demo tenant (Green Valley
International School: 500 students, 300 parents, 30 teachers, 10 staff).

---

## 3. Deploy to Vercel

### 3.1 Push the repo

```bash
git push origin main
```

### 3.2 Import the project

On vercel.com → **Add New → Project** → import
`mr-umar-ahmed/school-erp-system`. Framework auto-detects as Next.js; leave
the build settings alone (`postinstall` already runs `prisma generate`).

### 3.3 Environment variables

Add these under **Settings → Environment Variables** for *Production*,
*Preview* and *Development*:

| Name | Value |
|---|---|
| `DATABASE_URL` | the **pooled** (6543) connection string |
| `DIRECT_URL` | the **direct** (5432) connection string |
| `AUTH_SECRET` | a fresh 64-char hex secret (below) |
| `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` |

Generate the secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use a **different** `AUTH_SECRET` than your local one, and never commit `.env`.
Changing it later signs everyone out — that's the intended way to revoke all
sessions.

### 3.4 Migrations on deploy

Run migrations from your machine against the hosted database (simplest, and
keeps a failed migration from breaking a deploy):

```bash
pnpm prisma migrate deploy
```

Alternatively set Vercel's **Build Command** to
`pnpm prisma migrate deploy && pnpm build` so every deploy migrates first.

### 3.5 After the first deploy

Open `https://<your-app>.vercel.app` and sign in with a demo account
(`admin@edunexus.app` / `Admin@123`). **Change these passwords before showing
the app to a real school.**

---

## 4. Installing the PWA

The install prompt only appears when **all** of these are true:

1. The page is served over **HTTPS** (Vercel does this automatically) or from
   `localhost`.
2. A **service worker is registered** — this only happens in a production
   build. `pnpm dev` deliberately unregisters it, because its cache-first
   strategy would serve stale dev chunks.
3. The browser supports installation (Chrome, Edge, or Safari on iOS).

**This is why install did nothing during development.** To test locally:

```bash
pnpm build
```

```bash
pnpm start
```

Then open `http://localhost:3000` and use the install icon in the header. On
the deployed Vercel URL it works directly.

If the browser's own installer can't be opened, the app now shows step-by-step
manual instructions instead of a button that silently fails — and tells you
which prerequisite is missing.

---

## 5. Where images and PDFs can be shared

Uploads are stored as `bytea` rows in the `stored_files` table and served
through `/api/files/[id]`, which checks the session and the institution on
every request — one school can never fetch another's files. Accepted types are
**PDF, JPG, PNG and WebP**, up to **4 MB each**, max **5 per record**, and the
file's magic bytes are verified so a renamed executable can't be stored as a
"PDF".

| Where | Who uploads | Who sees it |
|---|---|---|
| **Assignments** (`/teacher/assignments/new`) | Teacher | Students in that class, on `/student/assignments` |
| **Assignment submissions** | Student | The teacher, on the assignment detail page |
| **Announcements** (`/admin/communication`) | Admin / teacher | Everyone targeted by the announcement |
| **Direct messages** | Anyone in a conversation | The other participant |

Every upload control has a **"Take photo"** button next to it, which opens the
camera directly on phones — a student can photograph handwritten work and a
teacher can photograph a worksheet.

### Storage budget

A 500 MB Supabase database holds roughly 250 two-megabyte PDFs. That is plenty
for a demo, but for a real school year move attachments to object storage
(Supabase Storage or self-hosted MinIO) and keep only the URL in
`attachmentUrls`. `lib/uploads.ts` and `/api/files` are the only two places
that would need to change.

---

## 6. Spreadsheet import

| Import | Where | Template |
|---|---|---|
| Students | `/admin/students` → *Import from Excel* | `/api/templates/students` |
| Teachers | `/admin/teachers` → *Import from Excel* | `/api/templates/teachers` |
| Exam marks | `/teacher/gradebook` → *Import marks* | `/api/templates/marks?schedule=<id>` |

Accepts `.xlsx` and `.csv`, up to 5 MB / 1000 rows. Column headers are matched
case- and space-insensitively, unknown columns are ignored, and every rejected
row is reported back with its spreadsheet row number and the reason — valid
rows still import. The marks template arrives pre-filled with the class roster,
so teachers only type into the *Marks* column.

Imported students get the default password `Student@123` and teachers
`Teacher@123`; both should be reset on first login.

---

## 7. Troubleshooting

| Symptom | Cause |
|---|---|
| `Can't reach database server` | Supabase project paused (free tier sleeps after 7 idle days) — open the dashboard to resume |
| `prepared statement "s0" already exists` | Missing `?pgbouncer=true&connection_limit=1` on the pooled URL |
| Migrations hang or fail on Vercel | Migrating through the pooler — use `DIRECT_URL` (port 5432) |
| Everyone signed out after deploy | `AUTH_SECRET` changed |
| Install button shows instructions instead of installing | No service worker — you're on a dev build, see §4 |
| Build hangs on Windows | A dev/prod server is still running; stop it before `pnpm build` |
