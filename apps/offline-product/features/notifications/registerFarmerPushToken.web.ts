import type {
  RegisterFarmerPushTokenOptions,
  RegisterFarmerPushTokenResult,
} from './registerFarmerPushToken.native';

export type { RegisterFarmerPushTokenOptions, RegisterFarmerPushTokenResult };

export async function registerFarmerPushToken(
  _options?: RegisterFarmerPushTokenOptions,
): Promise<RegisterFarmerPushTokenResult> {
  return { ok: false, reason: 'unavailable' };
}
