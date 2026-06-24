import type { ProvisionalMemberInput } from '@/features/enumeration/fieldRosterTypes';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ProvisionalMemberValidationError =
  | 'name_required'
  | 'village_required'
  | 'phone_or_id_required'
  | 'invalid_email';

export function validateProvisionalMemberInput(
  input: ProvisionalMemberInput,
): ProvisionalMemberValidationError | null {
  if (!input.fullName.trim()) return 'name_required';
  if (!input.village.trim()) return 'village_required';

  const phone = input.phone?.trim() ?? '';
  const nationalId = input.nationalId?.trim() ?? '';
  if (!phone && !nationalId) return 'phone_or_id_required';

  const email = input.email?.trim() ?? '';
  if (email && !EMAIL_PATTERN.test(email)) return 'invalid_email';

  return null;
}

export function normalizeMemberPhone(phone: string): string {
  return phone.replace(/\s+/g, '').replace(/^\+/, '');
}

export function normalizeMemberEmail(email: string): string {
  return email.trim().toLowerCase();
}
