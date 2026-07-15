# AGENTS.md

## Frontend Rules

- Use React Query for server state and API loading. Do not fetch in `useEffect`.
- Treat new direct `useEffect` / `React.useEffect` usage as banned by default.
- Before adding an effect, prefer render-time derivation, event handlers, or a parent `key` reset.
- Use `src/hooks/useMountEffect.ts` only for true mount/unmount synchronization with an external system.
- Keep direct `src/api/**` imports inside `src/hooks/api/**` so UI code consumes hooks instead of raw API helpers.
- Avoid barrel imports and barrel exports. Import the concrete file instead of `index` re-export layers.
- Prefer named imports. The only allowed namespace import is `import * as React from "react"`.
- Use `@chenglou/pretext` for text-heavy responsive layout, multiline height
  prediction, shrink-wrapped text blocks, and overflow prevention instead of
  DOM measurement loops. Keep text accessible in the DOM, call `prepare()` only
  when the text/font changes, and call `layout()` on width changes.

## Working Style

- Run `bun run lint`, `bun run typecheck`, and `bun run test` before finishing changes.
- Preserve the seeded Next.js, Bun, Tailwind, and React Query baseline instead of re-scaffolding the app.

## Console Rules

- `src/app/console/**` routes are protected. Every `layout.tsx` in this subtree must perform a
  server-side Supabase session check and redirect unauthenticated visitors to `/auth`.
- `src/app/api/nexus/route.ts` is the **only** place the `NEXUS_URL` env var is used.
  UI components call `/api/nexus` — never the Nexus service directly.
- `src/app/api/nexus/schema/route.ts` is the **only** place the `BRIDGE_URL` env var is used.
- `src/app/api/console/waitlist/route.ts` is the console admin data endpoint. Auth-gated; reads
  via service-role client to bypass RLS.
- Trace data from Nexus is displayed read-only. The console never mutates Nexus or Bridge state.
- Use React Query for all console data fetching (`useNexusRun`, `useNexusSchema`, `useConsoleWaitlist`).
  No raw `fetch()` calls in components.

## Auth Routes

- `/auth` — magic-link sign-in page (`src/app/auth/page.tsx` + `AuthForm.tsx`).
- `/auth/callback` — Supabase PKCE exchange route (`src/app/auth/callback/route.ts`).
- `middleware.ts` — runs `updateSession()` on every request to refresh auth cookies.
  Excludes `/api/health` and `/api/stripe/webhook` from session overhead.

## API Routes (Phase 1)

- `GET /api/health` — public uptime probe, no auth, returns `{ status, ts, version }`.
- `POST /api/nexus` — auth-gated Nexus proxy (NEXUS_URL server-only).
- `GET /api/nexus/schema` — auth-gated Bridge tool registry (BRIDGE_URL server-only).
- `GET /api/console/waitlist` — auth-gated admin waitlist read (service-role key).
- `POST /api/stripe/webhook` — Stripe event handler with signature verification.

## Service Integration Rules

- `NEXUS_URL` — env var pointing to orchestrai-nexus. Used only in `src/app/api/nexus/route.ts`.
- `BRIDGE_URL` — env var pointing to ai_bridge. Used only in `src/app/api/nexus/schema/route.ts`.
- Both vars must be set in Vercel environment settings. They are never exposed to the browser bundle.
