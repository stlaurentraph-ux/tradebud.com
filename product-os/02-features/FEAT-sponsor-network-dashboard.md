# FEAT: Sponsor network oversight dashboard

## Audience

Organisations, governments, and brands that oversee multiple supply chains across countries and commodities. Goal: invite contacts, classify by role, and drive transparency/compliance for sustainable market access (EUDR-aligned).

## Dashboard sections

1. **Network hero** — mission, country/commodity scope chips, invite + classify CTAs
2. **KPI row** — countries, commodities, supply chain roles, transparency index
3. **Sponsor emphasis** — country (government) vs brand (buyer) priority tuning
4. **Countries in scope** — org + contact counts per country
5. **Commodities tracked** — programme coverage per commodity
6. **Supply chain roles** — cooperative, exporter, importer, producer, partner counts
7. **Transparency panel** — index, compliance health, at-risk orgs, active contacts
8. **Network health** — organisation readiness list
9. **Programmes & interventions** — existing programme performance + intervention queue

## Data sources

| Source | Used for |
|--------|----------|
| `GET /api/admin/organizations` | Governed orgs, countries, roles |
| `GET /api/requests/campaigns` | Programmes, commodities |
| `listContacts()` | Invited contacts, role classification, countries |
| Dashboard summary metrics | Plot compliance health |

## Virgin state

Shown when no packages/plots/farmers **and** no organisations **and** no contacts. Four-step onboarding: invite → register orgs → launch programme → compliance health.

## Acceptance criteria

- [x] Sponsor sees country and commodity coverage aggregates
- [x] Role classification merges organisation types and contact types
- [x] Invite contact CTA prominent on homepage hero
- [x] Country vs brand emphasis toggle preserved
- [x] Virgin state requires network entities, not only field metrics
