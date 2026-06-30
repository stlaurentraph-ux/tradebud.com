#!/usr/bin/env bash
# Print emulator -engine flags for reactivecircus/android-emulator-runner (snapshot-aware).
set -euo pipefail

SNAPSHOT_NAME="${MAESTRO_EMULATOR_SNAPSHOT_NAME:-maestro_ci_boot}"
BASE_OPTS="${MAESTRO_EMULATOR_BASE_OPTS:--no-window -gpu swiftshader_indirect -noaudio -no-boot-anim -memory 4096}"
CACHE_HIT="${MAESTRO_EMULATOR_SNAPSHOT_CACHE_HIT:-0}"

if [[ "$CACHE_HIT" == "1" ]]; then
  echo "-snapshot ${SNAPSHOT_NAME} ${BASE_OPTS}"
else
  # Cold boot; snapshot is written on emulator quit for actions/cache/save on ~/.android/avd.
  echo "-snapshot ${SNAPSHOT_NAME} ${BASE_OPTS}"
fi
