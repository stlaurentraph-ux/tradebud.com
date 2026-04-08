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

const INITIAL_ORGANIZATIONS: AdminOrganization[] = [
  {
    id: 'org_001',
    name: 'Rwanda Coffee Cooperative',
    type: 'COOPERATIVE',
    country: 'RW',
    status: 'ACTIVE',
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'org_002',
    name: 'EU Coffee Importers GmbH',
    type: 'IMPORTER',
    country: 'DE',
    status: 'ACTIVE',
    created_at: '2024-02-10T00:00:00Z',
  },
  {
    id: 'org_003',
    name: 'Brazil Export Co.',
    type: 'EXPORTER',
    country: 'BR',
    status: 'ACTIVE',
    created_at: '2024-03-05T00:00:00Z',
  },
];

const INITIAL_USERS: AdminUser[] = [
  {
    id: 'usr_001',
    name: 'Maria Santos',
    email: 'maria@example.com',
    organisation_id: 'org_003',
    roles: ['exporter'],
    status: 'ACTIVE',
    invited_at: '2024-03-06T00:00:00Z',
    last_login_at: '2024-06-22T08:00:00Z',
  },
  {
    id: 'usr_002',
    name: 'Jean-Baptiste Niyonzima',
    email: 'jb@example.com',
    organisation_id: 'org_001',
    roles: ['cooperative'],
    status: 'ACTIVE',
    invited_at: '2024-01-16T00:00:00Z',
    last_login_at: '2024-06-21T11:00:00Z',
  },
  {
    id: 'usr_003',
    name: 'Klaus Mueller',
    email: 'klaus@example.com',
    organisation_id: 'org_002',
    roles: ['importer'],
    status: 'ACTIVE',
    invited_at: '2024-02-11T00:00:00Z',
    last_login_at: '2024-06-20T17:00:00Z',
  },
];

let organizations: AdminOrganization[] = INITIAL_ORGANIZATIONS.map((org) => ({ ...org }));
let users: AdminUser[] = INITIAL_USERS.map((user) => ({ ...user, roles: [...user.roles] }));

const listeners = new Set<AdminListener>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  organizations = INITIAL_ORGANIZATIONS.map((org) => ({ ...org }));
  users = INITIAL_USERS.map((user) => ({ ...user, roles: [...user.roles] }));
  emitUpdate();
}

export function seedFirstCustomerTenants(): void {
  const now = new Date().toISOString();
  organizations = [
    {
      id: 'org_demo_coop',
      name: 'Kivu Producers Cooperative',
      type: 'COOPERATIVE',
      country: 'RW',
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'org_demo_exporter',
      name: 'Great Lakes Exporters',
      type: 'EXPORTER',
      country: 'RW',
      status: 'ACTIVE',
      created_at: now,
    },
    {
      id: 'org_demo_importer',
      name: 'EU Green Bean Imports',
      type: 'IMPORTER',
      country: 'DE',
      status: 'ACTIVE',
      created_at: now,
    },
  ];

  users = [
    {
      id: 'usr_demo_coop',
      name: 'Cooperative Lead',
      email: 'coop.lead@demo.tracebud',
      organisation_id: 'org_demo_coop',
      roles: ['cooperative'],
      status: 'ACTIVE',
      invited_at: now,
      last_login_at: now,
    },
    {
      id: 'usr_demo_exporter',
      name: 'Exporter Ops',
      email: 'exporter.ops@demo.tracebud',
      organisation_id: 'org_demo_exporter',
      roles: ['exporter'],
      status: 'ACTIVE',
      invited_at: now,
      last_login_at: now,
    },
    {
      id: 'usr_demo_importer',
      name: 'Importer Compliance',
      email: 'importer.compliance@demo.tracebud',
      organisation_id: 'org_demo_importer',
      roles: ['importer'],
      status: 'ACTIVE',
      invited_at: now,
      last_login_at: now,
    },
    {
      id: 'usr_demo_field',
      name: 'Field Agent Pending',
      email: 'field.pending@demo.tracebud',
      organisation_id: 'org_demo_coop',
      roles: ['cooperative'],
      status: 'PENDING',
      invited_at: now,
    },
  ];
  emitUpdate();
}

export async function listOrganizations(): Promise<AdminOrganization[]> {
  await wait(120);
  return organizations.map((org) => ({ ...org }));
}

export async function listUsers(): Promise<AdminUser[]> {
  await wait(120);
  return users.map((user) => ({ ...user, roles: [...user.roles] }));
}

export async function createOrganization(input: {
  name: string;
  type: AdminOrgType;
  country: string;
}): Promise<AdminOrganization> {
  await wait(150);
  const org: AdminOrganization = {
    id: `org_${Date.now()}`,
    name: input.name.trim(),
    type: input.type,
    country: input.country.trim().toUpperCase(),
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  };
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
  await wait(150);
  const user: AdminUser = {
    id: `usr_${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    organisation_id: input.organisation_id,
    roles: [input.role],
    status: 'PENDING',
    invited_at: new Date().toISOString(),
  };
  users = [user, ...users];
  emitUpdate();
  return { ...user, roles: [...user.roles] };
}

export async function updateUserRole(userId: string, role: TenantRole): Promise<AdminUser> {
  await wait(120);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error('User not found.');
  users[idx] = {
    ...users[idx],
    roles: [role],
  };
  emitUpdate();
  return { ...users[idx], roles: [...users[idx].roles] };
}

export async function updateUserStatus(userId: string, status: AdminStatus): Promise<AdminUser> {
  await wait(120);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error('User not found.');
  users[idx] = {
    ...users[idx],
    status,
  };
  emitUpdate();
  return { ...users[idx], roles: [...users[idx].roles] };
}

