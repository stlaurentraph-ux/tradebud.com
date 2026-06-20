# Supabase SQL

SQL migrations and seeds for the Tracebud Supabase Postgres project.

## Two migration tracks

| Track | Location | Used for |
| --- | --- | --- |
| Supabase CLI | `migrations/*.sql` | `supabase db push`, linked project deploys |
| Backend manual | `../tracebud-backend/sql/tb_v16_*.sql` | Railway ops, one-off SQL editor runs |

Keep both tracks in sync when adding schema changes. Mirror filenames by purpose (not always identical timestamps).

**Mirror map (CI):** `migration-mirror-map.json` lists Supabase ↔ `tracebud-backend/sql/tb_v16_*` pairs and documented Supabase-only migrations. CI runs `npm run supabase:migration:mirror:assert` on changes. Refresh with `npm run supabase:migration:mirror:baseline:refresh` after review.

### Naming convention

Use **`YYYYMMDD` + zero-padded sequence** + descriptive slug:

```
202606200003_plot_farmer_display_name.sql
202606200005_plot_ops_summary_view.sql
```

**Rules:**

1. One migration file = one logical change set.
2. **Never reuse a timestamp prefix** — two files must not share the same `YYYYMMDDNNNN` prefix.
3. **Do not rename migrations already applied** on production — Supabase tracks the full filename in `supabase_migrations.schema_migrations`.
4. Apply order is lexicographic by filename.

### Historical note (202606200004)

Two migrations share the `202606200004` date prefix (both applied on Tracebud CRM 2026-06-20):

- `202606200004_plot_duplicate_prevention.sql`
- `202606200004_plot_status_rename_compliant_to_deforestation_clear.sql`

They have **unique full filenames**, so Supabase applied both correctly. Do not rename them on the live project. New migrations should use the next free sequence (`20260620140000_*`, etc.).

Backend mirror for the enum rename: `tracebud-backend/sql/tb_v16_049z_plot_status_rename_compliant_to_deforestation_clear.sql` (between `049` and `050`).

---

## Founder OS (CRM / GTM)

Early migrations for internal outreach CRM and content cadence:

| File | Purpose |
| --- | --- |
| `migrations/20260413_001_founder_os_tables.sql` | Tables, indexes, `updated_at` triggers |
| `migrations/20260413_002_founder_os_functions.sql` | Reporting / generator functions |
| `seeds/20260413_001_founder_os_seed.sql` | Templates, prompts, cadence defaults |

Apply order:

1. `migrations/20260413_001_founder_os_tables.sql`
2. `migrations/20260413_002_founder_os_functions.sql`
3. `seeds/20260413_001_founder_os_seed.sql`

Run in Supabase SQL Editor or via the Supabase CLI.

### Verification queries

```sql
-- Tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'prospects',
    'outreach_templates',
    'outreach_activity',
    'daily_actions',
    'content_ideas',
    'content_calendar',
    'content_tasks',
    'cadence_settings'
  )
ORDER BY table_name;

-- Seed template check
SELECT stage, channel, count(*)
FROM outreach_templates
GROUP BY stage, channel
ORDER BY stage, channel;

-- Function smoke test
SELECT generate_daily_actions(current_date);
SELECT * FROM daily_outreach_actions(current_date);
SELECT * FROM content_tasks_due(current_date);
SELECT generate_content_tasks(current_date);
```

## Product schema (ADR-006)

Database organization across Postgres schemas (`public`, `commercial`, `crm`, `gtm`, `integrations`, `ops`, `internal`) is documented in [`../product-os/05-decisions/ADR-006-database-schema-organization.md`](../product-os/05-decisions/ADR-006-database-schema-organization.md).

For ops browsing in Supabase Table Editor, prefer the **`plot_ops_summary`** view over raw `plot`.

## Notes

- Founder OS setup is additive; it does not modify marketing lead tables.
- LinkedIn action automation is out of scope for this schema.
