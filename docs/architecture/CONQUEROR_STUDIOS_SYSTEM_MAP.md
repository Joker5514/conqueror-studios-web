# Conqueror Studios system map

Verified against `conqueror-studios-web` at branch `fix/production-hardening` (base `2258071`) and against the public contracts of the sibling repositories named below. Live calls into Nexus, Bridge, Supabase, and Stripe were not made. Those edges are marked `NOT_VERIFIED`.

## Repository roles

```
Browser
  │
  ├─ public pages (marketing, waitlist form, BYOK demo)
  ├─ /auth magic link
  └─ /console  ── session + CONSOLE_OWNER_EMAILS
        │
        ▼
conqueror-studios-web  (Vercel, Next.js 16 App Router)
  │
  ├─ POST /api/gateway ──────────► provider APIs using server keys
  ├─ POST /api/nexus ────────────► orchestrai-nexus  POST /run
  ├─ GET  /api/nexus/schema ─────► ai-bridge-v2      GET /tools/schema
  ├─ POST /api/stripe/webhook ◄── Stripe
  ├─ waitlist + agents + subscriptions ──► Supabase (RLS + service role)
  └─ email ──► Postmark
```

| Repository | What it is | What the website uses |
|---|---|---|
| `Joker5514/conqueror-studios-web` | Studio site, owner console, waitlist, billing, and three server-side AI edges. | This repository. |
| `Joker5514/orchestrai-nexus` | Agent runtime. FastAPI and a React app. Open PR #334 is unmerged. | `NEXUS_URL` + `POST /run`. |
| `Joker5514/ai-bridge-v2` | Tool and provider service. `main` exposes health, tool schema, and tool invoke. PR #2 (unmerged) adds a secret header and `POST /v1/chat`. | `BRIDGE_URL` + `GET /tools/schema`. |
| `Joker5514/ai-bridge` | Drive and GitHub synchronization worker. Different product. Last `main` push observed 2026-08-04. | Nothing. Do not set `BRIDGE_URL` to this service. |
| VoiceIsolate Pro, AI Counselor, and the other portfolio repos | Separate products. The assessment says not to merge them into the website. | Marketing links and copy only. |

Canonical recommendation, from the contracts above:

- Keep `ai-bridge` and `ai-bridge-v2` as separate repositories.
- The website tool-schema client matches AI Bridge v2 `main`: `GET /tools/schema`.
- The website chat gateway stays `POST /api/gateway` inside this repository. It is not a proxy to either Bridge repo.
- AI Bridge v2 PR #2 is the candidate if the studio later wants that service to host `POST /v1/chat` with `X-Gateway-Secret`. It is not merged, so this site does not call `/v1/chat`.
- Nexus stays the `/run` upstream. Do not fold it into the gateway.

## Request paths

### `POST /api/gateway`

1. `src/app/api/gateway/route.ts` rate-limits `ai-gateway:${ip}` to 30 requests per minute.
2. `authorizeGatewayRequest` (`src/lib/ai-gateway/auth.ts`) requires `GATEWAY_SECRET`. Comparison is SHA-256 plus `timingSafeEqual`. Unset secret: 503 `gateway_misconfigured`. Mismatch: 401.
3. The route validates the body and calls the configured provider with server-side credentials.
4. The public page `MultiAIPlatform` does not call this route. Keys typed there stay in React state and go to the provider from the browser.

### `POST /api/nexus`

1. `requireConsoleOwner()` (`src/lib/console-owner.ts`): no session returns 401, empty allowlist returns 503, other emails return 403.
2. Rate limit `nexus:${user.id}` is 20 requests per minute in this process.
3. `query` is required and capped at 8000 characters.
4. `postNexusRun` (`src/lib/nexus-client.ts`) is the only reader of `NEXUS_URL`. It POSTs JSON to `{base}/run` with a 60 second timeout. `X-Nexus-Secret` is set only when `NEXUS_SHARED_SECRET` is set.
5. A JSON body is forwarded with the upstream status. Network failure, timeout, oversize body, and non-JSON become stable codes (`nexus_timeout`, `nexus_unreachable`, `nexus_response_too_large`, `nexus_invalid_response`) and do not include the exception string.
6. Expected JSON fields consumed by the console are `correlation_id`, `routing_mode`, `result`, and `trace`. The live Nexus process was not called. Shape compatibility is `NOT_VERIFIED`.

### `GET /api/nexus/schema`

1. Same owner gate as Nexus.
2. `getBridgeToolSchema` (`src/lib/bridge-client.ts`) is the only reader of `BRIDGE_URL`. It GETs `{base}/tools/schema` with a 20 second timeout.
3. `X-Gateway-Secret` on this outbound call comes from `BRIDGE_SHARED_SECRET` only. It is not `GATEWAY_SECRET`.
4. AI Bridge v2 `main` documents this path. Whether the deployed Railway service matches `main` is `NOT_VERIFIED`.

### Agent run

`POST /api/agents/[id]/run` uses the owner gate, then a per-user RLS read of the agent, then the service-role client to insert an `agent_runs` row. The Nexus call is the buffered `postNexusRun` path. The previous chunked-as-SSE parser was removed. Input is capped at 16000 characters. Rate limit is 10 runs per minute per user. Non-2xx upstream responses persist a failure and return 502. Service-role updates bypass RLS on `agent_runs` by design. The route sets `user_id` from the session.

## Authentication

| Surface | Check |
|---|---|
| `/auth` | `signInWithOtp` with `shouldCreateUser: false`. |
| `/auth/callback` | Supabase PKCE exchange. |
| `src/proxy.ts` | Refreshes the session cookie. Skips `/api/health` and `/api/stripe/webhook`. |
| `/console/**` layouts | Session required, then `consoleOwnerRedirectPath()`. |
| Owner APIs | `requireConsoleOwner()`, then RLS where the table has a user owner. |
| `POST /api/gateway` | Shared secret header. No user session. |
| `POST /api/stripe/webhook` | `stripe.webhooks.constructEvent`. |
| `POST /api/billing/portal` | Signed-in user, own customer. Not owner-gated. Return URL is `configuredSiteOrigin() + /billing`. |
| Unsubscribe | HMAC token in `src/lib/unsubscribe-token.ts`. |

`CONSOLE_OWNER_EMAILS` is a comma-separated, case-insensitive list. Until a role table exists, the whole owner console fails closed. That blocks the product-strategy idea of a public multi-tenant Agent Studio. Per-user RLS on `agents` does not replace the allowlist.

## Data

Migrations, not applied by this change:

- `supabase/migrations/20240618000000_create_waitlist.sql` — `waitlist`, unique email, RLS, writes via service role.
- `supabase/migrations/20250101000000_create_subscriptions.sql` — Stripe ids, status, plan, periods.
- `supabase/migrations/20260719150420_create_agents.sql` — per-user RLS.
- `supabase/migrations/20260719150421_create_agent_runs.sql` — runs scoped to the owner.

Waitlist signup inserts. A unique violation returns success without a second email. Stripe subscription writes upsert on `stripe_subscription_id`. A failed write returns HTTP 500 so Stripe retries. There is no event-id ledger.

## Public origin

`configuredSiteOrigin()` in `src/lib/site-url.ts`:

1. `https://www.conqueror-studios.com` when `NEXT_PUBLIC_SITE_URL` is unset or is `conquerorstudios.dev` / `www.conquerorstudios.dev`.
2. Any other `http` or `https` origin from `NEXT_PUBLIC_SITE_URL`, including local development.
3. Else `https://${VERCEL_URL}` when that variable is present.
4. Else the canonical www origin.

DNS evidence: `.dev` did not resolve. Apex redirects to www. Production `NEXT_PUBLIC_SITE_URL` contents are `NOT_VERIFIED`.

## Security headers

`next.config.ts` sets, on every path: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. No Content-Security-Policy.

## Environment classification

| Variable | Exposure | Required for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser | Auth and RLS reads |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Server | Preferred server Supabase endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Waitlist, subscriptions, agent run rows |
| `CONSOLE_OWNER_EMAILS` | Server | Console and owner APIs. Empty means 503. |
| `GATEWAY_SECRET` | Server | `POST /api/gateway` |
| `NEXUS_URL`, `BRIDGE_URL` | Server | Upstream base URLs. No default. |
| `NEXUS_SHARED_SECRET`, `BRIDGE_SHARED_SECRET` | Server | Optional outbound headers |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Server | Billing and webhooks |
| `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_EMAIL` | Server | Mail |
| `UNSUBSCRIBE_TOKEN_SECRET` | Server | Unsubscribe links |
| `NEXT_PUBLIC_SITE_URL` | Browser bundle | Absolute links. Retired host is rewritten. |

Server URL checks reject non-loopback `http` and reject URLs that contain a username or password.

## Operational limits

- Rate limits live in a process-local `Map`. They reset on cold start and are not shared across instances.
- Timeouts: Nexus 60s, Bridge schema 20s, gateway has its own route limits.
- Cancel is `AbortSignal.timeout`. There is no separate user-facing cancel token for an in-flight Nexus run.
- Non-idempotent mail (welcome email, dunning email) is not retried by this app after a successful provider acceptance. Stripe may redeliver `invoice.payment_failed`, and that can send dunning mail again.
