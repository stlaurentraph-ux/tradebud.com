import { describe, expect, it, vi } from 'vitest';

// `fieldMapTiles` imports `@/features/offlineTiles/offlineTiles`, which transitively pulls in the
// Expo native runtime (expo-modules-core) that cannot load under Node. We only need a deterministic
// offline template here, so stub the offline-tiles boundary.
vi.mock('@/features/offlineTiles/offlineTiles', () => ({
  getOfflineTilesUrlTemplate: (packId?: string) =>
    `file:///data/user/0/com.tracebud.app/files/offlineTiles/${packId ?? 'default'}/{z}/{x}/{y}.png`,
}));

import {
  getFieldMapUrlTemplate,
  resolveFieldMapTileMode,
  toLocalTilePathTemplate,
} from './fieldMapTiles';

describe('resolveFieldMapTileMode', () => {
  it('prefers low-data (no tiles) over everything', () => {
    expect(resolveFieldMapTileMode({ lowDataMap: true, offlineTilesEnabled: true })).toBe('none');
  });

  it('uses offline tiles when enabled', () => {
    expect(resolveFieldMapTileMode({ lowDataMap: false, offlineTilesEnabled: true })).toBe('offline');
  });

  it('defaults to online tiles', () => {
    expect(resolveFieldMapTileMode({ lowDataMap: false, offlineTilesEnabled: false })).toBe('online');
  });
});

describe('toLocalTilePathTemplate', () => {
  it('strips the file:// scheme so LocalTile gets a filesystem path (iOS + Android)', () => {
    expect(toLocalTilePathTemplate('file:///var/mobile/Documents/offlineTiles/{z}/{x}/{y}.png')).toBe(
      '/var/mobile/Documents/offlineTiles/{z}/{x}/{y}.png',
    );
    expect(
      toLocalTilePathTemplate('file:///data/user/0/com.tracebud.app/files/offlineTiles/{z}/{x}/{y}.png'),
    ).toBe('/data/user/0/com.tracebud.app/files/offlineTiles/{z}/{x}/{y}.png');
  });

  it('leaves a path without a scheme untouched', () => {
    expect(toLocalTilePathTemplate('/already/a/path/{z}/{x}/{y}.png')).toBe(
      '/already/a/path/{z}/{x}/{y}.png',
    );
  });
});

describe('getFieldMapUrlTemplate', () => {
  it('returns null when tiles are disabled', () => {
    expect(getFieldMapUrlTemplate('none')).toBeNull();
  });

  it('returns an https template for online mode', () => {
    expect(getFieldMapUrlTemplate('online')).toMatch(/^https:\/\//);
  });
});
