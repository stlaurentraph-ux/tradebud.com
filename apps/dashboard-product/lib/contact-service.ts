export type ContactStatus = 'new' | 'invited' | 'engaged' | 'submitted' | 'inactive' | 'blocked';
export type ContactType = 'exporter' | 'cooperative' | 'farmer' | 'other';

export interface ContactRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  contact_type: ContactType;
  status: ContactStatus;
  country: string | null;
  tags: string[];
  consent_status: 'unknown' | 'granted' | 'revoked';
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
      throw new Error('Forbidden: your current role cannot access Contacts.');
    }
    if (response.status === 503) {
      const message =
        payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : 'Contacts service is unavailable in this environment.';
      throw new Error(message);
    }
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Contact request failed (status ${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export async function listContacts(): Promise<ContactRecord[]> {
  return requestJson<ContactRecord[]>('/api/contacts', { method: 'GET' });
}

export async function createContact(input: {
  full_name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  contact_type?: ContactType;
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

