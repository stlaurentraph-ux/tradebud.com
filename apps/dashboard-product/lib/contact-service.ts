import type { ContactActivityType, ProcessingFacilitySubtype } from '@/lib/contact-activity-types';

export type ContactStatus = 'new' | 'invited' | 'engaged' | 'submitted' | 'inactive' | 'blocked';
export type {
  ContactActivityType,
  ContactActivityType as ContactType,
  ProcessingFacilitySubtype,
} from '@/lib/contact-activity-types';

export interface ContactRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  contact_type: ContactActivityType;
  processing_subtype: ProcessingFacilitySubtype | null;
  status: ContactStatus;
  country: string | null;
  tags: string[];
  consent_status: 'unknown' | 'granted' | 'revoked';
  farmer_profile_id: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.sessionStorage.getItem('tracebud_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized: please sign in again.');
    }
    if (response.status === 403) {
      throw new Error(extractApiErrorMessage(payload, response.status, 'Forbidden: your current role cannot access Contacts.'));
    }
    if (response.status === 503) {
      const message =
        payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : 'Contacts service is unavailable in this environment.';
      throw new Error(message);
    }
    throw new Error(extractApiErrorMessage(payload, response.status));
  }
  return payload as T;
}

function extractApiErrorMessage(payload: unknown, status: number, fallback?: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback ?? `Contact request failed (status ${status}).`;
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }
  if (Array.isArray(record.message)) {
    const parts = record.message.filter((part): part is string => typeof part === 'string');
    if (parts.length > 0) {
      return parts.join(' ');
    }
  }
  if (record.message && typeof record.message === 'object' && record.message !== null) {
    const nested = record.message as Record<string, unknown>;
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message;
    }
  }
  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error;
  }
  return fallback ?? `Contact request failed (status ${status}).`;
}

export async function listContacts(): Promise<ContactRecord[]> {
  return requestJson<ContactRecord[]>('/api/contacts', { method: 'GET' });
}

export async function createContact(input: {
  full_name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  contact_type?: ContactActivityType;
  processing_subtype?: ProcessingFacilitySubtype | null;
  country?: string | null;
  tags?: string[];
  consent_status?: 'unknown' | 'granted' | 'revoked';
}): Promise<ContactRecord> {
  return requestJson<ContactRecord>('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateContactStatus(id: string, status: ContactStatus): Promise<ContactRecord> {
  return requestJson<ContactRecord>(`/api/contacts/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateContact(
  id: string,
  input: {
    full_name?: string;
    email?: string;
    phone?: string | null;
    organization?: string | null;
    contact_type?: ContactActivityType;
    processing_subtype?: ProcessingFacilitySubtype | null;
    country?: string | null;
    tags?: string[];
    consent_status?: 'unknown' | 'granted' | 'revoked';
  },
): Promise<ContactRecord> {
  return requestJson<ContactRecord>(`/api/contacts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteContact(id: string): Promise<{ id: string; deleted: true }> {
  return requestJson<{ id: string; deleted: true }>(`/api/contacts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

