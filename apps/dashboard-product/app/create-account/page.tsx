'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WizardProgress } from '@/components/onboarding/wizard-progress';
import {
  StepCreateAccount,
  type CreateAccountData,
} from '@/components/onboarding/step-create-account';
import {
  StepWorkspaceSetup,
  type WorkspaceSetupData,
  type PrimaryRole,
} from '@/components/onboarding/step-workspace-setup';
import {
  StepCommercialProfile,
  type CommercialProfileData,
} from '@/components/onboarding/step-commercial-profile';

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

const STEP_TITLES: Record<Step, { title: string; description: string }> = {
  1: {
    title: 'Create your account',
    description: 'Start your free Tracebud workspace.',
  },
  2: {
    title: 'Set up your workspace',
    description: 'Tell us about your organisation so we can tailor your experience.',
  },
  3: {
    title: 'Your commercial profile',
    description: 'Help us personalise your dashboard. You can always update this later.',
  },
};

const WIZARD_STEPS = ['Create account', 'Workspace', 'Profile'];

// ── API helpers ────────────────────────────────────────────────────────────────

function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return 'Something went wrong. Please try again.';
  const b = body as Record<string, unknown>;
  const msg = b.message ?? b.msg ?? b.error;
  return typeof msg === 'string' && msg.length > 0
    ? msg
    : 'Something went wrong. Please try again.';
}

async function apiSignupCreateAccount(data: CreateAccountData): Promise<{ access_token: string }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stage: 'create_account',
      email: data.email,
      password: data.password,
      full_name: data.fullName,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(extractErrorMessage(json));
  return json as { access_token: string };
}

async function apiSignupWorkspace(
  data: WorkspaceSetupData,
  token: string,
): Promise<void> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      stage: 'workspace_setup',
      organization_name: data.organizationName,
      country: data.country,
      primary_role: data.primaryRole,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(extractErrorMessage(json));
}

async function apiCommercialProfile(
  role: PrimaryRole | '',
  data: CommercialProfileData,
  token: string,
): Promise<void> {
  const payload: Record<string, unknown> = {
    primary_commodity: data.primaryCommodity || null,
    primary_objective: data.primaryObjective || null,
  };

  if (role === 'cooperative') payload.member_count = data.memberCount ? Number(data.memberCount) : null;
  if (role === 'exporter') {
    payload.supplier_count = data.supplierCount ? Number(data.supplierCount) : null;
    payload.importer_count = data.importerCount ? Number(data.importerCount) : null;
  }
  if (role === 'importer') payload.supplier_count = data.supplierCount ? Number(data.supplierCount) : null;

  const res = await fetch('/api/launch/commercial-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(extractErrorMessage(json));
}

function getRedirectUrl(role: PrimaryRole | ''): string {
  if (role === 'admin') return '/?welcome=1&entry=admin';
  return '/?welcome=1&entry=requests';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');

  // Form state per step
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

  // ── Step handlers ───────────────────────────────────────────────────────────

  const handleStep1 = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { access_token } = await apiSignupCreateAccount(accountData);
      setAccessToken(access_token);
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
      await apiSignupWorkspace(workspaceData, accessToken);
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
      await apiCommercialProfile(workspaceData.primaryRole, profileData, accessToken);
    } catch {
      // Non-blocking: commercial profile failure should not stop onboarding
    } finally {
      setIsSubmitting(false);
      router.push(getRedirectUrl(workspaceData.primaryRole));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const { title, description } = STEP_TITLES[step];

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-10 sm:items-center sm:py-0">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Image
              src="/tracebud-logo-v6.png"
              alt="Tracebud"
              width={32}
              height={32}
              className="rounded-sm"
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-primary">Tracebud</h1>
            <p className="text-xs text-muted-foreground">EUDR Compliance Platform</p>
          </div>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <WizardProgress currentStep={step} totalSteps={3} steps={WIZARD_STEPS} />
          </CardHeader>

          <CardHeader className="pt-4 pb-2">
            <CardTitle className="text-xl text-balance">{title}</CardTitle>
            <CardDescription className="text-pretty">{description}</CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {step === 1 && (
              <StepCreateAccount
                data={accountData}
                onChange={setAccountData}
                onNext={handleStep1}
                isSubmitting={isSubmitting}
                error={error}
              />
            )}
            {step === 2 && (
              <StepWorkspaceSetup
                data={workspaceData}
                onChange={setWorkspaceData}
                onNext={handleStep2}
                onBack={() => { setError(null); setStep(1); }}
                isSubmitting={isSubmitting}
                error={error}
              />
            )}
            {step === 3 && (
              <StepCommercialProfile
                role={workspaceData.primaryRole}
                data={profileData}
                onChange={setProfileData}
                onNext={handleStep3}
                onBack={() => { setError(null); setStep(2); }}
                isSubmitting={isSubmitting}
                error={error}
              />
            )}
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
