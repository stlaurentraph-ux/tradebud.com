# Requirements for this folder

This package implements the marketing web surface for Tracebud.

## Canonical sources

- **June 2026 definition (positioning + target IA):** [TRACEBUD_DEFINITION_JUNE_2026.md](../../TRACEBUD_DEFINITION_JUNE_2026.md)
- Route migration (current → target): [lib/marketing-route-migration.ts](./lib/marketing-route-migration.ts)
- Strategic / commercial requirements: [REQUIREMENTS.md](../../REQUIREMENTS.md)
- Detailed product PRD: [PRODUCT_PRD.md](../../PRODUCT_PRD.md)
- MVP scope PRD: [MVP_PRD.md](../../MVP_PRD.md)
- JTBD workflow PRD: [JTBD_PRD.md](../../JTBD_PRD.md)
- App topology and deployment mapping: [apps/STRUCTURE.md](../STRUCTURE.md)

## Marketing scope mapping

Prioritize:

- Strategic positioning and messaging alignment
- Tier model accuracy and pricing communication
- Persona pages and call-to-action flows
- Quote request intake and routing expectations

## Site structure (planned)

Incremental IA, navigation, Insights (blog), and rollout phases are documented in [SITE_ARCHITECTURE.md](./SITE_ARCHITECTURE.md). **Target IA (June 2026)** is in [TRACEBUD_DEFINITION_JUNE_2026.md](../../TRACEBUD_DEFINITION_JUNE_2026.md); stealth routes migrate at Stage B per [marketing-route-migration.ts](./lib/marketing-route-migration.ts). v0 styling may continue on current URLs (`/impact/*`, persona pages) until rename redirects ship.

If requirements conflict, treat `REQUIREMENTS.md` as business intent, `MVP_PRD.md` as release boundary, `PRODUCT_PRD.md` as implementation detail, and `JTBD_PRD.md` as role-workflow behavior.
