import { describe, expect, test } from "bun:test";
import { buildContentSecurityPolicy } from "./csp.ts";

function directives(policy) {
  return Object.fromEntries(
    policy.split("; ").map((part) => {
      const [name, ...values] = part.split(" ");
      return [name, values];
    }),
  );
}

describe("buildContentSecurityPolicy", () => {
  test("production policy pins origins and forbids framing, plugins, and eval", () => {
    const policy = buildContentSecurityPolicy({
      VERCEL_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnop.supabase.co",
    });
    const d = directives(policy);
    expect(d["default-src"]).toEqual(["'self'"]);
    expect(d["frame-ancestors"]).toEqual(["'none'"]);
    expect(d["object-src"]).toEqual(["'none'"]);
    expect(d["base-uri"]).toEqual(["'self'"]);
    expect(d["form-action"]).toEqual(["'self'"]);
    expect(d["frame-src"]).toEqual(["'none'"]);
    expect(d["script-src"]).not.toContain("'unsafe-eval'");
    expect(d["script-src"]).not.toContain("https://app.cofounder.co");
    expect(d["connect-src"]).toContain("https://abcdefghijklmnop.supabase.co");
    expect(d["connect-src"]).toContain("https://api.anthropic.com");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  test("preview policy allows the Vercel toolbar and the preview widget only there", () => {
    const d = directives(buildContentSecurityPolicy({ VERCEL_ENV: "preview" }));
    expect(d["script-src"]).toContain("https://vercel.live");
    expect(d["script-src"]).toContain("https://app.cofounder.co");
    expect(d["frame-src"]).toEqual(["https://vercel.live"]);
  });

  test("local builds skip upgrade-insecure-requests so http://localhost keeps working", () => {
    expect(buildContentSecurityPolicy({})).not.toContain("upgrade-insecure-requests");
  });

  test("an invalid Supabase URL is ignored rather than injected", () => {
    const d = directives(buildContentSecurityPolicy({ NEXT_PUBLIC_SUPABASE_URL: "not a url; script-src *" }));
    expect(d["connect-src"].join(" ")).not.toContain("not");
    expect(d["script-src"]).not.toContain("*");
  });
});
