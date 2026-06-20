#!/usr/bin/env bash
# Metro must listen on LAN — physical iPhones cannot use localhost:8081.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IP="$(bash ./scripts/write-xcode-lan-env.sh)"
export REACT_NATIVE_PACKAGER_HOSTNAME="$IP"
export SENTRY_DISABLE_AUTO_UPLOAD=true

METRO_PORT="${METRO_PORT:-8081}"
if lsof -i :"${METRO_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo ""
  echo "Port ${METRO_PORT} is already in use. Stop the other Metro process first:"
  echo "  lsof -i :${METRO_PORT} -sTCP:LISTEN"
  echo ""
  echo "The iPhone debug build expects Metro on ${METRO_PORT} (not 8083)."
  exit 1
fi

node ./scripts/validate-metro-start.mjs

echo ""
echo "Metro (LAN): http://${IP}:${METRO_PORT}"
if [[ -n "${EXPO_PUBLIC_API_URL:-}" ]]; then
  echo "Sync API: ${EXPO_PUBLIC_API_URL}"
else
  echo "Sync API: from .env (local Nest on ${IP}:4000 unless overridden)"
fi
echo "Phone and Mac must be on the same Wi‑Fi. In the app: shake → Reload, or tap Reload JS."
echo ""

exec npx expo start --lan --port "${METRO_PORT}" "$@"
