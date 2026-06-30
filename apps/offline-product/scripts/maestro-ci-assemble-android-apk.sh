#!/usr/bin/env bash
# Prebuild Android, embed the JS bundle, and assemble a standalone debug APK for Maestro CI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"
export MAESTRO_CI="${MAESTRO_CI:-1}"
export EXPO_PUBLIC_MAESTRO_CI="${EXPO_PUBLIC_MAESTRO_CI:-1}"
export EXPO_PUBLIC_SENTRY_ENABLED="${EXPO_PUBLIC_SENTRY_ENABLED:-0}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"

echo "==> expo prebuild (android)"
if [[ -f android/app/build.gradle && "${MAESTRO_FORCE_PREBUILD:-}" != "1" ]]; then
  echo "==> Reusing cached android/ tree (skip expo prebuild)"
else
  npx expo prebuild --platform android --no-install
fi

GRADLE_FILE="$ROOT/android/app/build.gradle"
echo "==> Force JS embed in debug APK (debug variant skips bundling by default)"
MAESTRO_GRADLE_FILE="$GRADLE_FILE" node <<'NODE'
const fs = require('node:fs');
const gradlePath = process.env.MAESTRO_GRADLE_FILE;
if (!gradlePath) {
  throw new Error('MAESTRO_GRADLE_FILE is required');
}
let source = fs.readFileSync(gradlePath, 'utf8');
if (!/debuggableVariants\s*=\s*\[\]/.test(source)) {
  source = source.replace(/react\s*\{/, 'react {\n    debuggableVariants = []');
}
if (!/debug\s*\{[^}]*debuggable\s+false/.test(source)) {
  source = source.replace(
    /(buildTypes\s*\{\s*debug\s*\{)/,
    '$1\n            debuggable false',
  );
}
fs.writeFileSync(gradlePath, source);
NODE

GRADLE_PROPS="$ROOT/android/gradle.properties"
if [[ -f "$GRADLE_PROPS" ]]; then
  MAESTRO_GRADLE_PROPS="$GRADLE_PROPS" node <<'NODE'
const fs = require('node:fs');
const propsPath = process.env.MAESTRO_GRADLE_PROPS;
if (!propsPath) throw new Error('MAESTRO_GRADLE_PROPS is required');
let source = fs.readFileSync(propsPath, 'utf8');
const upsert = (key, value) => {
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(source)) source = source.replace(re, `${key}=${value}`);
  else source += `\n${key}=${value}\n`;
};
upsert('hermesEnabled', 'true');
upsert('newArchEnabled', 'true');
upsert('org.gradle.parallel', 'true');
upsert('org.gradle.caching', 'true');
upsert('org.gradle.configureondemand', 'true');
const ciJvmArgs = 'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8';
if (/^org\.gradle\.jvmargs=/m.test(source)) {
  source = source.replace(/^org\.gradle\.jvmargs=.*$/m, ciJvmArgs);
} else {
  source += `\n${ciJvmArgs}\n`;
}
fs.writeFileSync(propsPath, source);
NODE
fi

# Run expo export:embed BEFORE generating the Maestro boot DB so that Metro
# does not see assets/maestro/tracebud_offline.db during its asset scan.
# metro.config.js adds '.db' to assetExts; if the DB file exists at export
# time, Metro can relocate it to a hashed asset path and the file ends up
# absent from assets/maestro/tracebud_offline.db in the final APK.
echo "==> expo export:embed (android) — bundle JS for offline APK (no Metro)"
npx expo export:embed --eager --platform android --dev false

echo "==> Generate Maestro CI boot SQLite asset (in-app seed — no host adb)"
node ./scripts/generate-maestro-ci-boot-db.mjs

MAESTRO_BOOT_DB_SRC="$ROOT/assets/maestro/tracebud_offline.db"
MAESTRO_BOOT_DB_DST="$ROOT/android/app/src/main/assets/maestro/tracebud_offline.db"
if [[ ! -f "$MAESTRO_BOOT_DB_SRC" ]]; then
  echo "::error::Missing generated Maestro boot DB at $MAESTRO_BOOT_DB_SRC"
  exit 1
fi
mkdir -p "$(dirname "$MAESTRO_BOOT_DB_DST")"
cp "$MAESTRO_BOOT_DB_SRC" "$MAESTRO_BOOT_DB_DST"
echo "==> Copied Maestro boot DB into Android native assets"

# Release assemble OOMs on GHA (Metaspace) — debug + embedded bundle is the CI path.
export GRADLE_OPTS="${GRADLE_OPTS:--Dorg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8}"

MAESTRO_ANDROID_ABI="${MAESTRO_ANDROID_ABI:-x86_64}"
echo "==> gradle assembleDebug (${MAESTRO_ANDROID_ABI} for CI emulator)"
cd android
./gradlew assembleDebug --no-daemon --build-cache --parallel -q -PreactNativeArchitectures="$MAESTRO_ANDROID_ABI"

APK_PATH="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
if [[ ! -f "$APK_PATH" ]]; then
  echo "Missing APK at $APK_PATH"
  exit 1
fi

# Capture unzip listing once and grep via here-string (not a pipe) to avoid
# SIGPIPE false-negative under pipefail: `cmd | grep -q` makes grep -q exit
# early on match → upstream gets SIGPIPE → pipefail returns non-zero.
# A here-string (<<<) is a redirection, not a pipeline, so pipefail doesn't apply.
APK_LIST="$(unzip -l "$APK_PATH" 2>/dev/null || true)"

if ! grep -qE 'assets/index.android.bundle|\.hbc' <<< "$APK_LIST"; then
  echo "::error::Missing embedded JS bundle (index.android.bundle) in $APK_PATH — debug APK will not boot offline without debuggableVariants = []."
  grep -E '.' <<< "$APK_LIST" | head -40 || true
  exit 1
fi

if ! grep -q "lib/${MAESTRO_ANDROID_ABI}/" <<< "$APK_LIST"; then
  echo "::error::Missing lib/${MAESTRO_ANDROID_ABI} native libs in $APK_PATH — CI emulator requires ${MAESTRO_ANDROID_ABI} ABI."
  grep 'lib/' <<< "$APK_LIST" | head -20 || true
  exit 1
fi

if ! grep -qE 'assets/maestro/tracebud_offline\.db|maestro/tracebud_offline\.db' <<< "$APK_LIST"; then
  echo "::error::Missing assets/maestro/tracebud_offline.db in $APK_PATH — in-app Maestro seed requires bundled DB."
  grep -i maestro <<< "$APK_LIST" || true
  exit 1
fi

echo "Android debug APK ready (embedded bundle + Maestro boot DB verified): $APK_PATH"
