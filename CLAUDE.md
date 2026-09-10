# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Commands

```bash
bun run dev          # Start dev server (Turbopack)
bun run build        # Production build
bun run lint         # Localhost-hardcode check + ESLint
bun run typecheck    # tsc --noEmit
bun run test         # bun test (runner configured, no test files yet)
```

Run all three checks before finishing changes: `bun run lint && bun run typecheck && bun run test`.

## Architecture

This is the marketing and R&D-facing website for **Conqueror Studios**, an independent AI lab. The stack is **Next.js 15 App Router**, **React 19**, **TypeScript 5** (strict), **Tailwind 4**, **Supabase** (SSR), **React Query 5**, **Postmark**, and **Stripe**. Package manager is **Bun**.

### App structure

- `src/app/` — Next.js App Router pages. Server components by default; add `"use client"` only when needed.
- `src/components/site/` — Shared UI components (`SiteHeader`, `SiteFooter`, `ProductHero`, `ProjectCard`, `FeatureGrid`, `SplitFeature`, `ProductCTA`, `HudCorners`). One component per file.
- `src/lib/` — Backend helpers: `supabase/` (client + server + admin factories), `postmark/` (typed email sender), `projects.ts` (project metadata), `responsiveText.ts` (pretext helper), `rateLimit.ts` (in-process sliding-window rate limiter).
- `src/actions/` — Next.js server actions (e.g., `waitlist.ts`).
- `src/hooks/` — Custom hooks. `useMountEffect.ts` is the approved mount-only effect hook.
- `src/hooks/api/` — React Query hooks for server data: `useNexus.ts`, `useConsoleWaitlist.ts`.
- `eslint-rules/` — Custom ESLint plugin with 7 enforcement rules (see below).
- `scripts/lint-no-browser-localhost.mjs` — Pre-lint guard that fails if localhost URLs appear in browser-facing code.
- `middleware.ts` — Next.js middleware entry-point. Delegates to `src/proxy.ts` → `src/lib/supabase/proxy.ts` to refresh Supabase auth cookies on every request. Excludes `/api/health` and `/api/stripe/webhook`.

### Auth flow

1. Unauthenticated visitors hitting `/console/**` are redirected to `/auth`.
2. `/auth` renders `AuthForm` — sends a magic link via `supabase.auth.signInWithOtp`.
3. Supabase emails a link back to `/auth/callback?next=/console`.
4. `/auth/callback/route.ts` exchanges the PKCE code for a session and redirects to `next`.
5. `middleware.ts` refreshes the session cookie on every subsequent request.

### Console routes

All routes under `/console` require authentication. Every `layout.tsx` in the subtree performs its own `createClient().auth.getUser()` check and redirects to `/auth` on failure.

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
| `GET /api/health` | None | Uptime probe — `{ status, ts, version }` |
| `POST /api/nexus` | Session | Proxy to OrchestrAI Nexus `/run` (NEXUS_URL) |
| `GET /api/nexus/schema` | Session | Proxy to AI Bridge `/tools/schema` (BRIDGE_URL) |
| `GET /api/console/waitlist` | Session | Admin waitlist read (service-role) |
| `GET /api/console/settings` | Session | Env health + deploy metadata |
| `POST /api/console/broadcast` | Session | Fan-out broadcast email to waitlist via Postmark |
| `POST /api/unsubscribe` | None | Remove email from waitlist (public, linked from emails) |
| `POST /api/stripe/webhook` | Stripe sig | Typed event dispatch + DB upsert + dunning email |
| `GET /api/agents` | Session | List user's agent definitions |
| `POST /api/agents` | Session | Create a new agent |
| `GET /api/agents/[id]` | Session + owner | Fetch single agent |
| `PATCH /api/agents/[id]` | Session + owner | Update agent fields |
| `DELETE /api/agents/[id]` | Session + owner | Delete agent + cascade runs |
| `POST /api/agents/[id]/run` | Session + owner | Run agent via Nexus, persist to agent_runs |
| `GET /api/agents/[id]/runs` | Session + owner | Paginated run history for one agent |

### Supabase client pattern

Three separate factories with distinct responsibilities:
- `src/lib/supabase/client.ts` — Browser client (uses `NEXT_PUBLIC_*` vars).
- `src/lib/supabase/server.ts` — SSR server client (cookie-aware, reads from `SUPABASE_URL` / `SUPABASE_ANON_KEY` with sandbox fallback logic in `server-env.ts`).
- `src/lib/supabase/admin.ts` — Service-role admin client (requires `SUPABASE_SERVICE_ROLE_KEY`).

The server env resolver (`server-env.ts`) has fallback priority: `GIC_SERVER_SUPABASE_URL` → sandbox parsed from `GIC_BROWSER_LOCAL_SERVICES_JSON` → `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`. Never bypass this; it's what makes local sandbox and production work from the same code.

### Rate limiting

`src/lib/rateLimit.ts` — In-process sliding-window rate limiter keyed on arbitrary strings (typically `"namespace:ip"`). Used by `src/actions/waitlist.ts` (3 req/min per IP). To swap for Upstash Redis (needed for multi-region Vercel), replace the `Map`-backed store with an Upstash client — the public `rateLimit(key, opts)` API is identical.

### Email (Postmark)

`src/lib/postmark/send.ts` wraps a typed `sendTemplatedEmail` function. Template aliases are `"welcome-email"` and `"broadcast-update"`. Broadcast emails use the `POSTMARK_BROADCAST_MESSAGE_STREAM` stream; transactional ones use `POSTMARK_MESSAGE_STREAM`.

### Waitlist server action

`src/actions/waitlist.ts` — Server action for waitlist signup. Validates email, applies IP rate limiting (3/min), persists to Supabase `waitlist` table via admin client, and sends a Postmark `welcome-email`. Do not convert to an API route.

### Stripe

`src/app/api/stripe/webhook/route.ts` — Webhook endpoint with HMAC signature verification. Typed `switch` dispatches `checkout.session.completed`, `customer.subscription.*`, and `invoice.*` events. Wire real DB writes (upsert to `subscriptions` table via admin client) as billing flows solidify.

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

### TypeScript

Strict mode is on. Use named imports, not namespace or barrel imports. Export types from `.ts` files alongside their implementations; do not create separate `.d.ts` files.

## Environment variables

```
# Site
NEXT_PUBLIC_SITE_URL              # canonical public URL — used for unsubscribe/billing links

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
NEXUS_URL                        # OrchestrAI Nexus service URL
BRIDGE_URL                       # AI Bridge service URL

# Sandbox / local dev (GIC environment)
GIC_SERVER_SUPABASE_URL
GIC_BROWSER_LOCAL_SERVICES_JSON  # JSON array: [{alias:"supabase",port:54321,scheme:"http"}]
```

## CI workflows

Ten GitHub Actions workflows cover: build verification, TypeScript check, Bun tests + Biome lint, package security scan, Supabase preview-branch DB, staging/prod migrations, migration protection gate, and SQL linting. Supabase migrations live in `supabase/migrations/` and are reviewed before merging.
