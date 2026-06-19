import { describe, expect, it } from 'vitest';

import { isLocalLanSyncApi, isProductionSyncApi } from './syncApiTarget';

describe('syncApiTarget', () => {
  it('detects LAN and localhost API bases', () => {
    expect(isLocalLanSyncApi('http://10.0.0.7:4000/api')).toBe(true);
    expect(isLocalLanSyncApi('http://localhost:4000/api')).toBe(true);
    expect(isLocalLanSyncApi('https://api.tracebud.com/api')).toBe(false);
  });

  it('detects production API', () => {
    expect(isProductionSyncApi('https://api.tracebud.com/api')).toBe(true);
    expect(isProductionSyncApi('http://10.0.0.7:4000/api')).toBe(false);
  });
});
