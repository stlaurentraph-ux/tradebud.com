#!/usr/bin/env bash
# Prebuild iOS, embed the JS bundle, and assemble a simulator .app for Maestro CI.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export SENTRY_DISABLE_AUTO_UPLOAD="${SENTRY_DISABLE_AUTO_UPLOAD:-true}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.tracebud.com/api}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export EXPO_PUBLIC_OAUTH_BRIDGE_URL="${EXPO_PUBLIC_OAUTH_BRIDGE_URL:-https://app.tracebud.com/auth/callback}"
export EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL="${EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL:-https://app.tracebud.com/auth/confirm}"

IOS_BUILD_DIR="$ROOT/ios-build"
DERIVED_DATA="$IOS_BUILD_DIR/DerivedData"
APP_PATH="$DERIVED_DATA/Build/Products/Debug-iphonesimulator/Tracebud.app"

echo "==> expo prebuild (ios)"
npx expo prebuild --platform ios --no-install

echo "==> expo export:embed (ios) — bundle JS for offline simulator build (no Metro)"
npx expo export:embed --eager --platform ios --dev false

echo "==> pod install"
cd ios
pod install --repo-update

echo "==> xcodebuild (iphonesimulator Debug)"
xcodebuild \
  -workspace Tracebud.xcworkspace \
  -scheme Tracebud \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath "$DERIVED_DATA" \
  ONLY_ACTIVE_ARCH=YES \
  CODE_SIGNING_ALLOWED=NO \
  -quiet

if [[ ! -d "$APP_PATH" ]]; then
  echo "Missing simulator app at $APP_PATH"
  exit 1
fi

echo "iOS simulator app ready: $APP_PATH"
