import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  platformOS: 'android' as 'android' | 'ios' | 'web',
  setNotificationChannelAsync: vi.fn(
    async (_channelId: string, _config: { importance?: number }) => undefined,
  ),
}));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return h.platformOS;
    },
  },
}));

vi.mock('expo-notifications', () => ({
  setNotificationChannelAsync: h.setNotificationChannelAsync,
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
}));

import {
  ANDROID_DEFAULT_CHANNEL_ID,
  ensureAndroidNotificationChannel,
} from './androidNotificationChannel';

describe('ensureAndroidNotificationChannel', () => {
  beforeEach(() => {
    h.setNotificationChannelAsync.mockClear();
  });

  it('creates a HIGH-importance default channel on Android', async () => {
    h.platformOS = 'android';
    await ensureAndroidNotificationChannel();
    expect(h.setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(h.setNotificationChannelAsync.mock.calls[0]?.[0]).toBe(ANDROID_DEFAULT_CHANNEL_ID);
    expect(h.setNotificationChannelAsync.mock.calls[0]?.[1]?.importance).toBe(4); // AndroidImportance.HIGH
  });

  it('is a no-op on iOS (no notification channels)', async () => {
    h.platformOS = 'ios';
    await ensureAndroidNotificationChannel();
    expect(h.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('is a no-op on web', async () => {
    h.platformOS = 'web';
    await ensureAndroidNotificationChannel();
    expect(h.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});
