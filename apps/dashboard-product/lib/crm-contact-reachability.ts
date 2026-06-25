const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeContactEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !EMAIL_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

export function normalizeFarmerPhoneE164(phone: string): string | null {
  const trimmed = phone.trim();
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

export function validateFarmerContactDraft(input: {
  email: string;
  phone: string;
  phoneOnlyNoEmail: boolean;
}): { email: string | null; phone: string | null; error: string | null } {
  const email = input.phoneOnlyNoEmail ? null : normalizeContactEmail(input.email);
  const phone = normalizeFarmerPhoneE164(input.phone);

  if (email) {
    return { email, phone, error: null };
  }

  if (input.phoneOnlyNoEmail) {
    if (!phone) {
      return {
        email: null,
        phone: null,
        error: 'Enter a valid phone number with country code (e.g. +233…).',
      };
    }
    return { email: null, phone, error: null };
  }

  if (!normalizeContactEmail(input.email)) {
    return {
      email: null,
      phone: null,
      error: 'Enter a valid email or enable phone-only outreach.',
    };
  }

  return { email: null, phone: null, error: 'Enter a valid email or enable phone-only outreach.' };
}
