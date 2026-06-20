## Tracebud Offline App (Expo React Native)

**Purpose:** Offline-first field app to walk a plot perimeter, store farmer/plot data locally, and sync to the Tracebud backend for compliance and traceability.

### 1. Prerequisites

- Node.js 18+
- Expo tooling (`npx expo` will auto-install)
- A running Tracebud backend (see `tracebud-backend/README.md`)
- A Supabase project with:
  - Same project as the backend
  - A test user (email + password) that maps to the desired role (farmer / agent / exporter)

### 2. Environment variables

Create `.env.local` in `apps/offline-product` with at least:

```bash
EXPO_PUBLIC_API_URL=http://localhost:4001/api
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
EXPO_PUBLIC_TRACEBUD_TEST_EMAIL=YOUR_TEST_USER_EMAIL
EXPO_PUBLIC_TRACEBUD_TEST_PASSWORD=YOUR_TEST_USER_PASSWORD
EXPO_PUBLIC_ALLOW_TEST_AUTH=1
EXPO_PUBLIC_ALLOW_LOCALHOST_API=1
EXPO_PUBLIC_ALLOW_INSECURE_API=1
```

These are used by the app’s API client to:

- Call the NestJS backend.
- Log in automatically to Supabase to obtain a JWT for each sync call.

Production safety defaults:

- `EXPO_PUBLIC_ALLOW_TEST_AUTH` defaults to off unless explicitly set to `1`.
- `EXPO_PUBLIC_ALLOW_LOCALHOST_API` defaults to off unless explicitly set to `1`.
- `EXPO_PUBLIC_ALLOW_INSECURE_API` defaults to off unless explicitly set to `1`.
- For preview/production builds, use a reachable HTTPS API URL (not localhost).
- Sync account credentials are stored in secure platform storage (Keychain/Keystore). Legacy
  plaintext settings are migrated automatically on first load.

### 3. Local development (no OTA)

**Preview/TestFlight builds load JavaScript from EAS Update.** Reloading that app does **not** pick up edits on your Mac. Use a **debug build + Metro** for day-to-day UI work.

From the **repo root** (after `npm install`):

```bash
npm run dev:offline
```

Or from this folder:

```bash
npm run dev:metro

# iOS Simulator — best for UI iteration (first run compiles native code; then hot reload)
npm run dev:ios

# Physical iPhone (USB) — GPS, camera, walk perimeter on a real device
npm run dev:metro          # terminal 1 — keep running
npm run dev:device         # terminal 2 — build/install (only when native code changes)
```
```

After install, open the app on your phone. If you see **“No script URL provided”**, Metro is not reachable — ensure `dev:metro` is running and tap **Reload JS**.

Keep the Metro terminal open. Save a file to refresh, or press **⌘R** in the simulator. If the bundle looks stale: **Shift+⌘R** (reload + clear cache).

**Build warnings (safe to ignore locally)**

| Warning | Meaning |
|---------|---------|
| `Skipping dev server` | Metro already running on port 8081 — normal if `dev:metro` is up |
| `devicectl JSON version` | Xcode ↔ device tooling noise; USB install still works |
| `deployment version mismatch` (Pods) | Fixed on next `pod install` after Podfile update |
| `Upload Debug Symbols to Sentry` | Disabled for local debug via `SENTRY_DISABLE_AUTO_UPLOAD` |
| `ignoring duplicate libraries: -lc++` | Harmless linker noise from React Native pods |

**Environment tips**

- Simulator: `EXPO_PUBLIC_API_URL=http://localhost:4000/api` is fine if the backend runs on your Mac.
- Physical device on Wi‑Fi: use your Mac’s LAN IP (see comment in `.env.local`), not `localhost`.
- The debug install is separate from the preview app — use the one Metro launched.

**When to use OTA instead**

| Goal | Command |
|------|---------|
| Local UI / logic changes | `npm run dev:ios` or `npm run dev:device` |
| Share with pilot testers on preview builds | `npm run update:preview:ios` |
| Store / production users | `npm run update:production` |

Expo Go is **not** supported (custom native modules, OAuth URL schemes). Use `dev:ios` / `dev:device`.

**Google / Apple sign-in locally**

```bash
npm run dev:oauth:verify    # env + Supabase redirect checks
npm run dev:oauth:ios       # simulator, production API (no local backend needed)
npm run dev:oauth:device    # USB iPhone, production API
```

Local debug builds use `tracebudoffline://auth/callback` automatically (`__DEV__`). Use `dev:oauth:*` when your LAN backend is off but you still want a full sign-in + sync test against `https://api.tracebud.com`.

**Simulator note:** Google uses the **browser** sign-in sheet on the simulator (native account picker only works on a physical iPhone). You should see Safari / ASWebAuthenticationSession open with Google.

Make sure the **backend** is running and reachable at `EXPO_PUBLIC_API_URL` when testing sync against a local API.

### 4. Features & flows

**Tabs:**

- **Home** – Walk the field perimeter with GPS, see live area estimate and precision, and save a plot with farmer declaration and self-identity.
- **Plots** – See locally stored plots, plus “Synced plots (backend)” with:
  - Computed area, declared area & discrepancy.
  - Compliance status and SINAPH/Indigenous overlap flags (after running compliance checks).
  - Harvest form to record kg and create vouchers in the backend.
  - DDS package creation from active vouchers.

**Offline behaviour:**

- Local data is stored with SQLite (`features/state/persistence.ts`).
- Sync calls are **best-effort**: if the network is unavailable, local state still persists; backend operations simply fail quietly (or show a simple error) and can be retried later.

### 5. Quick demo script

1. Start the backend (`npm run build && npm start` in `tracebud-backend`).
2. Start the app (`npm run dev:ios` in `apps/offline-product`).
3. In the app:
   - Go to **Home**, walk a perimeter and save a plot.
   - Switch to **Plots**:
     - Select a local plot.
     - Check it appears under “Synced plots (backend)” once sync succeeds.
     - Tap **Run compliance check** to flip compliance/overlap flags.
     - Enter kg and tap **Record harvest** to create a voucher.
     - Use **Create DDS package from active vouchers** to create an exporter package.

### 6. Release model (testing vs official app)

Use one codebase with separate release tracks:

- `development` -> internal dev builds
- `preview` -> QA and pilot testers
- `production` -> official public app for farmers

Commands:

```bash
# Build for testers (use npx eas-cli if eas is not global)
npx eas-cli build --platform ios --profile preview

# Build for official users
npm run release:production

# Production preflight + build (recommended)
npm run release:production:safe

# Rollout SLO go/no-go gate (before preview -> production promotion)
npm run release:slo:gate -- --report=release-health-report.json

# Submit official build to stores
npm run submit:production

# OTA updates (after validation)
npm run update:preview
npm run update:production
```

See `RELEASE_MODEL.md` for the full branch and promotion workflow.
For operational launch steps and staged rollout procedure, see `RELEASE_RUNBOOK.md`.
Example SLO report payload lives at `release-health-report.example.json`.

