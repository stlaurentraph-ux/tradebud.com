# Marketing structural contracts

Public marketing site — no RBAC. Structural guards focus on **routes**, **i18n**, **analytics**, and **SEO/a11y** baselines.

Guards: `npm run qa:structural` in tracebud-marketing (orchestrates existing `*:assert` scripts).

## Registries (baseline JSON)

| Domain | Baseline | Guard |
|--------|----------|-------|
| Public routes | `qa/automation-baselines/routes-publication.json` | `routes:publication:assert` |
| Analytics events | `qa/automation-baselines/analytics-slice.json` | `analytics:slice:assert` |
| i18n keys | locale parity script | `i18n:parity:assert` |
| Playwright golden paths | manifest | `e2e:golden-paths:assert` |
| Lighthouse / SEO | manifests | `lighthouse:budgets:assert`, `seo:smoke:assert` |

## When changing marketing

1. New public route → update routes baseline + golden path if user-facing.
2. New analytics event → update analytics baseline + FEAT/marketing doc.
3. New locale keys → run i18n parity.
4. `npm run qa:structural` before PR.
