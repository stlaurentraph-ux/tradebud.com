#!/usr/bin/env bash
# Local Android Maestro runner — CI-parity without GitHub Actions or Maestro Cloud.
#
# Prerequisites (one-time):
#   - Android SDK (ANDROID_HOME or ANDROID_SDK_ROOT)
#   - Maestro CLI: curl -Ls "https://get.maestro.mobile.dev" | bash
#   - Java 17+, Node 20
#   - x86_64 system image for CI parity on Intel Mac / Linux; arm64-v8a on Apple Silicon is OK locally
#
# Usage:
#   npm run qa:maestro:local:android              # PR smoke (fast)
#   npm run qa:maestro:local:android:golden       # full golden path (warm bootstrap)
#
# Env:
#   MAESTRO_LOCAL_MODE=smoke|golden               default smoke
#   MAESTRO_LOCAL_BOOT_EMULATOR=1                 start AVD when none booted (needs avdmanager)
#   MAESTRO_LOCAL_SKIP_ASSEMBLE=1                 reuse existing APK
#   MAESTRO_ANDROID_ABI=arm64-v8a|x86_64          default: auto from host + emulator
#   MAESTRO_ANDROID_AVD=Pixel_6_API_33            override AVD name for boot
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${PATH:+$PATH:}$HOME/.maestro/bin"

MODE="${MAESTRO_LOCAL_MODE:-smoke}"
if [[ "${1:-}" == "golden" ]]; then
  MODE=golden
elif [[ "${1:-}" == "smoke" ]]; then
  MODE=smoke
fi

resolve_sdk_root() {
  if [[ -n "${ANDROID_HOME:-}" ]]; then
    echo "$ANDROID_HOME"
    return
  fi
  if [[ -n "${ANDROID_SDK_ROOT:-}" ]]; then
    echo "$ANDROID_SDK_ROOT"
    return
  fi
  if [[ -d "$HOME/Library/Android/sdk" ]]; then
    echo "$HOME/Library/Android/sdk"
    return
  fi
  echo ""
}

SDK_ROOT="$(resolve_sdk_root)"
if [[ -z "$SDK_ROOT" || ! -d "$SDK_ROOT/platform-tools" ]]; then
  echo "[error] Android SDK not found. Set ANDROID_HOME or install Android Studio."
  exit 1
fi
export ANDROID_HOME="$SDK_ROOT"
export PATH="$SDK_ROOT/platform-tools:$SDK_ROOT/emulator:$SDK_ROOT/cmdline-tools/latest/bin:$PATH"

if ! command -v adb >/dev/null 2>&1; then
  echo "[error] adb not on PATH (expected under $SDK_ROOT/platform-tools)"
  exit 1
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "[error] Maestro CLI not found. Install: curl -Ls \"https://get.maestro.mobile.dev\" | bash"
  exit 1
fi

detect_host_abi() {
  local arch
  arch="$(uname -m)"
  case "$arch" in
    x86_64|amd64) echo "x86_64" ;;
    arm64|aarch64) echo "arm64-v8a" ;;
    *) echo "x86_64" ;;
  esac
}

HOST_ABI="$(detect_host_abi)"
export MAESTRO_ANDROID_ABI="${MAESTRO_ANDROID_ABI:-$HOST_ABI}"

boot_emulator_if_needed() {
  local serial
  serial="$(adb devices 2>/dev/null | awk '/^emulator-/{print $1; exit}')"
  if [[ -n "$serial" ]]; then
    echo "==> Using booted emulator: $serial"
    export ANDROID_SERIAL="$serial"
    export MAESTRO_ANDROID_SERIAL="$serial"
    return
  fi

  serial="$(adb devices 2>/dev/null | awk 'NR>1 && $2=="device" && $1 !~ /^emulator-/ { print $1; exit }')"
  if [[ -n "$serial" ]]; then
    echo "[warn] No emulator — using physical device $serial (Maestro CI parity expects an emulator)."
    export ANDROID_SERIAL="$serial"
    export MAESTRO_ANDROID_SERIAL="$serial"
    return
  fi

  if [[ "${MAESTRO_LOCAL_BOOT_EMULATOR:-}" != "1" ]]; then
    echo "[error] No booted Android emulator."
    echo "Boot one in Android Studio, or re-run with MAESTRO_LOCAL_BOOT_EMULATOR=1"
    echo "  Example: MAESTRO_LOCAL_BOOT_EMULATOR=1 npm run qa:maestro:local:android"
    adb devices -l || true
    exit 1
  fi

  if ! command -v emulator >/dev/null 2>&1; then
    echo "[error] emulator binary not found under $SDK_ROOT/emulator"
    exit 1
  fi

  local avd="${MAESTRO_ANDROID_AVD:-}"
  if [[ -z "$avd" ]]; then
    avd="$(avdmanager list avd 2>/dev/null | awk -F': ' '/Name:/{print $2; exit}')"
  fi
  if [[ -z "$avd" ]]; then
    echo "[error] No AVD found. Create a Pixel 6 API 33 emulator in Android Studio."
    exit 1
  fi

  echo "==> Starting emulator AVD: $avd (ABI hint: $MAESTRO_ANDROID_ABI)"
  emulator -avd "$avd" -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect &
  local emu_pid=$!
  trap 'kill "$emu_pid" 2>/dev/null || true' EXIT

  adb wait-for-device
  local deadline=$(( $(date +%s) + 600 ))
  while [[ "$(date +%s)" -lt "$deadline" ]]; do
    if adb shell getprop sys.boot_completed 2>/dev/null | grep -q '^1$'; then
      echo "==> Emulator booted"
      trap - EXIT
      return
    fi
    sleep 3
  done
  echo "[error] Emulator boot timed out (10 min)"
  exit 1
}

echo "==> Maestro local Android (mode=$MODE, ABI=$MAESTRO_ANDROID_ABI)"
echo "    Free local CI-parity — no Maestro Cloud or GitHub macOS minutes."
echo ""

boot_emulator_if_needed

export EXPO_PUBLIC_MAESTRO_CI=1
export EXPO_PUBLIC_SENTRY_ENABLED=0
export SENTRY_DISABLE_AUTO_UPLOAD=true
export MAESTRO_SEED_SKIP=1
export MAESTRO_ANDROID_IN_APP_DB_SEED=1
export MAESTRO_CI_ARTIFACT_DIR="${MAESTRO_CI_ARTIFACT_DIR:-$ROOT/ci-artifacts/maestro-android-local}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"

if [[ "${MAESTRO_LOCAL_SKIP_ASSEMBLE:-}" != "1" ]]; then
  echo "==> Assembling CI-parity debug APK (embedded bundle + Maestro boot DB)"
  bash "$ROOT/scripts/maestro-ci-assemble-android-apk.sh"
fi

APK_PATH="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
if [[ ! -f "$APK_PATH" ]]; then
  echo "[error] Missing APK at $APK_PATH — run assemble or drop MAESTRO_LOCAL_SKIP_ASSEMBLE"
  exit 1
fi

bash "$ROOT/scripts/maestro-ci-stage-android-apk.sh"

if [[ "$MODE" == "golden" ]]; then
  export MAESTRO_SKIP_BOOTSTRAP_WARM=0
  export MAESTRO_JS_BOOT_FAIL_FAST=1
  export MAESTRO_BOOT_WAIT_MS="${MAESTRO_BOOT_WAIT_MS:-2700000}"
  export MAESTRO_BOOTSTRAP_WARM_MS="${MAESTRO_BOOTSTRAP_WARM_MS:-1200000}"
  export MAESTRO_JS_BOOT_FAIL_FAST_MS="${MAESTRO_JS_BOOT_FAIL_FAST_MS:-1800000}"
  export MAESTRO_CI_RETRY_ATTEMPTS="${MAESTRO_CI_RETRY_ATTEMPTS:-2}"
  echo "==> Running full Android golden path (settings-sync-smoke-android.yaml)"
  bash "$ROOT/scripts/maestro-ci-golden-path-android.sh"
else
  export MAESTRO_SKIP_BOOTSTRAP_WARM=1
  export MAESTRO_JS_BOOT_FAIL_FAST=1
  export MAESTRO_BOOT_WAIT_MS="${MAESTRO_BOOT_WAIT_MS:-1800000}"
  export MAESTRO_JS_BOOT_FAIL_FAST_MS="${MAESTRO_JS_BOOT_FAIL_FAST_MS:-600000}"
  export MAESTRO_CI_RETRY_ATTEMPTS="${MAESTRO_CI_RETRY_ATTEMPTS:-1}"
  echo "==> Running Android PR smoke (android-pr-smoke.yaml)"
  bash "$ROOT/scripts/maestro-ci-golden-path-android-smoke.sh"
fi

echo ""
echo "Maestro local Android ($MODE) passed."
