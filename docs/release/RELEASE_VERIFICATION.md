# Release verification

Branch: `fix/production-hardening`  
Base: `2258071c68d683f9b74aa506f77ed400573a6d55` on `main`  
Date of the checks below: 2026-10-26 (local). Health timestamps are UTC.  
Production promotion: not performed.

## Commands

Working directory: `C:\Users\randy\repos\conqueror-studios-web`. Package manager is Bun. `package.json` pins `next` 16.3.4, `typescript` 6.0.3, `react` 19.2.6, `packageManager` `bun@1.3.13`. The local Bun binary was 1.3.14.

| Command | Result |
|---|---|
| `bun install --frozen-lockfile` | Exit 0. Reported 16 packages installed, including `next@16.3.4` and `sharp@0.35.4`. `package.json` and the lockfile were not edited. |
| `bun run lint` | Exit 0. Localhost guard plus ESLint, after the frozen install and after `src/lib/server-url.ts` was excluded from the browser-localhost scan. |
| `bun run typecheck` | Exit 0 (`tsc --noEmit`), run immediately before the production build. |
| `bun run build` | Exit 0. Next.js 16.3.4 (Turbopack). Compiled in 25.0s. TypeScript check inside the build finished in 6.1s. 33 static pages generated. |
| `bun test` | Exit 0. `59 pass`, `0 fail`, `103 expect()` calls, 11 files, about 696 ms. Re-run after the build. |

`bun run lint` was not repeated after the markdown-only documentation edits. Those files are not part of the Next.js bundle that was built.

## Local smoke of `next start` on port 3017

The process had no Supabase environment variables. That is a local limitation, not a production health check.

| Request | Result |
|---|---|
| `GET /` | 200. Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. HTML contains `https://www.conqueror-studios.com`. The string `multi-tenant` is absent. |
| `GET /api/health` | 200. `{"status":"ok","version":"dev", ...}`. `version: dev` is expected off Vercel. |
| `POST /api/gateway` with no secret | 503 `{"error":"AI gateway is not configured","code":"gateway_misconfigured"}`. |
| `GET /auth?error=console_unconfigured` | 200. Body contains `Console access is not configured on the server.` |
| `GET /auth?error=unauthorized` | 200. Body contains `This account cannot open the console.` |
| `GET /robots.txt` | 200. Sitemap is `https://www.conqueror-studios.com/sitemap.xml`. |
| `GET /sitemap.xml` | 200. First location is `https://www.conqueror-studios.com/`. |
| `GET /api/console/waitlist`, `POST /api/nexus`, `GET /api/nexus/schema`, `GET /console` | 500. Server log: `Missing Supabase server env`. `createClient()` throws before the allowlist decision when those variables are absent. This does not show a fail-open. An owner session was not available, so the allowlist pass and the 401/403/503 API responses are `NOT_VERIFIED` in a browser. |

The server was stopped after these requests.

## Production, observed before this branch

These checks describe the deployment of `2258071`, not this branch.

| Check | Result |
|---|---|
| Vercel production deployment | `dpl_E7VD7PJaAeE11uYk7X83kiePMC4E`, state `READY`, SHA `2258071`, message `chore: trigger Vercel deployment`. |
| `GET https://www.conqueror-studios.com/api/health` | 200. `version` `2258071c68d683f9b74aa506f77ed400573a6d55`. Timestamp `2026-10-27T04:28:02.122Z`. |
| `GET https://www.conqueror-studios.com/` | 200. |
| Apex host | 307 to `https://www.conqueror-studios.com/`. |
| `conquerorstudios.dev` | DNS failure: `No such host is known.` |
| Vercel env list, decryption off | Empty visible list. This does not prove variables are unset. Values were not decrypted. `NOT_VERIFIED`. |

## GitHub CI

Recorded when the pull request is opened. A queued or failed self-hosted runner is not a local-build failure. Do not rerun `Prod DB Migration`. The earlier run on `062602d` (`chore: promote main to production (#25)`) was cancelled.

Dependabot runs on `main` were failing in the runs visible around 2026-10-23. That is an open P2 and is not fixed here.

## Release gate for this branch

Do not promote until all of the following are true:

1. `CONSOLE_OWNER_EMAILS` is set in the target Vercel environment to the real owner addresses. If it is empty, `/console` and the owner APIs return 503 `console_unconfigured`.
2. `NEXUS_URL` and `BRIDGE_URL` are HTTPS URLs for the intended services. AI Bridge v2 serves `GET /tools/schema`. The Drive/GitHub `ai-bridge` repository is the wrong target.
3. Preview smoke covers owner login, a non-owner refusal, one waitlist insert, and one Stripe test event. Those are `NOT_VERIFIED` here.
4. Reviewers accept that shared-secret enforcement on Nexus and Bridge is still `BLOCKED` on the upstream services.

## Unresolved risks

- In-process rate limits do not span instances.
- `invoice.payment_failed` can send duplicate dunning mail. No event ledger was migrated.
- Upstream Nexus and Bridge authentication is optional from this app and unverified on the deployed services.
- Supabase Auth dashboard signup settings are `NOT_VERIFIED`.
- No Content-Security-Policy.
- Sibling repository test suites were not run.
