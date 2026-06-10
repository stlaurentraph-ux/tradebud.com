# v0 handoff — marketing site (June 2026 definition)

**Branch:** `v0/stlaurentraph-4260-3ace7b2a` (active) · base: `main` / `marketing/v0-site-restructure`  
**Package:** `apps/marketing`  
**QA index:** http://localhost:3000/en/draft  
**Canonical definition:** [TRACEBUD_DEFINITION_JUNE_2026.md](../../TRACEBUD_DEFINITION_JUNE_2026.md)  
**URL migration map:** [lib/marketing-route-migration.ts](./lib/marketing-route-migration.ts)  
**Paste-only brief:** [V0_JUNE_2026_INSTRUCTIONS.md](./V0_JUNE_2026_INSTRUCTIONS.md)

---

## Read this first

Tracebud is repositioned (June 2026) as a **farmer-first agrifood operating system**:

- **Platform core:** Field App + Dashboard (two products only)
- **Modular solutions:** toggleable modules (EUDR first, then ESG, reg ag, CLMRS, Open Chain, marketplace)
- **Who we serve:** persona entry pages
- **Outcomes:** three pillars (was “Impact” in earlier IA)
- **Resources:** insights, security, standards, APIs

**Your job:** Style pages and a **preview navigation** that match this structure. Copy is already written — do not invent product claims. Label non-MVP modules with a **Roadmap** badge.

**Do not wire the new nav to the live production header yet** — build it on `/preview` or a `SiteNavPreview` component until Stage B.

---

## Quick start

```bash
cd apps/marketing
npm install
npm run dev
```

| URL | Purpose |
| --- | --- |
| `/en/draft` | Full site map — start here |
| `/en/preview` | Homepage v2 assembly (target hero + sections) |
| `/en/solutions` | New modular solutions hub (draft) |
| `/en/platform/field-app` | New platform pillar (draft) |
| `/en/who-we-serve` | New persona hub (draft) |
| `/en/resources` | New trust/resources hub (draft) |

Draft routes are **visible in dev**; production returns **404** until `lib/marketing-publication.ts` flags flip.

Deployed preview: set `MARKETING_PREVIEW_SECRET`, visit `?marketing_preview=<secret>`.

---

## Target navigation — design to this (June 2026)

```
Logo   Solutions ▾   Platform ▾   Who we serve ▾   Outcomes ▾   Resources ▾   Pricing   [Primary CTA]
```

i18n labels: `messages/en.json` → `siteNav.june2026` (add keys as you build menus).

### Solutions ▾ (modular marketplace)

| Label | URL (style now) | Badge |
| --- | --- | --- |
| All solutions | `/solutions` | — |
| EUDR compliance | `/solutions/eudr-compliance` | **Start here** |
| ESG & carbon reporting | `/solutions/esg-carbon-reporting` | Roadmap |
| Regenerative agriculture | `/solutions/regenerative-agriculture` | Roadmap |
| Child labor monitoring | `/solutions/child-labor-monitoring` | Roadmap |
| Open Chain model | `/solutions/open-chain-model` | Roadmap |
| Direct trade marketplace | `/solutions/direct-trade-marketplace` | Roadmap |

Legacy URLs (style if not done, then visually align with EUDR solution): `/compliance`, `/compliance/eudr`, `/compliance/due-diligence`.

### Platform ▾ (two products only)

| Label | URL (style now) | Notes |
| --- | --- | --- |
| Platform overview | `/platform` | Hub — lead with Field App + Dashboard cards |
| Field App | `/platform/field-app` | **Primary** — offline capture story |
| Dashboard | `/platform/dashboard` | **Primary** — validation + export story |
| Offline mapping | `/platform/offline-mapping` | Legacy — merge visually into Field App |
| AI verification | `/platform/ai-verification` | Legacy — cross-link from Field App + EUDR |

### Who we serve ▾ (personas)

| Label | URL (style now) | Status |
| --- | --- | --- |
| Hub | `/who-we-serve` | Draft hub — new |
| Producers & cooperatives | `/farmers` (+ `/cooperatives` draft) | Live + draft |
| Exporters & processors | `/exporters` | Live |
| Brands & roasters | `/importers` | Live |
| Network sponsors | `/sponsors` | Draft |
| Governments | `/countries` | Live |

*Stage B renames to `/who-we-serve/*` — style current URLs now; use definition labels in nav preview.*

### Outcomes ▾ (three pillars — nav label “Outcomes”, not “Impact”)

| Label | URL (style now) | Target URL (Stage B) |
| --- | --- | --- |
| Outcomes hub | `/impact` | `/outcomes` |
| Resilient supply chains | `/impact/supply-chains` | `/outcomes/resilient-supply-chains` |
| Farmer livelihoods | `/impact/farmer-livelihood`, `/impact/smallholders` | `/outcomes/farmer-livelihoods` |
| Nature-positive & climate | `/impact/climate-biodiversity`, `/impact/forests` | `/outcomes/nature-positive-climate` |
| Why Tracebud | `/why-tracebud` | linked from outcomes |

*Regenerative farming narrative moves to `/solutions/regenerative-agriculture` — `/impact/regenerative-farming` can cross-link.*

### Resources ▾

| Label | URL (style now) |
| --- | --- |
| Resources hub | `/resources` |
| Insights & regulatory tracker | `/insights` (+ `/insights/[slug]`) |
| Data sovereignty & security | `/resources/data-sovereignty-security` |
| Verification standards | `/resources/verification-standards` |
| API documentation | `/resources/api-docs` |

Legacy merge: `/compliance/security` → sovereignty page; `/compliance/guides` → insights; `/platform/integrations` → api-docs.

### Convert (footer + CTAs — already styled)

| Page | URL |
| --- | --- |
| Pricing | `/pricing` |
| Get started | `/get-started` |
| Pilot | `/pilot` |
| Demo | `/demo` |

---

## Phased work order (do in this sequence)

### Phase 1 — Shared draft design system (blocks everything else)

Upgrade these shells from plain HTML to branded layouts (hero, section rhythm, cards, related links):

| Component | Path |
| --- | --- |
| Draft content page | `components/marketing/draft-content-page.tsx` |
| Draft hub page | `components/marketing/draft-hub-page.tsx` |
| Draft banner | `components/marketing/draft-banner.tsx` |
| Marketing layout | `components/marketing/marketing-page-layout.tsx` |

Hub pages should use a **card grid** for child links. Content pages need a **hero + sections + related** pattern matching live persona pages.

### Phase 2 — Outcomes (current `/impact/*` URLs)

Style all pages under `/en/draft` → **Impact** section. On v0 branch you may also have:

- `/impact/supply-chains`
- `/impact/smallholders`
- `/impact/forests`

Use nav label **Outcomes** in preview nav (not “Impact”). Style `components/tracebud/home-v2/three-resilience.tsx` on `/preview`.

### Phase 3 — June 2026 definition routes (new URLs)

Style all pages under `/en/draft` → **June 2026 definition** section:

- `/solutions` + 6 module pages
- `/platform/field-app`, `/platform/dashboard` (+ refresh `/platform` hub)
- `/who-we-serve` hub
- `/resources` + 3 resource pages

### Phase 4 — Platform, compliance, insights (legacy stealth URLs)

If not done in earlier passes:

- `/platform/*` (offline-mapping, ai-verification, network, integrations)
- `/compliance/*`
- `/insights` hub + article template

### Phase 5 — Homepage preview + nav preview

On `/preview`:

| Block | Component | Definition copy |
| --- | --- | --- |
| Hero | update or replace hero | `homeV2.hero` in `messages/en.json` |
| Choose your path | `home-v2/choose-your-path.tsx` | keep — links to persona pages |
| Modular solutions | **new block** `home-v2/modular-solutions.tsx` | 6 solution cards from `/solutions` hub |
| Platform duo | **new block** `home-v2/platform-core.tsx` | Field App + Dashboard |
| Three outcomes | `home-v2/three-resilience.tsx` | link to `/impact/*` for now |
| What's possible | `home-v2/whats-possible.tsx` | existing |
| Why Tracebud | `home-v2/why-tracebud-block.tsx` | existing |
| Latest insights | `home-v2/latest-insights.tsx` | existing |

Build **`components/marketing/site-nav-preview.tsx`** (or similar) using `siteNav.june2026` — render on `/preview` and `/draft` only, not on live `/`.

### Phase 6 — Polish live pages (light touch only)

**Live — styled** (polish only, do not rebuild): `/`, `/farmers`, `/exporters`, `/importers`, `/countries`, `/pricing`, `/get-started`, `/pilot`, `/demo`.

Align typography/spacing with new system if cheap; do not change layout structure unless asked.

---

## Homepage messaging (June 2026 — use on `/preview`)

| Element | Copy |
| --- | --- |
| **Headline** | The agrifood operating system for equitable, verified, and compliant supply chains. |
| **Subhead** | Farmer-first field capture and a collaboration dashboard — with modular solutions for compliance, sustainability, and trade. |
| **Primary CTA** | Onboard your first shipment free |
| **Secondary CTA** | Watch 2-min product demo |
| **Field tagline** (optional sub-block) | One Map. One Passport. Every Market. |

Strings: `messages/en.json` → `homeV2.hero`.

---

## Where copy lives (do not change product claims in layout files)

| Content | File |
| --- | --- |
| All draft page body copy | `lib/marketing-draft-content.ts` |
| Blog articles | `content/insights/*.md` |
| Homepage v2 + nav labels | `messages/en.json` → `homeV2`, `siteNav` |
| Site map status | `lib/marketing-site-map.ts` |

---

## Components to create or restyle

| Component | Path | Notes |
| --- | --- | --- |
| Insights card | `components/insights/insights-card.tsx` | |
| Insights hub | `app/[locale]/insights/page.tsx` | |
| Article layout | `app/[locale]/insights/[slug]/page.tsx` | |
| Homepage v2 blocks | `components/tracebud/home-v2/*` | + `modular-solutions.tsx`, `platform-core.tsx` |
| Nav preview | `components/marketing/site-nav-preview.tsx` | **Create** — June 2026 mega-menus |
| Roadmap badge | `components/marketing/roadmap-badge.tsx` | **Create** — for non-MVP solutions |

---

## Brand reference

- [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md)
- Forest Canopy `#064E3B` · Data Emerald `#10B981` · Mountain Clay `#78350F`
- Marketing tagline (2026): **The agrifood operating system for equitable, verified, and compliant supply chains.**
- Field capture tagline (contextual): **One Map. One Passport. Every Market.**

---

## Do NOT

- Wire new nav to the live `Header` on `/` until Stage B
- Flip `marketingRoutePublication` flags to `true`
- Rename URLs (`/impact` → `/outcomes`) — engineering adds redirects at launch
- Rebuild finished persona, pricing, pilot, or demo pages from scratch
- Remove roadmap badges from ESG, CLMRS, Open Chain, marketplace, or direct trade modules
- Claim features as live when copy says “roadmap” or “pilot”

---

## After v0 (engineering — not your task)

Stage B assembly: publication flags, production `SiteNav`, footer groups, mount home-v2 on `/`, 301 redirects per `marketing-route-migration.ts`, expand `sitemap.ts`.

See [SITE_ARCHITECTURE.md](./SITE_ARCHITECTURE.md).

---

## Paste-ready prompts for v0

### Master prompt (start a new v0 chat)

```
You are styling the Tracebud marketing site in apps/marketing.

READ FIRST:
- apps/marketing/V0_JUNE_2026_INSTRUCTIONS.md
- apps/marketing/V0_HANDOFF.md
- TRACEBUD_DEFINITION_JUNE_2026.md

Open http://localhost:3000/en/draft and implement the June 2026 IA:
- Solutions (modular marketplace) + Platform (Field App + Dashboard) + Who we serve + Outcomes + Resources
- Use messages/en.json siteNav.june2026 and homeV2.hero for labels/copy
- Upgrade DraftHubPage and DraftContentPage to match the design quality of /farmers and /pricing
- Add Roadmap badges on non-MVP solution modules
- Build site-nav-preview.tsx for /preview and /draft only — do NOT change the live homepage header
- Do not rename URLs or flip marketing-publication.ts flags
```

### Phase 2 only (Outcomes)

```
Style all Outcomes pages at /impact/* (and /why-tracebud). Use DraftHubPage/DraftContentPage patterns. Label nav "Outcomes" not "Impact". Style three-resilience.tsx on /preview. Do not touch farmers, pricing, pilot, demo, or get-started.
```

### Phase 3 only (Definition routes)

```
Style the "June 2026 definition" section on /en/draft: /solutions/*, /platform/field-app, /platform/dashboard, /who-we-serve, /resources/*. Match tokens from outcomes/platform drafts. EUDR solution gets a "Start here" badge; other modules get "Roadmap" badges.
```
