# Tracebud Definition — June 2026

**Status:** Canonical product, positioning, and marketing IA definition  
**Supersedes (for commercial/marketing):** ad-hoc homepage copy only — technical execution remains governed by `TRACEBUD_V1_2_EUDR_SPEC.md` and `MVP_PRD.md`  
**Source:** Founder definition document (June 2026)  
**Marketing implementation map:** `apps/marketing/lib/marketing-route-migration.ts`

---

## One-line definition

Tracebud is a **farmer-first, self-serve, bidirectional** agrifood operating system: offline field capture plus a collaboration dashboard, with **toggleable modular solutions** for compliance, sustainability, and trade — culminating in the **Open Chain** shared-risk sourcing model.

## Tagline (marketing)

**The agrifood operating system for equitable, verified, and compliant supply chains.**

Legacy product tagline (*One Map. One Passport. Every Market.*) remains valid for field capture; use contextually.

---

## Strategic thesis

| Principle | Meaning |
| --- | --- |
| **Bidirectional** | Any actor (farmer, cooperative, exporter, brand, sponsor, authority) can register and initiate verification up or down the chain |
| **Self-serve / PLG** | Low-friction onboarding; no consultant-led implementation required for core flows |
| **Modular** | Users pay for and enable only the solutions they need; avoid feature-salad all-in-one |
| **Coffee-first** | Initial commodity focus due to shade-grown / false-positive complexity, then expand EUDR commodities |
| **Farmer-first** | Producers free forever; data sovereignty; livelihood outcomes not compliance-only |

### Regulatory context (2026)

EUDR, CSDDD, and retail vendor rules make traceability mandatory for EU market access. Cut-off date for deforestation: **31 December 2020**. EUDR enterprise deadlines per `REQUIREMENTS.md` (2026-12-30 / 2027-06-30).

---

## Platform core (two components only)

All modules run on this infrastructure:

| Component | Route (target) | Narrative |
| --- | --- | --- |
| **Field App** | `/platform/field-app` | Zero-friction, offline-first georeferencing and first-mile capture |
| **Dashboard** | `/platform/dashboard` | Unified command center to visualize, validate, and share supply chain data |

**Field App capabilities (normative intent):**

- Offline-first local cache; sync on connectivity
- Adaptive geolocation: point if &lt;4 ha, walk-boundary polygon if ≥4 ha; six decimal places minimum
- Waypoint averaging under canopy (no brittle HDOP lockouts)
- Low-literacy onboarding (phone / magic link — product detail in spec)

**Dashboard capabilities (normative intent):**

- Multi-role access control (tenant-scoped)
- Automated plausibility checks (duplicates, yield-cap, missing documents)
- One-click compliance export (PDF, CSV, TRACES-compatible payloads)

---

## Modular solutions (toggleable)

| Module | Target route | Role |
| --- | --- | --- |
| EUDR Compliance | `/solutions/eudr-compliance` | **Start here** — automated DDS prep, satellite calibration, TRACES filing |
| ESG & Carbon Reporting | `/solutions/esg-carbon-reporting` | Scope 3, Cool Farm Tool integration, SACP clusters (roadmap) |
| Regenerative Agriculture | `/solutions/regenerative-agriculture` | FSA digital wizard, continuous improvement, auditor portal |
| Child Labor & Ethical Sourcing | `/solutions/child-labor-monitoring` | CLMRS surveys, remediation tracking |
| Open Chain Model | `/solutions/open-chain-model` | Shared-risk sourcing, LIRP + 20%, 5-year MoUs |
| Direct Trade Marketplace | `/solutions/direct-trade-marketplace` | Verified listings, milestone escrow, FSS privacy |

**MVP boundary:** Ship and message only modules present in `MVP_PRD.md` / spec. Label others **roadmap** or **pilot** on the website.

---

## Who we serve (actor landing pages)

| Archetype | Target route | Primary medium |
| --- | --- | --- |
| Producers & cooperatives | `/who-we-serve/producers-cooperatives` | Field App + cooperative portal |
| Exporters & processors | `/who-we-serve/exporters-processors` | Dashboard |
| Brands & roasters | `/who-we-serve/brands-roasters` | Dashboard + APIs |
| Sponsors / NGOs | `/who-we-serve/sponsors` (or `/sponsors`) | Program dashboard |
| Country authorities | `/who-we-serve/countries` (or `/countries`) | Regional auditor portal |

---

## Outcomes (impact narrative — three pillars)

Marketing organizes impact as **outcomes**, not a separate product category:

| Outcome | Target route | Message |
| --- | --- | --- |
| Resilient & de-risked supply chains | `/outcomes/resilient-supply-chains` | Open Chain, pre-competitive mapping, audit cost reduction |
| Farmer livelihoods & inclusion | `/outcomes/farmer-livelihoods` | LIRP, premiums, credit access, free tier |
| Nature-positive & climate action | `/outcomes/nature-positive-climate` | Carbon, agroforestry, soil/water (roadmap-labelled where needed) |

**Implementation note:** Current stealth routes use `/impact/*` (v0 styling in progress). See migration map for rename at Stage B.

---

## Resources & trust

| Resource | Target route |
| --- | --- |
| Insights & regulatory tracker | `/resources/insights` (or `/insights`) |
| Data sovereignty & security | `/resources/data-sovereignty-security` |
| Verification standards | `/resources/verification-standards` |
| API documentation | `/resources/api-docs` |

---

## Target marketing sitemap

```
tracebud.com
├── /                              Home
├── /platform
│   ├── /platform/field-app
│   └── /platform/dashboard
├── /solutions
│   ├── /solutions/eudr-compliance
│   ├── /solutions/esg-carbon-reporting
│   ├── /solutions/regenerative-agriculture
│   ├── /solutions/child-labor-monitoring
│   ├── /solutions/open-chain-model
│   └── /solutions/direct-trade-marketplace
├── /who-we-serve
│   ├── /who-we-serve/producers-cooperatives
│   ├── /who-we-serve/exporters-processors
│   └── /who-we-serve/brands-roasters
├── /outcomes
│   ├── /outcomes/resilient-supply-chains
│   ├── /outcomes/farmer-livelihoods
│   └── /outcomes/nature-positive-climate
├── /resources
│   ├── /resources/insights
│   ├── /resources/data-sovereignty-security
│   ├── /resources/verification-standards
│   └── /resources/api-docs
└── /pricing
```

---

## Homepage messaging (target)

- **Headline:** The agrifood operating system for equitable, verified, and compliant supply chains.
- **Primary CTA:** Onboard your first shipment free
- **Secondary CTA:** Watch 2-min product demo

---

## Modular pricing model (commercial intent)

Hybrid: base platform fee + solution-specific usage fees.

| Tier | Base (intent) |
| --- | --- |
| Farmer / producer | Free forever |
| Cooperative | From $49/mo (definition); align live `/pricing` before publish |
| Importer / trader / roaster | From $99/mo |
| Solution add-ons | EUDR per container, reg ag per ha, carbon revenue share, Open Chain custom, marketplace commission |

**Website rule:** Pricing page must match `REQUIREMENTS.md` tier model and `MVP_PRD.md` until commercial team signs off on June 2026 matrix.

---

## Open Chain (five principles — messaging)

1. **100% operational traceability** — segregated (bean-to-brand) or administrative matching (bean-to-machine) with volume alignment  
2. **20% livelihood premium** — above Living Income Reference Price (LIRP)  
3. **5-year mutual commitments** — MoUs between roasters and cooperatives  
4. **Strong cooperatives** — registries, internal credit, transparency tools  
5. **Productivity coaching** — IFDPs via Field App  

---

## Technical / geospatial differentiation (coffee-first)

- Sentinel-2 / Landsat multi-temporal optical analysis for seasonal canopy  
- GEDI LiDAR / canopy height for shade-grown discrimination (roadmap where not in MVP)  
- Size-based geometry rules per EUDR  

---

## Implementation roadmap (commercial phases)

| Phase | Months | Focus |
| --- | --- | --- |
| 1 | 1–3 | Coffee EUDR core; Field App; GIS engine; EUDR solution page |
| 2 | 4–6 | Cool Farm API; FSA digital; CLMRS in Field App |
| 3 | 7–9 | Open Chain; carbon SACP clusters |
| 4 | 10–12 | Direct trade marketplace; FSS architecture |

---

## Spec alignment notes

| Topic | Definition doc | Engineering truth |
| --- | --- | --- |
| Mass balance | Cooperative table mentions volume reconciliation | **EUDR requires identity preservation** — no laundering obscuring origins (`REQUIREMENTS.md`, spec §lineage) |
| TRACES | “Direct API” | SOAP/XML middleware with WS-Security — accurate copy is “TRACES NT integration” |
| Carbon / ESRS | Aspirational metrics | Label roadmap until live in backend |
| Child labor / Open Chain / Marketplace | Full module descriptions | MVP boundary — pilot labels until shipped |

---

## Related documents

| Doc | Role |
| --- | --- |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Strategic/commercial source of truth |
| [TRACEBUD_V1_2_EUDR_SPEC.md](./TRACEBUD_V1_2_EUDR_SPEC.md) | Normative product engineering |
| [MVP_PRD.md](./MVP_PRD.md) | Release boundary |
| [apps/marketing/SITE_ARCHITECTURE.md](./apps/marketing/SITE_ARCHITECTURE.md) | Website rollout & migration |
| [apps/marketing/V0_HANDOFF.md](./apps/marketing/V0_HANDOFF.md) | v0 styling instructions |
