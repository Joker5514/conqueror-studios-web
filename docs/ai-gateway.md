# AI Gateway (Phase 1)

Server-side multi-provider AI entrypoint for **conqueror-studios-web**.  
Browser code must never hold provider API keys.

## Endpoint paths

| Path | Status |
|------|--------|
| **`POST /api/gateway`** | **Stable entrypoint (this PR)** |
| `POST /api/ai` | **Does not exist** — do not use |
| `POST /api/nexus` | Separate OrchestrAI Nexus `/run` proxy (session auth, not this gateway) |
| `GET /api/nexus/schema` | Separate AI Bridge tools schema proxy |

Implementation: `src/app/api/gateway/route.ts`

---

## Authentication

| Item | Value | Notes |
|------|--------|--------|
| Header name | **`X-Gateway-Secret`** | **Confirmed** Phase-1 |
| Env var (server-only) | **`GATEWAY_SECRET`** | **Confirmed** — must match header value |
| Comparison | Constant-time (SHA-256 digests) | Missing/wrong → `401` |
| Unset secret | `503` `gateway_misconfigured` | Fail closed |

**Never** put `GATEWAY_SECRET` or provider keys in `NEXT_PUBLIC_*`.

---

## Request

```http
POST /api/gateway
Content-Type: application/json
X-Gateway-Secret: <GATEWAY_SECRET>
```

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "user", "content": "Say hello in one sentence." }
  ],
  "temperature": 0.4,
  "max_tokens": 256
}
```

Or single-turn:

```json
{
  "provider": "anthropic",
  "input": "Summarize AI safety in one sentence."
}
```

### Providers (canonical)

| `provider` | Aliases | Server env (confirmed) |
|------------|---------|------------------------|
| `openai` | — | `OPENAI_API_KEY` |
| `anthropic` | `claude` | `ANTHROPIC_API_KEY` |
| `xai` | `grok` | `XAI_API_KEY` |

### Success response

```json
{
  "id": "chatcmpl-…",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "output_text": "Hello…",
  "usage": {
    "input_tokens": 12,
    "output_tokens": 8,
    "total_tokens": 20
  }
}
```

Provider raw payloads are **not** returned (avoids leaking provider metadata).


### Error response

```json
{
  "error": "Unauthorized",
  "code": "unauthorized"
}
```

Common codes: `unauthorized`, `gateway_misconfigured`, `rate_limited`, `invalid_provider`, `invalid_messages`, `provider_misconfigured`, `provider_error`, `provider_unreachable`.

---

## Routing modes

| `AI_GATEWAY_MODE` | Behavior |
|-------------------|----------|
| *(unset)* / `direct` | **Default.** Call OpenAI / Anthropic / xAI HTTP APIs from this route using server env keys. |
| `upstream` | Forward JSON body to `AI_GATEWAY_UPSTREAM_URL` (server-only absolute URL). Forwards `X-Gateway-Secret` if present. |

Optional env names for non-default routing: `AI_GATEWAY_MODE`, `AI_GATEWAY_UPSTREAM_URL`.

Related existing env (not used by `/api/gateway` unless you point upstream at them yourself):

- `NEXUS_URL` — used only by `POST /api/nexus` → Nexus `/run`
- `BRIDGE_URL` — used only by `GET /api/nexus/schema` → Bridge tools schema

---

## Required / optional env vars (names only)

### Server-only (runtime — set in Vercel Project → Settings → Environment Variables)

| Name | Required when | Public? |
|------|----------------|---------|
| `GATEWAY_SECRET` | Always (for `/api/gateway`) | **No** |
| `OPENAI_API_KEY` | `direct` + provider `openai` | **No** |
| `ANTHROPIC_API_KEY` | `direct` + provider `anthropic` | **No** |
| `XAI_API_KEY` | `direct` + provider `xai` | **No** |
| `AI_GATEWAY_MODE` | Optional (`direct` \| `upstream`) | **No** |
| `AI_GATEWAY_UPSTREAM_URL` | `upstream` mode | **No** |

### Public (browser-safe) — **not used by the gateway**

| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon |

Optional public helper for **client apps that only need the path** (never the secret):

| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_GATEWAY_URL` | Optional; e.g. `/api/gateway` — path only, no secrets |

---

## Vercel configuration notes

1. Add secrets under **Runtime** environments (Production + Preview).  
   Build-time injection is unnecessary for these keys; the route uses `process.env` at request time.
2. **Do not** prefix provider keys or `GATEWAY_SECRET` with `NEXT_PUBLIC_`.
3. After changing env vars, redeploy Preview/Production so serverless instances pick them up.
4. Preview deploys from PRs should use **Preview** env values (can use separate test keys + a distinct `GATEWAY_SECRET`).
5. Rotate secrets by: create new value → update Vercel → redeploy → update callers → revoke old value.

---

## Rate limiting

In-process sliding window via `src/lib/rateLimit.ts`: **30 requests / IP / minute** for `/api/gateway`.  
Multi-instance Vercel traffic is not globally coordinated; upgrade to Redis later if needed.

---

## Local test

```bash
# From repo root — ensure .env.local has GATEWAY_SECRET + at least one provider key
bun run dev
```

```bash
# Export the same secret you put in .env.local (Next does not inject it into your shell)
export GATEWAY_SECRET=dev-secret

curl -sS -X POST "http://localhost:3000/api/gateway" \
  -H "Content-Type: application/json" \
  -H "X-Gateway-Secret: $GATEWAY_SECRET" \
  -d "{\"provider\":\"openai\",\"input\":\"Reply with the word pong only.\"}"
```

Expect `200` and JSON with `output_text`.  
Without the header (or with wrong secret): `401`.  
Without `GATEWAY_SECRET` in env: `503`.

---

## Vercel Preview test

1. Open the PR Preview URL (Vercel deployment).
2. Ensure Preview env has `GATEWAY_SECRET` and provider keys.
3. Run the same curl against `https://<preview-host>/api/gateway`.
4. Confirm Network tab in the browser never receives provider keys (only your app’s server may call the gateway with the secret — and the secret must not be embedded in client bundles).

---

## Minimal server-side call (example)

```ts
// Server Component / Route Handler / Server Action only — not in client components
const res = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/gateway`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Gateway-Secret": process.env.GATEWAY_SECRET!, // server-only
  },
  body: JSON.stringify({
    provider: "xai",
    model: "grok-2",
    messages: [{ role: "user", content: "Hi" }],
  }),
});
```

For **other repos** calling this deployment, store `GATEWAY_SECRET` and the production base URL as server-only env on the caller; never ship them as `VITE_*` / `NEXT_PUBLIC_*`.

---

## Identifier summary (Phase-1 confirmed)

| Role | Identifier | Status |
|------|------------|--------|
| Auth header | `X-Gateway-Secret` | Confirmed |
| Auth env | `GATEWAY_SECRET` | Confirmed |
| Default mode | direct-to-providers | Confirmed |
| Mode env | `AI_GATEWAY_MODE` | Optional (`direct` \| `upstream`) |
| Upstream URL env | `AI_GATEWAY_UPSTREAM_URL` | Optional |
| Provider keys | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY` | Confirmed |

### Client secret audit (this repo)

- No provider keys or `GATEWAY_SECRET` are exposed via `NEXT_PUBLIC_*`.
- Gateway route and `src/lib/ai-gateway/*` use server-only `process.env` only.
- `MultiAIPlatform` (AI Bridge demo) is **BYOK**: keys are entered in the browser by the user and sent directly to providers — not loaded from env. Production callers should use `POST /api/gateway` from **server-side** code instead.
- Client-secret remediations for **uncle-vito** / **stake-affiliate-vito** are out of this repository; point those apps at this gateway with server-only `GATEWAY_SECRET`.
