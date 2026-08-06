# Local Environment Setup

A quick checklist for getting the Conqueror Studios dev server running locally.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Bun** | ≥ 1.3 | `curl -fsSL https://bun.sh/install \| bash` |
| **Node.js** | ≥ 20 | [nodejs.org](https://nodejs.org/) or [volta.sh](https://volta.sh/) |
| **Git** | ≥ 2.40 | [git-scm.com](https://git-scm.com/) |

---

## 1-minute quickstart

```bash
# Clone the repo
git clone https://github.com/Joker5514/conqueror-studios-web.git
cd conqueror-studios-web

# Bootstrap (copies .env.example → .env.local, installs deps, runs quality gate)
bash scripts/setup.sh
```

Then open `.env.local` and fill in the real values (see below), then:

```bash
bun dev
# → http://localhost:3000
```

---

## .env.local reference

Copy `.env.example` to `.env.local` and fill in each variable:

```dotenv
# ── Supabase ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service-role key — server-only, never expose>

# ── Postmark ──────────────────────────────────────────────────────────────
POSTMARK_SERVER_TOKEN=<token from Postmark → Servers → API Tokens>
POSTMARK_FROM_EMAIL=no-reply@conquerorstudios.dev

# ── Stripe ────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Site URL ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # change to production URL on Vercel

# ── Backend services (server-only) ────────────────────────────────────────
NEXUS_URL=http://localhost:8000             # OrchestrAI Nexus
BRIDGE_URL=http://localhost:8001            # AI Bridge
```

> **Security note**: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `POSTMARK_SERVER_TOKEN`, `NEXUS_URL`, and `BRIDGE_URL` are server-only and must **never** appear in code with a `NEXT_PUBLIC_` prefix.

---

## Development commands

```bash
bun dev              # Start Next.js dev server with Turbopack
bun run build        # Production build (run before opening any PR)
bun run typecheck    # TypeScript strict check — must exit 0
bun run lint         # ESLint + Biome + localhost guard — must exit 0
bun test             # Bun test runner — all tests must pass
bun test --coverage  # With coverage report
```

---

## Supabase locally (optional, fully offline)

See [`docs/supabase-setup.md`](./supabase-setup.md#6-local-supabase-fully-offline-dev) for running a full Supabase stack with Docker.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module '@/...'` | Run `bun install` and restart the dev server |
| Fonts not loading | The Google Fonts `<link>` in `layout.tsx` requires an internet connection |
| Auth redirect loop | Set `Site URL` in Supabase dashboard to `http://localhost:3000` |
| `MISSING_SUPABASE_SERVER_ENV_ERROR` | Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` |
| Port 3000 in use | `bun dev -- -p 3001` to use a different port |
