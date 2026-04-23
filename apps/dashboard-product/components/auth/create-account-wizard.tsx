'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { TenantRole, User } from '@/types';
import { useAuth } from '@/lib/auth-context';

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

const objectiveOptions: Array<{ value: PrimaryObjective; label: string }> = [
  { value: 'prepare_first_due_diligence_package', label: 'Prepare first due diligence package' },
  { value: 'supplier_onboarding', label: 'Supplier onboarding' },
  { value: 'risk_screening', label: 'Risk screening' },
  { value: 'audit_readiness', label: 'Audit readiness' },
];

const eudrCommodityOptions = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'cocoa', label: 'Cocoa' },
  { value: 'soy', label: 'Soy' },
  { value: 'cattle', label: 'Cattle' },
  { value: 'oil_palm', label: 'Oil palm' },
  { value: 'rubber', label: 'Rubber' },
  { value: 'wood', label: 'Wood' },
];

export function CreateAccountWizard() {
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
  const [mainCommodity, setMainCommodity] = useState(eudrCommodityOptions[0].value);
  const [primaryObjective, setPrimaryObjective] =
    useState<PrimaryObjective>('prepare_first_due_diligence_package');

  useEffect(() => {
    void emitEvent('create_workspace_value_viewed', { source: 'create_account_step_1' });
    // Fire impression once on first paint.
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
    // Backend commercial-profile schema currently persists canonical commercial roles only.
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
        throw new Error(readApiError(payload, 'Unable to create account.'));
      }
      if (payload.accessToken) {
        hydrateSessionFromToken(payload.accessToken);
      }
      setSignupResult(payload);
      setStep(2);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create account.');
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
        throw new Error(readApiError(payload, 'Unable to complete workspace setup.'));
      }
      applyRoleToStoredUser(primaryRole);
      setStep(3);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to complete workspace setup.');
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

  const selectedRoleToTenantRole = (role: PrimaryRole): TenantRole => {
    if (role === 'cooperative') return 'cooperative';
    if (role === 'importer' || role === 'exporter') return role;
    return 'exporter';
  };

  const applyRoleToStoredUser = (role: PrimaryRole) => {
    const rawUser = sessionStorage.getItem('tracebud_user');
    if (!rawUser) return;
    const selectedRole = selectedRoleToTenantRole(role);
    try {
      const parsedUser = JSON.parse(rawUser) as User;
      const nextRoles = parsedUser.roles.includes(selectedRole)
        ? parsedUser.roles
        : [selectedRole, ...parsedUser.roles];
      const updatedUser: User = {
        ...parsedUser,
        roles: nextRoles,
        active_role: selectedRole,
      };
      sessionStorage.setItem('tracebud_user', JSON.stringify(updatedUser));
    } catch {
      // Fail closed to auth-provider fallback if parsing fails.
    }
  };

  const getPostSignupPath = (role: PrimaryRole): string => {
    if (role === 'admin') return '/?welcome=1&entry=admin';
    if (role === 'importer' || role === 'compliance_manager') return '/?welcome=1&entry=requests';
    return '/?welcome=1&entry=requests';
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">Create your Tracebud workspace</CardTitle>
        <CardDescription>
          Step {step} of 3 - fast setup, then immediate first-value onboarding.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {step === 1 ? (
          <>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Start your EUDR-ready workspace in under 2 minutes. No credit card required. 30-day trial.
            </div>
            <form className="space-y-4" onSubmit={handleStepOneSubmit}>
              <div className="space-y-2">
                <label htmlFor="workEmail" className="text-sm font-medium">
                  Work email
                </label>
                <Input
                  id="workEmail"
                  type="email"
                  value={workEmail}
                  onChange={(event) => setWorkEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a secure password"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Full name
                </label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating workspace...' : 'Create workspace'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </>
        ) : null}

        {step === 2 ? (
          <form className="space-y-4" onSubmit={handleWorkspaceSetup}>
            <div className="space-y-2">
              <label htmlFor="organizationName" className="text-sm font-medium">
                Organization name
              </label>
              <Input
                id="organizationName"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Tracebud Imports Ltd"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="country" className="text-sm font-medium">
                Country
              </label>
              <Input
                id="country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                placeholder="France"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="primaryRole" className="text-sm font-medium">
                Primary role
              </label>
              <select
                id="primaryRole"
                value={primaryRole}
                onChange={(event) => setPrimaryRole(event.target.value as PrimaryRole)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="importer">Importer</option>
                <option value="exporter">Exporter</option>
                <option value="cooperative">Supplier (cooperative)</option>
                <option value="compliance_manager">Compliance manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving setup...' : 'Continue'}
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
                  Number of members (optional)
                </label>
                <Input
                  id="cooperativeMembers"
                  value={cooperativeMembers}
                  onChange={(event) => setCooperativeMembers(event.target.value)}
                  placeholder="120"
                />
              </div>
            ) : null}
            {primaryRole === 'exporter' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="exporterSuppliers" className="text-sm font-medium">
                    Number of suppliers (optional)
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
                    Number of importers (optional)
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
                  Number of suppliers (optional)
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
                Main commodity (optional)
              </label>
              <select
                id="mainCommodity"
                value={mainCommodity}
                onChange={(event) => setMainCommodity(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {eudrCommodityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="primaryObjective" className="text-sm font-medium">
                Primary objective
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
                Skip for now
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Continue to dashboard'}
              </Button>
            </div>
          </form>
        ) : null}

        {error ? <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
      </CardContent>
    </Card>
  );
}
