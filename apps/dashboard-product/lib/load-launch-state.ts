import { fetchBackendJson } from '@/lib/dashboard-fetch';

export type LaunchLifecycleStatus = 'trial_active' | 'trial_expired' | 'paid_active' | 'suspended';

export interface LaunchState {
  lifecycle_status: LaunchLifecycleStatus;
  trial_expires_at: string | null;
}

export async function loadLaunchState(authHeader: string): Promise<LaunchState | null> {
  const payload = await fetchBackendJson('/v1/launch/state', authHeader);
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { lifecycle_status?: string; trial_expires_at?: string | null };
  if (
    record.lifecycle_status !== 'trial_active' &&
    record.lifecycle_status !== 'trial_expired' &&
    record.lifecycle_status !== 'paid_active' &&
    record.lifecycle_status !== 'suspended'
  ) {
    return null;
  }
  return {
    lifecycle_status: record.lifecycle_status,
    trial_expires_at: record.trial_expires_at ?? null,
  };
}
