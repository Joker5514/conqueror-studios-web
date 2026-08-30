# Conqueror Studios Web

Official website and control-plane for **Conqueror Studios** — an independent AI R&D lab building multi-agent orchestration, voice-first interfaces, and federated agentic architectures.

**Live**: [conquerorstudios.dev](https://conquerorstudios.dev)  
**Lab director**: Randy Jordan — AI Architect & Systems Researcher, Mobile, Alabama

---

## What this is

The marketing and research-facing website for Conqueror Studios, featuring:

- **Flagship project showcase** — OrchestrAI Nexus, AI Bridge, VoiceIsolate Pro, AI Counselor
- **Waitlist system** — email capture with Postmark confirmation and Supabase persistence
- **Agent Studio** (`/console/agents`) — create, configure, and run AI agents against OrchestrAI Nexus
- **Admin console** (`/console`) — waitlist management, settings, broadcast emails
- **Billing** — Stripe-integrated donation and subscription flows

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 6 (strict) |
| Styles | Tailwind CSS 4, dark-only HUD aesthetic |
| Data | Supabase (SSR, RLS, migrations) |
| State | React Query 5 |
| Email | Postmark (transactional + broadcast) |
| Payments | Stripe (webhooks, billing portal) |
| Package manager | Bun 1.3 |
| Deployment | Vercel (preview + production) |

---

## Local setup

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.3
- [Node.js](https://nodejs.org/) ≥ 20 (required by ESLint scripts)
- [Git](https://git-scm.com/) ≥ 2.40

### Quickstart

```bash
git clone https://github.com/Joker5514/conqueror-studios-web.git
cd conqueror-studios-web

# Installs deps, copies .env.example → .env.local, runs quality gate
bash scripts/setup.sh
```

Fill in `.env.local` with your real credentials (see [docs/local-env.md](docs/local-env.md)), then:

```bash
bun dev
# → http://localhost:3000
```

---

## Development commands

```bash
bun dev              # Next.js dev server (Turbopack)
bun run build        # Production build
bun run typecheck    # tsc --noEmit (strict mode)
bun run lint         # localhost guard + ESLint
bun test             # Bun test runner
bun test --coverage  # With code coverage
```

**Run all three quality gates before opening a PR:**

```bash
bun run typecheck && bun run lint && bun test
```

---

## Environment variables

Copy `.env.example` to `.env.local` and populate all values. See [docs/local-env.md](docs/local-env.md) for a full reference and troubleshooting guide.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (browser-safe) |
| `SUPABASE_URL` | recommended | Server-side URL override (avoids browser proxy) |
| `SUPABASE_ANON_KEY` | recommended | Server-side anon key override |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key — server-only, never expose |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical public URL for links in emails |
| `POSTMARK_SERVER_TOKEN` | optional | Postmark API token for transactional email |
| `POSTMARK_FROM_EMAIL` | optional | Verified sender address in Postmark |
| `STRIPE_SECRET_KEY` | optional | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | optional | Stripe webhook signing secret |
| `NEXUS_URL` | optional | OrchestrAI Nexus service URL (server-only) |
| `BRIDGE_URL` | optional | AI Bridge service URL (server-only) |

---

## Database

Migrations live in [`supabase/migrations/`](supabase/migrations/). See [docs/supabase-setup.md](docs/supabase-setup.md) for the full setup guide, RLS policies, and how to add new migrations.

```bash
# Apply migrations to your linked Supabase project
supabase db push

# Reset the local Supabase stack (Docker required)
supabase db reset
```

---

## Project structure

```
src/
  actions/          Next.js server actions (waitlist.ts)
  app/              App Router pages and API routes
    api/            Backend API routes (health, nexus, agents, stripe, …)
    console/        Protected admin console (/console/**)
    auth/           Magic-link auth pages
  components/
    site/           Shared UI: SiteHeader, SiteFooter, ProjectCard, …
  hooks/
    api/            React Query hooks (useAgents, useNexus, useConsoleWaitlist, …)
  lib/
    supabase/       Browser / server / admin Supabase client factories
    postmark/       Typed email sender
    agents/         Agent types and starter templates
    rateLimit.ts    In-process sliding-window rate limiter
    projects.ts     Project metadata (flagships, in-study, repo index)
supabase/
  migrations/       SQL migration files
docs/
  local-env.md      Local setup guide
  supabase-setup.md Supabase project setup and RLS reference
  ai-gateway.md     AI Gateway Phase 1 spec
```

---

## Deployment

Deployments are managed through Vercel. The `main` branch auto-deploys to production; every PR gets a preview deployment.

Required Vercel environment variables: all variables listed in `.env.example` (Supabase, Postmark, Stripe, site URL, Nexus/Bridge URLs). See [docs/local-env.md](docs/local-env.md).

---

## Contributing

1. Branch from `main`: `git checkout -b feat/your-feature`
2. Run `bun run typecheck && bun run lint && bun test` — all must pass
3. Open a PR against `main` and assign `@Joker5514`
4. Follow [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages

---

## Architecture principles

- **Git-native everything** — configs, prompts, agent state, and replays live in repos
- **Federated, not monolithic** — specialized agents on a shared bus
- **Voice as first-class surface** — latency, prosody, and barge-in are product decisions
- **Determinism and evals** — every flow ships with golden replays and regression suites

---

© 2026 Conqueror Studios. Independent AI R&D. Built in the open.
