# Conqueror Studios — Web

**Lab director**: Randy Jordan — AI Architect & Systems Researcher, Mobile, Alabama
**Status**: Active — independent AI R&D lab identity

The marketing and research-facing website for **Conqueror Studios**, an independent
AI R&D lab focused on federated agentic architectures, multi-agent orchestration,
voice-first interfaces, and evaluation/observability for production AI systems.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Runtime / package manager | [Bun](https://bun.sh) `1.3.x` |
| Language | TypeScript (strict) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Server state | [TanStack React Query](https://tanstack.com/query) |
| Data / auth | [Supabase](https://supabase.com) (Postgres + SSR auth) |
| Transactional email | [Postmark](https://postmarkapp.com) |
| Payments | [Stripe](https://stripe.com) (webhook scaffold) |
| Hosting | [Vercel](https://vercel.com) (`vercel.json` sets `framework: nextjs`) |

---

## Getting started

```bash
# Install dependencies
bun install

# Copy and fill environment variables
cp .env.example .env.local

# Run the dev server (http://localhost:3000)
bun run dev
```

### Scripts

| Script | Purpose |
|--------|---------|
| `bun run dev` | Start the local dev server |
| `bun run build` | Production build |
| `bun run start` | Serve the production build |
| `bun run lint` | Browser-localhost check + ESLint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Run the test suite (`bun test`) |

Run `bun run lint`, `bun run typecheck`, and `bun run test` before opening a PR.

---

## Environment variables

See [`.env.example`](./.env.example) for the full list. The site degrades
gracefully when integrations are unconfigured (it still renders), so only wire
up what you need:

- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  and `SUPABASE_SERVICE_ROLE_KEY` (server-only) to persist waitlist signups.
- **Postmark** — `POSTMARK_SERVER_TOKEN` and `POSTMARK_FROM_EMAIL` to send
  waitlist confirmation emails.
- **Stripe** — `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for the
  `/api/stripe/webhook` endpoint.

---

## Project layout

```
src/
  actions/        Server actions (e.g. waitlist signup)
  app/            App Router routes, layouts, and API routes
  components/     UI components (site/* for shared layout chrome)
  hooks/          Custom hooks (e.g. useMountEffect)
  lib/            Integrations and helpers (supabase, postmark, projects)
  proxy.ts        Next.js middleware (session refresh)
supabase/
  migrations/     SQL migrations (RLS-enabled)
```

---

## Conventions

See [`AGENTS.md`](./AGENTS.md). Highlights:

- Use React Query for server state — do **not** fetch in `useEffect` (enforced
  by custom ESLint rules; `useMountEffect` is the only escape hatch).
- Avoid barrel imports/exports — import the concrete module file.
- Prefer named imports; the only allowed namespace import is `import * as React`.

---

## Deploy

Deploys to Vercel as a standard Next.js app:

- **Framework preset**: `Next.js` (already declared in `vercel.json`)
- **Build command**: `bun run build` (Vercel auto-detects)
- **Install command**: `bun install`
- Add the environment variables above in the Vercel project settings.

---

© Conqueror Studios. Independent AI R&D. Built in the open.
