'use client';

import { useEffect, useState } from 'react';
import type { AdminOrganization, AdminUser } from '@/lib/admin-service';
import {
  getAdminSnapshot,
  listOrganizations,
  listUsers,
  subscribeAdminData,
} from '@/lib/admin-service';

export function useAdminData() {
  const snapshot = getAdminSnapshot();
  const [organizations, setOrganizations] = useState<AdminOrganization[]>(snapshot.organizations);
  const [users, setUsers] = useState<AdminUser[]>(snapshot.users);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [orgs, loadedUsers] = await Promise.all([listOrganizations(), listUsers()]);
        if (!cancelled) {
          setOrganizations(orgs);
          setUsers(loadedUsers);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load admin data.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    const unsubscribe = subscribeAdminData(() => {
      const current = getAdminSnapshot();
      if (!cancelled) {
        setOrganizations(current.organizations);
        setUsers(current.users);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [reloadTick]);

  return { organizations, users, isLoading, error, reload };
}

