import { describe, expect, it } from 'vitest';
import {
  FIELD_APP_PERMISSIONS,
  FIELD_APP_ROLES,
  fieldRoleHasPermission,
} from './fieldRolePermissionRegistry';

describe('fieldRolePermissionRegistry', () => {
  it('grants all MVP permissions to farmer', () => {
    for (const permission of FIELD_APP_PERMISSIONS) {
      expect(fieldRoleHasPermission('farmer', permission)).toBe(true);
    }
  });

  it('includes farmer and agent roles', () => {
    expect(FIELD_APP_ROLES).toContain('farmer');
    expect(FIELD_APP_ROLES).toContain('agent');
  });
});
