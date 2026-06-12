# Tracebud Demo Apps

This folder groups all permanent public demo applications.

- `offline` -> `fieldapp-demo.tracebud.com`
- `exporter` -> `exporter-demo.tracebud.com`
- `importer` -> `importer-demo.tracebud.com`
- `cooperative` -> `cooperative-demo.tracebud.com`
- `country` -> `country-demo.tracebud.com`

Each demo app is independent from product deployments and is intended to remain publicly visible over time.

## Shared lib

`lib/` holds cross-demo assets and metadata:

- `lib/screenshots/` — reference PNGs of live demo dashboards (June 2026)
- `lib/demo-dashboard-screenshots.ts` — typed catalog with demo URLs and file paths

Import the catalog from any app in this folder when you need marketing, QA, or deck references:

```ts
import { DEMO_DASHBOARD_SCREENSHOTS } from "../lib";
```

