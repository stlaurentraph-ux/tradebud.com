// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_DATA_STORAGE_KEY,
  isDemoDataToggleAvailable,
  readDemoDataEnabled,
  writeDemoDataEnabled,
} from './demo-data-mode';

describe('demo-data-mode', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllEnvs();
  });

  it('enables toggle when env flag is true', () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_DATA_TOGGLE', 'true');
    expect(isDemoDataToggleAvailable()).toBe(true);
  });

  it('disables toggle when env flag is false', () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_DATA_TOGGLE', 'false');
    expect(isDemoDataToggleAvailable()).toBe(false);
  });

  it('persists enabled state in session storage', () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_DATA_TOGGLE', 'true');
    writeDemoDataEnabled(true);
    expect(sessionStorage.getItem(DEMO_DATA_STORAGE_KEY)).toBe('1');
    expect(readDemoDataEnabled()).toBe(true);
    writeDemoDataEnabled(false);
    expect(readDemoDataEnabled()).toBe(false);
  });
});
