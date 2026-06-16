'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  normalizeSupplyChainRoles,
  primaryTenantRoleFromSupplyChainRoles,
  type SupplyChainRoleId,
} from '@/lib/org-supply-chain-roles';
import { fetchCommercialProfile, type CommercialProfile } from '@/lib/commercial-profile';
import { SupplyChainRolePicker } from '@/components/settings/supply-chain-role-picker';

export function OrgSupplyChainRolesPanel() {
  const { user, applyTenantRolesFromProfile } = useAuth();
  const [profile, setProfile] = useState<CommercialProfile | null>(null);
  const [selected, setSelected] = useState<SupplyChainRoleId[]>(['exporter']);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void fetchCommercialProfile().then((loaded) => {
      setProfile(loaded);
      const roles = normalizeSupplyChainRoles(loaded?.supply_chain_roles);
      if (roles.length > 0) {
        setSelected(roles);
      }
      setIsLoading(false);
    });
  }, []);

  const saveRoles = async () => {
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const response = await fetch('/api/launch/supply-chain-roles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ supplyChainRoles: selected }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        profile?: CommercialProfile;
        error?: string;
      };
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error ?? 'Failed to save supply chain roles.');
      }
      setProfile(payload.profile);
      applyTenantRolesFromProfile(payload.profile);
      toast.success('Supply chain roles updated. Use the sidebar switcher to change active workflow.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save supply chain roles.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supply chain roles</CardTitle>
        <CardDescription>
          Enable every workflow your organisation performs. Users switch active role from the sidebar without
          creating separate tenants.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading organisation profile…</p> : null}
        <SupplyChainRolePicker selected={selected} onChange={setSelected} disabled={isSaving || isLoading} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Active session role: <strong>{user?.active_role}</strong>
            {profile?.organization_name ? ` · ${profile.organization_name}` : ''}
          </p>
          <Button onClick={() => void saveRoles()} disabled={isSaving || selected.length === 0}>
            {isSaving ? 'Saving…' : 'Save roles'}
          </Button>
        </div>
        {selected.length > 1 ? (
          <p className="text-xs text-muted-foreground">
            Default landing role after save:{' '}
            <strong>{primaryTenantRoleFromSupplyChainRoles(selected)}</strong> (change anytime via sidebar).
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
