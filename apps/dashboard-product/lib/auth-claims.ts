import type { TenantRole } from '@/types';

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payloadPart = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function mapClaimRoleToTenantRole(role: string | undefined): TenantRole {
  if (role === 'importer') return 'importer';
  if (role === 'cooperative') return 'cooperative';
  if (role === 'country_reviewer' || role === 'reviewer') return 'country_reviewer';
  if (role === 'sponsor') return 'sponsor';
  if (role === 'compliance_manager' || role === 'compliance-manager') return 'importer';
  if (role === 'admin') return 'exporter';
  return 'exporter';
}

export function getTenantRoleFromAccessToken(token: string | undefined | null): TenantRole | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const appMetadata = (payload.app_metadata ?? {}) as Record<string, unknown>;
  const userMetadata = (payload.user_metadata ?? {}) as Record<string, unknown>;
  const roleClaim =
    (appMetadata.role as string | undefined) ?? (userMetadata.role as string | undefined);
  return mapClaimRoleToTenantRole(roleClaim);
}
