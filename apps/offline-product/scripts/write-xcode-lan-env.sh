#!/usr/bin/env bash
# Write ios/.xcode.env.local so device builds embed the Mac LAN IP (not localhost).
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

echo "$IP"
