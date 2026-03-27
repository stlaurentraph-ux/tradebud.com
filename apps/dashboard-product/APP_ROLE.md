# Multi-Tenant Dashboard Product App

This folder is the production-track multi-tenant SaaS dashboard.

- Audience: exporters, importers, cooperatives, country/government users
- Domain target: `app.tracebud.com` (or `dashboard.tracebud.com`)
- Vercel root directory: `apps/dashboard-product`

Authorization model:

- Tenant-scoped RBAC (role + permission checks evaluated against active organization)
- Delegated administration (tenant admins invite/manage users in their own organization)

