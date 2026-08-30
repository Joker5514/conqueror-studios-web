# Supabase Setup Guide

This document covers creating a Supabase project, running the database migrations, configuring Row Level Security, and wiring the credentials into your local development environment.

---

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New project**.
3. Choose your organization, give the project a name (e.g. `conqueror-studios`), set a strong database password, and pick the region closest to your Vercel deployment region.
4. Wait ~2 minutes for provisioning to complete.

---

## 2. Collect your credentials

From the Supabase dashboard → **Project Settings** → **API**:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" (e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "anon public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role secret" key — **never expose this to the browser** |

Also set:
- `SUPABASE_URL` — same value as `NEXT_PUBLIC_SUPABASE_URL` (used on the server side to bypass the browser proxy)
- `SUPABASE_ANON_KEY` — same as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (server side override)

---

## 3. Run database migrations

The migrations live in [`supabase/migrations/`](../supabase/migrations/). They are applied in filename order (timestamps sort them correctly).

### Option A — Supabase CLI (recommended for local dev)

```bash
# Install the CLI (once)
brew install supabase/tap/supabase   # macOS
# or: https://supabase.com/docs/guides/cli/getting-started

# Link to your remote project
supabase login
supabase link --project-ref <your-project-ref>

# Apply all pending migrations
supabase db push
```

### Option B — Dashboard SQL editor

Open the Supabase dashboard → **SQL Editor** and paste each migration file in order:

1. `20240618000000_create_waitlist.sql`
2. `20250101000000_create_subscriptions.sql`
3. `20260719150420_create_agents.sql`
4. `20260719150421_create_agent_runs.sql`

Run each file as a separate query.

### Option C — GitHub Actions (CI)

The repo has a `prod-db-migration.yml` workflow that runs `supabase db push` on every merge to `main`. Wire the following secrets in GitHub repository settings:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`

---

## 4. Row Level Security (RLS) policies

Every table created by the migrations has RLS enabled. The default posture is **deny-all**; the server-side `service_role` client (which bypasses RLS) is used for all write operations.

### `waitlist` table

```sql
-- RLS is enabled with no public-facing policies.
-- Inserts come exclusively from the server action via the service-role client.
-- To allow anon SELECT on the count (for a public waitlist counter):
create policy "anon can count waitlist"
  on public.waitlist for select
  to anon
  using (true);
```

### `subscriptions` table

```sql
-- Only the service-role client writes to this table (Stripe webhook).
-- Authenticated users may read their own subscription:
create policy "user can read own subscription"
  on public.subscriptions for select
  to authenticated
  using (auth.uid() = user_id);
```

### `agents` table

```sql
-- RLS policies are already created by the migration:
-- - "user can insert own agent"
-- - "user can select own agents"
-- - "user can update own agent"
-- - "user can delete own agent"
-- No additional policies needed for the standard flow.
```

### `agent_runs` table

```sql
-- RLS policies are already created by the migration:
-- - "user can insert own agent run"
-- - "user can select own agent runs"
-- Runs are append-only (no UPDATE or DELETE policies by design).
```

---

## 5. Adding new migrations

Always use the Supabase CLI to generate migration files so the timestamp sorts correctly:

```bash
supabase migration new <descriptive_name>
# e.g.: supabase migration new add_contact_messages
```

This creates `supabase/migrations/<timestamp>_<descriptive_name>.sql`.

**Rules enforced by CI (`sql-migration-lint.yml`):**

- Every `CREATE TABLE` on a public schema table must be followed by `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- Never use `DROP TABLE` without a `CREATE TABLE` in the same migration (use a new migration to drop).
- Never modify an existing migration file — create a new one to alter schema.

---

## 6. Local Supabase (fully offline dev)

```bash
# Start a local Supabase stack (requires Docker)
supabase start

# This prints local credentials. Add to .env.local:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<printed anon key>
# SUPABASE_SERVICE_ROLE_KEY=<printed service-role key>

# Apply migrations to the local stack
supabase db reset   # fresh reset + re-runs all migrations

# Stop when done
supabase stop
```

---

## 7. Auth configuration

1. In the Supabase dashboard → **Authentication** → **Providers**, enable **Email** (magic link, no password).
2. Under **URL Configuration**, set:
   - **Site URL**: `https://conquerorstudios.dev` (production) or `http://localhost:3000` (dev)
   - **Redirect URLs**: add `https://conquerorstudios.dev/auth/callback` and `http://localhost:3000/auth/callback`
3. Under **Email Templates** → **Magic Link**, customize the subject and body to match the Conqueror Studios branding.

The PKCE exchange is handled by [`src/app/auth/callback/route.ts`](../src/app/auth/callback/route.ts).

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `MISSING_SUPABASE_SERVER_ENV_ERROR` at runtime | `SUPABASE_URL` or `SUPABASE_ANON_KEY` not set in `.env.local` | Copy from Supabase dashboard and add to `.env.local` |
| Auth redirect loop | Site URL mismatch | Ensure "Site URL" in Supabase matches `NEXT_PUBLIC_SITE_URL` |
| `permission denied for table waitlist` | Wrong client used | Only the `admin` client (service-role key) may write to `waitlist` |
| Migrations not applied | `supabase db push` not run | Run `supabase db push` after linking the project |
| `MISSING_SUPABASE_ADMIN_ENV_ERROR` | `SUPABASE_SERVICE_ROLE_KEY` not set | Add the service-role key from Project Settings → API |
