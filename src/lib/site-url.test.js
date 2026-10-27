import { afterEach, describe, expect, test } from "bun:test";
import { CANONICAL_SITE_ORIGIN, configuredSiteOrigin } from "./site-url.ts";

describe("configuredSiteOrigin", () => {
  const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
  const prevVercel = process.env.VERCEL_URL;

  afterEach(() => {
    if (prevSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prevSite;
    if (prevVercel === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = prevVercel;
  });

  test("uses the live canonical origin when unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
    expect(configuredSiteOrigin()).toBe(CANONICAL_SITE_ORIGIN);
  });

  test("rewrites the retired .dev host", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://conquerorstudios.dev";
    expect(configuredSiteOrigin()).toBe("https://www.conqueror-studios.com");
  });

  test("keeps a local development origin and preview hosts", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:3000";
    expect(configuredSiteOrigin()).toBe("http://127.0.0.1:3000");
    process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com/path";
    expect(configuredSiteOrigin()).toBe("https://preview.example.com");
  });
});
