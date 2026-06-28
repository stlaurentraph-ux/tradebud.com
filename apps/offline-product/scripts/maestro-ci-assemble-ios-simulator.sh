#!/usr/bin/env bash
# Prebuild iOS, embed the JS bundle, and assemble a simulator .app for Maestro CI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"
export MAESTRO_CI="${MAESTRO_CI:-1}"
export EXPO_PUBLIC_MAESTRO_CI="${EXPO_PUBLIC_MAESTRO_CI:-1}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"

IOS_BUILD_DIR="$ROOT/ios-build"
DERIVED_DATA="$IOS_BUILD_DIR/DerivedData"
# Release embeds JS; Debug+simulator skips bundling (SKIP_BUNDLING=1 in Expo .xcode.env).
IOS_CONFIGURATION="${IOS_CONFIGURATION:-Release}"
APP_PATH="$DERIVED_DATA/Build/Products/${IOS_CONFIGURATION}-iphonesimulator/Tracebud.app"

echo "==> expo prebuild (ios)"
npx expo prebuild --platform ios --no-install

echo "==> expo export:embed (ios) — bundle JS for offline simulator build (no Metro)"
npx expo export:embed --eager --platform ios --dev false

echo "==> pod install"
cd ios
pod install --repo-update

echo "==> xcodebuild (iphonesimulator ${IOS_CONFIGURATION} — embeds JS bundle for offline Maestro)"
cd "$ROOT/ios"
xcodebuild \
  -workspace Tracebud.xcworkspace \
  -scheme Tracebud \
  -configuration "$IOS_CONFIGURATION" \
  -sdk iphonesimulator \
  -derivedDataPath "$DERIVED_DATA" \
  ONLY_ACTIVE_ARCH=YES \
  CODE_SIGNING_ALLOWED=NO \
  -quiet

if [[ ! -d "$APP_PATH" ]]; then
  echo "Missing simulator app at $APP_PATH"
  exit 1
fi

if ! find "$APP_PATH" \( -name 'main.jsbundle' -o -name '*.hbc' -o -name '*.jsbundle' \) -print -quit | grep -q .; then
  echo "::error::Missing embedded JS bundle in $APP_PATH — app will not boot offline (use FORCE_BUNDLING=1)."
  find "$APP_PATH" -maxdepth 4 -type f 2>/dev/null | head -30 || true
  exit 1
fi

echo "iOS simulator app ready (embedded bundle verified): $APP_PATH"
