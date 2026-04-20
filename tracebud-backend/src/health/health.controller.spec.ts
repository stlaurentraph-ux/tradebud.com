import { HealthController } from './health.controller';

describe('HealthController', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.BENCHMARK_ADMIN_ROLE_CLAIMS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns default benchmark-admin claim requirements', () => {
    const controller = new HealthController();
    const result = controller.getHealth();
    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        warnings: [],
        benchmarkAdminAuth: {
          claimEnforced: true,
          configured: true,
          requiredClaims: ['ADMIN', 'COMPLIANCE_MANAGER'],
        },
      }),
    );
  });

  it('warns when benchmark-admin claim configuration is empty', () => {
    process.env.BENCHMARK_ADMIN_ROLE_CLAIMS = ' , ';
    const controller = new HealthController();
    const result = controller.getHealth();
    expect(result.status).toBe('ok');
    expect(result.benchmarkAdminAuth).toEqual(
      expect.objectContaining({
        claimEnforced: true,
        configured: false,
        requiredClaims: [],
      }),
    );
    expect(result.warnings).toContain(
      'Benchmark-admin claim configuration is empty; benchmark admin routes may be inaccessible.',
    );
  });
});
