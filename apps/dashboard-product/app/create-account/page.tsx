'use client';

import { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthBrandHeader } from '@/components/brand/auth-brand-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WizardProgress } from '@/components/onboarding/wizard-progress';
import { useAuth } from '@/lib/auth-context';
import { StepCreateAccount, type CreateAccountData } from '@/components/onboarding/step-create-account';
import {
  StepWorkspaceSetup,
  type WorkspaceSetupData,
  type PrimaryRole,
} from '@/components/onboarding/step-workspace-setup';
import { StepCommercialProfile, type CommercialProfileData } from '@/components/onboarding/step-commercial-profile';
import type { User, TenantRole } from '@/types';
import {
  defaultSupplyChainRoleForSignupPrimary,
  primaryTenantRoleFromSupplyChainRoles,
  signupPrimarySupportsSupplyChainRoles,
  supplyChainRoleToTenantRole,
  type SupplyChainRoleId,
} from '@/lib/org-supply-chain-roles';
import { LocaleContext } from '@/lib/locale-context';
import {
  getAuthCopy,
  getSignupCopy,
  getSignupStepMeta,
} from '@/lib/workflow-terminology-labels';
import {
  extractClaimFromNextPath,
  persistPendingDeliveryClaimRef,
  resolvePostAuthIntakeRedirect,
} from '@/lib/delivery-intake-redirect';
import {
  extractCampaignFromNextPath,
  persistPendingSupplierCampaignId,
  resolvePostAuthNetworkRedirect,
} from '@/lib/supplier-campaign-redirect';
import { SearchParamsPageBoundary } from '@/components/routing/search-params-page-boundary';

type Step = 1 | 2 | 3;
type ApiPrimaryRole = 'importer' | 'exporter' | 'compliance_manager' | 'admin';
type SupportedPrefillRole = PrimaryRole;

const WIZARD_STEP_KEYS = ['wizard_step_account', 'wizard_step_workspace', 'wizard_step_profile'] as const;

function extractErrorMessage(body: unknown, t?: (key: string) => string): string {
  if (!body || typeof body !== 'object') return getAuthCopy('error_generic', t);
  const b = body as Record<string, unknown>;
  const msg = b.message ?? b.msg ?? b.error;
  return typeof msg === 'string' && msg.length > 0 ? msg : getAuthCopy('error_generic', t);
}

function toApiPrimaryRole(role: PrimaryRole | ''): ApiPrimaryRole {
  if (role === 'cooperative') return 'exporter';
  if (role === 'importer' || role === 'exporter' || role === 'compliance_manager' || role === 'admin') {
    return role;
  }
  return 'exporter';
}

function buildRoleSpecificSize(role: PrimaryRole | '', data: CommercialProfileData): string | null {
  if (role === 'cooperative') {
    return data.memberCount.trim() ? `members:${data.memberCount.trim()}` : null;
  }
  if (role === 'exporter') {
    const suppliers = data.supplierCount.trim() || 'unknown';
    const importers = data.importerCount.trim() || 'unknown';
    return `suppliers:${suppliers};importers:${importers}`;
  }
  if (role === 'importer') {
    return data.supplierCount.trim() ? `suppliers:${data.supplierCount.trim()}` : null;
  }
  return null;
}

function getRedirectUrl(role: PrimaryRole | ''): string {
  if (role === 'admin') return '/?welcome=1&entry=admin';
  if (role === 'importer' || role === 'compliance_manager') return '/?welcome=1&entry=inbox';
  return '/?welcome=1&entry=outreach';
}

function selectedRoleToTenantRole(role: PrimaryRole | ''): TenantRole {
  if (role === 'cooperative') return 'cooperative';
  if (role === 'importer' || role === 'exporter') return role;
  return 'exporter';
}

function parsePrefillRole(role: string | null): SupportedPrefillRole | '' {
  if (
    role === 'importer' ||
    role === 'exporter' ||
    role === 'cooperative' ||
    role === 'compliance_manager' ||
    role === 'admin'
  ) {
    return role;
  }
  return '';
}

export default function CreateAccountPage() {
  return (
    <SearchParamsPageBoundary fallback={<CreateAccountPageFallback />}>
      <CreateAccountPageContent />
    </SearchParamsPageBoundary>
  );
}

function CreateAccountPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <AuthBrandHeader />
      </div>
    </div>
  );
}

function CreateAccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hydrateSessionFromToken, isAuthenticated } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const resumeWorkspace = searchParams.get('resume') === 'workspace';
  const claimFromQuery =
    searchParams.get('claim')?.trim() || extractClaimFromNextPath(searchParams.get('next'));
  const campaignFromQuery =
    searchParams.get('campaign')?.trim() || extractCampaignFromNextPath(searchParams.get('next'));
  const [step, setStep] = useState<Step>(resumeWorkspace ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accountData, setAccountData] = useState<CreateAccountData>({
    email: '',
    password: '',
    fullName: '',
  });
  const [workspaceData, setWorkspaceData] = useState<WorkspaceSetupData>({
    organizationName: '',
    country: '',
    primaryRole: '',
    supplyChainRoles: ['exporter'],
  });
  const [profileData, setProfileData] = useState<CommercialProfileData>({
    memberCount: '',
    supplierCount: '',
    importerCount: '',
    primaryCommodity: '',
    primaryObjective: '',
  });

  const prefillRole = parsePrefillRole(searchParams.get('role'));
  const effectivePrimaryRole = workspaceData.primaryRole || prefillRole;

  useEffect(() => {
    if (claimFromQuery) persistPendingDeliveryClaimRef(claimFromQuery);
    if (campaignFromQuery) persistPendingSupplierCampaignId(campaignFromQuery);
  }, [claimFromQuery, campaignFromQuery]);

  useEffect(() => {
    if (!resumeWorkspace || !isAuthenticated) return;
    if (!workspaceData.primaryRole && prefillRole) {
      const defaultRole = defaultSupplyChainRoleForSignupPrimary(prefillRole);
      setWorkspaceData((current) => ({
        ...current,
        primaryRole: prefillRole,
        supplyChainRoles: signupPrimarySupportsSupplyChainRoles(prefillRole) ? [defaultRole] : current.supplyChainRoles,
      }));
    }
  }, [resumeWorkspace, isAuthenticated, prefillRole, workspaceData.primaryRole]);

  const handleStep1 = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'create_account',
          workEmail: accountData.email.trim().toLowerCase(),
          password: accountData.password,
          fullName: accountData.fullName.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractErrorMessage(json, t));
      const payload = json as { accessToken?: string; refreshToken?: string | null };
      if (payload.accessToken) {
        hydrateSessionFromToken(payload.accessToken, payload.refreshToken);
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : getAuthCopy('error_generic', t));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2 = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          stage: 'workspace_setup',
          organizationName: workspaceData.organizationName.trim(),
          country: workspaceData.country.trim(),
          primaryRole: toApiPrimaryRole(effectivePrimaryRole),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractErrorMessage(json, t));

      const supplyChainRoles: SupplyChainRoleId[] = signupPrimarySupportsSupplyChainRoles(effectivePrimaryRole)
        ? workspaceData.supplyChainRoles
        : [];
      if (supplyChainRoles.length > 0) {
        const rolesRes = await fetch('/api/launch/supply-chain-roles', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ supplyChainRoles }),
        });
        if (!rolesRes.ok) {
          // Non-blocking: workspace remains usable with primary role only.
        }
      }

      const rawUser = sessionStorage.getItem('tracebud_user');
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser) as User;
          const tenantRoles =
            supplyChainRoles.length > 0
              ? Array.from(new Set(supplyChainRoles.map(supplyChainRoleToTenantRole)))
              : [selectedRoleToTenantRole(effectivePrimaryRole)];
          const activeRole =
            supplyChainRoles.length > 0
              ? primaryTenantRoleFromSupplyChainRoles(supplyChainRoles)
              : selectedRoleToTenantRole(effectivePrimaryRole);
          const updatedUser: User = {
            ...parsed,
            roles: tenantRoles,
            active_role: activeRole,
          };
          sessionStorage.setItem('tracebud_user', JSON.stringify(updatedUser));
        } catch {
          // Fail closed to existing auth state.
        }
      }
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : getAuthCopy('error_generic', t));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3 = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const res = await fetch('/api/launch/commercial-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          skipped: false,
          primaryRole: toApiPrimaryRole(effectivePrimaryRole),
          teamSize: buildRoleSpecificSize(effectivePrimaryRole, profileData),
          mainCommodity: profileData.primaryCommodity || null,
          primaryObjective: profileData.primaryObjective || null,
        }),
      });
      if (!res.ok) {
        // Non-blocking by design.
      }
    } finally {
      setIsSubmitting(false);
      router.push(
        resolvePostAuthNetworkRedirect({
          claimRef: claimFromQuery,
          campaignId: campaignFromQuery,
          fallbackPath: getRedirectUrl(effectivePrimaryRole),
          resolveClaim: resolvePostAuthIntakeRedirect,
        }),
      );
    }
  };

  const { title, description } = getSignupStepMeta(step, t);
  const wizardSteps = WIZARD_STEP_KEYS.map((key) => getSignupCopy(key, t));

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-10 sm:items-center sm:py-0">
      <div className="w-full max-w-md">
        <AuthBrandHeader />

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <WizardProgress currentStep={step} totalSteps={3} steps={wizardSteps} />
          </CardHeader>

          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>
              {resumeWorkspace && step === 2
                ? getSignupCopy('step2_resume_description', t)
                : description}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {step === 1 ? (
              <StepCreateAccount
                data={accountData}
                onChange={setAccountData}
                onNext={handleStep1}
                isSubmitting={isSubmitting}
                error={error}
              />
            ) : null}
            {step === 2 ? (
              <StepWorkspaceSetup
                data={{ ...workspaceData, primaryRole: effectivePrimaryRole }}
                onChange={setWorkspaceData}
                onNext={handleStep2}
                onBack={() => {
                  setError(null);
                  setStep(1);
                }}
                isSubmitting={isSubmitting}
                error={error}
              />
            ) : null}
            {step === 3 ? (
              <StepCommercialProfile
                role={effectivePrimaryRole}
                data={profileData}
                onChange={setProfileData}
                onNext={handleStep3}
                onBack={() => {
                  setError(null);
                  setStep(2);
                }}
                isSubmitting={isSubmitting}
                error={error}
              />
            ) : null}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {getAuthCopy('already_have_account', t)}{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            {getAuthCopy('sign_in', t)}
          </Link>
        </p>
      </div>
    </div>
  );
}
