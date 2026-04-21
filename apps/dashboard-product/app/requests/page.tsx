'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface ImportedRequestTarget {
  email: string;
  fullName: string;
  organization?: string;
  farmerId?: string;
  plotId?: string;
}

type AssessmentRequestStatus =
  | 'sent'
  | 'opened'
  | 'in_progress'
  | 'submitted'
  | 'reviewed'
  | 'needs_changes'
  | 'cancelled';

type AssessmentRequest = {
  id: string;
  pathway: 'annuals' | 'rice';
  farmer_user_id: string;
  questionnaire_id?: string | null;
  status: AssessmentRequestStatus;
  title: string;
  instructions: string;
  due_at: string | null;
  updated_at: string;
};

const BULK_TARGETS_CSV_TEMPLATE = [
  'email,full_name,organization,farmer_id,plot_id',
  'jane@example.com,Jane Doe,Coop North,farmer-001,plot-001',
  'john@example.com,John Doe,Coop South,farmer-002,plot-002',
].join('\n');

function parseBulkTargetsCsv(raw: string): {
  targets: ImportedRequestTarget[];
  errors: string[];
  aliasesUsed: string[];
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { targets: [], errors: [], aliasesUsed: [] };
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { targets: [], errors: [], aliasesUsed: [] };
  }

  const splitRow = (line: string) =>
    line
      .split(',')
      .map((cell) => cell.trim().replace(/^"(.*)"$/, '$1'));

  const rawHeaderCells = splitRow(lines[0]).map((cell) => cell.toLowerCase());
  const aliasesUsed: string[] = [];
  const headerCells = rawHeaderCells.map((cell) => {
    const normalizedCell = cell.replace(/[\s-]+/g, '_');
    if (normalizedCell === 'name') {
      aliasesUsed.push('name->full_name');
      return 'full_name';
    }
    if (normalizedCell === 'email_address') {
      aliasesUsed.push('email_address->email');
      return 'email';
    }
    if (normalizedCell === 'farmerid') {
      aliasesUsed.push('farmerid->farmer_id');
      return 'farmer_id';
    }
    if (normalizedCell === 'plotid') {
      aliasesUsed.push('plotid->plot_id');
      return 'plot_id';
    }
    if (normalizedCell === 'full_name') {
      return 'full_name';
    }
    if (normalizedCell === 'farmer_id') {
      return 'farmer_id';
    }
    if (normalizedCell === 'plot_id') {
      return 'plot_id';
    }
    return cell;
  });
  const required = ['email', 'full_name'];
  const missing = required.filter((field) => !headerCells.includes(field));
  if (missing.length > 0) {
    return {
      targets: [],
      errors: [`Missing required column(s): ${missing.join(', ')}.`],
      aliasesUsed,
    };
  }

  const rowToTarget = (cells: string[]): ImportedRequestTarget | null => {
    const read = (key: string) => {
      const index = headerCells.indexOf(key);
      return index >= 0 ? (cells[index] ?? '') : '';
    };
    const email = read('email');
    const fullName = read('full_name');
    if (!email || !fullName) {
      return null;
    }
    const target: ImportedRequestTarget = {
      email,
      fullName,
    };
    const organization = read('organization');
    const farmerId = read('farmer_id');
    const plotId = read('plot_id');
    if (organization) target.organization = organization;
    if (farmerId) target.farmerId = farmerId;
    if (plotId) target.plotId = plotId;
    return target;
  };

  const targets: ImportedRequestTarget[] = [];
  const errors: string[] = [];
  const seenEmails = new Set<string>();
  for (let index = 1; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const cells = splitRow(lines[index]);
    const target = rowToTarget(cells);
    if (!target) {
      errors.push(`Row ${lineNumber}: email and full_name are required.`);
      continue;
    }
    const normalizedEmail = target.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.push(`Row ${lineNumber}: invalid email "${target.email}".`);
      continue;
    }
    if (seenEmails.has(normalizedEmail)) {
      continue;
    }
    seenEmails.add(normalizedEmail);
    targets.push(target);
  }

  return { targets, errors, aliasesUsed };
}

// Mock request campaigns
const mockCampaigns: (RequestCampaign & { responses: { accepted: number; pending: number; expired: number } })[] = [
  {
    id: 'req-001',
    title: 'Q1 2024 FPIC Documentation Update',
    description: 'Request updated Free, Prior and Informed Consent documentation from all active producers for the upcoming EUDR compliance deadline.',
    request_type: 'GENERAL_EVIDENCE',
    status: 'RUNNING',
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
    request_type: 'MISSING_PLOT_GEOMETRY',
    status: 'RUNNING',
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
    request_type: 'GENERAL_EVIDENCE',
    status: 'COMPLETED',
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
    request_type: 'CONSENT_GRANT',
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
    request_type: 'GENERAL_EVIDENCE',
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
    request_type: 'GENERAL_EVIDENCE',
    due_at: '2024-04-15T23:59:59Z',
    status: 'pending' as const,
  },
  {
    id: 'inc-002',
    campaign_id: 'req-002',
    title: 'Plot Boundary Verification - Zone A',
    from_organization: 'Café Exports Colombia',
    request_type: 'MISSING_PLOT_GEOMETRY',
    due_at: '2024-04-01T23:59:59Z',
    status: 'pending' as const,
  },
];

const statusConfig: Record<RequestCampaignStatus, { label: string; color: string; icon: typeof Send }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400', icon: FileText },
  QUEUED: { label: 'Queued', color: 'bg-indigo-500/20 text-indigo-400', icon: Clock },
  RUNNING: { label: 'Running', color: 'bg-blue-500/20 text-blue-400', icon: Send },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle2 },
  PARTIAL: { label: 'Partial', color: 'bg-amber-500/20 text-amber-400', icon: AlertCircle },
  EXPIRED: { label: 'Expired', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400', icon: XCircle },
};

const requestTypeConfig = {
  GENERAL_EVIDENCE: { label: 'General Evidence', icon: FileText, color: 'text-purple-500' },
  MISSING_PLOT_GEOMETRY: { label: 'Missing Plot Geometry', icon: MapPin, color: 'text-amber-500' },
  CONSENT_GRANT: { label: 'Consent Grant', icon: Users, color: 'text-blue-500' },
  MISSING_LAND_TITLE: { label: 'Missing Land Title', icon: FileText, color: 'text-orange-500' },
  MISSING_HARVEST_RECORD: { label: 'Missing Harvest Record', icon: FileText, color: 'text-rose-500' },
  YIELD_EVIDENCE: { label: 'Yield Evidence', icon: AlertCircle, color: 'text-yellow-500' },
  MISSING_PRODUCER_PROFILE: { label: 'Missing Producer Profile', icon: Users, color: 'text-cyan-500' },
  DDS_REFERENCE: { label: 'DDS Reference', icon: CheckCircle2, color: 'text-emerald-500' },
  OTHER: { label: 'Other', icon: FileText, color: 'text-gray-500' },
};

// Stats
const stats = {
  totalCampaigns: mockCampaigns.length,
  activeCampaigns: mockCampaigns.filter((c) => c.status === 'RUNNING' || c.status === 'QUEUED').length,
  pendingResponses: mockCampaigns.reduce((acc, c) => acc + c.pending_count, 0),
  completedCampaigns: mockCampaigns.filter((c) => c.status === 'COMPLETED').length,
  expiredCampaigns: mockCampaigns.filter((c) => c.status === 'EXPIRED').length,
  incomingRequests: mockIncomingRequests.filter((r) => r.status === 'pending').length,
};

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState('outgoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<RequestCampaignStatus | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState<{
    title: string;
    description: string;
    request_type: RequestCampaign['request_type'];
    due_at: string;
  }>({
    title: '',
    description: '',
    request_type: 'GENERAL_EVIDENCE' as const,
    due_at: '',
  });
  const [bulkTargetsInput, setBulkTargetsInput] = useState('');
  const [importedTargets, setImportedTargets] = useState<ImportedRequestTarget[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importAliasesUsed, setImportAliasesUsed] = useState<string[]>([]);
  const [lastParsedRowCount, setLastParsedRowCount] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [assessmentRequests, setAssessmentRequests] = useState<AssessmentRequest[]>([]);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [sendingAssessment, setSendingAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    instructions: '',
    pathway: 'annuals' as 'annuals' | 'rice',
    farmerUserId: '',
    questionnaireDraftId: '',
    dueAt: '',
  });

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadAssessmentRequests = useCallback(async () => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      setAssessmentRequests([]);
      return;
    }
    setAssessmentError(null);
    try {
      const response = await fetch('/api/integrations/assessments/requests', {
        cache: 'no-store',
        headers: authHeaders,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to load assessment requests.');
      }
      const body = (await response.json()) as { items?: AssessmentRequest[] };
      setAssessmentRequests(body.items ?? []);
    } catch (error) {
      setAssessmentError(error instanceof Error ? error.message : 'Failed to load assessment requests.');
      setAssessmentRequests([]);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void loadAssessmentRequests();
  }, [loadAssessmentRequests]);

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

  const handleCreateCampaign = async () => {
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreatingDraft(true);
    try {
      const response = await fetch('/api/requests/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `req-campaign-${Date.now()}`,
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          request_type: newCampaign.request_type,
          campaign_name: newCampaign.title,
          description_template: newCampaign.description,
          due_date: newCampaign.due_at,
          targets: importedTargets.map((target) => ({
            email: target.email,
            full_name: target.fullName,
            organization: target.organization ?? null,
            farmer_id: target.farmerId ?? null,
            plot_id: target.plotId ?? null,
          })),
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to create request campaign.');
      }
      const body = (await response.json().catch(() => ({}))) as { campaign_id?: string };
      setCreateSuccess(
        body.campaign_id ? `Draft campaign created (${body.campaign_id}).` : 'Draft campaign created.',
      );
      setCreateDialogOpen(false);
      setNewCampaign({ title: '', description: '', request_type: 'GENERAL_EVIDENCE', due_at: '' });
      setBulkTargetsInput('');
      setImportedTargets([]);
      setImportErrors([]);
      setImportAliasesUsed([]);
      setLastParsedRowCount(0);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create request campaign.');
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleSendAssessmentRequest = async () => {
    setAssessmentError(null);
    setSendingAssessment(true);
    try {
      const response = await fetch('/api/integrations/assessments/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: assessmentForm.title,
          instructions: assessmentForm.instructions,
          pathway: assessmentForm.pathway,
          farmerUserId: assessmentForm.farmerUserId,
          questionnaireDraftId: assessmentForm.questionnaireDraftId || null,
          dueAt: assessmentForm.dueAt || null,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to send assessment request.');
      }
      setAssessmentForm({
        title: '',
        instructions: '',
        pathway: 'annuals',
        farmerUserId: '',
        questionnaireDraftId: '',
        dueAt: '',
      });
      await loadAssessmentRequests();
    } catch (error) {
      setAssessmentError(error instanceof Error ? error.message : 'Failed to send assessment request.');
    } finally {
      setSendingAssessment(false);
    }
  };

  const handleAssessmentStatusUpdate = async (id: string, status: AssessmentRequestStatus) => {
    setAssessmentError(null);
    try {
      const response = await fetch(`/api/integrations/assessments/requests/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to update status.');
      }
      await loadAssessmentRequests();
    } catch (error) {
      setAssessmentError(error instanceof Error ? error.message : 'Failed to update status.');
    }
  };

  const handleParseTargets = () => {
    const result = parseBulkTargetsCsv(bulkTargetsInput);
    setImportedTargets(result.targets);
    setImportErrors(result.errors);
    setImportAliasesUsed(result.aliasesUsed);
    const rows = bulkTargetsInput
      .trim()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setLastParsedRowCount(rows.length > 0 ? Math.max(0, rows.length - 1) : 0);
  };

  const handleTargetsFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setBulkTargetsInput(text);
    const result = parseBulkTargetsCsv(text);
    setImportedTargets(result.targets);
    setImportErrors(result.errors);
    setImportAliasesUsed(result.aliasesUsed);
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setLastParsedRowCount(rows.length > 0 ? Math.max(0, rows.length - 1) : 0);
  };

  const handleDownloadTargetsTemplate = () => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([BULK_TARGETS_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tracebud-request-targets-template.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handlePasteSampleTargets = () => {
    setBulkTargetsInput(BULK_TARGETS_CSV_TEMPLATE);
    const result = parseBulkTargetsCsv(BULK_TARGETS_CSV_TEMPLATE);
    setImportedTargets(result.targets);
    setImportErrors(result.errors);
    setImportAliasesUsed(result.aliasesUsed);
    const rows = BULK_TARGETS_CSV_TEMPLATE
      .trim()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setLastParsedRowCount(rows.length > 0 ? Math.max(0, rows.length - 1) : 0);
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
                      aria-label="Campaign Title"
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
                          request_type: e.target.value as RequestCampaign['request_type'],
                        })
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="GENERAL_EVIDENCE">General Evidence</option>
                      <option value="MISSING_PLOT_GEOMETRY">Missing Plot Geometry</option>
                      <option value="CONSENT_GRANT">Consent Grant</option>
                      <option value="MISSING_LAND_TITLE">Missing Land Title</option>
                      <option value="MISSING_HARVEST_RECORD">Missing Harvest Record</option>
                      <option value="YIELD_EVIDENCE">Yield Evidence</option>
                      <option value="MISSING_PRODUCER_PROFILE">Missing Producer Profile</option>
                      <option value="DDS_REFERENCE">DDS Reference</option>
                      <option value="OTHER">Other</option>
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
                      aria-label="Due Date"
                      value={newCampaign.due_at}
                      onChange={(e) => setNewCampaign({ ...newCampaign, due_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bulk targets (CSV)</Label>
                    <Input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleTargetsFileUpload}
                      aria-label="Upload targets CSV"
                    />
                    <Textarea
                      placeholder={'email,full_name,organization,farmer_id,plot_id\njane@example.com,Jane Doe,Coop North,farmer-001,plot-001'}
                      aria-label="Bulk targets CSV"
                      value={bulkTargetsInput}
                      onChange={(e) => setBulkTargetsInput(e.target.value)}
                      rows={5}
                    />
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleParseTargets}>
                        Parse targets
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadTargetsTemplate}
                      >
                        Download CSV template
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handlePasteSampleTargets}
                      >
                        Paste sample CSV
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Required columns: <code>email</code>, <code>full_name</code>
                      </span>
                    </div>
                    {importErrors.length > 0 ? (
                      <div className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700">
                        {importErrors.map((error) => (
                          <p key={error}>{error}</p>
                        ))}
                      </div>
                    ) : null}
                    {importedTargets.length > 0 ? (
                      <div className="rounded-md border border-emerald-300 bg-emerald-50 p-2 text-xs text-emerald-800">
                        Parsed {importedTargets.length} unique target{importedTargets.length === 1 ? '' : 's'}.
                        <div className="mt-1 max-h-24 overflow-auto">
                          {importedTargets.slice(0, 5).map((target) => (
                            <p key={target.email}>
                              {target.fullName} ({target.email})
                            </p>
                          ))}
                          {importedTargets.length > 5 ? <p>...and {importedTargets.length - 5} more</p> : null}
                        </div>
                      </div>
                    ) : null}
                    {importAliasesUsed.length > 0 ? (
                      <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
                        Column aliases applied: {Array.from(new Set(importAliasesUsed)).join(', ')}.
                      </div>
                    ) : null}
                    {lastParsedRowCount > 0 ? (
                      <div className="rounded-md border border-slate-300 bg-slate-50 p-2 text-xs text-slate-700">
                        Parse summary: {importedTargets.length} valid / {Math.max(0, importErrors.length)} invalid excluded
                        {lastParsedRowCount !== importedTargets.length + importErrors.length
                          ? ` (${lastParsedRowCount - (importedTargets.length + importErrors.length)} duplicate email row${lastParsedRowCount - (importedTargets.length + importErrors.length) === 1 ? '' : 's'} skipped)`
                          : ''}
                        .
                      </div>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Import contacts in bulk, validate, then create draft with attached target list.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={
                      !newCampaign.title || !newCampaign.due_at || importedTargets.length === 0 || isCreatingDraft
                    }
                  >
                    {isCreatingDraft ? 'Creating...' : 'Create Draft'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PermissionGate>
        </div>

        {createSuccess ? (
          <Card className="border-emerald-300">
            <CardContent className="p-4 text-sm text-emerald-700">{createSuccess}</CardContent>
          </Card>
        ) : null}
        {createError ? (
          <Card className="border-red-300">
            <CardContent className="p-4 text-sm text-red-700">{createError}</CardContent>
          </Card>
        ) : null}
        {assessmentError ? (
          <Card className="border-red-300">
            <CardContent className="p-4 text-sm text-red-700">{assessmentError}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>SAI + Cool Farm Assessment Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-6">
              <Input
                placeholder="Assessment title"
                value={assessmentForm.title}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <Input
                placeholder="Farmer user UUID"
                value={assessmentForm.farmerUserId}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, farmerUserId: e.target.value }))}
              />
              <Input
                placeholder="Questionnaire draft UUID"
                value={assessmentForm.questionnaireDraftId}
                onChange={(e) =>
                  setAssessmentForm((prev) => ({ ...prev, questionnaireDraftId: e.target.value }))
                }
              />
              <select
                value={assessmentForm.pathway}
                onChange={(e) =>
                  setAssessmentForm((prev) => ({
                    ...prev,
                    pathway: e.target.value === 'rice' ? 'rice' : 'annuals',
                  }))
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="annuals">Annuals</option>
                <option value="rice">Rice</option>
              </select>
              <Input
                type="date"
                value={assessmentForm.dueAt}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, dueAt: e.target.value }))}
              />
              <Button
                onClick={handleSendAssessmentRequest}
                disabled={
                  sendingAssessment ||
                  !assessmentForm.title.trim() ||
                  !assessmentForm.farmerUserId.trim()
                }
              >
                {sendingAssessment ? 'Sending...' : 'Send to Farmer'}
              </Button>
            </div>
            <Textarea
              placeholder="Instructions for farmer"
              value={assessmentForm.instructions}
              onChange={(e) =>
                setAssessmentForm((prev) => ({ ...prev, instructions: e.target.value }))
              }
              rows={2}
            />
            <div className="space-y-2">
              {assessmentRequests.slice(0, 8).map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.pathway} · Farmer {request.farmer_user_id} · Updated{' '}
                      {new Date(request.updated_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Questionnaire draft: {request.questionnaire_id ?? 'not linked'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{request.status}</Badge>
                    {request.status === 'submitted' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleAssessmentStatusUpdate(request.id, 'needs_changes')}
                        >
                          Needs changes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => void handleAssessmentStatusUpdate(request.id, 'reviewed')}
                        >
                          Review complete
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
              {assessmentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assessment requests yet.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

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
                  <option value="QUEUED">Queued</option>
                  <option value="RUNNING">Running</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PARTIAL">Partial</option>
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
                const isOverdue = daysUntilDue < 0 && campaign.status === 'RUNNING';

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
                              {!isOverdue && daysUntilDue <= 7 && daysUntilDue > 0 && campaign.status === 'RUNNING' && (
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
                          {campaign.status === 'RUNNING' && campaign.pending_count > 0 && (
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
                              {campaign.status === 'RUNNING' && (
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
