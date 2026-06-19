#!/usr/bin/env bash
# Write ios/.xcode.env.local so device builds embed the Mac LAN IP (not localhost).
# Also sync EXPO_PUBLIC_API_URL in .env and .env.local when present.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP="${1:-}"

if [[ -z "$IP" ]]; then
  IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [[ -z "$IP" ]]; then
  echo "Could not detect Mac LAN IP (en0/en1). Connect to Wi‑Fi."
  exit 1
fi

NODE_BIN="$(command -v node)"
cat >"$ROOT/ios/.xcode.env.local" <<EOF
export NODE_BINARY=$NODE_BIN
export REACT_NATIVE_PACKAGER_HOSTNAME=$IP
export SENTRY_DISABLE_AUTO_UPLOAD=true
EOF

should_skip_lan_api_sync() {
  if [[ "${TRACEBUD_SKIP_LAN_API_SYNC:-}" == "1" ]]; then
    return 0
  fi
  local preset="${EXPO_PUBLIC_API_URL:-}"
  if [[ -n "$preset" ]] && [[ "$preset" != *":4000/api" ]] && [[ "$preset" != *"localhost"* ]]; then
    return 0
  fi
  return 1
}

sync_api_url_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  if grep -q '^EXPO_PUBLIC_API_URL=' "$file"; then
    sed -i '' "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://${IP}:4000/api|" "$file"
  fi
}

ENV_DEV_LOCAL="$ROOT/.env.development.local"
ENV_DEV_LOCAL_MARKER="# tracebud-metro-api-target"

write_production_api_env() {
  local url="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
  cat >"$ENV_DEV_LOCAL" <<EOF
${ENV_DEV_LOCAL_MARKER}
EXPO_PUBLIC_API_URL=${url}
EOF
  echo "Wrote ${url} to .env.development.local (Metro bundle will use production API)" >&2
}

clear_production_api_env() {
  if [[ -f "$ENV_DEV_LOCAL" ]] && head -n 1 "$ENV_DEV_LOCAL" | grep -q "tracebud-metro-api-target"; then
    rm -f "$ENV_DEV_LOCAL"
    echo "Removed .env.development.local API override (local Nest)" >&2
  fi
}

if should_skip_lan_api_sync; then
  echo "Skipping LAN API URL sync (using ${EXPO_PUBLIC_API_URL:-production target})" >&2
  write_production_api_env
else
  clear_production_api_env
  sync_api_url_file "$ROOT/.env"
  sync_api_url_file "$ROOT/.env.local"
fi

echo "$IP"
