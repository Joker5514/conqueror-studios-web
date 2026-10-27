# Development completion plan

Baseline: `2258071` on `main`, production deployment `dpl_E7VD7PJaAeE11uYk7X83kiePMC4E` (`READY`).  
This plan is the remaining work after `fix/production-hardening`. It is not a new product design.

## Done on this branch

Acceptance for each item is the regression test or the code path named in `docs/audits/CONQUEROR_STUDIOS_AUDIT.md`. None of these items are in the production deployment yet.

1. Fail-closed `CONSOLE_OWNER_EMAILS` on console layouts and owner APIs.
2. Nexus and Bridge clients with timeouts, size caps, JSON checks, and no implicit loopback URL.
3. Agent runs use buffered Nexus JSON.
4. Stripe subscription persistence failure returns 500. Signature errors stay generic 400s.
5. Waitlist insert, duplicate handling, and an honest error when storage is not configured.
6. Canonical origin `https://www.conqueror-studios.com`, retired `.dev` host rewritten, billing return URL no longer trusts `Origin`.
7. HTTPS-only broadcast CTA, broadcast rate limit, broadcast logs without recipient addresses, baseline security headers.
8. Public copy no longer says the console is multi-tenant.
9. CLAUDE.md, AGENTS.md, and local-env docs aligned with Next.js 16, `src/proxy.ts`, and the gates above.

## P0 remaining

None in this repository. The production deploy of item 1 is a release action, not more code. See blockers.

## P1 remaining

| Item | Acceptance | Dependency | Status |
|---|---|---|---|
| Confirm `CONSOLE_OWNER_EMAILS` in the Vercel production and preview environments before promoting this branch | A signed-in owner opens `/console`. A non-owner receives `/auth?error=unauthorized`. An unset variable shows `console_unconfigured` only in an environment where that is intended. | Vercel env access. Do not print values. | `BLOCKED` |
| Nexus and Bridge v2 reject unauthenticated calls | A request without the shared secret fails at the upstream. This site already sends the header when the matching env var is set. | Merge and deploy AI Bridge v2 PR #2 only if that is the chosen contract. Configure Nexus auth separately. Do not merge the two Bridge repos. | `BLOCKED` |
| Live contract check of `POST /run` and `GET /tools/schema` | One authenticated call to each deployed service returns the JSON this site parses, or a documented adapter is added. | Railway URLs and secrets. | `NOT_VERIFIED` |

## P2 remaining

| Item | Acceptance | Notes |
|---|---|---|
| Shared rate-limit store | Two instances enforce one counter for waitlist, gateway, Nexus, agent run, and broadcast. | Do not add Upstash until the cost is accepted. In-process limits stay until then. |
| Stripe event ledger | A second delivery of the same `event.id` does not send another dunning email. Subscription upsert remains idempotent on `stripe_subscription_id`. | Needs a migration reviewed and applied through the existing Supabase workflow. Do not run the cancelled prod migration by hand. |
| CI runner health | Pull-request workflows on `conqueror-studios-web` finish on GitHub-hosted or a reliable self-hosted runner. Dependabot PRs typecheck. | Self-hosted label `superoptimizers` has been failing or queuing. Fix the runner or change the label in a separate change. |
| Supabase Auth dashboard | New emails cannot sign themselves up even if a client omits `shouldCreateUser: false`. | Dashboard setting. `NOT_VERIFIED`. |
| Content-Security-Policy | A policy that still loads the current fonts and pages, tested in a browser. | Not guessed in this branch. |
| Postmark sender domain | From-address is on a domain that resolves and is verified. `conquerorstudios.dev` had no DNS on 2026-10-27. | Mail DNS. `NOT_VERIFIED`. |

## P3 remaining

- Homepage and product pages already match the dark HUD system closely enough. Further visual work waits until the P1 blockers above are closed.
- Product strategy still calls for real roles if Agent Studio should leave the owner allowlist. That is a schema and RLS design, not a copy change.

## Explicitly out of scope

- Merging or deleting `ai-bridge`, `ai-bridge-v2`, or `orchestrai-nexus`.
- Applying Supabase migrations to production, resetting data, or editing customer rows.
- Promoting this branch in Vercel, editing production environment variables, or pushing `main`.
- Routing the public BYOK demo through `/api/gateway`.
- Implementing the Drive financial and capital documents as software requirements.
- Treating unread Drive files as specifications.

## Suggested order after review

1. Set `CONSOLE_OWNER_EMAILS` in preview, deploy the preview, sign in as the owner, and confirm a second account is refused.
2. Set `NEXUS_URL` and `BRIDGE_URL` to the real HTTPS origins. Leave the shared secrets unset until each upstream returns 401 without its header.
3. Send one Stripe test webhook with a bad signature and one with a valid signature against a database that can accept the upsert.
4. Submit one waitlist signup and one duplicate. Confirm a single row.
5. Only then merge and promote.
