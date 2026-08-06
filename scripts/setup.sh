#!/usr/bin/env bash
# scripts/setup.sh
#
# Conqueror Studios — local development setup script.
# Usage: bash scripts/setup.sh
#
# What it does:
#   1. Verifies required system tools (bun, node, git)
#   2. Copies .env.example → .env.local if .env.local is absent
#   3. Runs `bun install`
#   4. Validates that all required env vars are present in .env.local
#   5. Probes Supabase connectivity (if SUPABASE_URL is set)
#   6. Runs the full quality gate: typecheck, lint, test
#
# Exits non-zero on the first unrecoverable error.

set -euo pipefail

# ── Colour helpers ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $*"; }
err()  { echo -e "${RED}✗${RESET} $*" >&2; }
info() { echo -e "${CYAN}→${RESET} $*"; }

# ── 1. Verify required tools ────────────────────────────────────────────────
info "Checking required tools…"

check_tool() {
  local tool="$1"
  if ! command -v "$tool" &>/dev/null; then
    err "Required tool not found: $tool"
    echo    "  Install guide:"
    case "$tool" in
      bun)   echo "    curl -fsSL https://bun.sh/install | bash" ;;
      node)  echo "    https://nodejs.org/ or https://volta.sh/" ;;
      git)   echo "    https://git-scm.com/downloads" ;;
    esac
    exit 1
  fi
  ok "$tool $(command $tool --version 2>/dev/null | head -1)"
}

check_tool bun
check_tool git

# node is needed for ESLint / lint scripts
if ! command -v node &>/dev/null; then
  warn "node not found — lint scripts may fail. Consider installing via https://nodejs.org/"
else
  ok "node $(node --version)"
fi

# ── 2. Bootstrap .env.local ─────────────────────────────────────────────────
info "Checking .env.local…"

if [[ ! -f ".env.local" ]]; then
  if [[ -f ".env.example" ]]; then
    cp .env.example .env.local
    warn ".env.local was missing — copied from .env.example."
    warn "Open .env.local and fill in the real values before running \`bun dev\`."
  else
    err ".env.example not found — cannot create .env.local."
    exit 1
  fi
else
  ok ".env.local already exists — skipping copy."
fi

# ── 3. Install dependencies ─────────────────────────────────────────────────
info "Installing dependencies with bun…"
bun install
ok "Dependencies installed."

# ── 4. Validate required env vars ───────────────────────────────────────────
info "Validating required environment variables in .env.local…"

# Source .env.local into the current shell so we can inspect values.
# Use `set -a` / `set +a` to avoid polluting global exports beyond this block.
set -a
# shellcheck disable=SC1091
source .env.local 2>/dev/null || true
set +a

REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  NEXT_PUBLIC_SITE_URL
)

missing=()
placeholder=()

for var in "${REQUIRED_VARS[@]}"; do
  val="${!var:-}"
  if [[ -z "$val" ]]; then
    missing+=("$var")
  elif [[ "$val" == *"xxxxxxxxxxxxxxxxxxxx"* ]] || [[ "$val" == "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." ]]; then
    placeholder+=("$var")
  else
    ok "$var is set"
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  err "Missing required variables in .env.local:"
  for v in "${missing[@]}"; do
    echo "    $v"
  done
  warn "Add the missing values to .env.local before running \`bun dev\`."
fi

if [[ ${#placeholder[@]} -gt 0 ]]; then
  warn "These variables still contain placeholder values:"
  for v in "${placeholder[@]}"; do
    echo "    $v"
  done
  warn "Replace the placeholder values with real credentials."
fi

# ── 5. Supabase connectivity check ──────────────────────────────────────────
SUPABASE_BASE="${NEXT_PUBLIC_SUPABASE_URL:-}"
if [[ -n "$SUPABASE_BASE" ]] && [[ "$SUPABASE_BASE" != *"xxxxxxxxxxxxxxxxxxxx"* ]]; then
  info "Probing Supabase at ${SUPABASE_BASE}…"
  if curl -sf --max-time 5 "${SUPABASE_BASE}/rest/v1/" -o /dev/null; then
    ok "Supabase is reachable."
  else
    warn "Could not reach Supabase at ${SUPABASE_BASE}."
    warn "This is expected if Supabase is not yet configured or you're offline."
  fi
else
  info "Skipping Supabase connectivity check (URL not yet set)."
fi

# ── 6. Quality gate ─────────────────────────────────────────────────────────
info "Running quality gate: typecheck → lint → test…"

bun run typecheck
ok "typecheck passed."

bun run lint
ok "lint passed."

bun test
ok "tests passed."

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}  Setup complete. Run \`bun dev\` to start the server.  ${RESET}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
