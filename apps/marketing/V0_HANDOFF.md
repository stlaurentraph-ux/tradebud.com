# v0 handoff — marketing site restructure

**Branch:** `marketing/v0-site-restructure`  
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
Solutions ▾   Platform   Compliance   Pricing   Insights   [CTA]
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
