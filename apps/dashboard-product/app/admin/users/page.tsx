'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionGate } from '@/components/common/permission-gate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Search,
  MoreHorizontal,
  Mail,
  Shield,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  UserPlus,
  Edit,
  Trash2,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TenantRole } from '@/types';
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { inviteUser } from '@/lib/admin-service';
import { useAdminData } from '@/lib/use-admin-data';

interface User {
  id: string;
  name: string;
  email: string;
  role: TenantRole;
  org: string;
  status: 'active' | 'pending' | 'suspended';
  lastLogin: string;
  createdAt: string;
}

// Mock users data
const mockUsers: User[] = [
  {
    id: 'usr-001',
    name: 'Maria Rodriguez',
    email: 'maria@cocoaexports.com',
    role: 'exporter',
    org: 'Cocoa Exports Ltd',
    status: 'active',
    lastLogin: '2026-04-08T10:30:00Z',
    createdAt: '2025-06-15T09:00:00Z',
  },
  {
    id: 'usr-002',
    name: 'Carlos Mendez',
    email: 'carlos@cocoaexports.com',
    role: 'exporter',
    org: 'Cocoa Exports Ltd',
    status: 'active',
    lastLogin: '2026-04-07T16:45:00Z',
    createdAt: '2025-08-20T11:30:00Z',
  },
  {
    id: 'usr-003',
    name: 'Ana Garcia',
    email: 'ana@highland.coffee',
    role: 'cooperative',
    org: 'Highland Coffee Co',
    status: 'active',
    lastLogin: '2026-04-08T09:15:00Z',
    createdAt: '2025-09-10T14:00:00Z',
  },
  {
    id: 'usr-004',
    name: 'Klaus Mueller',
    email: 'klaus@euimports.de',
    role: 'importer',
    org: 'EU Coffee Importers GmbH',
    status: 'active',
    lastLogin: '2026-04-06T08:00:00Z',
    createdAt: '2025-07-05T10:00:00Z',
  },
  {
    id: 'usr-005',
    name: 'Jean-Baptiste Niyonzima',
    email: 'jb@rwanda-coop.rw',
    role: 'cooperative',
    org: 'Rwanda Coffee Cooperative',
    status: 'pending',
    lastLogin: '-',
    createdAt: '2026-04-05T12:00:00Z',
  },
  {
    id: 'usr-006',
    name: 'Sophie Laurent',
    email: 'sophie@review.gov.rw',
    role: 'country_reviewer',
    org: 'Rwanda National Authority',
    status: 'active',
    lastLogin: '2026-04-07T11:30:00Z',
    createdAt: '2025-11-01T09:00:00Z',
  },
  {
    id: 'usr-007',
    name: 'Pedro Santos',
    email: 'pedro@amazonprod.br',
    role: 'exporter',
    org: 'Amazon Producers Coop',
    status: 'suspended',
    lastLogin: '2026-03-15T14:00:00Z',
    createdAt: '2025-10-20T16:00:00Z',
  },
  {
    id: 'usr-008',
    name: 'Emma Thompson',
    email: 'emma@sustainsponsor.org',
    role: 'sponsor',
    org: 'Sustainable Coffee Initiative',
    status: 'active',
    lastLogin: '2026-04-08T08:00:00Z',
    createdAt: '2025-12-01T10:00:00Z',
  },
];

const ROLE_LABELS: Record<TenantRole, string> = {
  exporter: 'Exporter',
  importer: 'Importer',
  cooperative: 'Cooperative',
  country_reviewer: 'Country Reviewer',
  sponsor: 'Network Sponsor',
};

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-800',
    icon: Clock,
  },
  suspended: {
    label: 'Suspended',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
};

export default function UserManagementPage() {
  const { users: loadedUsers, organizations } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | TenantRole>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TenantRole>('exporter');
  const [inviteOrgId, setInviteOrgId] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const users = loadedUsers.length > 0 ? loadedUsers : mockUsers;

  // Filter users
  const filteredUsers = users.filter((user) => {
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (filterStatus !== 'all' && user.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.org.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    pending: users.filter((u) => u.status === 'pending').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  };

  const handleInvite = async () => {
    setInviteError(null);
    if (!inviteName.trim() || !inviteEmail.trim() || !inviteOrgId) {
      setInviteError('Name, email, role, and organization are required.');
      return;
    }
    setIsInviting(true);
    try {
      await inviteUser({
        name: inviteName,
        email: inviteEmail,
        organisation_id: inviteOrgId,
        role: inviteRole,
      });
      markOnboardingAction('team_invited');
      setShowInviteDialog(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('exporter');
      setInviteOrgId('');
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Failed to invite user.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <PermissionGate permission="admin:manage_users">
      <div className="flex flex-col">
        <AppHeader
          title="User Management"
          subtitle="Manage user accounts, roles, and access across your organization"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Admin', href: '/admin' },
            { label: 'User Management' },
          ]}
          action={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                    <DialogDescription>
                      Send an invitation email to add a new user to the organization
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={inviteName}
                        onChange={(event) => setInviteName(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={inviteRole}
                        onChange={(event) => setInviteRole(event.target.value as TenantRole)}
                      >
                        <option value="exporter">Exporter</option>
                        <option value="importer">Importer</option>
                        <option value="cooperative">Cooperative</option>
                        <option value="country_reviewer">Country Reviewer</option>
                        <option value="sponsor">Network Sponsor</option>
                      </select>
                    </div>
                    <div>
                      <Label>Organization</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={inviteOrgId}
                        onChange={(event) => setInviteOrgId(event.target.value)}
                      >
                        <option value="">Select organization</option>
                        {organizations.map((organization) => (
                          <option key={organization.id} value={organization.id}>
                            {organization.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {inviteError ? <p className="text-sm text-destructive">{inviteError}</p> : null}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => void handleInvite()}
                      disabled={isInviting}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {isInviting ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <div className="flex-1 space-y-6 p-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold mt-1">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.active}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Suspended</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{stats.suspended}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <select
                  value={filterRole}
                  onChange={(e) =>
                    setFilterRole(e.target.value as typeof filterRole)
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="exporter">Exporter</option>
                  <option value="importer">Importer</option>
                  <option value="cooperative">Cooperative</option>
                  <option value="country_reviewer">Country Reviewer</option>
                  <option value="sponsor">Network Sponsor</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as typeof filterStatus)
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRole('all');
                    setFilterStatus('all');
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                {filteredUsers.length} User{filteredUsers.length !== 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">User</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">Role</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">Organization</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">Last Login</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                          No users match the selected filters
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const statusConfig = STATUS_CONFIG[user.status];
                        const StatusIcon = statusConfig.icon;
                        return (
                          <tr key={user.id} className="border-b last:border-0 hover:bg-secondary/30">
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                  {user.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                {ROLE_LABELS[user.role]}
                              </Badge>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                {user.org}
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <Badge className={cn('text-xs gap-1', statusConfig.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="py-4 pr-4 text-sm text-muted-foreground">
                              {user.lastLogin === '-'
                                ? 'Never'
                                : new Date(user.lastLogin).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Change Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Key className="h-4 w-4 mr-2" />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {user.status === 'active' && (
                                    <DropdownMenuItem className="text-amber-600">
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Suspend User
                                    </DropdownMenuItem>
                                  )}
                                  {user.status === 'suspended' && (
                                    <DropdownMenuItem className="text-emerald-600">
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Reactivate User
                                    </DropdownMenuItem>
                                  )}
                                  {user.status === 'pending' && (
                                    <DropdownMenuItem className="text-emerald-600">
                                      <Mail className="h-4 w-4 mr-2" />
                                      Resend Invitation
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
}
