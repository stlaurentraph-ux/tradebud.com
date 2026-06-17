#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Maestro CLI (installer adds ~/.maestro/bin)
export PATH="${PATH:+$PATH:}$HOME/.maestro/bin"

# Maestro requires a JDK; prefer Homebrew openjdk@17 when present.
if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -d /opt/homebrew/opt/openjdk@17 ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
  elif [[ -d /usr/local/opt/openjdk@17 ]]; then
    export JAVA_HOME="/usr/local/opt/openjdk@17"
  fi
fi
if [[ -n "${JAVA_HOME:-}" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found."
  echo "Install: curl -Ls \"https://get.maestro.mobile.dev\" | bash"
  echo "Then restart your terminal or: export PATH=\"\$PATH:\$HOME/.maestro/bin\""
  exit 1
fi

if ! java -version >/dev/null 2>&1; then
  echo "Java not found (required by Maestro)."
  echo "Install: brew install openjdk@17"
  echo "Then: export JAVA_HOME=\"/opt/homebrew/opt/openjdk@17\""
  exit 1
fi

# Booted simulator or USB device required.
if ! xcrun simctl list devices booted 2>/dev/null | grep -q Booted; then
  if ! command -v adb >/dev/null 2>&1 || ! adb devices 2>/dev/null | grep -q 'device$'; then
    echo "No booted iOS simulator or Android device found."
    echo "Start Simulator (Xcode) or connect a device, then retry."
    exit 1
  fi
fi

exec maestro test .maestro/flows "$@"
