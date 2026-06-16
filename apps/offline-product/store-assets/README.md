# Store assets hub

Canonical paths for App Store and Google Play submission.

| Platform | Folder | Checklist |
|----------|--------|-----------|
| iOS | [`app-store/`](./app-store/README.md) | `STORE_OPS_CHECKLIST.md` § iOS |
| Android | [`google-play/`](./google-play/README.md) | `STORE_OPS_CHECKLIST.md` § Google Play |

## Commands

```bash
npm run store:preflight              # required assets + privacy strings (macOS checks PNG sizes)
npm run store:preflight -- --strict  # also fail on missing Google Play assets
npm run generate:store-screenshots   # regenerate iPhone 6.7" marketing frames
npm run store:screenshots:capture    # simulator capture guide
```

Run before `npm run submit:production`.
