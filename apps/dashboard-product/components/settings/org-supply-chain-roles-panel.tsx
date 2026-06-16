'use client';

import { useContext, useEffect, useState } from 'react';
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
import { LocaleContext } from '@/lib/locale-context';
import { getSettingsPageCopy } from '@/lib/workflow-terminology-labels';

export function OrgSupplyChainRolesPanel() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
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
        throw new Error(payload.error ?? getSettingsPageCopy('org_roles_error_save', t));
      }
      setProfile(payload.profile);
      applyTenantRolesFromProfile(payload.profile);
      toast.success(getSettingsPageCopy('org_roles_toast_success', t));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getSettingsPageCopy('org_roles_error_save', t));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getSettingsPageCopy('org_roles_title', t)}</CardTitle>
        <CardDescription>{getSettingsPageCopy('org_roles_description', t)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{getSettingsPageCopy('org_roles_loading', t)}</p>
        ) : null}
        <SupplyChainRolePicker selected={selected} onChange={setSelected} disabled={isSaving || isLoading} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {getSettingsPageCopy('org_roles_active_session', t, { role: user?.active_role ?? '' })}
            {profile?.organization_name ? ` · ${profile.organization_name}` : ''}
          </p>
          <Button onClick={() => void saveRoles()} disabled={isSaving || selected.length === 0}>
            {isSaving ? getSettingsPageCopy('saving', t) : getSettingsPageCopy('org_roles_save', t)}
          </Button>
        </div>
        {selected.length > 1 ? (
          <p className="text-xs text-muted-foreground">
            {getSettingsPageCopy('org_roles_default_landing', t, {
              role: primaryTenantRoleFromSupplyChainRoles(selected),
            })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
