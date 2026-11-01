# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Commands

```bash
bun run dev          # Start dev server (Turbopack)
bun run build        # Production build
bun run lint         # Localhost-hardcode check + ESLint
bun run typecheck    # tsc --noEmit
bun run test         # bun test (fails when tests fail; no pass-with-no-tests)
```

Run all three checks before finishing changes: `bun run lint && bun run typecheck && bun run test`.

## Architecture

This is the marketing and R&D-facing website for **Conqueror Studios**, an independent AI lab. The stack is **Next.js 16.4.3 App Router**, **React 19.2.6**, **TypeScript 6.0.3** (strict), **Tailwind 4.2.4**, **Supabase** (SSR), **React Query 5**, **Postmark**, and **Stripe 22**. Package manager is **Bun 1.3.13** (`packageManager`). `bun.lock` is the only lockfile: Vercel picks npm whenever a `package-lock.json` exists, so do not add one. Versions are the resolved `package.json` pins.

### App structure

- `src/app/` — Next.js App Router pages. Server components by default; add `"use client"` only when needed.
- `src/components/site/` — Shared UI components (`SiteHeader`, `SiteFooter`, `ProductHero`, `ProjectCard`, `FeatureGrid`, `SplitFeature`, `ProductCTA`, `HudCorners`). One component per file.
- `src/lib/` — Backend helpers: `supabase/` (client + server + admin factories), `postmark/` (typed email sender), `projects.ts` (project metadata), `responsiveText.ts` (pretext helper), `rateLimit.ts` (in-process sliding-window rate limiter), `console-owner.ts` (fail-closed owner allowlist), `nexus-client.ts` (only reader of `NEXUS_URL`), `bridge-client.ts` (only reader of `BRIDGE_URL`), `site-url.ts` (canonical public origin), `service-config.ts` (which backends are configured; presence only), `log.ts` (structured JSON logger with redaction), `supabase/session.ts` (`lookupSession()`, never throws).
- `src/actions/` — Next.js server actions (e.g., `waitlist.ts`).
- `src/hooks/` — Custom hooks. `useMountEffect.ts` is the approved mount-only effect hook.
- `src/hooks/api/` — React Query hooks for server data: `useNexus.ts`, `useConsoleWaitlist.ts`.
- `eslint-rules/` — Custom ESLint plugin with 7 enforcement rules (see below).
- `scripts/lint-no-browser-localhost.mjs` — Pre-lint guard that fails if localhost URLs appear in browser-facing code.
- `src/proxy.ts` — Next.js 16 request proxy (there is no `middleware.ts`). Delegates to `src/lib/supabase/proxy.ts` to refresh Supabase auth cookies on matched requests. Excludes `/api/health` and `/api/stripe/webhook`.

### Auth flow

1. Unauthenticated visitors hitting `/console/**` are redirected to `/auth`.
2. `/auth` renders `AuthForm` — sends a magic link via `supabase.auth.signInWithOtp`.
3. Supabase emails a link back to `/auth/callback?next=/console`.
4. `/auth/callback/route.ts` exchanges the PKCE code for a session and redirects to `next`.
5. `src/proxy.ts` refreshes the session cookie on subsequent matched requests.
6. `CONSOLE_OWNER_EMAILS` is required. An empty allowlist redirects signed-in users to `/auth?error=console_unconfigured`. A signed-in address that is not on the list goes to `/auth?error=unauthorized`.
7. Missing Supabase configuration never throws: pages redirect to `/auth?error=auth_unconfigured` (the sign-in page then explains that sign-in is offline instead of rendering a form), APIs return 503 `auth_unconfigured`, and an unreachable auth service returns 503 `auth_unavailable`. Expired or reused magic links land on `/auth?error=link_invalid`.

### Console routes

All routes under `/console` require a session and an allowlisted owner email. Every `layout.tsx` in the subtree calls `requireConsoleOwnerPage()` (`src/lib/console-owner.ts`), which resolves the session with `lookupSession()` and redirects using `decideConsoleAccess()`. API routes use `requireConsoleOwner()`.

| Route | File | Description |
|---|---|---|
| `/console` | `src/app/console/page.tsx` | Run tab — Nexus query + trace + query history |
| `/console/agents` | `src/app/console/agents/page.tsx` | Agent Studio — list + create agents |
| `/console/agents/[id]` | `src/app/console/agents/[id]/page.tsx` | Agent detail — edit, run, history |
| `/console/waitlist` | `src/app/console/waitlist/page.tsx` | Waitlist signups table |
| `/console/settings` | `src/app/console/settings/page.tsx` | Env health, deploy info, Nexus URL |

### API routes

| Route | Auth | Description |
|---|---|---|
| `GET /api/health` | None | Liveness and readiness — `{ status: "ok", ready, services, ts, version }`. `services` reports presence only (`configured`/`not_configured`/`invalid`). |
| `POST /api/gateway` | `X-Gateway-Secret` | Server-side multi-provider gateway. Separate from Nexus and Bridge. |
| `POST /api/nexus` | Session + owner allowlist | Proxy to OrchestrAI Nexus `POST /run` (`NEXUS_URL`, read only in `nexus-client.ts`) |
| `GET /api/nexus/schema` | Session + owner allowlist | Proxy to AI Bridge v2 `GET /tools/schema` (`BRIDGE_URL`, read only in `bridge-client.ts`) |
| `GET /api/console/waitlist` | Session + owner allowlist | Admin waitlist read (service-role) |
| `GET /api/console/settings` | Session + owner allowlist | Env health booleans + deploy metadata. Does not return secret values. |
| `POST /api/console/broadcast` | Session + owner allowlist | Fan-out broadcast email to waitlist via Postmark. CTA must be `https`. |
| `POST /api/unsubscribe` | Signed token | Remove email from waitlist (public, linked from emails) |
| `POST /api/stripe/webhook` | Stripe sig | Typed event dispatch. Subscription upsert failure returns 500 so Stripe retries. Dunning email failure does not. |
| `GET /api/agents` | Session + owner allowlist | List the signed-in user's agent definitions (RLS) |
| `POST /api/agents` | Session + owner allowlist | Create a new agent |
| `GET /api/agents/[id]` | Session + owner allowlist + row owner | Fetch single agent |
| `PATCH /api/agents/[id]` | Session + owner allowlist + row owner | Update agent fields |
| `DELETE /api/agents/[id]` | Session + owner allowlist + row owner | Delete agent + cascade runs |
| `POST /api/agents/[id]/run` | Session + owner allowlist + row owner | Buffered JSON run via Nexus, persist to `agent_runs` |
| `GET /api/agents/[id]/runs` | Session + owner allowlist + row owner | Paginated run history for one agent |

### Supabase client pattern

Three separate factories with distinct responsibilities:
- `src/lib/supabase/client.ts` — Browser client (uses `NEXT_PUBLIC_*` vars).
- `src/lib/supabase/server.ts` — SSR server client (cookie-aware, reads from `SUPABASE_URL` / `SUPABASE_ANON_KEY` with sandbox fallback logic in `server-env.ts`).
- `src/lib/supabase/admin.ts` — Service-role admin client (requires `SUPABASE_SERVICE_ROLE_KEY`).

The server env resolver (`server-env.ts`) has fallback priority: `GIC_SERVER_SUPABASE_URL` → sandbox parsed from `GIC_BROWSER_LOCAL_SERVICES_JSON` → `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`. Never bypass this; it's what makes local sandbox and production work from the same code.

### Rate limiting

`src/lib/rateLimit.ts` — In-process sliding-window rate limiter keyed on arbitrary strings. It does not coordinate across Vercel instances. Current callers: waitlist signup (3/min per IP), AI gateway (30/min per IP), Nexus proxy (20/min per user), agent run (10/min per user), broadcast (3/hour per user). Replacing the `Map` with a shared store would keep the `rateLimit(key, opts)` signature. Do not add a paid limiter without an explicit decision.

### Email (Postmark)

`src/lib/postmark/send.ts` wraps a typed `sendTemplatedEmail` function. Template aliases are `"welcome-email"` and `"broadcast-update"`. Broadcast emails use the `POSTMARK_BROADCAST_MESSAGE_STREAM` stream; transactional ones use `POSTMARK_MESSAGE_STREAM`.

### Waitlist server action

`src/actions/waitlist.ts` — Server action for waitlist signup. Validates and caps fields, applies IP rate limiting (3/min), inserts into Supabase `waitlist` via the admin client, and sends a Postmark `welcome-email`. A duplicate email (`23505`) returns success and does not send another email. Missing service-role configuration returns an error instead of a false success. A confirmation-email failure after a successful insert is non-fatal. Do not convert this to an API route.

### Stripe

`src/app/api/stripe/webhook/route.ts` — Webhook endpoint with signature verification via `constructEvent`. A bad signature returns a generic 400. Typed `switch` dispatches `checkout.session.completed`, `customer.subscription.*`, and `invoice.*` events. Subscription rows upsert on `stripe_subscription_id` through the service-role client. If that write fails, or the service-role key is missing, the handler returns 500 (`finalizeWebhookHttp`) so Stripe retries. A dunning email failure is logged and does not fail the webhook. There is no `stripe_events` ledger, so a retried `invoice.payment_failed` can send the dunning email again.

### Database migrations

`supabase/migrations/` — four migrations:
- `20240618000000_create_waitlist.sql` — `waitlist` table with RLS.
- `20250101000000_create_subscriptions.sql` — `subscriptions` table with Stripe IDs, status, plan, periods, and `updated_at` trigger.
- `20260719150420_create_agents.sql` — `agents` table with per-user RLS policies.
- `20260719150421_create_agent_runs.sql` — `agent_runs` table; immutable audit log, RLS scoped to owner.

Shared types: `src/lib/agents/types.ts` — `AgentRow` and `AgentRunRow` interfaces mirroring the DB schema.

New migrations: use `supabase migration new <name>` so the timestamp sorts correctly. Every `CREATE TABLE` on a public table must be followed by `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — the SQL lint CI check enforces this.

## Enforced conventions

### useEffect is banned

Direct `useEffect` calls are blocked by `no-restricted-syntax` in ESLint and enforced by two custom rules (`no-use-effect-aliases`, `no-data-fetching-in-use-effect`). The only approved alternatives:
- Derived state computed at render time.
- Event handlers for mutations.
- React Query (`useQuery`, `useMutation`) for async data.
- `useMountEffect` (`src/hooks/useMountEffect.ts`) for true mount/unmount synchronization with an external system only.

A component may have at most 3 `useEffect` calls before a lint warning fires.

### Import rules (custom ESLint plugin)

- **No barrel exports** — `export * from "..."` is forbidden.
- **No barrel imports** — importing from a local `index` file triggers a warning; import the concrete file directly.
- **API imports gated to hooks** — `@/api/*` imports are only allowed inside `src/hooks/api/**`. UI code must consume a React Query hook, not the raw API helper.
- **No namespace imports** — `import * as Foo` is banned except for `import * as React from "react"`.

### Responsive text

Use `@chenglou/pretext` for text-heavy responsive layout, multiline height prediction, and overflow prevention. Keep text in the DOM; call `prepare()` only when text/font changes; call `layout()` on width changes. Import via `@/lib/responsiveText`.

### Styling

Tailwind 4 with a custom `@theme` block in `globals.css`. Design language is dark-only (cyberpunk/HUD aesthetic): accent color `#e84040`, fonts Orbitron (display) / Inter (body) / JetBrains Mono (code). Custom utility classes are prefixed `cs-` (e.g., `cs-btn-deploy`, `cs-link-arrow`, `cs-eyebrow`). Do not add `color-scheme: light` or light-mode variants.

### Logging and errors

Server code logs through `log.info/warn/error(event, fields)` from `src/lib/log.ts`, never raw `console.*`. Fields are redacted (credential-like keys, email local parts, token shapes). Log Supabase errors by `code`, not the whole object, because `details` can contain row values. API errors are JSON `{ error, code }` with a stable `code`; upstream (Nexus, Bridge) error bodies are never forwarded to the browser.

`src/app/error.tsx`, `global-error.tsx`, and `not-found.tsx` are the branded error boundaries.

### TypeScript

Strict mode is on. Use named imports, not namespace or barrel imports. Export types from `.ts` files alongside their implementations; do not create separate `.d.ts` files.

## Environment variables

```
# Site
NEXT_PUBLIC_SITE_URL              # public origin. Production is https://www.conqueror-studios.com. conquerorstudios.dev is rewritten.
CONSOLE_OWNER_EMAILS              # required comma-separated owner emails. Empty fails closed (503).

# Supabase (browser)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Supabase (server — override the NEXT_PUBLIC_ ones server-side)
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Postmark
POSTMARK_SERVER_TOKEN
POSTMARK_FROM_EMAIL
POSTMARK_MESSAGE_STREAM          # transactional stream
POSTMARK_BROADCAST_MESSAGE_STREAM

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Backend services (server-only — never exposed to browser)
NEXUS_URL                        # OrchestrAI Nexus base URL. Read only in src/lib/nexus-client.ts. No localhost default.
BRIDGE_URL                       # AI Bridge v2 base URL (GET /tools/schema). Read only in src/lib/bridge-client.ts.
NEXUS_SHARED_SECRET              # optional. Sent as X-Nexus-Secret only when set.
BRIDGE_SHARED_SECRET             # optional. Sent as X-Gateway-Secret only when set. Not GATEWAY_SECRET.
GATEWAY_SECRET                   # required for POST /api/gateway. Server-only.

# Sandbox / local dev (GIC environment)
GIC_SERVER_SUPABASE_URL
GIC_BROWSER_LOCAL_SERVICES_JSON  # JSON array: [{alias:"supabase",port:54321,scheme:"http"}]
```

## CI workflows

All app checks run on GitHub-hosted `ubuntu-latest` runners:

- `ci.yml` — frozen `bun install`, entrypoint check, ESLint + localhost guard, `biome ci`, `tsc`, `bun test`, `bun audit --audit-level=high`, `next build`, then `next start` plus `scripts/smoke-test.mjs`.
- `codeql.yml` — CodeQL `security-extended` for JavaScript/TypeScript.
- `deploy-smoke.yml` — on Vercel `deployment_status` success, runs `scripts/smoke-test.mjs` against the deployment URL and, for Production, against `https://www.conqueror-studios.com`, requiring `/api/health` to report the deployed SHA. Protected previews are reported as not verified unless `VERCEL_AUTOMATION_BYPASS_SECRET` is set as an Actions secret.
- `sql-migration-lint.yml`, `protect-supabase-migrations.yml` — migration lint (RLS required) and no deleted/renamed migrations.

`preview-db-branch.yml`, `staging-db-migration.yml`, `staging-db-migration-rollback.yml`, and `prod-db-migration.yml` apply migrations through the Cofounder API on self-hosted `superoptimizers` runners. Those runners have not picked up jobs since late August 2026, so migrations are not applied automatically. Supabase migrations live in `supabase/migrations/` and are reviewed before merging.

Dependabot (`.github/dependabot.yml`) uses the `bun` ecosystem; the `npm_and_yarn` ecosystem rejects Bun projects.
