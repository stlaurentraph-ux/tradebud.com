#!/usr/bin/env bash
# Resolve the Maestro CI APK (must contain bundled boot DB) and stage outside android/build churn.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STAGED_APK="${MAESTRO_ANDROID_APK_STAGED:-/tmp/tracebud-maestro-ci-app-debug.apk}"
DEFAULT_APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"

apk_has_maestro_db() {
  local apk="$1"
  [[ -f "$apk" ]] || return 1
  local apk_list
  apk_list="$(unzip -l "$apk" 2>/dev/null || true)"
  grep -qE 'assets/maestro/tracebud_offline\.db|maestro/tracebud_offline\.db' <<< "$apk_list"
}

collect_candidates() {
  local -a candidates=()
  local path seen duplicate

  add_candidate() {
    path="$1"
    [[ -n "$path" ]] || return 0
    duplicate=0
    if ((${#candidates[@]} > 0)); then
      for seen in "${candidates[@]}"; do
        if [[ "$seen" == "$path" ]]; then
          duplicate=1
          break
        fi
      done
    fi
    if [[ "$duplicate" -eq 0 ]]; then
      candidates+=("$path")
    fi
  }

  add_candidate "${MAESTRO_ANDROID_APK_PATH:-}"
  add_candidate "$DEFAULT_APK"
  add_candidate "$(dirname "$DEFAULT_APK")/maestro-android-apk/app-debug.apk"
  add_candidate "${MAESTRO_ANDROID_APK_STAGED:-/tmp/tracebud-maestro-ci-app-debug.apk}"

  while IFS= read -r path; do
    add_candidate "$path"
  done < <(find "$ROOT/android" -name 'app-debug.apk' -type f 2>/dev/null || true)

  if ((${#candidates[@]} > 0)); then
    printf '%s\n' "${candidates[@]}"
  fi
}

RESOLVED=""
while IFS= read -r candidate; do
  [[ -z "$candidate" ]] && continue
  if apk_has_maestro_db "$candidate"; then
    RESOLVED="$candidate"
    break
  fi
done < <(collect_candidates)

if [[ -z "$RESOLVED" ]]; then
  echo "::error::No Maestro CI APK with assets/maestro/tracebud_offline.db found under $ROOT/android"
  while IFS= read -r candidate; do
    [[ -z "$candidate" ]] || echo "  candidate: $candidate (exists=$([[ -f "$candidate" ]] && echo yes || echo no))"
  done < <(collect_candidates)
  exit 1
fi

mkdir -p "$(dirname "$STAGED_APK")"
cp -f "$RESOLVED" "$STAGED_APK"
echo "==> Staged Maestro CI APK ($RESOLVED → $STAGED_APK)"
if [[ -n "${GITHUB_ENV:-}" ]]; then
  echo "MAESTRO_ANDROID_APK_PATH=$STAGED_APK" >> "$GITHUB_ENV"
fi
export MAESTRO_ANDROID_APK_PATH="$STAGED_APK"
