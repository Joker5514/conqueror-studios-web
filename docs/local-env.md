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
POSTMARK_FROM_EMAIL=no-reply@conqueror-studios.com

# ── Stripe ────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Site URL ──────────────────────────────────────────────────────────────
# Local dev may use http://127.0.0.1:3000.
# Production on Vercel must be https://www.conqueror-studios.com.
# conquerorstudios.dev does not resolve and is rewritten to the www host.
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000

# ── Console access (required for /console and owner APIs) ────────────────
# Comma-separated. Empty or unset fails closed with 503 console_unconfigured.
CONSOLE_OWNER_EMAILS=you@example.com

# ── Backend services (server-only) ────────────────────────────────────────
# HTTP is accepted only for loopback. There is no implicit localhost default.
NEXUS_URL=http://127.0.0.1:8000             # OrchestrAI Nexus POST /run
BRIDGE_URL=http://127.0.0.1:8001            # AI Bridge v2 GET /tools/schema
# Optional. Sent upstream only when set. Leave empty until that service checks them.
# NEXUS_SHARED_SECRET=
# BRIDGE_SHARED_SECRET=
# GATEWAY_SECRET=                           # required before POST /api/gateway accepts calls
```

> **Security note**: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `POSTMARK_SERVER_TOKEN`, `GATEWAY_SECRET`, `NEXUS_SHARED_SECRET`, `BRIDGE_SHARED_SECRET`, `NEXUS_URL`, and `BRIDGE_URL` are server-only and must never appear in code with a `NEXT_PUBLIC_` prefix. The public AI Bridge demo on the site keeps provider keys in browser memory and sends them to the provider. It does not use `/api/gateway`.

The sender address must be a domain Postmark has verified. `conquerorstudios.dev` had no DNS on 2026-10-27, so do not use it for the public site or for new mail. `.env.example` may still show an older sender until Postmark verification of `conqueror-studios.com` is confirmed. Email deliverability is `NOT_VERIFIED` from this repository alone.

---

## Development commands

```bash
bun dev              # Start Next.js dev server with Turbopack
bun run build        # Production build (run before opening any PR)
bun run typecheck    # TypeScript strict check — must exit 0
bun run lint         # ESLint + localhost guard — must exit 0
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
| Auth redirect loop | Set `Site URL` in the Supabase dashboard to the origin you actually open, and add that origin's `/auth/callback` to the redirect allowlist. Production is `https://www.conqueror-studios.com`. |
| Console returns to `/auth?error=console_unconfigured` | Set `CONSOLE_OWNER_EMAILS` to the signed-in address. An empty allowlist is intentional. |
| Console returns to `/auth?error=unauthorized` | The session is valid and the address is not on the allowlist. |
| `MISSING_SUPABASE_SERVER_ENV_ERROR` | Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` |
| Port 3000 in use | `bun dev -- -p 3001` to use a different port |
