# Conqueror Studios audit

Date: 2026-10-26  
Repository: `Joker5514/conqueror-studios-web`  
Baseline commit: `2258071c68d683f9b74aa506f77ed400573a6d55` (`chore: trigger Vercel deployment`)  
Branch with remediations: `fix/production-hardening`  
Production deployment of this branch: not performed

This audit records what the checked-out source, lockfile, GitHub metadata, and public probes showed. Items that could not be executed against live credentials are marked `NOT_VERIFIED` or `BLOCKED`. Secret values are not included.

## Counts

| Severity | Open after this branch | Fixed in this branch, not deployed | Blocked on something outside this repo |
|---|---|---|---|
| P0 | 0 | 1 | 0 |
| P1 | 0 | 6 | 1 |
| P2 | 4 | 4 | 0 |
| P3 | 0 | 0 | 0 |

Production still runs `2258071` until this branch is reviewed and promoted. The P0 fix is therefore not live.

## Production evidence

- Vercel production project `conqueror-studios-web` (team slug `randy-jordans-projects`). Latest production deployment observed: `dpl_E7VD7PJaAeE11uYk7X83kiePMC4E`, state `READY`, git SHA `2258071`, message `chore: trigger Vercel deployment`.
- `GET https://www.conqueror-studios.com/api/health` returned `{"status":"ok","ts":"2026-10-27T04:28:02.122Z","version":"2258071c68d683f9b74aa506f77ed400573a6d55"}`.
- Homepage `GET https://www.conqueror-studios.com/` returned 200.
- Apex host returned a 307 toward `https://www.conqueror-studios.com/`.
- `conquerorstudios.dev` DNS lookup failed: `No such host is known.` Probed 2026-10-27.
- `vercel env list` with decryption off returned an empty visible list. That call does not prove which variables are set. Production environment contents are `NOT_VERIFIED`. Values were not decrypted.

## Repositories inspected

| Repository | Role established from source | Edited in this pass |
|---|---|---|
| `Joker5514/conqueror-studios-web` | Studio site and control plane. Next.js 16.3.4, React 19.2.6, TypeScript 6.0.3, Bun 1.3.13. | Yes |
| `Joker5514/ai-bridge` | Drive-to-GitHub sync (Express, BullMQ, classifier). `main` last pushed 2026-08-04. Not the website tool bridge. | No |
| `Joker5514/ai-bridge-v2` | Multi-provider service. `main` OpenAPI paths: `/health`, `/tools/schema`, `/tools/{tool_name}/invoke`. Open unmerged PR #2 adds `X-Gateway-Secret` and `POST /v1/chat`. | No |
| `Joker5514/orchestrai-nexus` | Python FastAPI plus React stack. Website calls `POST {NEXUS_URL}/run`. Open unmerged PR #334 ("Nexus Brain"). | No |

Sibling test suites, Railway process health, and upstream secret checks are `NOT_VERIFIED`. These repositories were not merged or deployed.

## Google Drive inventory

Drive keyword search did not surface the assessment by filename. Reading file id `13CPfG1RnJvsjp2WAkgRS66MsTEvga_x7` succeeded. Modification dates below are included only when the Drive response provided them. Unreadable files were not treated as reviewed.

| File | Link | Modified | Purpose | Relevance | Finding |
|---|---|---|---|---|---|
| Conqueror Studios Portfolio Assessment (PDF) | https://drive.google.com/file/d/13CPfG1RnJvsjp2WAkgRS66MsTEvga_x7/view | 2026-10-26 (document date; Randy Jordan) | Portfolio scoring | High | Read in full. VoiceIsolate Pro ~4.2, nearest revenue. OrchestrAI Nexus ~2.5, prototype. scope/GitScope ~3.0. vibe ~3.5. AI Counselor ~2.0, non-clinical only. workflow-failure-copilot ~2.8. Website ~3.5 control plane. Instruction in the assessment: do not merge unrelated repositories. |
| Financial / capital planning document | https://docs.google.com/document/d/1lyV_hBhTdRFOH0MPcEgYgAPRU1BdpcP-p2_I_Lj26cQ/edit | not retrieved | Legal, tax, or investment planning | None for this code change | Partial text returned. It is not a product specification and was not implemented. |
| Architecture blueprint PDF (~11 MB) | Drive search hit; id not retained because the file was unreadable | not retrieved | Claimed architecture | Unknown | `readable: false`. Contents not reviewed. |
| Capital blueprint PDF | Drive search hit | not retrieved | Finance | None | `readable: false`. Not reviewed. |
| `feb88133.pdf` | Drive search hit | not retrieved | Unknown | Unknown | `readable: false`. Not reviewed. |
| Founder-ops mind maps (HTML) | Drive search hit | not retrieved | Planning notes | Unknown | Not opened as readable text. Not reviewed. |
| HOLO files | Drive search hit | not retrieved | Unknown | Unknown | Not reviewed. |
| Give capabilities to host and build agents | https://docs.google.com/document/d/1or4AcPR4pmV8uWBjg7lHJvaY3db0xemU/edit and https://docs.google.com/document/d/1YkSIks3080-mBZtsqmIgyqf4_pigpfCE/edit | not retrieved | Agent hosting notes | Possible | Not read. Not used as requirements. |
| Company context export | https://docs.google.com/document/d/1qJcEznQQ6L2h1xHqqxTkSeg0kH_s-DCuDlxSyKA3tHI/edit | not retrieved | Company context | Possible | Not read. |
| AI implementation notes | https://docs.google.com/document/d/1m5qdjhmraoVYy9wX_DP3kd2P-4vLRfH54V4VxYg5d24/edit | not retrieved | Implementation prompt | Possible | Not read. |
| `ai-implementation-prompt.md` | https://drive.google.com/file/d/1zjx4rTrN5ZwFYeNVdQu0BmtYxgLJLzCy/view and https://drive.google.com/file/d/1YzxWWGklg1tXhiukZZDwdcPu1J1NGTDP/view | not retrieved | Prompt | Possible | Not read. |
| `HOLO_PORTFOLIO_ORCHESTRATOR.md` | https://drive.google.com/file/d/1IChH-03I82Nhgxj9k9Lx9is3J8LZwMqf/view | not retrieved | Portfolio orchestration | Possible | Not read. |

No unread Drive file was used to justify a code change.

## Discrepancy matrix

| Intended | Documented before this branch | Actual implementation at `2258071` | Corrective action |
|---|---|---|---|
| Owner-only console | `CONSOLE_OWNER_EMAILS` described as optional; missing list treated as allow-all in several checks | Settings, Nexus, Bridge schema, and agent APIs did not consult the allowlist. Public signup already uses `shouldCreateUser: false`. | Fail closed. Empty list is 503 `console_unconfigured`. Non-owner is 403. Layouts redirect. |
| Live canonical origin `https://www.conqueror-studios.com` | Docs and some fallbacks still named `conquerorstudios.dev` and `middleware.ts` / Next 15 | Apex 307s to www. `.dev` has no DNS. `src/proxy.ts` is the Next.js 16 proxy. | Rewrite the retired host. Point metadata, sitemap, robots, and billing return URLs at the live origin. |
| Nexus and Bridge are different upstreams | Comments sometimes said "AI Bridge" without naming v2 | `NEXUS_URL` and `BRIDGE_URL` could fall through to loopback, and failures could surface upstream text. Agent run treated a chunked body as SSE. | Dedicated clients. HTTPS required except loopback. No implicit default. Buffered JSON. Size cap. Stable error codes. |
| Gateway, Nexus, and Bridge stay separate | Easy to conflate because Bridge v2 PR #2 also speaks `X-Gateway-Secret` | Website `POST /api/gateway` already checks `GATEWAY_SECRET` with SHA-256 and `timingSafeEqual`. Schema proxy is `GET /tools/schema`. | Leave the gateway implementation in place. Do not reuse `GATEWAY_SECRET` as `BRIDGE_SHARED_SECRET`. |
| Stripe webhook is durable | CLAUDE.md still said to wire subscription writes later | `constructEvent` existed, but a failed upsert still returned 200 and the Supabase error was ignored. | Return 500 when persistence fails. Keep signature failures at 400 with a generic body. |
| Waitlist does not claim a save it did not make | README describes Supabase persistence | Upsert could overwrite a row, and a missing service role could still look successful. | Insert. Unique violation `23505` returns success without a second email. Missing service role returns an error. |
| Product copy matches the access model | Homepage and project blurbs said multi-tenant | Any signed-in user was not a tenant admin, and the new gate limits the console to the allowlist. | Remove the multi-tenant claim. Real roles remain future work. |
| Upstream calls are authenticated service-to-service | Hardening notes assumed a shared secret | Nexus and Bridge v2 `main` do not, in the inspected contracts, require the headers this site can send. | Send `X-Nexus-Secret` and `X-Gateway-Secret` only when the optional env vars are set. Enforcement upstream is `BLOCKED`. |

## Findings

### P0 — Console allowlist was fail-open

- Location: historical `isOwnerEmail` checks, plus `src/app/api/console/settings/route.ts`, `src/app/api/nexus/route.ts`, `src/app/api/nexus/schema/route.ts`, and `src/app/api/agents/**` before this branch. Current gate: `decideConsoleOwner` and `requireConsoleOwner` in `src/lib/console-owner.ts`.
- Evidence: an empty `CONSOLE_OWNER_EMAILS` previously allowed owner actions. Several API routes checked only `getUser()`.
- Impact: any already provisioned non-owner session could read the waitlist, send broadcast mail, inspect which secrets exist, and spend Nexus or Bridge capacity. Public self-signup is already disabled (`shouldCreateUser: false` in `AuthForm`), which limits new accounts. It does not protect existing accounts.
- Root cause: the allowlist was optional and was not applied on every privileged route.
- Fix: empty or missing allowlist returns 503 `console_unconfigured`. Any other non-matching email returns 403. Console layouts redirect to `/auth?error=console_unconfigured` or `/auth?error=unauthorized`. Agent row ownership under RLS remains in place.
- Regression: `src/lib/console-owner.test.js`.
- Status: fixed on this branch. Not deployed. Promoting the branch without `CONSOLE_OWNER_EMAILS` locks `/console` until the variable is set. That is intentional.
- Dependency: Vercel production env. `NOT_VERIFIED` whether the variable is already set.

### P1 — Retired domain still appeared as a site origin

- Location: `src/lib/site-url.ts` `configuredSiteOrigin`, metadata in `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, billing return URL in `src/app/api/billing/portal/route.ts`.
- Evidence: DNS for `conquerorstudios.dev` failed. Live health and the apex redirect use `www.conqueror-studios.com`.
- Impact: unsubscribe, billing, and Open Graph links could point at a host that does not resolve. The billing portal previously trusted the request `Origin` header.
- Root cause: the documented extra domain was copied into fallbacks after it stopped resolving.
- Fix: canonical origin is `https://www.conqueror-studios.com`. The retired host and `www.conquerorstudios.dev` are rewritten. Other configured origins, including loopback and `https://${VERCEL_URL}`, are preserved. Billing return URL uses only `configuredSiteOrigin()`.
- Regression: `src/lib/site-url.test.js`.
- Status: fixed in source. The value of production `NEXT_PUBLIC_SITE_URL` is `NOT_VERIFIED`.

### P1 — Nexus and Bridge clients were unsafe by default

- Location: `src/lib/server-url.ts`, `src/lib/nexus-client.ts` (`postNexusRun`), `src/lib/bridge-client.ts` (`getBridgeToolSchema`), `src/app/api/agents/[id]/run/route.ts`.
- Evidence: these modules are now the only readers of `NEXUS_URL` and `BRIDGE_URL`. `readServerHttpUrl` returns `missing`, `invalid`, or `insecure`. HTTP is allowed only for `localhost`, `127.0.0.1`, and `::1`. Userinfo in the URL is rejected. Timeout is 60s for Nexus and 20s for Bridge. Bodies over 1,000,000 characters are rejected. Non-JSON bodies become a stable 502. Exception strings are not returned to the client.
- Impact: an unset URL could target a developer machine, and an upstream error body could leak into the browser. A chunked Nexus response was previously parsed as SSE even when it was not an event stream.
- Root cause: URL handling and response handling lived inline in routes, with a stream parser that treated any chunked body as events.
- Fix: one client per upstream. Agent runs persist the buffered JSON fields and return 502 when upstream status is not 2xx. Optional `NEXUS_SHARED_SECRET` (`X-Nexus-Secret`) and `BRIDGE_SHARED_SECRET` (`X-Gateway-Secret`) are attached only when set. `GATEWAY_SECRET` is not reused.
- Regression: `src/lib/server-url.test.js`. Route-level tests against a live Nexus are `NOT_VERIFIED` (no credentialed call).
- Status: fixed on this branch. Upstream verification of the shared secrets is the separate blocked P1 below.

### P1 — Stripe acknowledged writes that did not happen

- Location: `upsertSubscription` and `finalizeWebhookHttp` in `src/app/api/stripe/webhook/route.ts` and `src/lib/stripe-webhook-result.ts`.
- Evidence: `constructEvent` still verifies the signature. The catch now returns `400` with `Invalid Stripe webhook signature.` and does not echo Stripe's message. `upsertSubscription` returns false when `SUPABASE_SERVICE_ROLE_KEY` is missing or the Supabase error object is set. `persistenceFailed` then selects HTTP 500 `{ error: "Subscription persistence failed." }`. Success remains 200 `{ received: true }`. Upsert conflict target is `stripe_subscription_id`.
- Impact: Stripe would stop retrying while the `subscriptions` row was missing.
- Root cause: the handler treated "event received" as "event stored", and the client error object was ignored.
- Fix: 500 on persistence failure. Dunning mail uses `configuredSiteOrigin()` and `.catch` so an email failure does not fail the webhook.
- Regression: `src/lib/stripe-webhook-result.test.js`. A live Stripe delivery was not sent. `NOT_VERIFIED`.
- Status: fixed on this branch. No new `stripe_events` table. See the open P2 for duplicate dunning mail. Production migrations were not applied. The cancelled "Prod DB Migration" workflow on `062602d` was not rerun.

### P1 — Waitlist could report success without a durable insert

- Location: `src/actions/waitlist.ts`, `src/lib/waitlist-input.ts`.
- Evidence: the action now rejects a missing service-role key with `Waitlist storage is not configured.` It inserts instead of upserting. Postgres `23505` returns `{ ok: true }` and does not send another welcome email. Field caps: email 320, name 120, org 160, message 2000, at most 12 interests of 80 characters.
- Impact: a caller could be told they were saved when the row was not written, or a second submission could overwrite name, org, and message.
- Root cause: upsert plus a success path that did not require the admin client.
- Fix: as above. Confirmation email failure after a successful insert stays non-fatal. Signup rate limit remains 3 per minute per IP.
- Regression: `src/lib/waitlist-input.test.js`. A live insert was not executed. `NOT_VERIFIED`.
- Status: fixed on this branch.

### P1 — Public copy claimed multi-tenant console access

- Location: `src/app/layout.tsx` description, `src/lib/projects.ts` website blurb, `src/components/site/SiteFooter.tsx`.
- Evidence: the console is an allowlisted owner tool plus per-user RLS. There is no tenant role table.
- Impact: the site over-claimed who can create and run agents.
- Fix: description is now "Conqueror Studios builds instrumented agent workflows, voice-first interfaces, and the studio control plane." Footer no longer implies a multi-tenant product. The Open Graph text still mentions federated agentic architectures, which matches the lab positioning and is not an access-control claim.
- Status: fixed on this branch. A full homepage redesign was not done. PR #24 already adjusted the homepage.

### P1 — Service-to-service authentication is not enforced upstream

- Location: optional headers in `src/lib/nexus-client.ts` and `src/lib/bridge-client.ts`. AI Bridge v2 PR #2 (unmerged) is the change that adds gateway secret checks and `POST /v1/chat` on that service. `main` OpenAPI does not list that chat route.
- Evidence: this website will send the secrets when configured. Nothing in the inspected `main` contracts shows those headers being required. Making them required here would turn currently working calls into 503s.
- Impact: anyone who can reach the Railway URLs can call them if those services have no auth of their own. That upstream behavior was not probed with credentials.
- Status: `BLOCKED`. Owner for the next step is the Nexus and AI Bridge v2 maintainers. Do not point `BRIDGE_URL` at `Joker5514/ai-bridge`.

### P2 — Rate limits are per instance

- Location: `src/lib/rateLimit.ts`. New keys: `nexus:${user.id}` 20/min, `agent-run:${user.id}` 10/min, `broadcast:${user.id}` 3/hour. Gateway remains 30/min per IP. Waitlist remains 3/min per IP.
- Impact: a multi-instance Vercel deploy does not share counters.
- Status: open. A shared store was not added. No paid dependency.

### P2 — Payment-failed mail is not idempotent

- Location: `invoice.payment_failed` branch in `src/app/api/stripe/webhook/route.ts`.
- Impact: Stripe retries, or duplicate event delivery, can send more than one dunning email. Subscription upsert itself is idempotent on `stripe_subscription_id`.
- Status: open. A `stripe_events` migration was not added and was not applied to production.

### P2 — CI runners and Dependabot are unhealthy

- Evidence: workflow files use self-hosted labels including `superoptimizers`. Recent Dependabot runs on `main` were failing (examples visible on 2026-10-23). No open issues or pull requests existed on this repository at the start of the audit.
- Impact: a green local build does not imply GitHub Actions will run or pass. This branch's CI is recorded in `docs/release/RELEASE_VERIFICATION.md` after the pull request exists.
- Status: open. Production migration workflows were not rerun.

### P2 — Broadcast and browser headers

- Location: `src/app/api/console/broadcast/route.ts`, `src/lib/broadcast-url.ts`, `next.config.ts` `headers()`.
- Evidence: broadcast now requires an `https` CTA, caps fields, rate-limits, and logs `[broadcast] send failed` without the recipient address. The owner response may still list failed addresses. That is acceptable only because the route is owner-gated. Response headers on `/:path*` are `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and a Permissions-Policy that disables camera, microphone, and geolocation.
- Status: fixed on this branch. A Content-Security-Policy was not added. A safe policy was not proven against the current font and script setup.
- Regression: `src/lib/broadcast-url.test.js`.

### P2 — Public BYOK demo holds provider keys in the page

- Location: `src/components/MultiAIPlatform.tsx`.
- Evidence: keys stay in React state for the session. Workflows persist under `ai_bridge_workflows`. Calls go to provider APIs, including a direct browser Anthropic path. They are not sent to `POST /api/gateway`.
- Impact: a user who pastes a provider key exposes it to that provider and to any script running on the page. The studio server does not store it. Routing the demo through `/api/gateway` would spend server credentials or require exposing `GATEWAY_SECRET`. That was rejected.
- Status: accepted for this branch. A short disclosure was added in the settings panel. Keys are still not written to `localStorage`.

### P3

No cosmetic redesign was scheduled. Homepage work already landed in #24. Spending this change on visual polish while the allowlist, webhook, and upstream clients were wrong would have missed the priority order.

## Gateway review

`POST /api/gateway` was read and left in place. `authorizeGatewayRequest` in `src/lib/ai-gateway/auth.ts` requires `GATEWAY_SECRET` and compares SHA-256 digests with `timingSafeEqual`. Missing configuration is 503. A bad header is 401. The route rate-limits per IP. It is a different product path from `POST /api/nexus` and `GET /api/nexus/schema`.

## What was not verified

- Production and preview environment variable presence, including `CONSOLE_OWNER_EMAILS`.
- Supabase dashboard "disable sign up" setting. The app sets `shouldCreateUser: false`. The dashboard can still diverge.
- Live waitlist insert, Stripe webhook delivery, Nexus `/run`, and Bridge `/tools/schema`.
- Test suites inside `ai-bridge`, `ai-bridge-v2`, and `orchestrai-nexus`.
- Row Level Security against a running database. Migrations were reviewed and not applied.
- Owner-console browser login. No owner session was available.
