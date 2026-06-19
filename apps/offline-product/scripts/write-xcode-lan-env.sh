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

sync_api_url_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  if grep -q '^EXPO_PUBLIC_API_URL=' "$file"; then
    sed -i '' "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://${IP}:4000/api|" "$file"
  fi
}

sync_api_url_file "$ROOT/.env"
sync_api_url_file "$ROOT/.env.local"

echo "$IP"
