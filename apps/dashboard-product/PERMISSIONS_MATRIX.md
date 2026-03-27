# Dashboard Permissions Matrix

This matrix defines baseline permissions for the unified multi-tenant dashboard.

## Permission keys

- `org.members.read`
- `org.members.manage`
- `org.invites.manage`
- `plots.read`
- `plots.write`
- `farmers.read`
- `farmers.write`
- `harvests.read`
- `harvests.write`
- `dds.read`
- `dds.write`
- `compliance.read`
- `compliance.review`
- `traces.submit`
- `reports.read`
- `reports.export`
- `admin.settings.manage`

## Role mapping (tenant-scoped)

### `tenant_admin`

- Full access to tenant operations
- Includes delegated administration (`org.members.manage`, `org.invites.manage`)

### `exporter_operator`

- `plots.read`
- `farmers.read`
- `harvests.read`
- `dds.read`
- `dds.write`
- `compliance.read`
- `traces.submit`
- `reports.read`
- `reports.export`

### `importer_analyst`

- `plots.read`
- `farmers.read`
- `harvests.read`
- `dds.read`
- `compliance.read`
- `reports.read`
- `reports.export`

### `cooperative_manager`

- `plots.read`
- `plots.write`
- `farmers.read`
- `farmers.write`
- `harvests.read`
- `harvests.write`
- `dds.read`
- `compliance.read`

### `country_reviewer`

- `plots.read`
- `farmers.read`
- `dds.read`
- `compliance.read`
- `compliance.review`
- `reports.read`
- `reports.export`

### `viewer`

- `plots.read`
- `farmers.read`
- `dds.read`
- `compliance.read`

## Notes

- Final permissions should be enforced server-side and represented in JWT/session claims only as hints.
- Sensitive actions (TRACES submission, compliance overrides, role changes) must be audit logged.
