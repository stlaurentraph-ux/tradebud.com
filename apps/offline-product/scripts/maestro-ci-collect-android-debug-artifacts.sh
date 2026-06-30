#!/usr/bin/env bash
# Collect adb diagnostics after Android Maestro CI failure (audit H25).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${MAESTRO_CI_ARTIFACT_DIR:-$ROOT/ci-artifacts/maestro-android}"
APP_ID="${MAESTRO_APP_ID:-com.tracebud.app}"
SERIAL="${MAESTRO_ANDROID_SERIAL:-${ANDROID_SERIAL:-}}"

mkdir -p "$OUT"

ADB=(adb)
if [[ -n "$SERIAL" ]]; then
  ADB=(adb -s "$SERIAL")
fi

echo "==> Collecting Maestro Android debug artifacts in $OUT"
{
  echo "collected_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "device_serial=${SERIAL:-unknown}"
  echo "app_id=$APP_ID"
} > "$OUT/meta.txt"

"${ADB[@]}" devices -l > "$OUT/adb-devices.txt" 2>&1 || true
"${ADB[@]}" shell getprop sys.boot_completed > "$OUT/boot-completed.txt" 2>&1 || true
"${ADB[@]}" shell pidof "$APP_ID" > "$OUT/app-pid.txt" 2>&1 || true
"${ADB[@]}" logcat -d > "$OUT/logcat-full.txt" 2>&1 || true
"${ADB[@]}" logcat -d 2>/dev/null \
  | grep -iE 'AndroidRuntime|FATAL EXCEPTION|ReactNative|ReactNativeJS|Hermes|expo|SQLite|tracebud|AppState|MaestroBoot|boot failed|JSExecutor|Bridgeless' \
  | tail -500 > "$OUT/logcat-tracebud.txt" || true
"${ADB[@]}" shell dumpsys meminfo "$APP_ID" > "$OUT/meminfo.txt" 2>&1 || true
"${ADB[@]}" shell dumpsys package "$APP_ID" > "$OUT/package-dumpsys.txt" 2>&1 || true
"${ADB[@]}" shell pm path "$APP_ID" > "$OUT/apk-path.txt" 2>&1 || true

if [[ -n "${GITHUB_WORKSPACE:-}" && -f "${MAESTRO_ANDROID_APK_PATH:-}" ]]; then
  unzip -l "${MAESTRO_ANDROID_APK_PATH}" | head -80 > "$OUT/apk-listing.txt" 2>&1 || true
fi

echo "Maestro Android artifacts ready: $OUT"
