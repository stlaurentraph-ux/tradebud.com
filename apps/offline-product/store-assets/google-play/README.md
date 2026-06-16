# Google Play store assets

## Required graphics

| Asset | Path | Size |
|-------|------|------|
| App icon | `app-icon-512.png` | 512 × 512 PNG |
| Feature graphic | `feature-graphic-1024x500.png` | 1024 × 500 PNG |
| Phone screenshots | `phone/*.png` | min 320px short side; 4–8 shots |
| 7" tablet (optional) | `tablet-7-inch/*.png` | same aspect as phone |
| 10" tablet (optional) | `tablet-10-inch/*.png` | landscape recommended |

Suggested phone order: Home → map/walk → My Plots → harvest → plot detail → register plot → settings/languages.

## Play Console upload

1. **Grow** → **Store presence** → **Main store listing**
2. Upload icon, feature graphic, and phone screenshots.
3. Complete **Data safety** (see `STORE_OPS_CHECKLIST.md` → Privacy mapping).
4. **Content rating** questionnaire → save IARC rating.
5. **Release** → production track → staged rollout (5% → 100%).

Package name must match `app.json`: `com.tracebud.app`.
