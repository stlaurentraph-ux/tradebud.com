const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type DigitalReachability = 'email' | 'phone' | 'desk_only';

export type FarmerReachabilityInput = {
  email?: string | null;
  phone?: string | null;
  phone_only?: boolean;
};

export type ResolvedFarmerReachability = {
  email: string | null;
  phone: string | null;
  digital_reachability: DigitalReachability;
};

export function normalizeContactEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase() ?? '';
  if (!normalized || !EMAIL_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

export function normalizeFarmerPhoneE164(phone: string | null | undefined): string | null {
  const trimmed = phone?.trim() ?? '';
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

export function resolveFarmerReachability(input: FarmerReachabilityInput): ResolvedFarmerReachability {
  const email = normalizeContactEmail(input.email);
  const phone = normalizeFarmerPhoneE164(input.phone);
  const phoneOnly = Boolean(input.phone_only);

  if (email) {
    return {
      email,
      phone,
      digital_reachability: 'email',
    };
  }

  if (phoneOnly || phone) {
    if (!phone) {
      throw new Error('A valid phone number is required when email is not provided.');
    }
    return {
      email: null,
      phone,
      digital_reachability: 'phone',
    };
  }

  return {
    email: null,
    phone: null,
    digital_reachability: 'desk_only',
  };
}

export function assertFarmerReachability(input: FarmerReachabilityInput): ResolvedFarmerReachability {
  const resolved = resolveFarmerReachability(input);
  if (resolved.digital_reachability === 'desk_only') {
    throw new Error('Farmer contacts require an email or a phone number.');
  }
  return resolved;
}

export function assertNonFarmerEmail(email: string | null | undefined): string {
  const normalized = normalizeContactEmail(email);
  if (!normalized) {
    throw new Error('Email is required for this contact type.');
  }
  return normalized;
}
