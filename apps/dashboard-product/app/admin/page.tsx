'use client';

import React, { useState } from 'react';
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
  Settings, 
  Plus, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

// Mock admin data
const mockOrganizations = [
  { id: 'org_001', name: 'Rwanda Coffee Cooperative', type: 'cooperative', users: 12, status: 'active', created: '2024-01-15' },
  { id: 'org_002', name: 'EU Coffee Importers GmbH', type: 'importer', users: 5, status: 'active', created: '2024-02-10' },
  { id: 'org_003', name: 'Brazil Export Co.', type: 'exporter', users: 8, status: 'active', created: '2024-03-05' },
  { id: 'org_004', name: 'Huye Highland Growers', type: 'cooperative', users: 15, status: 'pending', created: '2024-04-20' },
];

const mockUsers = [
  { id: 'usr_001', name: 'Maria Santos', email: 'maria@example.com', role: 'exporter_admin', org: 'Brazil Export Co.', status: 'active', lastLogin: '2024-06-22' },
  { id: 'usr_002', name: 'Jean-Baptiste Niyonzima', email: 'jb@example.com', role: 'cooperative_manager', org: 'Rwanda Coffee Cooperative', status: 'active', lastLogin: '2024-06-21' },
  { id: 'usr_003', name: 'Klaus Mueller', email: 'klaus@example.com', role: 'importer_admin', org: 'EU Coffee Importers GmbH', status: 'active', lastLogin: '2024-06-20' },
  { id: 'usr_004', name: 'Pierre Habimana', email: 'pierre@example.com', role: 'field_agent', org: 'Huye Highland Growers', status: 'pending', lastLogin: '-' },
];

const roleLabels: Record<string, string> = {
  exporter_admin: 'Exporter Admin',
  importer_admin: 'Importer Admin',
  cooperative_manager: 'Coop Manager',
  field_agent: 'Field Agent',
  country_reviewer: 'Country Reviewer',
};

const orgTypeLabels: Record<string, string> = {
  cooperative: 'Cooperative',
  exporter: 'Exporter',
  importer: 'Importer',
  government: 'Government',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  suspended: 'bg-red-500/20 text-red-400',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'organizations' | 'users' | 'roles'>('organizations');

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Admin Panel"
        description="Manage organizations, users, and system settings"
        actions={
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'organizations' ? 'Add Organization' : 'Invite User'}
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockOrganizations.length}</p>
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
                  <p className="text-2xl font-bold">{mockUsers.length}</p>
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
                  <p className="text-2xl font-bold">{mockUsers.filter(u => u.status === 'active').length}</p>
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
                  <p className="text-2xl font-bold">{mockUsers.filter(u => u.status === 'pending').length}</p>
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
                    {mockOrganizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {org.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {orgTypeLabels[org.type] || org.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{org.users}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[org.status]}`}>
                            {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(org.created).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </TableCell>
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
                    {mockUsers.map((user) => (
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
                          <Badge variant="outline" className="text-xs">
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{user.org}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[user.status]}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLogin}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </TableCell>
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
                { role: 'exporter_admin', permissions: ['packages:*', 'plots:*', 'farmers:*', 'compliance:*', 'reports:*'] },
                { role: 'importer_admin', permissions: ['packages:view', 'packages:review', 'compliance:view', 'reports:view'] },
                { role: 'cooperative_manager', permissions: ['farmers:*', 'plots:*', 'packages:view'] },
                { role: 'field_agent', permissions: ['farmers:view', 'plots:view', 'plots:create'] },
                { role: 'country_reviewer', permissions: ['packages:review', 'compliance:approve', 'reports:view'] },
              ].map((item) => (
                <div key={item.role} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="font-medium">{roleLabels[item.role] || item.role}</span>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
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
