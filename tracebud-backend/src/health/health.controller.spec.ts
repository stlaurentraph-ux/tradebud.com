import { HealthController } from './health.controller';

describe('HealthController', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.BENCHMARK_ADMIN_ROLE_CLAIMS;
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.GFW_API_KEY = 'test-gfw-key';
    process.env.AI_GATEWAY_API_KEY = 'gateway-test-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';
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
        warnings: expect.any(Array),
        tenureParse: expect.objectContaining({
          ready: true,
          viaGateway: true,
          zeroDataRetention: true,
        }),
        benchmarkAdminAuth: {
          claimEnforced: true,
          configured: true,
          requiredClaims: ['ADMIN', 'COMPLIANCE_MANAGER'],
        },
      }),
    );
  });

  it('warns when GFW_API_KEY is missing', () => {
    delete process.env.GFW_API_KEY;
    const controller = new HealthController();
    const result = controller.getHealth();
    expect(result.warnings).toContain(
      'GFW_API_KEY is not configured; plot deforestation screening will stay pending_check until set.',
    );
  });

  it('reports push notification readiness', () => {
    delete process.env.EXPO_ACCESS_TOKEN;
    const controller = new HealthController();
    const result = controller.getHealth();
    expect(result.pushNotifications).toEqual(
      expect.objectContaining({
        ready: true,
        expoAccessTokenConfigured: false,
        pushDevicesTableReady: true,
        supportedRoles: ['farmer', 'agent', 'cooperative', 'exporter', 'compliance_manager'],
      }),
    );
    expect(result.warnings).toContain(
      'EXPO_ACCESS_TOKEN is not configured; Expo push still works with low rate limits but may drop alerts in production.',
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
