# Tenant-Scoped RBAC Specification

This document defines the authorization model for the unified dashboard product.

## Core principles

1. The dashboard is a single multi-tenant app.
2. Every request is evaluated in the active tenant context.
3. Users may belong to multiple tenants and hold different roles in each tenant.
4. UI visibility must mirror permissions, but backend permission checks are the source of truth.
5. Tenant data isolation is mandatory: no cross-tenant data reads/writes.

## Authorization tuple

Each access decision evaluates:

- `user_id`
- `active_tenant_id`
- `role_in_tenant`
- `required_permission`
- optional resource ownership or policy conditions

## Base entities

- `organizations` (tenants)
- `organization_memberships` (`user_id`, `organization_id`, `role`)
- `roles`
- `permissions`
- `role_permissions`
- `invites` (delegated admin onboarding)

## Recommended request flow

1. Authenticate user.
2. Resolve and validate active tenant (session header/cookie/context).
3. Resolve membership for active tenant.
4. Resolve effective permissions from role.
5. Enforce permission at API boundary.
6. Query/write only tenant-scoped data.

## Server-side enforcement requirements

- All mutating endpoints require explicit permission checks.
- All data queries include `organization_id = active_tenant_id`.
- Audit log all privileged actions (role changes, invite acceptance, sensitive exports).

## Delegated administration

Tenant admins can:

- invite users into their organization
- assign tenant-scoped roles
- disable/revoke memberships

Platform super-admin actions stay internal to Tracebud operations.
