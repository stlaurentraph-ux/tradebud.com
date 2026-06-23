import type { Page } from '@playwright/test';

export const GOLDEN_SMOKE = {
  tenantId: 'tenant_rwanda_001',
  onboardingRole: 'compliance_manager',
  onboardingStepKey: 'create_first_campaign',
  email: 'playwright.smoke@tracebud.test',
  userId: 'playwright-user-001',
  organizationName: 'Golden Staging Cooperative',
} as const;

export function buildSmokeAccessToken(options?: {
  tenantId?: string;
  role?: string;
  email?: string;
  userId?: string;
}): string {
  const tenantId = options?.tenantId ?? GOLDEN_SMOKE.tenantId;
  const role = options?.role ?? GOLDEN_SMOKE.onboardingRole;
  const email = options?.email ?? GOLDEN_SMOKE.email;
  const userId = options?.userId ?? GOLDEN_SMOKE.userId;
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      user_metadata: { full_name: 'Playwright Smoke' },
      app_metadata: { tenant_id: tenantId, role },
    }),
  ).toString('base64url');
  return `${header}.${payload}.playwright-smoke-signature`;
}

export function buildSmokeUser() {
  return {
    id: GOLDEN_SMOKE.userId,
    email: GOLDEN_SMOKE.email,
    name: 'Playwright Smoke',
    tenant_id: GOLDEN_SMOKE.tenantId,
    roles: ['importer'],
    active_role: 'importer',
    created_at: new Date().toISOString(),
  };
}

export async function seedSmokeSession(page: Page): Promise<void> {
  const token = buildSmokeAccessToken();
  const user = buildSmokeUser();
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

  await page.context().addCookies([
    {
      name: 'tracebud_session',
      value: token,
      url: baseURL,
      sameSite: 'Lax',
    },
  ]);

  await page.addInitScript(({ tokenValue, userValue, userId }) => {
    sessionStorage.setItem('tracebud_token', tokenValue);
    sessionStorage.setItem('tracebud_user', JSON.stringify(userValue));
    document.cookie = `tracebud_session=${encodeURIComponent(tokenValue)}; Path=/; SameSite=Lax; Max-Age=604800`;
    localStorage.setItem(`tracebud_ob_phase_${userId}`, 'checklist');
    localStorage.setItem(`tracebud_ob_skipped_${userId}`, '1');
    localStorage.setItem(`tracebud_welcome_ack_${userId}`, '1');
  }, { tokenValue: token, userValue: user, userId: user.id });
}
