#!/usr/bin/env bash
# Boot Android emulator and install Tracebud for Maestro CI (audit H25).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${PATH:+$PATH:}$HOME/.maestro/bin"

APP_ID="${MAESTRO_APP_ID:-com.tracebud.app}"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found — install before running Maestro CI."
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found — Android SDK must be on PATH."
  exit 1
fi

adb wait-for-device
adb start-server 2>/dev/null || true
sleep 2
adb wait-for-device
DEVICE_SERIAL="$(adb devices | awk 'NR>1 && $2=="device" { print $1; exit }')"
if [[ -z "$DEVICE_SERIAL" ]]; then
  echo "No connected Android device/emulator."
  adb devices -l || true
  exit 1
fi

export ANDROID_SERIAL="$DEVICE_SERIAL"
export MAESTRO_ANDROID_SERIAL="$DEVICE_SERIAL"

echo "==> Using Android device $DEVICE_SERIAL"

APK_PATH="${MAESTRO_ANDROID_APK_PATH:-$ROOT/android/app/build/outputs/apk/debug/app-debug.apk}"
if [[ ! -f "$APK_PATH" ]]; then
  echo "::error::Missing prebuilt APK at $APK_PATH (assemble step must run first)."
  find "$ROOT" -name 'app-debug.apk' 2>/dev/null | head -5 || true
  exit 1
fi

echo "==> Removing previous Tracebud install"
adb -s "$DEVICE_SERIAL" shell pm clear "$APP_ID" 2>/dev/null || true
adb -s "$DEVICE_SERIAL" shell pm uninstall --user 0 "$APP_ID" 2>/dev/null || \
  adb -s "$DEVICE_SERIAL" uninstall "$APP_ID" 2>/dev/null || true

export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"
export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"

adb -s "$DEVICE_SERIAL" wait-for-device
adb -s "$DEVICE_SERIAL" shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done'

tune_emulator_dex2oat() {
  echo "==> Tune emulator dex2oat for speed (CI cold start)"
  adb -s "$DEVICE_SERIAL" shell setprop dalvik.vm.dex2oat-filter speed 2>/dev/null || true
  adb -s "$DEVICE_SERIAL" shell setprop dalvik.vm.image-dex2oat-filter speed 2>/dev/null || true
  adb -s "$DEVICE_SERIAL" shell setprop dalvik.vm.dex2oat-threads 4 2>/dev/null || true
}

tune_emulator_dex2oat

echo "==> Installing prebuilt debug APK from $APK_PATH"
adb -s "$DEVICE_SERIAL" install -r -g "$APK_PATH"

speed_compile_tracebud_apk() {
  echo "==> AOT dex compile Tracebud (speed mode — cuts cold-start verify on CI emulator)"
  adb -s "$DEVICE_SERIAL" shell cmd package compile -m speed -f "$APP_ID" 2>/dev/null || \
    adb -s "$DEVICE_SERIAL" shell pm compile -m speed -f "$APP_ID" 2>/dev/null || \
    echo "Package speed-compile unavailable on this emulator API — continuing"
}

speed_compile_tracebud_apk

export MAESTRO_APP_ID="$APP_ID"

# Maestro driver handshake can exceed the 15s Android default on cold CI emulators.
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000}"

echo "==> Launching Tracebud once to initialize local SQLite"
adb -s "$DEVICE_SERIAL" shell am start -W -n "$APP_ID/.MainActivity" 2>/dev/null || \
  adb -s "$DEVICE_SERIAL" shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true

echo "==> Waiting for Tracebud process (up to 90s)"
for _ in $(seq 1 45); do
  if adb -s "$DEVICE_SERIAL" shell pidof "$APP_ID" 2>/dev/null | grep -q .; then
    echo "Tracebud process running"
    break
  fi
  sleep 2
done

dump_tracebud_logcat() {
  local label="${1:-logcat}"
  echo "==> $label"
  adb -s "$DEVICE_SERIAL" logcat -d -t 400 2>/dev/null \
    | grep -iE 'AndroidRuntime|FATAL EXCEPTION|ReactNative|ReactNativeJS|expo|SQLite|tracebud|AppState|MaestroBoot|boot failed' \
    | tail -100 || true
}

wait_for_android_js_boot() {
  local label="${1:-JS boot}"
  local max_ms="${MAESTRO_BOOT_WAIT_MS:-900000}"
  local poll_s="${MAESTRO_BOOT_POLL_S:-5}"
  local deadline=$(( $(date +%s) + max_ms / 1000 ))

  echo "==> Waiting for $label (logcat MaestroBoot / RN main, up to ${max_ms}ms)"
  adb -s "$DEVICE_SERIAL" logcat -c 2>/dev/null || true

  local boot_pattern='MaestroBoot|\[MaestroBoot\]|ReactNativeJS|ReactNative|Hermes|Running application "main"|Running "main" with|AppState.*ready|expo\.modules'

  while [[ "$(date +%s)" -lt "$deadline" ]]; do
    if adb -s "$DEVICE_SERIAL" logcat -d 2>/dev/null | grep -qEi "$boot_pattern"; then
      if adb -s "$DEVICE_SERIAL" logcat -d 2>/dev/null | grep -qEi 'MaestroBoot.*marker visible|MaestroBoot.*app state ready bootError=false|Running application "main"|Running "main" with|\[MaestroBoot\] app state ready bootError=false|\[MaestroBoot\] marker visible'; then
        echo "$label complete"
        return 0
      fi
    fi
    if adb -s "$DEVICE_SERIAL" logcat -d 2>/dev/null | grep -qE 'FATAL EXCEPTION.*com\.tracebud\.app'; then
      echo "App crashed during $label"
      dump_tracebud_logcat "Logcat after crash during $label"
      return 1
    fi
    sleep "$poll_s"
  done

  echo "Timed out waiting for $label (${max_ms}ms)"
  dump_tracebud_logcat "Logcat after $label timeout"
  return 1
}

if [[ "${MAESTRO_SEED_SKIP:-}" == "1" ]]; then
  echo "==> Applying golden-path boot profile (polls until DB exists, up to ${MAESTRO_SEED_DB_WAIT_MS:-120000}ms)"
  MAESTRO_BOOT_PROFILE="${MAESTRO_BOOT_PROFILE:-golden_path_minimal}" \
    MAESTRO_BOOT_PLATFORM=android \
    MAESTRO_ANDROID_SERIAL="$DEVICE_SERIAL" \
    MAESTRO_SEED_DB_WAIT_MS="${MAESTRO_SEED_DB_WAIT_MS:-120000}" \
    node "$ROOT/scripts/seed-maestro-boot-profile.mjs"

  echo "==> Post-seed warm-up launch (RN boot after SQLite patch)"
  adb -s "$DEVICE_SERIAL" shell am start -W -n "$APP_ID/.MainActivity" 2>/dev/null || \
    adb -s "$DEVICE_SERIAL" shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
  if wait_for_android_js_boot "bootstrap warm-up"; then
    export MAESTRO_BOOT_WARMED=1
  else
    echo "Bootstrap warm-up incomplete — Maestro will cold-start with extended boot wait"
    export MAESTRO_BOOT_WARMED=0
  fi
fi

if [[ "${MAESTRO_KEEP_WARM_PROCESS:-1}" == "1" && "${MAESTRO_BOOT_WARMED:-0}" == "1" ]]; then
  echo "==> Sending Tracebud to background (keep warm JS process for Maestro launchApp)"
  adb -s "$DEVICE_SERIAL" shell input keyevent 3 2>/dev/null || true
elif [[ "${MAESTRO_BOOT_WARMED:-0}" == "0" ]] && adb -s "$DEVICE_SERIAL" shell pidof "$APP_ID" 2>/dev/null | grep -q .; then
  echo "==> Warm-up incomplete but Tracebud still running — leaving process for Maestro cold attach"
else
  adb -s "$DEVICE_SERIAL" shell am force-stop "$APP_ID" 2>/dev/null || true
fi

if [[ "${MAESTRO_LOGCAT_ON_BOOTSTRAP:-1}" == "1" ]]; then
  dump_tracebud_logcat "Logcat after bootstrap seed"
fi

echo "Android bootstrap ready for Maestro (flow uses launchApp clearState: false)."
