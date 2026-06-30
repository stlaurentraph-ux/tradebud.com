#!/usr/bin/env bash
# One-time (or when Apple/Android credentials need repair) — run in your own terminal.
# EAS cannot complete Apple login from non-interactive agents.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Expo account: $(npx eas-cli whoami 2>/dev/null || true)"
echo ""
echo "EAS environment variables (production):"
npx eas-cli env:list production
echo ""
echo "=== iOS (distribution cert + provisioning profile) ==="
echo "Log in with your Apple ID when prompted. Team: TRACEBUD AS (6RT8K5RM6Z)"
npx eas-cli credentials:configure-build -p ios -e production
echo ""
echo "=== Android (keystore) ==="
npx eas-cli credentials:configure-build -p android -e production
echo ""
echo "=== Android Play submit (service account JSON) ==="
echo "Place Play Console API key at: local/google-play-service-account.json"
echo "(gitignored — wired in eas.json submit.production.android.serviceAccountKeyPath)"
echo "Or upload via: npx eas-cli credentials -p android"
echo ""
echo "Done. Verify with: npx eas-cli build -p ios --profile preview --non-interactive --no-wait"
