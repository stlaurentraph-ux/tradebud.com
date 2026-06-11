#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$ROOT/../.." && pwd)"
LOG_DIR="$ROOT/.dev-logs"
mkdir -p "$LOG_DIR"

DEMOS=(
  offline:3001
  exporter:3002
  cooperative:3003
  importer:3004
  country:3005
)

cleanup() {
  for entry in "${DEMOS[@]}"; do
    port="${entry##*:}"
    pid=$(lsof -ti ":$port" 2>/dev/null || true)
    [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
  done
}

if [[ "${1:-}" == "--stop" ]]; then
  cleanup
  echo "Stopped all demo dev servers."
  exit 0
fi

cleanup

echo "Starting Tracebud demos..."
for entry in "${DEMOS[@]}"; do
  name="${entry%%:*}"
  port="${entry##*:}"
  log="$LOG_DIR/$name.log"
  echo "  $name -> http://localhost:$port (log: $log)"
  (cd "$ROOT/$name" && npm run dev -- --port "$port") >"$log" 2>&1 &
done

echo ""
echo "All demos running. Press Ctrl+C to stop."
trap cleanup EXIT INT TERM
wait
