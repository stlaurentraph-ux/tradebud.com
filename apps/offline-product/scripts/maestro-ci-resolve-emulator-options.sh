#!/usr/bin/env bash
# Print emulator flags for reactivecircus/android-emulator-runner (snapshot-aware).
# Loaded snapshot on cache hit; cold boot writes snapshot on emulator quit for
# actions/cache/save on ~/.android/avd (no -no-snapshot-save).
set -euo pipefail

SNAPSHOT_NAME="${MAESTRO_EMULATOR_SNAPSHOT_NAME:-maestro_ci_boot}"
BASE_OPTS="${MAESTRO_EMULATOR_BASE_OPTS:--no-window -gpu swiftshader_indirect -noaudio -no-boot-anim -memory 4096}"

echo "-snapshot ${SNAPSHOT_NAME} ${BASE_OPTS}"
