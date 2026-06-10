# v0 instructions — June 2026 site structure

**Paste this file into your v0 chat.** Full context: [V0_HANDOFF.md](./V0_HANDOFF.md).

---

## What changed

Tracebud’s website IA now follows the **June 2026 product definition**:

| Old mental model | New structure |
| --- | --- |
| Compliance as top-level nav | **Solutions** — modular marketplace (EUDR module = start here) |
| Platform = 4 feature pages | **Platform** — **Field App** + **Dashboard** only |
| Persona pages scattered | **Who we serve** hub + persona pages |
| “Impact” brand section | **Outcomes** — 3 pillars (livelihoods, supply chains, climate) |
| Insights standalone | **Resources** — insights + security + standards + APIs |

Canonical doc: `TRACEBUD_DEFINITION_JUNE_2026.md` (repo root).

---

## Your deliverables

1. **Design system for draft pages** — restyle `DraftHubPage` + `DraftContentPage` to match `/farmers` quality
2. **Style every page** listed in `/en/draft` (Impact + June 2026 definition sections)
3. **Preview navigation** — new component with June 2026 mega-menus on `/preview` and `/draft` only
4. **Homepage preview** — hero + modular solutions grid + platform duo on `/preview`
5. **Roadmap badges** on solution modules that are not MVP (everything except EUDR compliance)

---

## Target header (preview only — not live `/`)

```
Solutions ▾   Platform ▾   Who we serve ▾   Outcomes ▾   Resources ▾   Pricing   [Get started]
```

### Solutions menu → URLs

- All solutions → `/solutions`
- EUDR compliance → `/solutions/eudr-compliance` ⭐ Start here
- ESG & carbon → `/solutions/esg-carbon-reporting` 🏷 Roadmap
- Regenerative agriculture → `/solutions/regenerative-agriculture` 🏷 Roadmap
- Child labor monitoring → `/solutions/child-labor-monitoring` 🏷 Roadmap
- Open Chain → `/solutions/open-chain-model` 🏷 Roadmap
- Direct trade marketplace → `/solutions/direct-trade-marketplace` 🏷 Roadmap

### Platform menu → URLs

- Overview → `/platform`
- Field App → `/platform/field-app`
- Dashboard → `/platform/dashboard`

### Who we serve menu → URLs (use current paths)

- Hub → `/who-we-serve`
- Producers & cooperatives → `/farmers`
- Exporters & processors → `/exporters`
- Brands & roasters → `/importers`
- Network sponsors → `/sponsors`
- Governments → `/countries`

### Outcomes menu → URLs (use `/impact/*` for now)

- Hub → `/impact`
- Resilient supply chains → `/impact/supply-chains` (or `/impact` if no subpage)
- Farmer livelihoods → `/impact/farmer-livelihood`
- Nature-positive & climate → `/impact/climate-biodiversity`

### Resources menu → URLs

- Hub → `/resources`
- Insights → `/insights`
- Data sovereignty & security → `/resources/data-sovereignty-security`
- Verification standards → `/resources/verification-standards`
- API docs → `/resources/api-docs`

---

## Homepage `/preview` copy

**Headline:** The agrifood operating system for equitable, verified, and compliant supply chains.

**Primary CTA:** Onboard your first shipment free

**Secondary CTA:** Watch 2-min product demo

Use `messages/en.json` → `homeV2.hero` and `siteNav.june2026`.

**New homepage sections to add:**

- `modular-solutions.tsx` — 6 cards linking to `/solutions/*`
- `platform-core.tsx` — Field App + Dashboard side by side

---

## Files you will touch

```
apps/marketing/
├── components/marketing/
│   ├── draft-content-page.tsx      ← restyle
│   ├── draft-hub-page.tsx          ← restyle
│   ├── site-nav-preview.tsx        ← CREATE
│   └── roadmap-badge.tsx           ← CREATE
├── components/tracebud/home-v2/
│   ├── modular-solutions.tsx       ← CREATE
│   └── platform-core.tsx           ← CREATE
├── app/[locale]/preview/page.tsx   ← wire new sections + nav preview
├── app/[locale]/draft/page.tsx     ← optional nav preview
└── messages/en.json                ← homeV2.hero, siteNav.june2026
```

**Copy source (read, don’t rewrite claims):** `lib/marketing-draft-content.ts`

---

## Pages — do not restyle from scratch

These are already production-quality: `/farmers`, `/exporters`, `/importers`, `/countries`, `/pricing`, `/get-started`, `/pilot`, `/demo`, live `/` homepage.

Light polish OK. No structural rewrites.

---

## Hard rules

- ❌ Do not change URLs or add redirects
- ❌ Do not flip `lib/marketing-publication.ts` to `true`
- ❌ Do not replace live `Header` on `/` with new nav (preview only)
- ❌ Do not remove “Roadmap” labels from non-shipped modules
- ✅ Use `/en/draft` as your checklist
- ✅ Match brand colors: `#064E3B`, `#10B981`, `#78350F`

---

## Suggested v0 chat opener

```
Implement the June 2026 Tracebud marketing IA per apps/marketing/V0_JUNE_2026_INSTRUCTIONS.md.

Start with DraftHubPage/DraftContentPage design system, then style /solutions, /platform/field-app, /platform/dashboard, /who-we-serve, /resources, and /impact/* pages.

Build site-nav-preview.tsx for /preview using siteNav.june2026 labels. Add modular-solutions and platform-core to /preview homepage.

Do not modify live header, URLs, or publication flags. Do not rebuild farmers/pricing/pilot pages.
```
