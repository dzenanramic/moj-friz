#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node.js 24 or newer and try again." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Enable it with: corepack enable" >&2
  exit 1
fi

cd "$FRONTEND_DIR"

# Avoid pnpm's implicit dependency check overwriting anything in constrained
# environments. The explicit install below is the supported path.
export pnpm_config_verify_deps_before_run=false

STORE_ARGS=()
if [ ! -w "${HOME:-/nonexistent}" ]; then
  # The development sandbox can have a read-only HOME. Keep tool caches in a
  # temporary directory only for this process; normal machines use pnpm defaults.
  CACHE_ROOT="${TMPDIR:-/tmp}/mojfriz-tooling"
  mkdir -p "$CACHE_ROOT"
  export npm_config_cache="$CACHE_ROOT/npm-cache"
  export XDG_CACHE_HOME="$CACHE_ROOT/xdg-cache"
  export XDG_CONFIG_HOME="$CACHE_ROOT/xdg-config"
  export PNPM_HOME="$CACHE_ROOT/pnpm-home"
  STORE_ARGS=(--store-dir "$CACHE_ROOT/pnpm-store")
fi

if [ ! -d node_modules ]; then
  echo "Installing pinned dependencies…"
  pnpm install --frozen-lockfile "${STORE_ARGS[@]}"
fi

echo
echo "Moj Friz demo: http://127.0.0.1:5173"
echo "Demo podaci su izmišljeni. Ne unosite stvarne podatke."
echo
exec pnpm dev --host 127.0.0.1
