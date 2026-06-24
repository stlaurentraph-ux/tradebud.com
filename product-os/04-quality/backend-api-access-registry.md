# Backend API access registry

Code mirror: `tracebud-backend/src/auth/backendApiAccessRegistry.ts`  
Guard: `backend-api-access-guard.mjs`

Documents **role gates** on Nest controllers (403 scope). Runtime ownership proof remains `test:integration:ownership`.

## Entries

| ID | Controller | Roles |
|----|------------|-------|
| `harvest_dds_workspace` | `harvest/harvest.controller.ts` | exporter, cooperative, admin, compliance_manager |
| `requests_campaigns` | `requests/requests.controller.ts` | admin, exporter, compliance_manager |
| `requests_evidence` | `requests/requests.controller.ts` | admin, exporter, compliance_manager, cooperative |
| `contacts_crm` | `contacts/contacts.controller.ts` | admin, exporter, importer, cooperative |
| `inbox_requests` | `inbox/inbox.controller.ts` | exporter, admin, compliance_manager, agent |
| `billing_subscription_band` | `billing/billing.controller.ts` | admin, compliance_manager |
| `reports_importer_summary` | `reports/reports.controller.ts` | compliance_manager, admin, exporter |
| `yield_benchmarks_admin` | `integrations/yield-benchmarks.controller.ts` | admin, compliance_manager |
| `partner_export_start` | `integrations/partner-data.controller.ts` | exporter |
| `partner_export_status` | `integrations/partner-data.controller.ts` | exporter, agent |
| `eudr_connectivity` | `integrations/eudr.controller.ts` | exporter, agent |
| `field_plot_sync` | `plots/plots.controller.ts` | farmer, agent (plot scope) |
| `bulk_plot_import` | `plots/bulk-plot-import.controller.ts` | cooperative, exporter, admin, compliance_manager |
| `cadastral_parcel_lookup` | `plots/cadastral-parcel.controller.ts` | farmer, agent, exporter, cooperative, compliance_manager, admin, country_reviewer |

## Notes

- `importer` appears in contacts CRM but is not an `AppRole` JWT claim today — tracked as known drift.
- Field plot sync uses assignment/ownership checks beyond role list.

## When adding a controller gate

1. Add `BACKEND_API_ACCESS_ENTRIES` row.
2. Add table row here.
3. Run `npm run qa:structural`.
