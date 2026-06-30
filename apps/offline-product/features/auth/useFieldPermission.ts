import { useCallback, useEffect, useState } from 'react';

import type { FieldAppPermission } from '@/features/auth/fieldRolePermissionRegistry';
import {
  checkFieldAppPermissionForRole,
  type FieldPermissionDenyReason,
} from '@/features/auth/fieldPermissionGate';
import { parseClaimRoleFromAuthUser } from '@/features/auth/fieldAppEligibility';
import { getSyncAuthUser } from '@/features/auth/fieldAppSessionRole';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';

export function useFieldPermission() {
  const { isSignedIn, refreshAuth } = useSignInSheet();
  const [role, setRole] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const user = await getSyncAuthUser();
    const rawRole = parseClaimRoleFromAuthUser(user);
    setRole(rawRole);
    return rawRole;
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setRole(null);
      return;
    }
    void refresh();
  }, [isSignedIn, refreshAuth, refresh]);

  const can = useCallback(
    (permission: FieldAppPermission): boolean => {
      return checkFieldAppPermissionForRole(role, permission).allowed;
    },
    [role],
  );

  const denyReason = useCallback(
    (permission: FieldAppPermission): FieldPermissionDenyReason | null => {
      const result = checkFieldAppPermissionForRole(role, permission);
      return result.allowed ? null : result.reason;
    },
    [role],
  );

  return { role, can, denyReason, refresh };
}
