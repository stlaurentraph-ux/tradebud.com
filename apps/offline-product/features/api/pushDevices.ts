import { getAccessTokenFromSupabase } from '@/features/api/syncAuthSession';
import { getTracebudApiBaseUrl } from '@/features/api/runtimeGuards';

const API_BASE_URL = getTracebudApiBaseUrl();

export async function registerPushDevice(params: {
  pushToken: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
}): Promise<void> {
  const token = await getAccessTokenFromSupabase();
  if (!token) {
    return;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/v1/me/push-devices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        push_token: params.pushToken,
        platform: params.platform,
      }),
    });
    if (!res.ok && typeof __DEV__ !== 'undefined' && __DEV__) {
      const body = await res.text().catch(() => '');
      console.warn(`Push device registration failed (${res.status}): ${body}`);
    }
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('Push device registration error:', error);
    }
  }
}

export async function unregisterPushDevice(params: { pushToken: string }): Promise<void> {
  const token = await getAccessTokenFromSupabase();
  if (!token) {
    return;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/v1/me/push-devices/unregister`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        push_token: params.pushToken,
      }),
    });
    if (!res.ok && typeof __DEV__ !== 'undefined' && __DEV__) {
      const body = await res.text().catch(() => '');
      console.warn(`Push device unregister failed (${res.status}): ${body}`);
    }
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('Push device unregister error:', error);
    }
  }
}
