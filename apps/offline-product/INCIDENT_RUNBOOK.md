# Field app incident runbook

Ops guide when farmers report sync, sign-in, or data issues on `apps/offline-product`.

## Farmer-first triage (support)

1. **Data on device?** Plots and harvests live on the phone until backup succeeds. Reassure: local data is not lost if they can still open the app.
2. **Signed in?** Settings → Backup → sign in (email, Google, or Apple).
3. **Upload pending?** Home backup card or My Plots badge shows pending count. Settings → Backup → **Sync now**.
4. **Harvest queued offline?** Record shows a queued message; sync after signal returns.
5. **Still stuck?** `mailto:support@tracebud.com` with farmer email, device (iOS/Android), and screenshot of Settings → Backup message.

In-app copy: Settings → **Need help?** (farmer troubleshooting + contact).

## Engineering triage

| Symptom | Check | Mitigation |
|--------|--------|------------|
| Sign-in fails | Supabase auth, `EXPO_PUBLIC_SUPABASE_*`, OAuth redirect URLs | `npm run oauth:verify` |
| API 401/403 | `EXPO_PUBLIC_API_URL`, tenant role, session refresh | `syncAuthSession`, Sentry auth events |
| Plots not matching server | `clientPlotId` = local `plot.id` in server `name` | `backendPlotMatch.test.ts`, re-upload from My Plots |
| Harvest not on server | Pending sync queue row, `submitHarvestRecord` | Settings sync queue diagnostics |
| Crash spike | Sentry `tracebud/react-native` | OTA hotfix via `npm run update:production` after preview validation |

## Verification commands

From `apps/offline-product`:

```bash
npm run qa:full
npm run release:preflight:production:online   # requires production env + network
```

Manual soak: `npm run qa:device` → `DEVICE_SMOKE_CHECKLIST.md`.

## Escalation

1. Confirm scope (one farmer vs widespread).
2. Check API and Supabase status.
3. If widespread: pause store rollout %; ship OTA to `preview` first.
4. Document in `product-os/06-status/daily-log.md` with OTA/build id.

See also: `RELEASE_RUNBOOK.md`, `LAUNCH_READINESS_CHECKLIST.md`.
