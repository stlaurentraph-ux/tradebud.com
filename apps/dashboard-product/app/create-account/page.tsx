'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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

type Step = 1 | 2 | 3;
type ApiPrimaryRole = 'importer' | 'exporter' | 'compliance_manager' | 'admin';

const STEP_TITLES: Record<Step, { title: string; description: string }> = {
  1: {
    title: 'Create your account',
    description: 'Start your Tracebud workspace in a few minutes.',
  },
  2: {
    title: 'Set up your workspace',
    description: 'Tell us about your organization so we can tailor your workflows.',
  },
  3: {
    title: 'Your commercial profile',
    description: 'Help us personalize onboarding. You can update this later.',
  },
};

const WIZARD_STEPS = ['Create account', 'Workspace', 'Profile'];

function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return 'Something went wrong. Please try again.';
  const b = body as Record<string, unknown>;
  const msg = b.message ?? b.msg ?? b.error;
  return typeof msg === 'string' && msg.length > 0 ? msg : 'Something went wrong. Please try again.';
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
  return '/?welcome=1&entry=requests';
}

function selectedRoleToTenantRole(role: PrimaryRole | ''): TenantRole {
  if (role === 'cooperative') return 'cooperative';
  if (role === 'importer' || role === 'exporter') return role;
  return 'exporter';
}

export default function CreateAccountPage() {
  const router = useRouter();
  const { hydrateSessionFromToken } = useAuth();
  const [step, setStep] = useState<Step>(1);
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
  });
  const [profileData, setProfileData] = useState<CommercialProfileData>({
    memberCount: '',
    supplierCount: '',
    importerCount: '',
    primaryCommodity: '',
    primaryObjective: '',
  });

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
      if (!res.ok) throw new Error(extractErrorMessage(json));
      const payload = json as { accessToken?: string };
      if (payload.accessToken) {
        hydrateSessionFromToken(payload.accessToken);
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
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
          primaryRole: toApiPrimaryRole(workspaceData.primaryRole),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractErrorMessage(json));
      const rawUser = sessionStorage.getItem('tracebud_user');
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser) as User;
          const selectedRole = selectedRoleToTenantRole(workspaceData.primaryRole);
          const nextRoles = parsed.roles.includes(selectedRole) ? parsed.roles : [selectedRole, ...parsed.roles];
          const updatedUser: User = {
            ...parsed,
            roles: nextRoles,
            active_role: selectedRole,
          };
          sessionStorage.setItem('tracebud_user', JSON.stringify(updatedUser));
        } catch {
          // Fail closed to existing auth state.
        }
      }
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
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
          primaryRole: toApiPrimaryRole(workspaceData.primaryRole),
          teamSize: buildRoleSpecificSize(workspaceData.primaryRole, profileData),
          mainCommodity: profileData.primaryCommodity || null,
          primaryObjective: profileData.primaryObjective || null,
        }),
      });
      if (!res.ok) {
        // Non-blocking by design.
      }
    } finally {
      setIsSubmitting(false);
      router.push(getRedirectUrl(workspaceData.primaryRole));
    }
  };

  const { title, description } = STEP_TITLES[step];

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-10 sm:items-center sm:py-0">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/tracebud-logo-v6.png"
            alt="Tracebud"
            width={64}
            height={64}
            className="mb-4 rounded-xl"
          />
          <h1 className="text-2xl font-bold text-[#064E3B]">Tracebud</h1>
          <p className="text-sm text-muted-foreground">EUDR Compliance Platform</p>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <WizardProgress currentStep={step} totalSteps={3} steps={WIZARD_STEPS} />
          </CardHeader>

          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
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
                data={workspaceData}
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
                role={workspaceData.primaryRole}
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
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
