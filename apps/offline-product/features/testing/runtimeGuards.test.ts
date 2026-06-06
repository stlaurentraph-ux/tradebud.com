import {
  collectStartupConfigIssues,
  getTracebudApiBaseUrl,
  tryGetTracebudApiBaseUrl,
} from '@/features/api/runtimeGuards';

describe('runtimeGuards', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('resolves localhost API in dev runtime', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    (global as any).__DEV__ = true;
    expect(getTracebudApiBaseUrl()).toBe('http://localhost:4000/api');
  });

  it('flags missing supabase config in release runtime', () => {
    (global as any).__DEV__ = false;
    process.env.EXPO_PUBLIC_API_URL = 'https://api.tracebud.com/api';
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const issues = collectStartupConfigIssues();
    expect(issues.some((issue) => issue.code === 'missing_supabase_url')).toBe(true);
    expect(issues.some((issue) => issue.code === 'missing_supabase_anon_key')).toBe(true);
  });

  it('returns structured failure from tryGetTracebudApiBaseUrl when release config is incomplete', () => {
    (global as any).__DEV__ = false;
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const result = tryGetTracebudApiBaseUrl();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });
});
