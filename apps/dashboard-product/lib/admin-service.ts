import type { TenantRole } from '@/types';

export type AdminOrgType = 'COOPERATIVE' | 'EXPORTER' | 'IMPORTER';
export type AdminStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export interface AdminOrganization {
  id: string;
  name: string;
  type: AdminOrgType;
  country: string;
  status: AdminStatus;
  created_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  organisation_id: string;
  roles: TenantRole[];
  status: AdminStatus;
  invited_at: string;
  last_login_at?: string;
}

type AdminListener = () => void;
let organizations: AdminOrganization[] = [];
let users: AdminUser[] = [];

const listeners = new Set<AdminListener>();

function emitUpdate(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeAdminData(listener: AdminListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAdminSnapshot() {
  return {
    organizations: organizations.map((org) => ({ ...org })),
    users: users.map((user) => ({ ...user, roles: [...user.roles] })),
  };
}

export function resetAdminData(): void {
  organizations = [];
  users = [];
  emitUpdate();
}

export function seedFirstCustomerTenants(): void {
  organizations = [];
  users = [];
  emitUpdate();
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
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : 'Admin request failed.';
    throw new Error(message);
  }
  return payload as T;
}

export async function listOrganizations(): Promise<AdminOrganization[]> {
  const orgs = await requestJson<AdminOrganization[]>('/api/admin/organizations', {
    method: 'GET',
    cache: 'no-store',
  });
  organizations = orgs.map((org) => ({ ...org }));
  emitUpdate();
  return organizations.map((org) => ({ ...org }));
}

export async function listUsers(): Promise<AdminUser[]> {
  const loadedUsers = await requestJson<AdminUser[]>('/api/admin/users', {
    method: 'GET',
    cache: 'no-store',
  });
  users = loadedUsers.map((user) => ({ ...user, roles: [...user.roles] }));
  emitUpdate();
  return users.map((user) => ({ ...user, roles: [...user.roles] }));
}

export async function createOrganization(input: {
  name: string;
  type: AdminOrgType;
  country: string;
}): Promise<AdminOrganization> {
  const org = await requestJson<AdminOrganization>('/api/admin/organizations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  organizations = [org, ...organizations];
  emitUpdate();
  return { ...org };
}

export async function inviteUser(input: {
  name: string;
  email: string;
  organisation_id: string;
  role: TenantRole;
}): Promise<AdminUser> {
  const user = await requestJson<AdminUser>('/api/admin/users/invite', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  users = [user, ...users];
  emitUpdate();
  return { ...user, roles: [...user.roles] };
}

export async function updateUserRole(userId: string, role: TenantRole): Promise<AdminUser> {
  const user = await requestJson<AdminUser>(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  const idx = users.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    users[idx] = { ...user, roles: [...user.roles] };
  } else {
    users = [{ ...user, roles: [...user.roles] }, ...users];
  }
  emitUpdate();
  return { ...user, roles: [...user.roles] };
}

export async function updateUserStatus(userId: string, status: AdminStatus): Promise<AdminUser> {
  const user = await requestJson<AdminUser>(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  const idx = users.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    users[idx] = { ...user, roles: [...user.roles] };
  } else {
    users = [{ ...user, roles: [...user.roles] }, ...users];
  }
  emitUpdate();
  return { ...user, roles: [...user.roles] };
}

