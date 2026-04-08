'use client';

import { useState } from 'react';
import {
  Send,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ChevronRight,
  CalendarDays,
  Users,
  MapPin,
  FileText,
  Bell,
  MoreHorizontal,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/common/permission-gate';
import type { RequestCampaign, RequestCampaignStatus } from '@/types';
import { cn } from '@/lib/utils';

// Mock request campaigns
const mockCampaigns: (RequestCampaign & { responses: { accepted: number; pending: number; expired: number } })[] = [
  {
    id: 'req-001',
    title: 'Q1 2024 FPIC Documentation Update',
    description: 'Request updated Free, Prior and Informed Consent documentation from all active producers for the upcoming EUDR compliance deadline.',
    request_type: 'FPIC',
    status: 'SENT',
    target_organization_ids: ['org-001', 'org-002'],
    target_farmer_ids: ['farmer-001', 'farmer-002', 'farmer-003', 'farmer-004', 'farmer-005'],
    target_plot_ids: [],
    due_at: '2024-04-15T23:59:59Z',
    reminder_sent_at: '2024-03-25T10:00:00Z',
    accepted_count: 3,
    pending_count: 2,
    expired_count: 0,
    responses: { accepted: 3, pending: 2, expired: 0 },
    created_by: 'user-001',
    created_at: '2024-03-01T09:00:00Z',
    updated_at: '2024-03-25T10:00:00Z',
  },
  {
    id: 'req-002',
    title: 'Plot Boundary Verification - Zone A',
    description: 'Request GPS boundary verification for plots flagged with geometry conflicts in deforestation screening.',
    request_type: 'PLOT_UPDATE',
    status: 'SENT',
    target_organization_ids: [],
    target_farmer_ids: ['farmer-006', 'farmer-007'],
    target_plot_ids: ['plot-012', 'plot-013', 'plot-014'],
    due_at: '2024-04-01T23:59:59Z',
    reminder_sent_at: undefined,
    accepted_count: 1,
    pending_count: 2,
    expired_count: 0,
    responses: { accepted: 1, pending: 2, expired: 0 },
    created_by: 'user-001',
    created_at: '2024-03-10T14:30:00Z',
    updated_at: '2024-03-10T14:30:00Z',
  },
  {
    id: 'req-003',
    title: 'Labor Compliance Evidence Collection',
    description: 'Collect labor compliance certificates from cooperative members for annual audit requirements.',
    request_type: 'EVIDENCE',
    status: 'ACCEPTED',
    target_organization_ids: ['org-003'],
    target_farmer_ids: ['farmer-010', 'farmer-011', 'farmer-012'],
    target_plot_ids: [],
    due_at: '2024-03-20T23:59:59Z',
    reminder_sent_at: '2024-03-15T09:00:00Z',
    accepted_count: 3,
    pending_count: 0,
    expired_count: 0,
    responses: { accepted: 3, pending: 0, expired: 0 },
    created_by: 'user-002',
    created_at: '2024-02-15T11:00:00Z',
    updated_at: '2024-03-20T16:45:00Z',
  },
  {
    id: 'req-004',
    title: 'Consent Renewal - Data Processing',
    description: 'Annual renewal of data processing consent for GDPR compliance.',
    request_type: 'CONSENT',
    status: 'EXPIRED',
    target_organization_ids: [],
    target_farmer_ids: ['farmer-015', 'farmer-016', 'farmer-017', 'farmer-018'],
    target_plot_ids: [],
    due_at: '2024-02-28T23:59:59Z',
    reminder_sent_at: '2024-02-20T09:00:00Z',
    accepted_count: 2,
    pending_count: 0,
    expired_count: 2,
    responses: { accepted: 2, pending: 0, expired: 2 },
    created_by: 'user-001',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-02-28T23:59:59Z',
  },
  {
    id: 'req-005',
    title: 'New Season Evidence Collection',
    description: 'Draft request for 2024/25 season evidence collection - not yet sent.',
    request_type: 'EVIDENCE',
    status: 'DRAFT',
    target_organization_ids: [],
    target_farmer_ids: [],
    target_plot_ids: [],
    due_at: '2024-06-01T23:59:59Z',
    reminder_sent_at: undefined,
    accepted_count: 0,
    pending_count: 0,
    expired_count: 0,
    responses: { accepted: 0, pending: 0, expired: 0 },
    created_by: 'user-001',
    created_at: '2024-03-20T15:00:00Z',
    updated_at: '2024-03-20T15:00:00Z',
  },
];

// Mock incoming requests (for Tier 1 producers / responders)
const mockIncomingRequests = [
  {
    id: 'inc-001',
    campaign_id: 'req-001',
    title: 'Q1 2024 FPIC Documentation Update',
    from_organization: 'Café Exports Colombia',
    request_type: 'FPIC',
    due_at: '2024-04-15T23:59:59Z',
    status: 'pending' as const,
  },
  {
    id: 'inc-002',
    campaign_id: 'req-002',
    title: 'Plot Boundary Verification - Zone A',
    from_organization: 'Café Exports Colombia',
    request_type: 'PLOT_UPDATE',
    due_at: '2024-04-01T23:59:59Z',
    status: 'pending' as const,
  },
];

const statusConfig: Record<RequestCampaignStatus, { label: string; color: string; icon: typeof Send }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400', icon: FileText },
  SENT: { label: 'Sent', color: 'bg-blue-500/20 text-blue-400', icon: Send },
  ACCEPTED: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle2 },
  EXPIRED: { label: 'Expired', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400', icon: XCircle },
};

const requestTypeConfig = {
  EVIDENCE: { label: 'Evidence', icon: FileText, color: 'text-purple-500' },
  FPIC: { label: 'FPIC', icon: CheckCircle2, color: 'text-emerald-500' },
  CONSENT: { label: 'Consent', icon: Users, color: 'text-blue-500' },
  PLOT_UPDATE: { label: 'Plot Update', icon: MapPin, color: 'text-amber-500' },
};

// Stats
const stats = {
  totalCampaigns: mockCampaigns.length,
  activeCampaigns: mockCampaigns.filter((c) => c.status === 'SENT').length,
  pendingResponses: mockCampaigns.reduce((acc, c) => acc + c.pending_count, 0),
  completedCampaigns: mockCampaigns.filter((c) => c.status === 'ACCEPTED').length,
  expiredCampaigns: mockCampaigns.filter((c) => c.status === 'EXPIRED').length,
  incomingRequests: mockIncomingRequests.filter((r) => r.status === 'pending').length,
};

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState('outgoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<RequestCampaignStatus | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    request_type: 'EVIDENCE' as const,
    due_at: '',
  });

  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getDaysUntilDue = (dueAt: string) => {
    const due = new Date(dueAt);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleCreateCampaign = () => {
    console.log('[v0] Creating campaign:', newCampaign);
    setCreateDialogOpen(false);
    setNewCampaign({ title: '', description: '', request_type: 'EVIDENCE', due_at: '' });
  };

  return (
    <>
      <AppHeader title="Requests" />

      <div className="flex-1 space-y-6 p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Request Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage cross-org evidence requests, FPIC collection, and consent renewals
            </p>
          </div>
          <PermissionGate permission="requests:create">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Request Campaign</DialogTitle>
                  <DialogDescription>
                    Send a request to multiple producers, farmers, or organizations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Campaign Title</Label>
                    <Input
                      placeholder="e.g., Q2 2024 FPIC Collection"
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Request Type</Label>
                    <select
                      value={newCampaign.request_type}
                      onChange={(e) =>
                        setNewCampaign({
                          ...newCampaign,
                          request_type: e.target.value as 'EVIDENCE' | 'FPIC' | 'CONSENT' | 'PLOT_UPDATE',
                        })
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="EVIDENCE">Evidence Collection</option>
                      <option value="FPIC">FPIC Documentation</option>
                      <option value="CONSENT">Consent Renewal</option>
                      <option value="PLOT_UPDATE">Plot Boundary Update</option>
                    </select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe what you're requesting and why..."
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newCampaign.due_at}
                      onChange={(e) => setNewCampaign({ ...newCampaign, due_at: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    After creating, you can select specific targets (farmers, plots, organizations) before sending.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={!newCampaign.title || !newCampaign.due_at}
                  >
                    Create Draft
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PermissionGate>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
              <Send className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            </CardContent>
          </Card>

          <Card className={stats.pendingResponses > 0 ? 'border-amber-500/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Responses</CardTitle>
              <Clock className={`h-4 w-4 ${stats.pendingResponses > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.pendingResponses > 0 ? 'text-amber-600' : ''}`}>
                {stats.pendingResponses}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCampaigns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiredCampaigns}</div>
            </CardContent>
          </Card>

          <Card className={stats.incomingRequests > 0 ? 'border-blue-500/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Incoming Requests</CardTitle>
              <Inbox className={`h-4 w-4 ${stats.incomingRequests > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.incomingRequests > 0 ? 'text-blue-600' : ''}`}>
                {stats.incomingRequests}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Outgoing vs Incoming */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="outgoing" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Outgoing Campaigns
            </TabsTrigger>
            <TabsTrigger value="incoming" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Incoming Requests
              {stats.incomingRequests > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-500/20 text-blue-400">
                  {stats.incomingRequests}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Outgoing Campaigns Tab */}
          <TabsContent value="outgoing" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as RequestCampaignStatus | 'all')}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="ACCEPTED">Completed</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>

            {/* Campaign List */}
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => {
                const statusInfo = statusConfig[campaign.status];
                const typeInfo = requestTypeConfig[campaign.request_type];
                const daysUntilDue = getDaysUntilDue(campaign.due_at);
                const isOverdue = daysUntilDue < 0 && campaign.status === 'SENT';

                return (
                  <Card key={campaign.id} className={isOverdue ? 'border-red-500/50' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <typeInfo.icon className={cn('h-3 w-3', typeInfo.color)} />
                              {typeInfo.label}
                            </Badge>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {campaign.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <CalendarDays className="h-4 w-4" />
                              Due: {new Date(campaign.due_at).toLocaleDateString()}
                              {isOverdue && (
                                <Badge variant="destructive" className="ml-2">
                                  Overdue
                                </Badge>
                              )}
                              {!isOverdue && daysUntilDue <= 7 && daysUntilDue > 0 && campaign.status === 'SENT' && (
                                <Badge className="ml-2 bg-amber-500/20 text-amber-400">
                                  {daysUntilDue}d left
                                </Badge>
                              )}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {campaign.target_farmer_ids.length} farmers
                            </span>
                          </div>
                          {/* Response Progress */}
                          {campaign.status !== 'DRAFT' && (
                            <div className="flex items-center gap-4 pt-2">
                              <div className="flex-1 max-w-xs">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Response Progress</span>
                                  <span>
                                    {campaign.accepted_count} / {campaign.accepted_count + campaign.pending_count + campaign.expired_count}
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 transition-all"
                                    style={{
                                      width: `${
                                        (campaign.accepted_count /
                                          (campaign.accepted_count + campaign.pending_count + campaign.expired_count)) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1 text-emerald-500">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {campaign.accepted_count} accepted
                                </span>
                                <span className="flex items-center gap-1 text-amber-500">
                                  <Clock className="h-3 w-3" />
                                  {campaign.pending_count} pending
                                </span>
                                {campaign.expired_count > 0 && (
                                  <span className="flex items-center gap-1 text-red-500">
                                    <XCircle className="h-3 w-3" />
                                    {campaign.expired_count} expired
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {campaign.status === 'DRAFT' && (
                            <PermissionGate permission="requests:send">
                              <Button size="sm">
                                <Send className="mr-2 h-4 w-4" />
                                Send
                              </Button>
                            </PermissionGate>
                          )}
                          {campaign.status === 'SENT' && campaign.pending_count > 0 && (
                            <Button variant="outline" size="sm">
                              <Bell className="mr-2 h-4 w-4" />
                              Send Reminder
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>View Responses</DropdownMenuItem>
                              {campaign.status === 'DRAFT' && (
                                <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                              )}
                              {campaign.status === 'SENT' && (
                                <DropdownMenuItem className="text-red-600">
                                  Cancel Campaign
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredCampaigns.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Send className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No campaigns found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery || filterStatus !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Create your first request campaign to get started'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Incoming Requests Tab */}
          <TabsContent value="incoming" className="space-y-4">
            <div className="space-y-4">
              {mockIncomingRequests.map((request) => {
                const typeInfo = requestTypeConfig[request.request_type as keyof typeof requestTypeConfig];
                const daysUntilDue = getDaysUntilDue(request.due_at);

                return (
                  <Card key={request.id} className="border-blue-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-500/20 text-blue-400">Action Required</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <typeInfo.icon className={cn('h-3 w-3', typeInfo.color)} />
                              {typeInfo.label}
                            </Badge>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{request.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              From: {request.from_organization}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <CalendarDays className="h-4 w-4" />
                              Due: {new Date(request.due_at).toLocaleDateString()}
                              {daysUntilDue <= 7 && daysUntilDue > 0 && (
                                <Badge className="ml-2 bg-amber-500/20 text-amber-400">
                                  {daysUntilDue}d left
                                </Badge>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <PermissionGate permission="requests:respond">
                            <Button size="sm">
                              Respond
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {mockIncomingRequests.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No incoming requests</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You have no pending requests to respond to
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
