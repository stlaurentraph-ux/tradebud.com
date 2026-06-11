import { getSetting, setSetting } from '@/features/state/persistence';

export const DATA_PROCESSING_CONSENT_AT_KEY = 'data_processing_consent_at';

export async function hasDataProcessingConsent(): Promise<boolean> {
  const value = await getSetting(DATA_PROCESSING_CONSENT_AT_KEY);
  return Boolean(value && value.trim().length > 0);
}

export async function recordDataProcessingConsent(): Promise<string> {
  const at = new Date().toISOString();
  await setSetting(DATA_PROCESSING_CONSENT_AT_KEY, at);
  return at;
}

export async function clearDataProcessingConsent(): Promise<void> {
  await setSetting(DATA_PROCESSING_CONSENT_AT_KEY, '');
}
