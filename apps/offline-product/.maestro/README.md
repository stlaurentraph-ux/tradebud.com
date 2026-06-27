# Maestro golden-path flows (field app)

End-to-end UI smoke tests for the Tracebud offline app (`com.tracebud.app`).

## 1. Install Maestro CLI (macOS)

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Restart your terminal, or run once:

```bash
export PATH="$PATH:$HOME/.maestro/bin"
```

Verify:

```bash
maestro --version
```

## 2. Install Java (required)

Maestro needs a JDK. On macOS with Homebrew:

```bash
brew install openjdk@17
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"   # Intel: /usr/local/opt/openjdk@17
export PATH="$JAVA_HOME/bin:$PATH"
```

Add those `export` lines to `~/.zshrc` so new terminals pick them up.

Optional (lets macOS find Java system-wide):

```bash
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

## 3. Device / simulator

**iOS (recommended for this repo):**

1. Open Xcode → **Xcode → Open Developer Tool → Simulator**
2. Boot a device (e.g. iPhone 17 Pro Max)
3. Install a **debug** or **preview** build of Tracebud (`com.tracebud.app`):
   - **Local dev (hot reload):** `cd apps/offline-product && npm run dev:ios`
   - EAS preview on simulator: `npm run run:simulator`

**Android:** start an emulator from Android Studio, install the same app id, connect with `adb devices`.

## 4. Seed app state (before document / plot flows)

**CI (golden path, nightly, OTA gate):** `maestro-ci-bootstrap-simulator.sh` launches Tracebud once, runs `scripts/seed-maestro-simulator.mjs` (farmer **Maria Santos**, plot **Finca Norte**, English locale), then terminates the app. Set `MAESTRO_SEED_SKIP=1` to skip seeding.

**Local manual runs** — same seed after one app launch:

```bash
node scripts/seed-maestro-simulator.mjs
# or: npm run test:maestro:seed
```

`mark-three-corners.yaml` only needs the app installed (starts from Home → Walk my plot).

## 5. Run tests

From `apps/offline-product`:

```bash
npm run test:maestro
```

The script checks for Maestro, Java, and a booted simulator / connected device, then runs all flows in `.maestro/flows/`.

Run a single flow:

```bash
bash ./scripts/maestro-test.sh --include mark-three-corners.yaml
# or directly:
maestro test .maestro/flows/mark-three-corners.yaml
```

Debug output (screenshots, logs) is written under `~/.maestro/tests/`.

## 6. Optional: Maestro Studio (visual authoring)

Download **Maestro Studio** from [maestro.mobile.dev](https://maestro.mobile.dev/) to record flows, inspect elements, and run tests from a GUI. The YAML flows in this folder work with both Studio and CLI.

## Flows

| Flow | Covers | Notes |
|------|--------|-------|
| `land-title-photo.yaml` | §7 land title thumbnail | Photo library; may need media on simulator |
| `tenure-evidence.yaml` | §7 tenure doc row | Same |
| `mark-three-corners.yaml` | §2 mark corners | Needs location; best on device or simulator with mocked GPS |
| `settings-sync-smoke.yaml` | Settings → Backup | Requires Backup section; Sync now or sign-in CTA |
| `cross-device-restore-smoke.yaml` | DEVICE_SMOKE §12 subset | Device B seed (`cross_device_b`): plot linked, no local media; restore entry points |

## testID map

| testID | Screen |
|--------|--------|
| `maestro-boot-ready` | CI boot anchor — auth ready, welcome not blocking (`SignInSheetContext`) |
| `tab-home` | Bottom tab → Home |
| `tab-my-plots` | Bottom tab → My Plots |
| `tab-settings` | Bottom tab → Settings |
| `settings-sync-now` | Settings → Sync now (signed in) |
| `settings-cloud-parity-section` | Settings → Backup / sync card |
| `settings-cloud-parity-hint-0` | Cloud parity hint (when server > local) |
| `plot-card` | My Plots list |
| `plot-nav-documents` | Plot detail → Documents tab |
| `plot-upload-land-proof` | Upload land proof (photo, file, or camera) |
| `plot-add-tenure-evidence` | Add tenure evidence |
| `plot-land-title-photo-count` | Land title photo count |
| `plot-tenure-evidence-section` | Tenure evidence section |
| `walk-method-mark-corners` | Register plot → Mark corners |
| `walk-save-corner` | Save corner (after hold timer on device) |

Human smoke (GPS, camera, sync) remains mandatory — see `DEVICE_SMOKE_CHECKLIST.md` and `npm run qa:device:signoff`.

## CI (GitHub Actions)

- **Linux (blocking):** `npm run qa:maestro:preflight` in the Expo `app` CI job — validates flow manifest, `appId`, and testID wiring without a simulator.
- **Offline Maestro workflow:** PR + `main` push run iOS (macOS) and Android (emulator) golden path (`settings-sync-smoke.yaml`); manual dispatch for full flows.

See `product-os/04-quality/offline-automation-runbook.md` § Maestro CI.
