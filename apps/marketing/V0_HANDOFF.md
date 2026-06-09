# v0 handoff — marketing site restructure

**Branch for v0:** `v0/marketing-site-restructure` (or `main` — same content after PR #106)  
**Package:** `apps/marketing`  
**Status:** Stage A complete — style in v0, launch in Stage B

## Quick start

```bash
cd apps/marketing
npm install
npm run dev
```

Open **http://localhost:3000/en/draft** — full site map with links to every page.

## What v0 should style

| Status | Meaning | Action |
| --- | --- | --- |
| **Live — styled** | Already designed (farmers, exporters, importers, countries, pricing, pilot, demo, get-started, home) | Polish only if needed; align with new nav at Stage B |
| **Draft — needs v0 style** | Copy + structure only (`DraftContentPage`, `DraftHubPage`, insights) | Full visual design |
| **Preview assembly** | `/preview` + `/draft` | Style homepage v2 blocks |

## Target navigation (Stage B — do not wire yet)

```
Solutions ▾   Platform   Compliance   Impact   Pricing   Insights   [CTA]
```

### Solutions menu

| Page | URL | Status |
| --- | --- | --- |
| Farmers & producers | `/farmers` | Live |
| Cooperatives | `/cooperatives` | Draft |
| Exporters | `/exporters` | Live |
| Importers & brands | `/importers` | Live |
| Network sponsors | `/sponsors` | Draft |
| Governments | `/countries` | Live |
| Why Tracebud | `/why-tracebud` | Draft |

### Platform

| Page | URL |
| --- | --- |
| Hub | `/platform` |
| Offline mapping | `/platform/offline-mapping` |
| AI verification | `/platform/ai-verification` |
| Network & sovereignty | `/platform/network` |
| Integrations | `/platform/integrations` |

### Compliance

| Page | URL |
| --- | --- |
| Hub | `/compliance` |
| EUDR | `/compliance/eudr` |
| Due diligence | `/compliance/due-diligence` |
| Guides | `/compliance/guides` |
| Security | `/compliance/security` |

### Convert (footer + CTAs)

| Page | URL | Status |
| --- | --- | --- |
| Pricing | `/pricing` | Live |
| Get started | `/get-started` | Live |
| Pilot | `/pilot` | Live |
| Demo | `/demo` | Live |

### Insights

- Hub: `/insights`
- Articles: `/insights/[slug]` — content in `content/insights/*.md`

## Where to edit copy (not layout)

| Content | File |
| --- | --- |
| Platform, compliance, solutions drafts | `lib/marketing-draft-content.ts` |
| Blog posts | `content/insights/*.md` |
| Homepage v2 strings | `messages/en.json` → `homeV2` |
| Future nav labels | `messages/en.json` → `siteNav` |

## Components to restyle

| Component | Path |
| --- | --- |
| Draft page shell | `components/marketing/draft-content-page.tsx` |
| Draft hub shell | `components/marketing/draft-hub-page.tsx` |
| Insights card | `components/insights/insights-card.tsx` |
| Insights hub | `app/[locale]/insights/page.tsx` |
| Article layout | `app/[locale]/insights/[slug]/page.tsx` |
| Homepage v2 blocks | `components/tracebud/home-v2/*` |
| Future nav | build `components/site-nav.tsx` (Stage B) |

## Brand reference

- [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md)
- Colors: Forest Canopy `#064E3B`, Data Emerald `#10B981`, Mountain Clay `#78350F`
- Tagline: **One Map. One Passport. Every Market.**

## Production visibility

Draft routes return **404 in production** until `lib/marketing-publication.ts` flags flip to `true`.

Preview on deploy: set `MARKETING_PREVIEW_SECRET`, visit `?marketing_preview=<secret>`.

## After v0

Stage B assembly (separate PR): publish flags, `SiteNav`, footer groups, mount home-v2 on `/`, expand `sitemap.ts`.

See [SITE_ARCHITECTURE.md](./SITE_ARCHITECTURE.md) for full plan.

---

## Addendum — Impact section (Phase 2 for v0)

**Do not restyle pages you already completed** unless asked. This slice is **new routes only** + one homepage block.

### New routes (copy in `lib/marketing-draft-content.ts`)

| Page | URL |
| --- | --- |
| Impact hub | `/impact` |
| Farmer livelihood | `/impact/farmer-livelihood` |
| Regenerative farming | `/impact/regenerative-farming` |
| Climate & biodiversity | `/impact/climate-biodiversity` |
| Why Tracebud (linked) | `/why-tracebud` |

### Homepage preview

- New block: `components/tracebud/home-v2/three-resilience.tsx` on `/preview` (between What's possible and Why Tracebud)
- Style to match tokens you already applied elsewhere

### Insights

- 2 new articles in `content/insights/` with category `impact`

### v0 prompt (paste into existing chat)

> Style the **Impact** pages listed under `/en/draft` → Impact section. Use the same `DraftHubPage` / `DraftContentPage` patterns and design tokens as platform/compliance. Style `three-resilience.tsx` on `/preview`. Do not change farmers, pricing, pilot, or other finished pages.
