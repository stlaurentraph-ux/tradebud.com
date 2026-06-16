'use client';

import Link from 'next/link';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { TenantRole, User } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import {
  defaultSupplyChainRoleForSignupPrimary,
  ensurePrimaryInSupplyChainRoles,
  supplyChainRoleToTenantRole,
  type SupplyChainRoleId,
} from '@/lib/org-supply-chain-roles';
import { SupplyChainRolePicker } from '@/components/settings/supply-chain-role-picker';
import {
  getAuthCopy,
  getSignupCommodityOptions,
  getSignupCopy,
  getSignupWizardObjectiveOptions,
  getSignupWizardPrimaryRoleOptions,
} from '@/lib/workflow-terminology-labels';

type PrimaryRole = 'importer' | 'exporter' | 'cooperative' | 'compliance_manager' | 'admin';
type ApiPrimaryRole = 'importer' | 'exporter' | 'compliance_manager' | 'admin';
type PrimaryObjective =
  | 'prepare_first_due_diligence_package'
  | 'supplier_onboarding'
  | 'risk_screening'
  | 'audit_readiness';

interface SignupResponsePayload {
  userId?: string;
  tenantId?: string;
  accessToken?: string;
  refreshToken?: string | null;
  message?: string;
}

function readApiError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const typed = payload as { message?: unknown; msg?: unknown; error?: unknown };
  if (typeof typed.message === 'string' && typed.message.trim()) return typed.message;
  if (typeof typed.msg === 'string' && typed.msg.trim()) return typed.msg;
  if (typeof typed.error === 'string' && typed.error.trim()) return typed.error;
  return fallback;
}

export function CreateAccountWizard() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const router = useRouter();
  const { hydrateSessionFromToken } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupResult, setSignupResult] = useState<SignupResponsePayload | null>(null);

  const [workEmail, setWorkEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [organizationName, setOrganizationName] = useState('');
  const [country, setCountry] = useState('');
  const [primaryRole, setPrimaryRole] = useState<PrimaryRole>('exporter');

  const [cooperativeMembers, setCooperativeMembers] = useState('');
  const [exporterSuppliers, setExporterSuppliers] = useState('');
  const [exporterImporters, setExporterImporters] = useState('');
  const [importerSuppliers, setImporterSuppliers] = useState('');
  const commodityOptions = useMemo(() => getSignupCommodityOptions(t), [t]);
  const [mainCommodity, setMainCommodity] = useState('coffee');
  const objectiveOptions = useMemo(() => getSignupWizardObjectiveOptions(t), [t]);
  const primaryRoleOptions = useMemo(() => getSignupWizardPrimaryRoleOptions(t), [t]);
  const [primaryObjective, setPrimaryObjective] =
    useState<PrimaryObjective>('prepare_first_due_diligence_package');
  const [supplyChainRoles, setSupplyChainRoles] = useState<SupplyChainRoleId[]>(['exporter']);

  useEffect(() => {
    if (commodityOptions.length > 0 && !commodityOptions.some((option) => option.value === mainCommodity)) {
      setMainCommodity(commodityOptions[0].value);
    }
  }, [commodityOptions, mainCommodity]);

  useEffect(() => {
    void emitEvent('create_workspace_value_viewed', { source: 'create_account_step_1' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emitEvent = async (eventType: string, payload: Record<string, unknown>) => {
    const token = sessionStorage.getItem('tracebud_token');
    await fetch('/api/analytics/gated-entry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        eventType,
        feature: 'mvp_gated',
        gate: 'request_campaigns',
        tenantId: signupResult?.tenantId ?? 'signup_pending',
        role: primaryRole,
        redirectedPath: '/create-account',
        ...payload,
      }),
    }).catch(() => undefined);
  };

  const toApiPrimaryRole = (role: PrimaryRole): ApiPrimaryRole => {
    if (role === 'cooperative') return 'exporter';
    return role;
  };

  const handleStepOneSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await emitEvent('create_workspace_cta_clicked', { source: 'create_account_step_1' });
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'create_account',
          workEmail: workEmail.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as SignupResponsePayload & {
        error?: string;
        msg?: string;
      };
      if (!response.ok) {
        throw new Error(readApiError(payload, getSignupCopy('error_create_account', t)));
      }
      if (payload.accessToken) {
        hydrateSessionFromToken(payload.accessToken, payload.refreshToken);
      }
      setSignupResult(payload);
      setStep(2);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : getSignupCopy('error_create_account', t),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkspaceSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          stage: 'workspace_setup',
          organizationName: organizationName.trim(),
          country: country.trim(),
          primaryRole: toApiPrimaryRole(primaryRole),
          userId: signupResult?.userId ?? null,
          tenantId: signupResult?.tenantId ?? null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        msg?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(readApiError(payload, getSignupCopy('error_complete_workspace', t)));
      }
      const rolesResponse = await fetch('/api/launch/supply-chain-roles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ supplyChainRoles }),
      });
      if (!rolesResponse.ok) {
        // Non-blocking: workspace is usable with primary role only.
      }
      applyRoleToStoredUser(primaryRole);
      setStep(3);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : getSignupCopy('error_complete_workspace', t),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCommercialProfile = async (skipped: boolean) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const roleSpecificSize =
        primaryRole === 'cooperative'
          ? `members:${cooperativeMembers.trim() || 'unknown'}`
          : primaryRole === 'exporter'
            ? `suppliers:${exporterSuppliers.trim() || 'unknown'};importers:${exporterImporters.trim() || 'unknown'}`
            : primaryRole === 'importer'
              ? `suppliers:${importerSuppliers.trim() || 'unknown'}`
              : '';
      const response = await fetch('/api/launch/commercial-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(
          skipped
            ? { skipped: true, primaryRole: toApiPrimaryRole(primaryRole) }
            : {
                skipped: false,
                teamSize: roleSpecificSize || null,
                mainCommodity: mainCommodity.trim(),
                primaryObjective,
                primaryRole: toApiPrimaryRole(primaryRole),
              },
        ),
      });
      if (!response.ok) {
        // Non-blocking by design: profile is optional.
      }
      await emitEvent('onboarding_skipped', {
        stepKey: 'commercial_profile',
        skipped,
      });
      router.push(getPostSignupPath(primaryRole));
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyRoleToStoredUser = (role: PrimaryRole) => {
    const rawUser = sessionStorage.getItem('tracebud_user');
    if (!rawUser) return;
    const tenantRoles = Array.from(new Set(supplyChainRoles.map(supplyChainRoleToTenantRole)));
    const activeRole =
      role === 'cooperative'
        ? 'cooperative'
        : role === 'importer' || role === 'compliance_manager'
          ? 'importer'
          : tenantRoles.includes('exporter')
            ? 'exporter'
            : tenantRoles[0] ?? 'exporter';
    try {
      const parsedUser = JSON.parse(rawUser) as User;
      const updatedUser: User = {
        ...parsedUser,
        roles: tenantRoles,
        active_role: activeRole,
      };
      sessionStorage.setItem('tracebud_user', JSON.stringify(updatedUser));
    } catch {
      // Fail closed to auth-provider fallback if parsing fails.
    }
  };

  const getPostSignupPath = (role: PrimaryRole): string => {
    if (role === 'admin') return '/?welcome=1&entry=admin';
    if (role === 'importer' || role === 'compliance_manager') return '/?welcome=1&entry=inbox';
    return '/?welcome=1&entry=outreach';
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">{getSignupCopy('legacy_wizard_title', t)}</CardTitle>
        <CardDescription>{getSignupCopy('legacy_wizard_progress', t, { step })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {step === 1 ? (
          <>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {getSignupCopy('legacy_value_banner', t)}
            </div>
            <form className="space-y-4" onSubmit={handleStepOneSubmit}>
              <div className="space-y-2">
                <label htmlFor="workEmail" className="text-sm font-medium">
                  {getAuthCopy('field_work_email', t)}
                </label>
                <Input
                  id="workEmail"
                  type="email"
                  value={workEmail}
                  onChange={(event) => setWorkEmail(event.target.value)}
                  placeholder={getAuthCopy('placeholder_email', t)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  {getAuthCopy('field_password', t)}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={getSignupCopy('placeholder_password_create', t)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  {getAuthCopy('field_full_name', t)}
                </label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder={getSignupCopy('placeholder_full_name_short', t)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? getSignupCopy('creating_workspace', t)
                  : getSignupCopy('submit_create_workspace', t)}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {getAuthCopy('already_have_account', t)}{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  {getAuthCopy('sign_in', t)}
                </Link>
              </p>
            </form>
          </>
        ) : null}

        {step === 2 ? (
          <form className="space-y-4" onSubmit={handleWorkspaceSetup}>
            <div className="space-y-2">
              <label htmlFor="organizationName" className="text-sm font-medium">
                {getSignupCopy('field_organization', t)}
              </label>
              <Input
                id="organizationName"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder={getSignupCopy('placeholder_organization', t)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="country" className="text-sm font-medium">
                {getSignupCopy('field_country', t)}
              </label>
              <Input
                id="country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                placeholder={getSignupCopy('placeholder_country_example', t)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="primaryRole" className="text-sm font-medium">
                {getSignupCopy('field_primary_role', t)}
              </label>
              <select
                id="primaryRole"
                value={primaryRole}
                onChange={(event) => {
                  const role = event.target.value as PrimaryRole;
                  setPrimaryRole(role);
                  setSupplyChainRoles((current) =>
                    ensurePrimaryInSupplyChainRoles(
                      role,
                      current.length > 0 ? current : [defaultSupplyChainRoleForSignupPrimary(role)],
                    ),
                  );
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {primaryRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{getSignupCopy('supply_chain_roles_title', t)}</p>
              <p className="text-xs text-muted-foreground">
                {getSignupCopy('supply_chain_roles_hint_examples', t)}
              </p>
              <SupplyChainRolePicker
                selected={supplyChainRoles}
                onChange={setSupplyChainRoles}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                {getSignupCopy('back', t)}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? getSignupCopy('saving_setup', t) : getSignupCopy('continue', t)}
              </Button>
            </div>
          </form>
        ) : null}

        {step === 3 ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveCommercialProfile(false);
            }}
          >
            {primaryRole === 'cooperative' ? (
              <div className="space-y-2">
                <label htmlFor="cooperativeMembers" className="text-sm font-medium">
                  {getSignupCopy('field_members_optional', t)}
                </label>
                <Input
                  id="cooperativeMembers"
                  value={cooperativeMembers}
                  onChange={(event) => setCooperativeMembers(event.target.value)}
                  placeholder={getSignupCopy('number_placeholder', t)}
                />
              </div>
            ) : null}
            {primaryRole === 'exporter' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="exporterSuppliers" className="text-sm font-medium">
                    {getSignupCopy('field_suppliers_optional', t)}
                  </label>
                  <Input
                    id="exporterSuppliers"
                    value={exporterSuppliers}
                    onChange={(event) => setExporterSuppliers(event.target.value)}
                    placeholder="35"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="exporterImporters" className="text-sm font-medium">
                    {getSignupCopy('field_importers_optional', t)}
                  </label>
                  <Input
                    id="exporterImporters"
                    value={exporterImporters}
                    onChange={(event) => setExporterImporters(event.target.value)}
                    placeholder="12"
                  />
                </div>
              </div>
            ) : null}
            {primaryRole === 'importer' ? (
              <div className="space-y-2">
                <label htmlFor="importerSuppliers" className="text-sm font-medium">
                  {getSignupCopy('field_suppliers_optional', t)}
                </label>
                <Input
                  id="importerSuppliers"
                  value={importerSuppliers}
                  onChange={(event) => setImporterSuppliers(event.target.value)}
                  placeholder="40"
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <label htmlFor="mainCommodity" className="text-sm font-medium">
                {getSignupCopy('field_main_commodity_optional', t)}
              </label>
              <select
                id="mainCommodity"
                value={mainCommodity}
                onChange={(event) => setMainCommodity(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {commodityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="primaryObjective" className="text-sm font-medium">
                {getSignupCopy('field_primary_objective', t)}
              </label>
              <select
                id="primaryObjective"
                value={primaryObjective}
                onChange={(event) => setPrimaryObjective(event.target.value as PrimaryObjective)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {objectiveOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => void saveCommercialProfile(true)} disabled={isSubmitting}>
                {getSignupCopy('skip_for_now', t)}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? getSignupCopy('saving', t) : getSignupCopy('continue_to_dashboard', t)}
              </Button>
            </div>
          </form>
        ) : null}

        {error ? <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
      </CardContent>
    </Card>
  );
}
