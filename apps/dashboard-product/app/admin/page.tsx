'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Shield, 
  Plus, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { AsyncState } from '@/components/common/async-state';
import type { TenantRole } from '@/types';
import type { AdminOrgType, AdminStatus } from '@/lib/admin-service';
import { createOrganization, inviteUser, updateUserRole, updateUserStatus } from '@/lib/admin-service';
import { useAdminData } from '@/lib/use-admin-data';
import { resetDemoWorkspace, seedFirstCustomerWorkspace, seedGoldenPathWorkspace } from '@/lib/demo-bootstrap';

const roleLabels: Record<TenantRole, string> = {
  exporter: 'Supplier',
  importer: 'Buyer',
  cooperative: 'Producer',
  country_reviewer: 'Reviewer',
  sponsor_org: 'Sponsor',
};

const orgTypeLabels: Record<AdminOrgType, string> = {
  COOPERATIVE: 'Producer',
  EXPORTER: 'Supplier',
  IMPORTER: 'Buyer',
};

const statusColors: Record<AdminStatus, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
};

export default function AdminPage() {
  const { organizations, users, isLoading, error, reload } = useAdminData();
  const [activeTab, setActiveTab] = useState<'organizations' | 'users' | 'roles'>('organizations');
  const [isOrgFormOpen, setIsOrgFormOpen] = useState(false);
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', type: 'COOPERATIVE' as AdminOrgType, country: 'RW' });
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    organisation_id: '',
    role: 'cooperative' as TenantRole,
  });

  const usersByOrg = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u) => map.set(u.organisation_id, (map.get(u.organisation_id) ?? 0) + 1));
    return map;
  }, [users]);

  const activeUsersCount = users.filter((u) => u.status === 'ACTIVE').length;
  const pendingUsersCount = users.filter((u) => u.status === 'PENDING').length;

  const handleCreateOrganization = async () => {
    if (!orgForm.name.trim()) return;
    try {
      await createOrganization(orgForm);
      setOrgForm({ name: '', type: 'COOPERATIVE', country: 'RW' });
      setIsOrgFormOpen(false);
      toast.success('Organization created.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization.');
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.organisation_id) return;
    try {
      await inviteUser(inviteForm);
      setInviteForm({ name: '', email: '', organisation_id: '', role: 'cooperative' });
      setIsInviteFormOpen(false);
      toast.success('User invited.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite user.');
    }
  };

  const handleRoleChange = async (userId: string, role: TenantRole) => {
    try {
      await updateUserRole(userId, role);
      toast.success('Role updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role.');
    }
  };

  const handleStatusChange = async (userId: string, status: AdminStatus) => {
    try {
      await updateUserStatus(userId, status);
      toast.success('User status updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user status.');
    }
  };

  const handleSeedWorkspace = async () => {
    await seedFirstCustomerWorkspace();
    toast.success('Seeded first-customer demo workspace.');
  };

  const handleResetWorkspace = async () => {
    await resetDemoWorkspace();
    toast.success('Reset demo workspace to baseline.');
  };

  const handleSeedGoldenPath = async () => {
    await seedGoldenPathWorkspace();
    toast.success('Seeded golden-path demo scenario.');
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Admin Panel"
        subtitle="Manage organizations, user invitations, and role assignments"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/founder-os">Founder OS</Link>
            </Button>
            <Button
              size="sm"
              onClick={() => (activeTab === 'organizations' ? setIsOrgFormOpen((v) => !v) : setIsInviteFormOpen((v) => !v))}
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'organizations' ? 'Add Organization' : 'Invite User'}
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { void handleSeedWorkspace(); }}>
            Seed First Customers
          </Button>
          <Button variant="outline" size="sm" onClick={() => { void handleSeedGoldenPath(); }}>
            Seed Golden Path
          </Button>
          <Button variant="outline" size="sm" onClick={() => { void handleResetWorkspace(); }}>
            Reset Demo Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{organizations.length}</p>
                  <p className="text-xs text-muted-foreground">Organizations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <Users className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeUsersCount}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingUsersCount}</p>
                  <p className="text-xs text-muted-foreground">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('organizations')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'organizations'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Organizations
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'roles'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Roles & Permissions
          </button>
        </div>

        {/* Organizations Table */}
        {activeTab === 'organizations' && (
          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>Manage tenant organizations in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {isOrgFormOpen && (
                <div className="mb-4 rounded-lg border p-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <input
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder="Organization name"
                      value={orgForm.name}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <select
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      value={orgForm.type}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, type: e.target.value as AdminOrgType }))}
                    >
                      {Object.keys(orgTypeLabels).map((type) => (
                        <option key={type} value={type}>
                          {orgTypeLabels[type as AdminOrgType]}
                        </option>
                      ))}
                    </select>
                    <input
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder="Country code"
                      value={orgForm.country}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, country: e.target.value }))}
                    />
                    <Button onClick={handleCreateOrganization}>Create</Button>
                  </div>
                </div>
              )}

              {error ? (
                <div className="mb-4">
                  <AsyncState mode="error" title="Failed to load organizations" description={error} onRetry={reload} />
                </div>
              ) : null}

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          Loading organizations...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {org.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {orgTypeLabels[org.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>{usersByOrg.get(org.id) ?? 0}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[org.status]}`}>
                            {org.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(org.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user accounts and access</CardDescription>
            </CardHeader>
            <CardContent>
              {isInviteFormOpen && (
                <div className="mb-4 rounded-lg border p-4">
                  <div className="grid gap-3 md:grid-cols-5">
                    <input
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder="Full name"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <input
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder="Email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    <select
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      value={inviteForm.organisation_id}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, organisation_id: e.target.value }))}
                    >
                      <option value="">Select organization</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value as TenantRole }))}
                    >
                      {Object.keys(roleLabels).map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role as TenantRole]}
                        </option>
                      ))}
                    </select>
                    <Button onClick={handleInviteUser}>Invite</Button>
                  </div>
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-muted-foreground">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>
                          <select
                            className="rounded-md border bg-background px-2 py-1 text-xs"
                            value={user.roles[0]}
                            onChange={(e) => void handleRoleChange(user.id, e.target.value as TenantRole)}
                          >
                            {Object.keys(roleLabels).map((role) => (
                              <option key={role} value={role}>
                                {roleLabels[role as TenantRole]}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="text-sm">
                          {organizations.find((org) => org.id === user.organisation_id)?.name ?? '-'}
                        </TableCell>
                        <TableCell>
                          <select
                            className={`rounded-md border px-2 py-1 text-xs ${statusColors[user.status]}`}
                            value={user.status}
                            onChange={(e) => void handleStatusChange(user.id, e.target.value as AdminStatus)}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PENDING">PENDING</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roles & Permissions */}
        {activeTab === 'roles' && (
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Configure role-based access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { role: 'exporter', permissions: ['packages:create', 'packages:edit', 'packages:submit_traces', 'requests:send'] },
                { role: 'importer', permissions: ['packages:view', 'compliance:view', 'reports:view', 'requests:respond'] },
                { role: 'cooperative', permissions: ['farmers:create', 'plots:create', 'requests:respond'] },
                { role: 'country_reviewer', permissions: ['compliance:approve', 'reports:view', 'roles:manual_classify'] },
                { role: 'sponsor_org', permissions: ['admin:manage_users', 'roles:manual_classify', 'audit:view', 'reports:export'] },
              ].map((item) => (
                <div key={item.role} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="font-medium">{roleLabels[item.role as TenantRole] || item.role}</span>
                    </div>
                    <Badge variant="outline">Canonical</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
