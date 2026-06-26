import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSyncAuthUser } = vi.hoisted(() => ({
  getSyncAuthUser: vi.fn(),
}));

vi.mock('@/features/api/syncAuthSession', () => ({
  getSyncAuthUser,
}));

import {
  assertFieldAppPermission,
  checkFieldAppPermission,
  checkFieldAppPermissionForRole,
  FieldPermissionDeniedError,
} from './fieldPermissionGate';

describe('fieldPermissionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows farmer sync:manual', async () => {
    getSyncAuthUser.mockResolvedValue({ app_metadata: { role: 'farmer' } });
    await expect(checkFieldAppPermission('sync:manual')).resolves.toEqual({
      allowed: true,
      role: 'farmer',
    });
  });

  it('allows agent harvest:log via role helper', () => {
    expect(checkFieldAppPermissionForRole('agent', 'harvest:log')).toEqual({
      allowed: true,
      role: 'agent',
    });
  });

  it('blocks dashboard cooperative roles', async () => {
    getSyncAuthUser.mockResolvedValue({ app_metadata: { role: 'cooperative' } });
    await expect(checkFieldAppPermission('harvest:log')).resolves.toEqual({
      allowed: false,
      reason: 'blocked_role',
      role: 'cooperative',
    });
  });

  it('returns not_signed_in when session user is missing', async () => {
    getSyncAuthUser.mockResolvedValue(null);
    await expect(checkFieldAppPermission('evidence:upload')).resolves.toEqual({
      allowed: false,
      reason: 'not_signed_in',
      role: null,
    });
  });

  it('throws FieldPermissionDeniedError from assertFieldAppPermission', async () => {
    getSyncAuthUser.mockResolvedValue({ app_metadata: { role: 'admin' } });
    await expect(assertFieldAppPermission('sync:manual')).rejects.toBeInstanceOf(
      FieldPermissionDeniedError,
    );
  });
});
