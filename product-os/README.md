# Tracebud Product OS

Repo-native operating system for product, architecture, delivery, and implementation.

## Canonical sources (read first)

1. `REQUIREMENTS.md` (strategy, vision, positioning)
2. `MVP_PRD.md` (v1 scope boundaries)
3. `PRODUCT_PRD.md` (detailed product requirements)
4. `JTBD_PRD.md` (role workflows and activation/remediation jobs)
5. `BUILD_READINESS_ARTIFACTS.md` (states, entitlements, exceptions, events, acceptance)

If any document conflicts with these, canonical sources win.

### Filename aliases used in prompts

- `requirement.md` => `REQUIREMENTS.md`
- `PRODUCT_PDR.md` => `PRODUCT_PRD.md`

## How this replaces external PM tools

- Roadmap: `product-os/01-roadmap/`
- Features: `product-os/02-features/`
- Workflows: `product-os/03-workflows/`
- Quality gates: `product-os/04-quality/`
- Decisions (ADR): `product-os/05-decisions/`
- Execution status: `product-os/06-status/`

## Working loop in Cursor

1. Read canonical sources in order above.
2. Open `product-os/06-status/current-focus.md`.
3. Pick feature from `product-os/01-roadmap/master-roadmap.md`.
4. Use `.cursor/commands/build-feature.md`.
5. Review with `.cursor/commands/review-feature.md`.
6. Close session with `.cursor/commands/session-close.md`.
