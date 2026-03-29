# Tracebud: The Comprehensive Technical & Strategic Specification

This document defines requirements for the **entire Tracebud ecosystem**: field apps, backend APIs, multi-tenant SaaS, dashboards, integrations, and compliance infrastructure. Product-specific implementation notes may live in individual app folders but must not contradict this specification.

---

## I. Strategic Framework & Regulatory Alignment

### EUDR Core

The system is explicitly built to comply with the EU Deforestation Regulation (EUDR). The compliance deadlines are **December 30, 2026**, for large/medium enterprises and **June 30, 2027**, for micro/small enterprises.

### Voluntary DPP Architecture

Under the Ecodesign for Sustainable Products Regulation (ESPR), food and feed products like coffee and cocoa are exempt from mandatory Digital Product Passports. However, Tracebud will voluntarily implement a DPP-style architecture to future-proof clients against corporate ESG reporting requirements.

### Simplified Declarations

Micro and small primary operators in low-risk countries who produce the commodities themselves do not need to submit per-shipment statements. The app must allow them to submit a **one-time simplified declaration** using a postal address or basic geolocation.

### Commodity Agnostic

The data schema must be dynamically swappable (HS Code + Risk Matrix) to support **Coffee, Cocoa, Rubber, Soy, and Timber**.

### Multi-Directional Entry Points

The platform abandons rigid, linear supply chain tracking. It serves as an **open network** where brands, importers, exporters, cooperatives, and farmers can all enter the system independently and trigger workflows in multiple directions.

---

## II. System Architecture, Multi-Tenancy & Data Sovereignty

### Unified Platform

Instead of maintaining separate codebases and dashboards for cooperatives, exporters, importers, and government officials, Tracebud utilizes a **single, unified multi-tenant SaaS architecture**. This ensures infrastructure efficiency and rapid deployment of updates across all users.

### Organizations as Tenants

The system models every cooperative, exporter, or importer as a distinct **Organization** (or Tenant). **Every piece of data belongs to exactly one tenant.** Users can belong to multiple Organizations, and the application uses the **active Organization context** in each session to determine what data and actions are available. The most critical rule of this architecture is **strict data isolation**: one tenant must never be able to access or see another tenant's data **without explicit permission**.

### Network-Based Data Ecosystem

Tracebud functions as a **decentralized, peer-to-peer data sharing network**. Rather than forcing data up a static hierarchy, any node (user type) can interact with others. For example, a European brand can send a direct request to a local cooperative to initiate plot mapping, or an exporter can proactively push a Due Diligence Statement to an importer.

### Request-Grant Architecture & Data Sovereignty

To securely manage these multi-directional workflows, the platform utilizes a **Request-Grant authorization model** based on the principle of **data sovereignty**. Farmers possess a **self-sovereign identity profile** (a digital data wallet) that enables them to autonomously **manage, grant, or revoke access** to their verified compliance data and GeoIDs. This empowers farmers to share their data with local cooperatives or leverage it to sell directly to European buyers, shifting them from passive data subjects to **active market participants**.

### Open Interoperability & Avoiding Vendor Lock-In

Unlike proprietary competitors that force farmers into siloed ecosystems, Tracebud's integration with open **Digital Public Infrastructure (DPI)** like **AgStack** ensures farmers retain complete data sovereignty. This prevents vendor lock-in and allows enterprise users to configure **flexible, multi-step workflows** rather than being forced into rigid predefined paths.

### Tenant-Scoped Role-Based Access Control (RBAC)

Because users may hold different roles across different organizations, the authorization model relies on **tenant-scoped RBAC**. Permissions and roles are evaluated dynamically within the context of the user's **active tenant**.

### Delegated Administration

To reduce operational overhead, the platform supports **delegated administration**. This allows individual organizations to independently invite their own employees, assign them specific roles, and manage their workspaces.

---

## III. UX/UI & Interface Design Principles

### Progressive Disclosure

To prevent cognitive overload for B2B users, the interface must **hide advanced options and complexity** until the user explicitly needs or requests them.

### Usage-Based UX (Moving beyond static dashboards)

The system will **prioritize actions that users perform most often** and personalize views based on **real usage patterns**, rather than relying on generic, one-size-fits-all static dashboards.

### Professional Ergonomics

The UI must prioritize **task completion speed** over engagement metrics, supporting expert behaviors such as **keyboard shortcuts**, **contextual menus**, and **bulk actions** (e.g., processing hundreds of GeoIDs simultaneously).

---

## IV. GIS, Geolocation, & Hardware Interaction

### Precision Constraint

Strict validation requiring a **minimum of 6 decimal places** for all latitude/longitude inputs. Truncated data must be **rejected immediately**.

### Geometry Logic

Plots **under 4 hectares** can be captured as a **single point (centroid)** or a **polygon**. Plots of **4 hectares or more** must be captured as a **complete polygon** describing the unbroken perimeter.

### Adaptive GNSS Capture

Do **not** implement hard HDOP (Horizontal Dilution of Precision) lockouts. Tropical canopies cause severe multipath interference, and smartphone GPS accuracy frequently drops to **5–15 meters** under thick tree cover.

### Waypoint Averaging

The app should default to **dual-frequency (L1/L5) GNSS APIs** if supported. Instead of instantaneous capture, record a **stream of coordinates for 60–120 seconds** at each vertex and calculate the **mean position** to filter out errors.

### Offline Fail-safe

**Pre-cache high-resolution satellite imagery** so users can manually trace polygon perimeters via the touchscreen when GNSS fails entirely.

---

## V. The Compliance Engine & Verification

### Deforestation Check

AI cross-references polygons against historical data to ensure **no deforestation occurred** after the baseline date of **December 31, 2020**.

### Degradation Check

The engine must flag **structural changes to forest cover**, such as the conversion of primary forests or naturally regenerating forests into plantation forests.

### Ground-Truth Photo Vault

Satellite AI frequently flags severe agricultural pruning as deforestation. The app must force enumerators to take **timestamped, geo-tagged 360-degree photos**. These serve as localized evidence to override automated satellite false-positives.

---

## VI. Legality, Land Tenure, & Human Rights

### Productor en Posesión

Informal land tenure is a structural obstacle to EUDR compliance. Because the EUDR only requires a formal land title if domestic legislation explicitly mandates it, Tracebud must digitally support **"Producer in Possession"** declarations by allowing farmers to upload **customary agreements or local attestations** as proof of legal land use.

### Protected Areas

If a plot overlaps with **National Parks or Indigenous boundaries**, it must trigger an **Amber Flag** for manual review rather than an automatic rejection, as agroforestry is often legally permitted in buffer zones.

### FPIC & Social Compliance

A single digital signature is insufficient to prove **Free, Prior and Informed Consent (FPIC)** during an audit. The app must include a **repository module** to upload PDFs/photos of **community assembly minutes and social agreements**.

---

## VII. Supply Chain Integrity & Transactions

### Strict Segregation

The EUDR explicitly prohibits **"Mass Balance"** chains of custody. The database architecture must track **Identity Preservation (IP)** and **strictly segregated batches**. Do **not** build blending logic that obscures the **origin coordinates** of a batch.

### Yield Cap Validation

The backend must cross-reference delivery weights against the **biological carrying capacity** of the farmer's verified polygon to flag illicit blending or laundering.

### "Declaration in Excess" & Zero-Risk Pre-Flight Check

While **declaration in excess** batching logic ensures operational fluidity, it exposes operators to severe liability if a single plot in the pool fails. To mitigate this, Tracebud must implement a mandatory **"Zero-Risk Pre-Flight Check"** algorithm that automatically runs a **stringent secondary risk assessment** across the entire excess pool **before** unlocking the **"Submit to TRACES NT"** button.

---

## VIII. External API & Interoperability

### Inbound Integration

Provide endpoints to sync with **national registries** such as the Honduran Forest Institute (**ICF**) and Coffee Institute (**IHCAFE**) to pre-populate baseline boundaries.

### Outbound Integration (TRACES NT)

TRACES NT does not accept simple REST/JSON submissions. You must build a dedicated **backend middleware layer** to translate Tracebud's internal JSON data into the highly verbose, **legacy SOAP/XML** protocol required by the EU system. This layer must dynamically compute **cryptographic digests** and inject **WS-Security** headers for authentication.

---

## IX. Audit, Data Governance, & Security

### 5-Year Retention

EUDR mandates that all due diligence documentation and polygon data be stored securely for **exactly 5 years** from the date of market placement.

### Privacy vs. Transparency

You cannot irreversibly hash farmer **Personally Identifiable Information (PII)** using one-way cryptographic functions. EU Competent Authorities and downstream Importers of Record must have **full supply chain visibility** to verify compliance. Farmer PII must be **symmetrically encrypted** and accessed strictly via **Role-Based Access Control (RBAC)**.

---

## X. Corporate ESG, Climate & Biodiversity (Future-Proofing)

### ESG Platform Connectors

Build robust **REST APIs** designed to push verified supply chain data directly into major corporate ESG management platforms such as **EcoVadis** and **Sustainalytics**. This seamless data exchange will allow downstream buyers to embed sustainability scores directly into their procurement workflows without manual data entry, whilst supporting investor demands for ESG disclosure.

### Biodiversity & Climate Metrics (ESRS Data Mapping)

Map the underlying data structures to accommodate future farm-level environmental metrics aligned with the **European Sustainability Reporting Standards (ESRS)**. The schema must capture **highly granular, audit-ready** data points:

- **E1 (Climate Change):** Quantifying Scope 1, 2, and 3 greenhouse gas emissions, energy consumption, and carbon sequestration.
- **E2 (Pollution):** Tracking specific agricultural pollutants, including the use of pesticides, fertilizers, and substances of concern (**SVHC**).
- **E3 (Water and Marine Resources):** Measuring total water withdrawals, water consumption, and discharges, specifically identifying operations located in **water-stressed areas**.
- **E4 (Biodiversity and Ecosystems):** Tracking the conversion of land cover and land-use changes over **1- to 5-year** periods, and identifying sites owned or managed in or near **protected biodiversity-sensitive areas**.
- **E5 (Resource Use and Circular Economy):** Optimizing resource inflows and outflows, including total waste generated, waste diverted from disposal, and agricultural composting.

Additionally, the data architecture must align with the **Science Based Targets initiative (SBTi) FLAG** guidance to help downstream companies accurately account for land-based greenhouse gas emissions and agricultural carbon removals.

### Data Collection & Calculation Architecture

To successfully capture and verify these climate and biodiversity metrics, Tracebud will implement a **triad approach**:

1. **Data Structure (The Questionnaire):** Align data-entry forms with the Sustainable Agriculture Initiative (SAI) Platform's **Farm Sustainability Assessment (FSA)**. The FSA provides a standardized set of questions that benchmark on-farm sustainability globally, ensuring the raw data collected maps cleanly to ESRS requirements.

2. **Spatial Registry (AgStack):** Integrate the Linux Foundation's open-source **AgStack Asset Registry** to generate a **"GeoID"** for each mapped polygon. This provides a single, standardized, and anonymous identifier for a farm's boundaries, protecting farmer privacy while ensuring interoperability across supply chain platforms. AgStack's open-source models will also be leveraged to scale macro-level carbon sequestration data down to the individual field level.

3. **Calculation Engine (Cool Farm Tool API):** Instead of building a proprietary calculator, Tracebud will act as a conduit to the **Cool Farm Tool (CFT) API**. The CFT is a globally recognized, science-based calculator for farm-level greenhouse gas emissions, soil carbon sequestration, water use, and biodiversity. Tracebud will push the raw FSA questionnaire data and GeoIDs via API to the CFT, which will return verified, audit-ready carbon and biodiversity scores that comply with the **GHG Protocol** and **SBTi FLAG** guidance.

### Standardized Event Data Sharing

Utilize **GS1 EPCIS** (Electronic Product Code Information Services) standards to ensure that the complex blend of EUDR compliance data, carbon footprints, and biodiversity metrics can be universally understood and seamlessly ingested by external ERPs and global supply chain registries.

---

## Appendix A — Offline field app (`apps/offline-product`) implementation scope

The repository includes an **Expo offline field app**. It implements **only** a subset of this specification (on-device behavior and selected API calls). The table below maps **Sections I–X** to that app. It is **not** a substitute for the full spec.

**Status key**

| Status | Meaning |
|--------|---------|
| **Implemented** | Behavior exists in the offline app (may still need backend/dashboard to complete the ecosystem flow). |
| **Partial** | Some UX or data capture exists; engine, policy, or integration called out in the main spec is missing or stubbed. |
| **Not in app** | Expected to live in SaaS, middleware, or other services—not a goal of this mobile package alone. |

**Traceability matrix**

| Section | Topic | Status | Offline app notes |
|---------|-------|--------|-------------------|
| **§I** | EUDR deadlines, DPP-style readiness | **Not in app** | Policy context; dashboards and legal workflows carry formal deadlines. |
| **§I** | Simplified declaration (postal / geolocation) | **Partial** | Producer profile: postal/mailing address, commodity, **optional six-decimal declaration GPS** (capture/clear on Register plot and Settings); included in **declaration JSON** with ISO capture time. Full one-time regulatory submission flows belong on backend + dashboard. |
| **§I** | Commodity agnostic (HS + risk matrix) | **Partial** | User-selectable commodity codes with **HS heading** in UI and in **declaration JSON** (`commodityHsCode`); national risk matrix remains server-side. |
| **§I** | Multi-directional entry points | **Not in app** | Network orchestration is multi-tenant SaaS (§II). |
| **§II** | Unified platform, tenants, isolation | **Not in app** | App talks to APIs as a field client; org context enforced server-side. |
| **§II** | Request–grant, farmer wallet, AgStack | **Not in app** | No in-app wallet or grant UI; GeoID may appear as labels when server returns them. |
| **§II** | Tenant-scoped RBAC, delegated admin | **Not in app** | Roles are simplified for enumerators; full RBAC in dashboard product. |
| **§III** | Progressive disclosure | **Partial** | Screens split basic vs advanced paths (e.g. mapping modes); not usage-personalized. |
| **§III** | Usage-based UX, static dashboards | **Not in app** | Mobile is task-first; analytics-driven layouts are dashboard scope. |
| **§III** | Professional ergonomics (shortcuts, bulk) | **Partial** | Bulk-friendly flows where implemented (e.g. many plots); full desktop keyboard workflow N/A on phone. |
| **§IV** | 6-decimal lat/lon, reject truncation | **Implemented** | Validation aligned with six-decimal WGS84 handling in mapping flows. |
| **§IV** | Geometry (under 4 ha: point or polygon; ≥4 ha: polygon) | **Implemented** | Centroid/small-plot path, polygon walk, ≥4 ha polygon rule and checks. |
| **§IV** | No hard HDOP lockout | **Implemented** | Soft warnings when accuracy is poor; capture not blocked solely on HDOP. |
| **§IV** | Vertex averaging (60–120 s), dual-frequency when available | **Partial** | `vertex_avg` mode with **60 s / 120 s** sampling; **default duration** in Settings; watch uses **Highest** location accuracy when the OS supports it. |
| **§IV** | Offline imagery, manual trace | **Implemented** | Manual trace / tile-backed mapping when GNSS is unusable. |
| **§V** | Deforestation / degradation AI checks | **Not in app** | Server or external compliance engine; app may show checklist / statuses from API. |
| **§V** | Ground-truth photo vault (geo-tagged evidence) | **Partial** | Four cardinal photos **persisted to SQLite** with **capture-time coordinates** when location is available; 360° hardware still device-dependent. |
| **§VI** | Producer en Posesión | **Partial** | UX and evidence types support informal tenure declarations and uploads. |
| **§VI** | Protected / indigenous overlap → amber review | **Partial** | Amber-style flags and FPIC requirements when overlap indicated (source data from server/overlays). |
| **§VI** | FPIC repository (minutes, agreements) | **Partial** | Structured FPIC docs, repository module, signatures/metadata; audit-grade packaging is backend + policy. |
| **§VII** | IP batches, no mass-balance obscuring origin | **Not in app** | Ledger design is backend; app records harvests/vouchers against plots. |
| **§VII** | Yield cap vs polygon capacity | **Partial** | **Indicative kg/ha × plot ha** hint and **confirm dialog** if weight exceeds cap; authoritative validation on server. |
| **§VII** | Zero-Risk Pre-Flight Check | **Not in app** | Mandatory gating before TRACES submit is middleware/dashboard. |
| **§VIII** | ICF / IHCAFE inbound | **Not in app** | Integration services. |
| **§VIII** | TRACES NT SOAP / WS-Security | **Not in app** | Dedicated backend middleware. |
| **§IX** | 5-year retention | **Partial** | App stores local audit/evidence; long-term vault and legal retention are infrastructure. |
| **§IX** | PII encryption vs one-way hash | **Not in app** | Enforced in platform storage and APIs, not solely in the mobile client. |
| **§X** | ESG connectors, ESRS, FSA, AgStack registry, CFT, EPCIS | **Not in app** | Enterprise integrations and calculation pipelines. |

**Ecosystem-only (summary):** Multi-tenant orgs, Request–Grant wallet UX, TRACES NT SOAP middleware, national registry ingest, AI deforestation/degradation engine, durable 5-year archive design, EcoVadis/Sustainalytics/GS1 EPCIS/CFT connectors, dashboard-first UX (§III), and Zero-Risk Pre-Flight Check remain **outside** the offline field app’s responsibility; they are still **in scope** for Tracebud as a whole per Sections I–X above.

---

*Document version: ecosystem-wide canonical spec. Product folders may add implementation checklists that reference this file by path: `REQUIREMENTS.md` (repository root).*
