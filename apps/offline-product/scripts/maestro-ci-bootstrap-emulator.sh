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

resolve_maestro_apk_path() {
  local default_apk="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
  local -a candidates=()
  candidates+=("${MAESTRO_ANDROID_APK_STAGED:-/tmp/tracebud-maestro-ci-app-debug.apk}")
  candidates+=("${MAESTRO_ANDROID_APK_PATH:-}")
  candidates+=("$default_apk")
  candidates+=("$(dirname "$default_apk")/maestro-android-apk/app-debug.apk")

  while IFS= read -r found; do
    candidates+=("$found")
  done < <(find "$ROOT/android" -name 'app-debug.apk' -type f 2>/dev/null || true)

  local candidate apk_list
  for candidate in "${candidates[@]}"; do
    [[ -n "$candidate" && -f "$candidate" ]] || continue
    apk_list="$(unzip -l "$candidate" 2>/dev/null || true)"
    if grep -qE 'assets/maestro/tracebud_offline\.db|maestro/tracebud_offline\.db' <<< "$apk_list"; then
      echo "$candidate"
      return 0
    fi
  done

  echo "::error::No Maestro CI APK with assets/maestro/tracebud_offline.db (assemble + artifact download must run first)."
  for candidate in "${candidates[@]}"; do
    [[ -n "$candidate" ]] || continue
    echo "  checked: $candidate (exists=$([[ -f "$candidate" ]] && echo yes || echo no))"
  done
  find "$ROOT" -name 'app-debug.apk' 2>/dev/null | head -5 || true
  return 1
}

APK_PATH="$(resolve_maestro_apk_path)" || exit 1
export MAESTRO_ANDROID_APK_PATH="$APK_PATH"

preflight_maestro_apk() {
  echo "==> Preflight: bundled Maestro boot DB in APK ($APK_PATH)"
  local apk_list
  apk_list="$(unzip -l "$APK_PATH" 2>/dev/null || true)"
  if ! grep -qE 'assets/maestro/tracebud_offline\.db|maestro/tracebud_offline\.db' <<< "$apk_list"; then
    echo "::error::APK missing assets/maestro/tracebud_offline.db — assemble must run generate-maestro-ci-boot-db.mjs"
    echo "==> APK contents (maestro/assets):"
    grep -iE 'maestro|assets/|\.db$' <<< "$apk_list" || echo "  (unzip failed or no matching entries)"
    exit 1
  fi
}

preflight_maestro_apk

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
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000}"

dump_tracebud_logcat() {
  local label="${1:-logcat}"
  echo "==> $label"
  adb -s "$DEVICE_SERIAL" logcat -d -t 400 2>/dev/null \
    | grep -iE 'AndroidRuntime|FATAL EXCEPTION|ReactNative|ReactNativeJS|Hermes|expo|SQLite|tracebud|AppState|MaestroBoot|boot failed|JSExecutor|Bridgeless' \
    | tail -100 || true
}

logcat_has_boot_error() {
  adb -s "$DEVICE_SERIAL" logcat -d 2>/dev/null | grep -qEi \
    'MaestroBoot.*bootError=true|\[AppState\] boot failed'
}

logcat_has_js_boot_signal() {
  if logcat_has_boot_error; then
    return 1
  fi
  adb -s "$DEVICE_SERIAL" logcat -d 2>/dev/null | grep -qEi \
    'MaestroBoot.*marker visible|MaestroBoot.*app state ready bootError=false|MaestroBoot.*copied bundled|\[MaestroBoot\] app state ready bootError=false|\[MaestroBoot\] marker visible|Running application "main"|Running "main" with|ReactNativeJS'
}

wait_for_android_js_boot() {
  local label="${1:-JS boot}"
  local max_ms="${MAESTRO_BOOT_WAIT_MS:-2700000}"
  local fail_fast_ms="${MAESTRO_JS_BOOT_FAIL_FAST_MS:-1800000}"
  local poll_s="${MAESTRO_BOOT_POLL_S:-5}"
  local started_at
  started_at="$(date +%s)"
  local deadline=$(( started_at + max_ms / 1000 ))
  local fail_fast_deadline=$(( started_at + fail_fast_ms / 1000 ))
  local strict_fail="${MAESTRO_JS_BOOT_FAIL_FAST:-1}"

  echo "==> Waiting for $label (max ${max_ms}ms, fail-fast ${fail_fast_ms}ms if no JS signals)"
  adb -s "$DEVICE_SERIAL" logcat -c 2>/dev/null || true

  while [[ "$(date +%s)" -lt "$deadline" ]]; do
    if logcat_has_boot_error; then
      echo "::error::Maestro CI boot failed (bootError=true in logcat during $label)"
      dump_tracebud_logcat "Logcat after boot error during $label"
      return 1
    fi
    if logcat_has_js_boot_signal; then
      echo "$label complete"
      return 0
    fi
    if adb -s "$DEVICE_SERIAL" logcat -d 2>/dev/null | grep -qE 'FATAL EXCEPTION.*com\.tracebud\.app'; then
      echo "::error::App crashed during $label"
      dump_tracebud_logcat "Logcat after crash during $label"
      return 1
    fi
    if [[ "$strict_fail" == "1" && "$(date +%s)" -ge "$fail_fast_deadline" ]] && ! logcat_has_js_boot_signal; then
      echo "::error::Fail-fast: no JS boot signals within ${fail_fast_ms}ms during $label"
      dump_tracebud_logcat "Logcat after fail-fast $label"
      return 1
    fi
    sleep "$poll_s"
  done

  echo "::error::Timed out waiting for $label (${max_ms}ms)"
  dump_tracebud_logcat "Logcat after $label timeout"
  return 1
}

if [[ "${MAESTRO_ANDROID_IN_APP_DB_SEED:-1}" == "1" ]]; then
  echo "==> Maestro golden path uses in-app bundled SQLite (skip host adb seed)"
  if [[ "${MAESTRO_SKIP_BOOTSTRAP_WARM:-}" == "1" ]]; then
    echo "==> Skip bootstrap JS warm (smoke cold start — Maestro flow owns boot wait)"
    adb -s "$DEVICE_SERIAL" shell am force-stop "$APP_ID" 2>/dev/null || true
  else
    adb -s "$DEVICE_SERIAL" shell am start -n "$APP_ID/.MainActivity" 2>/dev/null || \
      adb -s "$DEVICE_SERIAL" shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true

    bootstrap_warm_ms="${MAESTRO_BOOTSTRAP_WARM_MS:-1200000}"
    if MAESTRO_BOOT_WAIT_MS="$bootstrap_warm_ms" wait_for_android_js_boot "bootstrap warm-up"; then
      export MAESTRO_BOOT_WARMED=1
    else
      echo "::error::Bootstrap warm-up failed — aborting Android golden path (no multi-hour Maestro wait)"
      exit 1
    fi
  fi
elif [[ "${MAESTRO_SEED_SKIP:-}" == "1" ]]; then
  echo "==> Legacy host adb seed (MAESTRO_ANDROID_IN_APP_DB_SEED=0)"
  MAESTRO_BOOT_PROFILE="${MAESTRO_BOOT_PROFILE:-golden_path_minimal}" \
    MAESTRO_BOOT_PLATFORM=android \
    MAESTRO_ANDROID_SERIAL="$DEVICE_SERIAL" \
    MAESTRO_ANDROID_FORCE_PROVISION=1 \
    node "$ROOT/scripts/seed-maestro-boot-profile.mjs"

  speed_compile_tracebud_apk
  adb -s "$DEVICE_SERIAL" shell am start -n "$APP_ID/.MainActivity" 2>/dev/null || \
    adb -s "$DEVICE_SERIAL" shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true

  bootstrap_warm_ms="${MAESTRO_BOOTSTRAP_WARM_MS:-1200000}"
  if MAESTRO_BOOT_WAIT_MS="$bootstrap_warm_ms" wait_for_android_js_boot "bootstrap warm-up"; then
    export MAESTRO_BOOT_WARMED=1
  else
    echo "::error::Bootstrap warm-up failed"
    exit 1
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
  dump_tracebud_logcat "Logcat after bootstrap"
fi

echo "Android bootstrap ready for Maestro (smoke: cold start; golden: warm attach when MAESTRO_BOOT_WARMED=1)."
