# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

The marketing and research-facing website for Conqueror Studios — an independent AI R&D lab. It is a **pure static site** (no build step, no framework, no package.json). Files are deployed directly to Vercel from the repo root.

## Linting

The CI pipeline installs tools globally. To run the same checks locally:

```bash
# Install once
npm install -g htmlhint stylelint stylelint-config-standard

# Lint HTML
htmlhint index.html --config .htmlhintrc

# Lint CSS
stylelint styles.css --config '{"extends":"stylelint-config-standard"}'
```

CI also checks:
- Total uncompressed size of `index.html + styles.css + script.js` must stay under **300 KB**
- `index.html` alone must stay under **500 KB**
- Internal anchor `href="#id"` values in `index.html` must match an `id` attribute
- `index.html` must contain the meta tags: `og:title`, `og:description`, `og:type`, `twitter:card`, `canonical`

## Page structure

| File | Route (Vercel clean URLs) |
|------|--------------------------|
| `index.html` | `/` |
| `projects.html` | `/projects` |
| `studio.html` | `/studio` |
| `waitlist.html` | `/waitlist` |
| `support.html` | `/support` |
| `orchestrai.html` | `/orchestrai` |
| `voiceisolate.html` | `/voiceisolate` |
| `confidential.html` | `/confidential` |

`vercel.json` enables `cleanUrls: true` and `trailingSlash: false` — links within pages use paths without `.html`.

## CSS / JS architecture

**`styles.css`** — single primary stylesheet imported by every page. All design tokens live in `:root`:
- `--accent` (#ff2244 neon crimson), `--accent2` (#ff6622 ember orange) — primary brand colors
- `--bg` / `--surface` / `--surface2` / `--surface3` — dark background stack
- `--mono` (JetBrains Mono), `--sans` (Inter) — the only two typefaces used

**`script.js`** — loaded only by `index.html`. Handles:
- `.reveal` scroll animation via `IntersectionObserver` (threshold 0.12); add class `reveal` to any element to opt in
- `[data-target="N"]` animated stat counters — set the integer target as `data-target` on a `<strong>`
- Mobile hamburger menu (`#menuToggle` / `#siteNav`)
- Path-based active nav highlighting; scrollspy kicks in only when nav contains anchor `href="#…"` links
- Terminal typewriter animation (`#terminalBody`) — driven by the `terminalLines` array in the script
- Form handling via `handleForm(formId, msgId, successText)` — currently client-side simulation only (no real backend)

**`multipage.css` / `multipage.js`** — supplementary files used by secondary pages (`projects.html`, `studio.html`, etc.). They provide `.animate-fade-up` reveal animation (same IntersectionObserver pattern as `script.js` but using a different CSS class), parallax hero scroll, and form submission handlers for `#waitlistForm` and `#supportForm`. Secondary pages include these via `<link>` / `<script>` tags instead of `styles.css`+`script.js`.

## HTML conventions

- All pages use semantic HTML5 with ARIA: `role="banner"`, `role="contentinfo"`, `role="navigation"`, `aria-label`, `aria-live` on form status messages.
- Every page must include a skip link (`<a href="#main-content" class="skip-link">`).
- `index.html` requires the full OG/Twitter/canonical meta block (checked by CI).
- Images in `assets/` are static — no build pipeline processes them.

## Deployment

No build step. Push to `main` → Vercel auto-deploys the repo root. Static assets (`styles.css`, `script.js`, `assets/*`) are served with long-lived `Cache-Control: immutable` headers defined in `vercel.json`.
