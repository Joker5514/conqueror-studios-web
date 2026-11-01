function originOf(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

// Browser-side calls made by the public BYOK demo (MultiAIPlatform).
const BYOK_PROVIDER_ORIGINS = [
  "https://api.openai.com",
  "https://api.anthropic.com",
  "https://api.x.ai",
  "https://api.perplexity.ai",
];

/**
 * Content-Security-Policy for production builds. App Router pages are
 * statically rendered, so scripts cannot carry per-request nonces and
 * 'unsafe-inline' stays for script-src; the policy still pins script, style,
 * font, image, media, and connect origins, blocks framing, plugins, base-URI
 * changes, and cross-origin form posts.
 */
export function buildContentSecurityPolicy(env: NodeJS.ProcessEnv): string {
  const supabase = originOf(env.NEXT_PUBLIC_SUPABASE_URL);
  const preview = env.VERCEL_ENV === "preview" || env.VERCEL_TARGET_ENV === "preview";
  const production = env.VERCEL_ENV === "production";
  const previewScript = preview ? ["https://app.cofounder.co", "https://vercel.live"] : [];
  const previewConnect = preview ? ["https://vercel.live", "wss://ws-us3.pusher.com"] : [];
  const previewImg = preview ? ["https://vercel.live", "https://vercel.com"] : [];
  const previewFrame = preview ? ["https://vercel.live"] : [];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...previewScript],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "img-src": ["'self'", "data:", "blob:", ...previewImg],
    "media-src": ["'self'"],
    "connect-src": ["'self'", ...(supabase ? [supabase] : []), ...BYOK_PROVIDER_ORIGINS, ...previewConnect],
    "frame-src": previewFrame.length > 0 ? previewFrame : ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
  };
  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (production) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}
