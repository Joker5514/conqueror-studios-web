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

This is the marketing and R&D-facing website for **Conqueror Studios**, an independent AI lab. The stack is **Next.js 16 App Router**, **React 19**, **TypeScript 6** (strict), **Tailwind 4**, **Supabase** (SSR), **React Query 5**, **Postmark**, and **Stripe**. Package manager is **Bun**.

### App structure

- `src/app/` — Next.js App Router pages. Server components by default; add `"use client"` only when needed.
- `src/components/site/` — Shared UI components (`SiteHeader`, `SiteFooter`, `ProductHero`, `ProjectCard`, `FeatureGrid`, `SplitFeature`, `ProductCTA`, `HudCorners`). One component per file.
- `src/lib/` — Backend helpers: `supabase/` (client + server + admin factories), `postmark/` (typed email sender), `projects.ts` (project metadata), `responsiveText.ts` (pretext helper).
- `src/actions/` — Next.js server actions (e.g., `waitlist.ts`).
- `src/hooks/` — Custom hooks. `useMountEffect.ts` is the approved mount-only effect hook.
- `eslint-rules/` — Custom ESLint plugin with 7 enforcement rules (see below).
- `scripts/lint-no-browser-localhost.mjs` — Pre-lint guard that fails if localhost URLs appear in browser-facing code.

### Supabase client pattern

Three separate factories with distinct responsibilities:
- `src/lib/supabase/client.ts` — Browser client (uses `NEXT_PUBLIC_*` vars).
- `src/lib/supabase/server.ts` — SSR server client (cookie-aware, reads from `SUPABASE_URL` / `SUPABASE_ANON_KEY` with sandbox fallback logic in `server-env.ts`).
- `src/lib/supabase/admin.ts` — Service-role admin client (requires `SUPABASE_SERVICE_ROLE_KEY`).

The server env resolver (`server-env.ts`) has fallback priority: `GIC_SERVER_SUPABASE_URL` → sandbox parsed from `GIC_BROWSER_LOCAL_SERVICES_JSON` → `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`. Never bypass this; it's what makes local sandbox and production work from the same code.

### Email (Postmark)

`src/lib/postmark/send.ts` wraps a typed `sendTemplatedEmail` function. Template aliases are `"welcome-email"` and `"broadcast-update"`. Broadcast emails use the `POSTMARK_BROADCAST_MESSAGE_STREAM` stream; transactional ones use `POSTMARK_MESSAGE_STREAM`.

### Waitlist server action

`src/actions/waitlist.ts` — Server action for waitlist signup → sends a Postmark welcome email. Still needs: rate limiting (Upstash Redis), Supabase persistence to a `waitlist` table, and real product template fields. Do not convert to an API route.

### Stripe

`src/app/api/stripe/webhook/route.ts` — Webhook endpoint with signature verification. Business logic is a stub; wire real event handling here.

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

# Sandbox / local dev (GIC environment)
GIC_SERVER_SUPABASE_URL
GIC_BROWSER_LOCAL_SERVICES_JSON  # JSON array: [{alias:"supabase",port:54321,scheme:"http"}]
```

## CI workflows

Ten GitHub Actions workflows cover: build verification, TypeScript check, Bun tests, package security scan, Supabase preview-branch DB, staging/prod migrations, migration protection gate, and SQL linting. Supabase migrations live in `supabase/migrations/` and are reviewed before merging.
