import { expect, test } from '@playwright/test';
import {
  buildSmokeAccessToken,
  GOLDEN_SMOKE,
  seedSmokeSession,
} from './helpers/smoke-session';
import {
  mockAuthenticatedDashboardApis,
  mockOnboardingProxy,
  mockSupabasePasswordGrant,
} from './helpers/api-mocks';

test('login page renders sign-in shell', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('login stub signs in with mocked Supabase grant and lands on dashboard', async ({ page }) => {
  const accessToken = buildSmokeAccessToken();
  await mockSupabasePasswordGrant(page, accessToken);
  await mockAuthenticatedDashboardApis(page);

  await page.goto('/login');
  await page.getByLabel('Email').fill(GOLDEN_SMOKE.email);
  await page.getByLabel('Password', { exact: true }).fill('playwright-smoke-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Welcome, Playwright Smoke' })).toBeVisible({
    timeout: 15_000,
  });
});

test('onboarding proxy read/write uses golden smoke role and step key', async ({ page }) => {
  await seedSmokeSession(page);
  await mockAuthenticatedDashboardApis(page);
  const onboardingMocks = await mockOnboardingProxy(page);

  await page.goto('/');

  const readResult = await page.evaluate(async (role) => {
    const token = sessionStorage.getItem('tracebud_token');
    const response = await fetch(`/api/launch/onboarding?role=${encodeURIComponent(role)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return {
      ok: response.ok,
      status: response.status,
      body: await response.json(),
    };
  }, GOLDEN_SMOKE.onboardingRole);

  expect(readResult.ok).toBe(true);
  expect(readResult.body.items).toEqual([
    { step_key: GOLDEN_SMOKE.onboardingStepKey, completed: false },
  ]);
  expect(onboardingMocks.getCalls()).toBe(1);

  const writeResult = await page.evaluate(
    async ({ role, stepKey }) => {
      const token = sessionStorage.getItem('tracebud_token');
      const response = await fetch('/api/launch/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role, stepKey }),
      });
      return {
        ok: response.ok,
        status: response.status,
        body: await response.json(),
      };
    },
    { role: GOLDEN_SMOKE.onboardingRole, stepKey: GOLDEN_SMOKE.onboardingStepKey },
  );

  expect(writeResult.ok).toBe(true);
  expect(writeResult.body).toEqual({ ok: true });
  expect(onboardingMocks.postBodies()).toEqual([
    {
      role: GOLDEN_SMOKE.onboardingRole,
      stepKey: GOLDEN_SMOKE.onboardingStepKey,
    },
  ]);
});
