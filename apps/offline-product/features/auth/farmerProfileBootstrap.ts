import type { FarmerProfile } from '@/features/state/AppStateContext';

export function isUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function createLocalFarmerId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** e.g. maria.santos@farm.co → Maria Santos */
export function deriveDisplayNameFromEmail(email: string): string | undefined {
  const local = email.trim().toLowerCase().split('@')[0]?.split('+')[0]?.trim();
  if (!local) return undefined;

  const parts = local.split(/[._-]+/).filter(Boolean);
  const words = (parts.length > 0 ? parts : [local]).map(
    (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
  );
  const name = words.join(' ').trim();
  return name.length >= 2 ? name : undefined;
}

export function resolveFarmerDisplayName(params: {
  fullName?: string;
  email?: string;
}): string | undefined {
  const explicit = params.fullName?.trim();
  if (explicit) return explicit;
  const email = params.email?.trim();
  if (!email) return undefined;
  return deriveDisplayNameFromEmail(email);
}

export function bootstrapFarmerProfile(
  existing: FarmerProfile | undefined,
  params: { name?: string; email?: string; preferredId?: string },
): FarmerProfile {
  const resolvedName = resolveFarmerDisplayName({
    fullName: params.name ?? existing?.name,
    email: params.email,
  });

  if (existing) {
    if (resolvedName && !existing.name?.trim()) {
      return { ...existing, name: resolvedName };
    }
    return existing;
  }

  const preferredId =
    params.preferredId && isUuid(params.preferredId) ? params.preferredId : createLocalFarmerId();

  return {
    id: preferredId,
    name: resolvedName,
    role: 'farmer',
    selfDeclared: false,
  };
}

export function shouldUpdateBootstrappedFarmer(
  existing: FarmerProfile | undefined,
  next: FarmerProfile,
): boolean {
  if (!existing) return true;
  if (existing.id !== next.id) return true;
  const existingName = existing.name?.trim() ?? '';
  const nextName = next.name?.trim() ?? '';
  return !existingName && Boolean(nextName);
}
