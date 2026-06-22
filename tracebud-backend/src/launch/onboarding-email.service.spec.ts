import { OnboardingEmailService } from './onboarding-email.service';

function createPoolMock(handlers: {
  onQuery?: (sql: string) => { rowCount?: number; rows?: unknown[] };
}) {
  return {
    query: jest.fn(async (sql: string) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      const result = handlers.onQuery?.(normalized) ?? { rowCount: 0, rows: [] };
      return {
        rowCount: result.rowCount ?? result.rows?.length ?? 0,
        rows: result.rows ?? [],
      };
    }),
  };
}

describe('OnboardingEmailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 're_test',
      RESEND_FROM_EMAIL: 'hello@tracebud.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('skips farmer welcome when profile already exists', () => {
    const service = new OnboardingEmailService({ query: jest.fn() } as any);
    expect(service.isWorkspaceSetupComplete(null)).toBe(false);
    expect(
      service.isWorkspaceSetupComplete({
        organization_name: 'Acme',
        country: '',
        primary_role: 'exporter',
      }),
    ).toBe(false);
    expect(
      service.isWorkspaceSetupComplete({
        organization_name: 'Acme',
        country: 'CI',
        primary_role: 'exporter',
      }),
    ).toBe(true);
  });

  it('sends farmer welcome only once when claim wins the race', async () => {
    let claimCount = 0;
    const pool = createPoolMock({
      onQuery: (sql) => {
        if (sql.includes('INSERT INTO field_app_signup_contacts')) {
          return { rowCount: 1 };
        }
        if (sql.includes('UPDATE field_app_signup_contacts') && sql.includes('welcome_email_sent_at = NOW()')) {
          claimCount += 1;
          return claimCount === 1 ? { rowCount: 1, rows: [{ user_id: 'user-1' }] } : { rowCount: 0, rows: [] };
        }
        if (sql.includes('INSERT INTO audit_log')) {
          return { rowCount: 1 };
        }
        return { rowCount: 0, rows: [] };
      },
    });

    const send = jest.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null });
    jest.spyOn(OnboardingEmailService.prototype as any, 'getResendClient').mockReturnValue({
      emails: { send },
    });

    const service = new OnboardingEmailService(pool as any);
    const input = {
      userId: 'user-1',
      farmerId: 'farmer-1',
      email: 'hector@example.com',
      fullName: 'Hector',
    };

    await expect(service.sendFarmerWelcomeAfterFieldSignup(input)).resolves.toBe(true);
    await expect(service.sendFarmerWelcomeAfterFieldSignup(input)).resolves.toBe(false);
    await expect(service.sendFarmerWelcomeAfterFieldSignup(input)).resolves.toBe(false);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]?.to).toBe('hector@example.com');
  });

  it('releases farmer welcome claim when Resend fails', async () => {
    const releaseCalls: string[] = [];
    const pool = createPoolMock({
      onQuery: (sql) => {
        if (sql.includes('INSERT INTO field_app_signup_contacts')) {
          return { rowCount: 1 };
        }
        if (sql.includes('SET welcome_email_sent_at = NOW()')) {
          return { rowCount: 1, rows: [{ user_id: 'user-1' }] };
        }
        if (sql.includes('SET welcome_email_sent_at = NULL')) {
          releaseCalls.push(sql);
          return { rowCount: 1 };
        }
        return { rowCount: 0, rows: [] };
      },
    });

    jest.spyOn(OnboardingEmailService.prototype as any, 'getResendClient').mockReturnValue({
      emails: {
        send: jest.fn().mockResolvedValue({ data: null, error: { message: 'rate limited' } }),
      },
    });

    const service = new OnboardingEmailService(pool as any);
    await expect(
      service.sendFarmerWelcomeAfterFieldSignup({
        userId: 'user-1',
        farmerId: 'farmer-1',
        email: 'hector@example.com',
        fullName: 'Hector',
      }),
    ).resolves.toBe(false);

    expect(releaseCalls.length).toBe(1);
  });
});
