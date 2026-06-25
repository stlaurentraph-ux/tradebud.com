import { describe, expect, it } from 'vitest';

import {
  isLegacySupabaseCoHost,
  isTracebudBrandedAuthHost,
  resolveSupabaseProjectUrl,
} from './supabaseProjectUrl';

describe('supabaseProjectUrl', () => {
  it('detects Tracebud auth host', () => {
    expect(isTracebudBrandedAuthHost('https://auth.tracebud.com')).toBe(true);
    expect(isTracebudBrandedAuthHost('https://uzsktajlnofosxeqwdwl.supabase.co')).toBe(false);
  });

  it('detects legacy supabase.co host', () => {
    expect(isLegacySupabaseCoHost('https://uzsktajlnofosxeqwdwl.supabase.co')).toBe(true);
    expect(isLegacySupabaseCoHost('https://auth.tracebud.com')).toBe(false);
  });

  it('strips trailing slash from env URL', () => {
    const prev = process.env.EXPO_PUBLIC_SUPABASE_URL;
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://auth.tracebud.com/';
    expect(resolveSupabaseProjectUrl()).toBe('https://auth.tracebud.com');
    process.env.EXPO_PUBLIC_SUPABASE_URL = prev;
  });
});
