#!/usr/bin/env node
// Smoke tests for a running deployment (local `next start`, a Vercel preview,
// or production). Dependency-free so it can run before `bun install`.
//
//   node scripts/smoke-test.mjs <baseUrl> [--profile local|preview|production]
//        [--expect-sha <sha>] [--wait-for-sha <seconds>]
//
// Exit 0 when every check passes. A preview behind Vercel deployment
// protection is reported as NOT VERIFIED (exit 0) unless
// VERCEL_AUTOMATION_BYPASS_SECRET is provided. Production is never skipped.

import { appendFileSync } from "node:fs";

const args = process.argv.slice(2);
const baseArg = args.find((a) => !a.startsWith("--"));
if (!baseArg) {
  console.error("usage: node scripts/smoke-test.mjs <baseUrl> [--profile p] [--expect-sha sha]");
  process.exit(2);
}
function option(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const baseUrl = baseArg.replace(/\/+$/, "");
const profile = option("--profile") ?? "local";
const expectSha = option("--expect-sha");
const waitForSha = Number(option("--wait-for-sha") ?? 0);
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
const summaryFile = process.env.SMOKE_SUMMARY_FILE;

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  if (bypass) {
    headers.set("x-vercel-protection-bypass", bypass);
    headers.set("x-vercel-set-bypass-cookie", "true");
  }
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
      });
      const body = await res.text();
      return { res, body };
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastError;
}

function isVercelProtection(res, body) {
  if (res.status === 401 && /vercel/i.test(body)) return true;
  const location = res.headers.get("location") ?? "";
  return res.status >= 300 && res.status < 400 && /vercel\.com\/(sso|login)/.test(location);
}

function writeSummary(title) {
  if (!summaryFile) return;
  const lines = [`### ${title}`, "", `Target: \`${baseUrl}\` · profile \`${profile}\``, "", "| Check | Result | Detail |", "|---|---|---|"];
  for (const r of results) {
    lines.push(`| ${r.name} | ${r.ok ? "pass" : "**fail**"} | ${String(r.detail ?? "").replace(/\|/g, "\\|")} |`);
  }
  appendFileSync(summaryFile, `${lines.join("\n")}\n\n`);
}

async function checkHealth() {
  const deadline = Date.now() + waitForSha * 1000;
  for (;;) {
    const { res, body } = await request("/api/health");
    if (isVercelProtection(res, body)) return "protected";
    let json = null;
    try {
      json = JSON.parse(body);
    } catch {
      // handled below
    }
    const okShape = res.status === 200 && json?.status === "ok" && typeof json?.version === "string";
    const cache = res.headers.get("cache-control") ?? "";
    if (!okShape) {
      record("GET /api/health", false, `HTTP ${res.status}`);
      return "failed";
    }
    if (expectSha && json.version !== expectSha) {
      if (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 10_000));
        continue;
      }
      record("GET /api/health", false, `version ${json.version} != expected ${expectSha}`);
      return "failed";
    }
    record("GET /api/health", true, `version ${json.version}${cache.includes("no-store") ? ", no-store" : ""}`);
    return "ok";
  }
}

const PUBLIC_PAGES = [
  "/",
  "/projects",
  "/agents",
  "/orchestrai",
  "/aibridge",
  "/voiceisolate",
  "/aicounselor",
  "/studio",
  "/support",
  "/waitlist",
  "/auth",
  "/unsubscribe",
];

const REQUIRED_HEADERS = {
  "x-content-type-options": (v) => v === "nosniff",
  "x-frame-options": (v) => v.toUpperCase() === "DENY",
  "referrer-policy": (v) => v.length > 0,
  "permissions-policy": (v) => v.includes("camera=()"),
};

async function main() {
  const health = await checkHealth();
  if (health === "protected") {
    if (profile === "production") {
      record("deployment reachable", false, "production responded with Vercel deployment protection");
    } else {
      console.log("NOT VERIFIED — preview is behind Vercel deployment protection and no bypass secret is configured.");
      results.push({ name: "deployment reachable", ok: true, detail: "NOT VERIFIED: protected preview, set VERCEL_AUTOMATION_BYPASS_SECRET" });
      writeSummary("Smoke test skipped (protected preview)");
      return 0;
    }
  }

  for (const path of PUBLIC_PAGES) {
    const { res, body } = await request(path);
    const ok = res.status === 200 && body.includes("</html>");
    record(`GET ${path}`, ok, `HTTP ${res.status}, ${body.length} bytes`);
    if (path === "/") {
      for (const [header, valid] of Object.entries(REQUIRED_HEADERS)) {
        const value = res.headers.get(header) ?? "";
        record(`header ${header}`, Boolean(value) && valid(value), value || "missing");
      }
      record("homepage title", /<title>[^<]*Conqueror Studios[^<]*<\/title>/.test(body), "");
    }
  }

  {
    const { res } = await request("/this-route-does-not-exist-smoke");
    record("unknown route returns 404", res.status === 404, `HTTP ${res.status}`);
  }

  {
    const { res, body } = await request("/robots.txt");
    record("robots.txt", res.status === 200 && body.includes("Sitemap:"), `HTTP ${res.status}`);
  }

  {
    const { res, body } = await request("/sitemap.xml");
    record("sitemap.xml", res.status === 200 && body.includes("<urlset"), `HTTP ${res.status}`);
  }

  {
    const { res, body } = await request("/api/gateway", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: "openai", input: "smoke" }),
    });
    let code = "";
    try {
      code = JSON.parse(body).code ?? "";
    } catch {
      // not JSON
    }
    record("gateway rejects unauthenticated calls", (res.status === 401 || res.status === 503) && code !== "", `HTTP ${res.status} ${code}`);
  }

  const failed = results.filter((r) => !r.ok);
  writeSummary(failed.length === 0 ? "Smoke test passed" : `Smoke test failed (${failed.length})`);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  return failed.length === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("smoke test crashed:", err instanceof Error ? err.message : err);
    writeSummary("Smoke test crashed");
    process.exit(1);
  });
