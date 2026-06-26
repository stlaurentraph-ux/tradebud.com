import type { Session } from '@supabase/supabase-js';

import { getSupabaseAuthClient } from '@/features/api/syncAuthSession';

export type PhoneOtpRequestResult =
  | { ok: true }
  | { ok: false; message: string };

export type PhoneOtpVerifyResult =
  | { ok: true; session: Session }
  | { ok: false; message: string };

export function normalizePhoneForOtp(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  const compact = trimmed.replace(/[^\d+]/g, '');
  if (!compact) {
    return null;
  }
  const digits = compact.startsWith('+') ? compact.slice(1) : compact;
  if (!/^\d{8,15}$/.test(digits)) {
    return null;
  }
  return `+${digits}`;
}

export async function requestFarmerPhoneOtp(phoneInput: string): Promise<PhoneOtpRequestResult> {
  const phone = normalizePhoneForOtp(phoneInput);
  if (!phone) {
    return { ok: false, message: 'phone_otp_invalid_number' };
  }

  try {
    const supabase = getSupabaseAuthClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: true },
    });
    if (error) {
      return { ok: false, message: error.message || 'phone_otp_send_failed' };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'phone_otp_send_failed',
    };
  }
}

export async function verifyFarmerPhoneOtp(
  phoneInput: string,
  code: string,
): Promise<PhoneOtpVerifyResult> {
  const phone = normalizePhoneForOtp(phoneInput);
  const token = code.trim();
  if (!phone) {
    return { ok: false, message: 'phone_otp_invalid_number' };
  }
  if (!/^\d{4,8}$/.test(token)) {
    return { ok: false, message: 'phone_otp_invalid_code' };
  }

  try {
    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) {
      return { ok: false, message: error.message || 'phone_otp_verify_failed' };
    }
    if (!data.session) {
      return { ok: false, message: 'phone_otp_verify_failed' };
    }
    return { ok: true, session: data.session };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'phone_otp_verify_failed',
    };
  }
}
