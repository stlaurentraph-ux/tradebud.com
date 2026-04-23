'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { markOnboardingAction } from '@/lib/onboarding-actions';
import { listContacts, type ContactRecord, type ContactStatus } from '@/lib/contact-service';
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
import type { RequestCampaign, RequestCampaignDecision, RequestCampaignStatus } from '@/types';
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

type CampaignWithResponses = RequestCampaign & {
  responses: { accepted: number; pending: number; expired: number };
};
type CampaignDecisionTimelineResponse = {
  campaign_id: string;
  tenant_id: string;
  last_synced_at: string | null;
  decisions: RequestCampaignDecision[];
  counts?: {
    all: number;
    accept: number;
    refuse: number;
  };
  pagination?: {
    decision: DecisionTimelineFilter;
    limit: number;
    offset: number;
    returned: number;
    has_more: boolean;
  };
};
type DecisionTimelineFilter = 'all' | 'accept' | 'refuse';
type PendingDecisionIntent = {
  campaignId: string;
  decision: 'accept' | 'refuse';
  recipientEmail?: string;
  token?: string;
  capturedAt: string;
};
type IncomingRequestItem = {
  id: string;
  campaign_id: string;
  title: string;
  from_organization: string;
  request_type: RequestCampaign['request_type'];
  due_at: string;
  status: 'pending';
};

const LOCAL_CAMPAIGNS_STORAGE_KEY = 'tracebud_local_request_campaigns_v1';
const PENDING_DECISION_INTENT_KEY = 'tracebud_pending_request_decision_intent';

const statusConfig: Record<RequestCampaignStatus, { label: string; color: string; icon: typeof Send }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500/20 text-gray-400', icon: FileText },
  QUEUED: { label: 'Queued', color: 'bg-indigo-500/20 text-indigo-400', icon: Clock },
  RUNNING: { label: 'Running', color: 'bg-blue-500/20 text-blue-400', icon: Send },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle2 },
  PARTIAL: { label: 'Partial', color: 'bg-amber-500/20 text-amber-400', icon: AlertCircle },
  EXPIRED: { label: 'Refused', color: 'bg-red-500/20 text-red-400', icon: XCircle },
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

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [manualTargets, setManualTargets] = useState<ImportedRequestTarget[]>([]);
  const [manualTargetDraft, setManualTargetDraft] = useState<ImportedRequestTarget>({
    email: '',
    fullName: '',
    organization: '',
    farmerId: '',
    plotId: '',
  });
  const [manualTargetError, setManualTargetError] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importAliasesUsed, setImportAliasesUsed] = useState<string[]>([]);
  const [lastParsedRowCount, setLastParsedRowCount] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [assessmentRequests, setAssessmentRequests] = useState<AssessmentRequest[]>([]);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [assessmentSetupNotice, setAssessmentSetupNotice] = useState<string | null>(null);
  const [sendingAssessment, setSendingAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    instructions: '',
    pathway: 'annuals' as 'annuals' | 'rice',
    farmerUserId: '',
    questionnaireDraftId: '',
    dueAt: '',
  });
  const [campaigns, setCampaigns] = useState<CampaignWithResponses[]>([]);
  const [incomingRequests] = useState<IncomingRequestItem[]>([]);
  const [savedContacts, setSavedContacts] = useState<ContactRecord[]>([]);
  const [selectedSavedContactIds, setSelectedSavedContactIds] = useState<string[]>([]);
  const [hasLoadedLocalCampaigns, setHasLoadedLocalCampaigns] = useState(false);
  const [campaignActionNotice, setCampaignActionNotice] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithResponses | null>(null);
  const [campaignDetailsOpen, setCampaignDetailsOpen] = useState(false);
  const [campaignDecisionTimeline, setCampaignDecisionTimeline] = useState<RequestCampaignDecision[]>([]);
  const [campaignDecisionSyncAt, setCampaignDecisionSyncAt] = useState<string | null>(null);
  const [campaignDecisionTimelineLoading, setCampaignDecisionTimelineLoading] = useState(false);
  const [campaignDecisionFilter, setCampaignDecisionFilter] = useState<DecisionTimelineFilter>('all');
  const [campaignDecisionTimelineVisibleCount, setCampaignDecisionTimelineVisibleCount] = useState(10);
  const [campaignDecisionCounts, setCampaignDecisionCounts] = useState<{ all: number; accept: number; refuse: number }>({
    all: 0,
    accept: 0,
    refuse: 0,
  });
  const [campaignDecisionHasMore, setCampaignDecisionHasMore] = useState(false);
  const [campaignDecisionTimelineLoadingMore, setCampaignDecisionTimelineLoadingMore] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [archivingCampaignId, setArchivingCampaignId] = useState<string | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<CampaignWithResponses | null>(null);

  const resetCampaignComposer = useCallback(() => {
    setEditingCampaignId(null);
    setNewCampaign({ title: '', description: '', request_type: 'GENERAL_EVIDENCE', due_at: '' });
    setBulkTargetsInput('');
    setImportedTargets([]);
    setManualTargets([]);
    setManualTargetDraft({
      email: '',
      fullName: '',
      organization: '',
      farmerId: '',
      plotId: '',
    });
    setManualTargetError(null);
    setImportErrors([]);
    setImportAliasesUsed([]);
    setLastParsedRowCount(0);
    setSelectedSavedContactIds([]);
  }, []);

  const openCreateCampaignDialog = useCallback(() => {
    resetCampaignComposer();
    setCreateError(null);
    setCreateSuccess(null);
    setCampaignActionNotice(null);
    setCreateDialogOpen(true);
  }, [resetCampaignComposer]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    const shouldOpenCreateCampaign = searchParams.get('openCreateCampaign') === '1';
    if (!shouldOpenCreateCampaign) return;
    openCreateCampaignDialog();
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('openCreateCampaign');
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/requests?${nextQuery}` : '/requests');
  }, [openCreateCampaignDialog, router, searchParams]);

  const handleAuthFailure = useCallback(
    (message: string) => {
      const normalized = message.toLowerCase();
      if (
        normalized.includes('invalid token') ||
        normalized.includes('jwt') ||
        normalized.includes('unauthorized') ||
        normalized.includes('forbidden')
      ) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('tracebud_token');
          sessionStorage.removeItem('tracebud_user');
        }
        setCreateError('Your session expired. Please sign in again.');
        router.push('/login');
        return true;
      }
      return false;
    },
    [router],
  );

  const loadAssessmentRequests = useCallback(async () => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      setAssessmentRequests([]);
      setAssessmentSetupNotice(null);
      return;
    }
    setAssessmentError(null);
    setAssessmentSetupNotice(null);
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
      const message =
        error instanceof Error ? error.message : 'Failed to load assessment requests.';
      if (message.includes('TB-V16-021') || message.includes('tables are not available')) {
        setAssessmentRequests([]);
        setAssessmentSetupNotice(
          'Assessment request tables are not initialized yet in this environment. Request Campaigns still work.',
        );
        return;
      }
      setAssessmentError(message);
      setAssessmentRequests([]);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void loadAssessmentRequests();
  }, [loadAssessmentRequests]);

  useEffect(() => {
    void listContacts()
      .then((contacts) => setSavedContacts(contacts))
      .catch(() => setSavedContacts([]));
  }, []);

  useEffect(() => {
    if (!createDialogOpen) return;
    if (selectedSavedContactIds.length > 0 || manualTargets.length > 0 || importedTargets.length > 0) return;
    const suggestedStatuses: ContactStatus[] = ['new', 'invited', 'engaged'];
    const suggestedIds = savedContacts
      .filter((contact) => suggestedStatuses.includes(contact.status))
      .slice(0, 8)
      .map((contact) => contact.id);
    if (suggestedIds.length > 0) {
      setSelectedSavedContactIds(suggestedIds);
    }
  }, [
    createDialogOpen,
    selectedSavedContactIds.length,
    manualTargets.length,
    importedTargets.length,
    savedContacts,
  ]);

  const loadCampaigns = useCallback(async () => {
    try {
      const response = await fetch('/api/requests/campaigns', {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to load campaigns (status ${response.status}).`);
      }
      const payload = (await response.json().catch(() => [])) as RequestCampaign[];
      if (!Array.isArray(payload)) {
        throw new Error('Unexpected campaigns response payload.');
      }
      setCampaigns(
        payload.map((campaign) => ({
          ...campaign,
          responses: {
            accepted: campaign.accepted_count ?? 0,
            pending: campaign.pending_count ?? 0,
            expired: campaign.expired_count ?? 0,
          },
        })),
      );
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          LOCAL_CAMPAIGNS_STORAGE_KEY,
          JSON.stringify(
            payload.map((campaign) => ({
              ...campaign,
              responses: {
                accepted: campaign.accepted_count ?? 0,
                pending: campaign.pending_count ?? 0,
                expired: campaign.expired_count ?? 0,
              },
            })),
          ),
        );
      }
    } catch {
      // Backend list can be unavailable in early environments; keep local fallback.
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    const campaignId = searchParams.get('campaign')?.trim() ?? '';
    const decisionRaw = searchParams.get('decision')?.trim().toLowerCase();
    const recipientEmail = searchParams.get('recipient')?.trim() ?? '';
    const token = searchParams.get('token')?.trim() ?? '';
    const decision = decisionRaw === 'accept' || decisionRaw === 'refuse' ? decisionRaw : null;
    if (!campaignId || !decision) return;
    let cancelled = false;
    void (async () => {
      try {
        const response =
          recipientEmail && token
            ? await fetch('/api/requests/campaigns/decision-intent/public', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  campaignId,
                  decision,
                  recipientEmail,
                  token,
                }),
              })
            : await fetch(`/api/requests/campaigns/${encodeURIComponent(campaignId)}/decision-intent`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...getAuthHeaders(),
                },
                body: JSON.stringify({ decision }),
              });
        if (cancelled) return;
        if (response.ok) {
          setCampaignActionNotice(
            decision === 'accept'
              ? 'Request intent recorded: accepted. Continue in Requests to complete your compliance workflow.'
              : 'Request intent recorded: refused. Continue in Requests for next compliance actions.',
          );
          await loadCampaigns();
        }
      } catch {
        // Keep existing behavior quiet; user can retry from email link.
      } finally {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete('campaign');
        nextParams.delete('decision');
        nextParams.delete('recipient');
        nextParams.delete('token');
        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `/requests?${nextQuery}` : '/requests');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAuthHeaders, loadCampaigns, router, searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawIntent = window.sessionStorage.getItem(PENDING_DECISION_INTENT_KEY);
    if (!rawIntent) return;
    let intent: PendingDecisionIntent | null = null;
    try {
      intent = JSON.parse(rawIntent) as PendingDecisionIntent;
    } catch {
      window.sessionStorage.removeItem(PENDING_DECISION_INTENT_KEY);
      return;
    }
    if (!intent?.campaignId || (intent.decision !== 'accept' && intent.decision !== 'refuse')) {
      window.sessionStorage.removeItem(PENDING_DECISION_INTENT_KEY);
      return;
    }
    void (async () => {
      try {
        const hasPublicToken = Boolean(intent.recipientEmail && intent.token);
        const headers = getAuthHeaders();
        const response = hasPublicToken
          ? await fetch('/api/requests/campaigns/decision-intent/public', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                campaignId: intent.campaignId,
                decision: intent.decision,
                recipientEmail: intent.recipientEmail,
                token: intent.token,
              }),
            })
          : headers.Authorization
            ? await fetch(`/api/requests/campaigns/${encodeURIComponent(intent.campaignId)}/decision-intent`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...headers,
                },
                body: JSON.stringify({ decision: intent.decision }),
              })
            : null;
        if (!response) return;
        if (response.ok) {
          setCampaignActionNotice(
            intent.decision === 'accept'
              ? 'Request intent recorded: accepted. Continue in Requests to complete your compliance workflow.'
              : 'Request intent recorded: refused. Continue in Requests for next compliance actions.',
          );
          window.sessionStorage.removeItem(PENDING_DECISION_INTENT_KEY);
          await loadCampaigns();
        }
      } catch {
        // Keep intent for next retry in this session.
      }
    })();
  }, [getAuthHeaders, loadCampaigns]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(LOCAL_CAMPAIGNS_STORAGE_KEY);
      if (!raw) {
        setHasLoadedLocalCampaigns(true);
        return;
      }
      const parsed = JSON.parse(raw) as CampaignWithResponses[];
      if (Array.isArray(parsed)) {
        setCampaigns(parsed);
      }
    } catch {
      // Ignore corrupt local cache and continue with empty campaigns state.
    } finally {
      setHasLoadedLocalCampaigns(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasLoadedLocalCampaigns) return;
    window.localStorage.setItem(LOCAL_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  }, [campaigns, hasLoadedLocalCampaigns]);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ? campaign.status !== 'CANCELLED' : campaign.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getDaysUntilDue = (dueAt: string) => {
    const due = new Date(dueAt);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const stats = useMemo(
    () => ({
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'RUNNING' || c.status === 'QUEUED').length,
      pendingResponses: campaigns.reduce((acc, c) => acc + c.pending_count, 0),
      completedCampaigns: campaigns.filter((c) => c.status === 'COMPLETED').length,
      expiredCampaigns: campaigns.filter((c) => c.status === 'EXPIRED').length,
      incomingRequests: incomingRequests.filter((r) => r.status === 'pending').length,
    }),
    [campaigns, incomingRequests],
  );

  const onboardingProgress = useMemo(() => {
    const contactsAdded = savedContacts.length > 0;
    const campaignSent = campaigns.some((campaign) => campaign.status !== 'DRAFT');
    const firstDecisionReceived = campaigns.some(
      (campaign) => (campaign.accepted_count ?? 0) + (campaign.expired_count ?? 0) > 0,
    );
    const completedSteps = [contactsAdded, campaignSent, firstDecisionReceived].filter(Boolean).length;
    const lastDecisionSyncTime = campaigns
      .filter((campaign) => (campaign.accepted_count ?? 0) + (campaign.expired_count ?? 0) > 0)
      .map((campaign) => campaign.updated_at)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return {
      contactsAdded,
      campaignSent,
      firstDecisionReceived,
      completedSteps,
      totalSteps: 3,
      lastDecisionSyncTime: lastDecisionSyncTime ?? null,
    };
  }, [campaigns, savedContacts]);

  useEffect(() => {
    if (!campaignDetailsOpen || !selectedCampaign?.id) {
      setCampaignDecisionTimeline([]);
      setCampaignDecisionSyncAt(null);
      setCampaignDecisionFilter('all');
      setCampaignDecisionTimelineVisibleCount(10);
      setCampaignDecisionCounts({ all: 0, accept: 0, refuse: 0 });
      setCampaignDecisionHasMore(false);
      setCampaignDecisionTimelineLoadingMore(false);
      return;
    }
  }, [campaignDetailsOpen, selectedCampaign?.id]);

  const loadCampaignDecisionTimeline = useCallback(
    async ({ reset, offset }: { reset: boolean; offset?: number }) => {
      if (!selectedCampaign?.id) return;
      const nextOffset = reset ? 0 : (offset ?? 0);
      if (reset) {
        setCampaignDecisionTimelineLoading(true);
      } else {
        setCampaignDecisionTimelineLoadingMore(true);
      }
      try {
        const params = new URLSearchParams();
        params.set('decision', campaignDecisionFilter);
        params.set('limit', '10');
        params.set('offset', String(nextOffset));
        const response = await fetch(
          `/api/requests/campaigns/${encodeURIComponent(selectedCampaign.id)}/decisions?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              ...getAuthHeaders(),
            },
            cache: 'no-store',
          },
        );
        if (!response.ok) {
          throw new Error('Failed to load campaign decision timeline.');
        }
        const payload = (await response.json().catch(() => null)) as CampaignDecisionTimelineResponse | null;
        if (!payload) return;
        const decisions = Array.isArray(payload.decisions) ? payload.decisions : [];
        setCampaignDecisionTimeline((previous) => (reset ? decisions : [...previous, ...decisions]));
        setCampaignDecisionSyncAt(payload.last_synced_at ?? null);
        setCampaignDecisionCounts(payload.counts ?? { all: 0, accept: 0, refuse: 0 });
        setCampaignDecisionHasMore(Boolean(payload.pagination?.has_more));
      } catch {
        if (reset) {
          setCampaignDecisionTimeline([]);
          setCampaignDecisionSyncAt(null);
          setCampaignDecisionCounts({ all: 0, accept: 0, refuse: 0 });
          setCampaignDecisionHasMore(false);
        }
      } finally {
        if (reset) {
          setCampaignDecisionTimelineLoading(false);
        } else {
          setCampaignDecisionTimelineLoadingMore(false);
        }
      }
    },
    [campaignDecisionFilter, getAuthHeaders, selectedCampaign?.id],
  );

  useEffect(() => {
    if (!campaignDetailsOpen || !selectedCampaign?.id) return;
    void loadCampaignDecisionTimeline({ reset: true });
  }, [campaignDetailsOpen, loadCampaignDecisionTimeline, selectedCampaign?.id]);

  const visibleDecisionTimeline = useMemo(
    () => campaignDecisionTimeline.slice(0, campaignDecisionTimelineVisibleCount),
    [campaignDecisionTimeline, campaignDecisionTimelineVisibleCount],
  );

  const handleCreateCampaign = async () => {
    setCreateError(null);
    setCreateSuccess(null);
    if (!newCampaign.title.trim() || !newCampaign.due_at.trim()) {
      setCreateError('Campaign title and due date are required.');
      return;
    }
    setIsCreatingDraft(true);
    const selectedSavedContactsTargets = savedContacts
      .filter((contact) => selectedSavedContactIds.includes(contact.id))
      .map<ImportedRequestTarget>((contact) => ({
        email: contact.email,
        fullName: contact.full_name,
        organization: contact.organization ?? undefined,
      }));
    const combinedTargets = [...importedTargets, ...manualTargets, ...selectedSavedContactsTargets].reduce<
      ImportedRequestTarget[]
    >(
      (acc, target) => {
        const email = target.email.trim().toLowerCase();
        if (!email) return acc;
        if (acc.some((existing) => existing.email.toLowerCase() === email)) return acc;
        acc.push({
          email: target.email.trim(),
          fullName: target.fullName.trim(),
          organization: target.organization?.trim() || undefined,
          farmerId: target.farmerId?.trim() || undefined,
          plotId: target.plotId?.trim() || undefined,
        });
        return acc;
      },
      [],
    );

    try {
      const sharedPayload = {
        request_type: newCampaign.request_type,
        campaign_name: newCampaign.title,
        description_template: newCampaign.description,
        due_date: newCampaign.due_at,
        targets: combinedTargets.map((target) => ({
          email: target.email,
          full_name: target.fullName,
          organization: target.organization ?? null,
          farmer_id: target.farmerId ?? null,
          plot_id: target.plotId ?? null,
        })),
      };
      const createHeaders = {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `req-campaign-${Date.now()}`,
        ...getAuthHeaders(),
      };
      let response = await fetch('/api/requests/campaigns', {
        method: editingCampaignId ? 'PATCH' : 'POST',
        headers: createHeaders,
        body: JSON.stringify({
          ...(editingCampaignId ? { campaign_id: editingCampaignId } : {}),
          ...sharedPayload,
        }),
      });
      let body = (await response.json().catch(() => ({}))) as {
        campaign_id?: string;
        campaign?: RequestCampaign;
        error?: string;
        message?: string | string[];
      };
      // Recovery path: if edit mode is stale, retry once as a clean create.
      if (
        editingCampaignId &&
        !response.ok &&
        (body.error?.includes('not found or no longer editable') ?? false)
      ) {
        setEditingCampaignId(null);
        response = await fetch('/api/requests/campaigns', {
          method: 'POST',
          headers: createHeaders,
          body: JSON.stringify(sharedPayload),
        });
        body = (await response.json().catch(() => ({}))) as {
          campaign_id?: string;
          campaign?: RequestCampaign;
          error?: string;
          message?: string | string[];
        };
      }
      if (!response.ok) {
        const backendMessage = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        throw new Error(backendMessage ?? body.error ?? 'Failed to create request campaign.');
      }
      const createdId = body.campaign_id ?? `req_${Date.now()}`;
      const nowIso = new Date().toISOString();
      const upsertedCampaign: CampaignWithResponses = body.campaign
        ? {
            ...body.campaign,
            responses: {
              accepted: body.campaign.accepted_count ?? 0,
              pending: body.campaign.pending_count ?? 0,
              expired: body.campaign.expired_count ?? 0,
            },
          }
        : {
            id: createdId,
            title: newCampaign.title,
            description: newCampaign.description,
            request_type: newCampaign.request_type,
            status: 'DRAFT',
            target_organization_ids: [],
            target_farmer_ids: [],
            target_plot_ids: [],
            target_contact_emails: combinedTargets.map((target) => target.email),
            due_at: newCampaign.due_at,
            reminder_sent_at: undefined,
            accepted_count: 0,
            pending_count: 0,
            expired_count: 0,
            responses: { accepted: 0, pending: 0, expired: 0 },
            created_by: 'current_user',
            created_at: nowIso,
            updated_at: nowIso,
          };
      setCampaigns((previous) => {
        if (editingCampaignId) {
          return previous.map((campaign) => (campaign.id === editingCampaignId ? upsertedCampaign : campaign));
        }
        return [upsertedCampaign, ...previous];
      });
      setCreateSuccess(
        editingCampaignId
          ? `Draft campaign updated (${createdId}).`
          : body.campaign_id
            ? `Draft campaign created (${body.campaign_id}).`
            : 'Draft campaign created.',
      );
      markOnboardingAction('campaign_created');
      if (combinedTargets.length > 0) {
        markOnboardingAction('contacts_uploaded');
      }
      setCreateDialogOpen(false);
      resetCampaignComposer();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create request campaign.';
      if (!handleAuthFailure(message)) {
        setCreateError(message);
      }
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleAddManualTarget = () => {
    const email = manualTargetDraft.email.trim().toLowerCase();
    const fullName = manualTargetDraft.fullName.trim();
    if (!email || !fullName) {
      setManualTargetError('Manual contact requires email and full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setManualTargetError(`Invalid email "${manualTargetDraft.email}".`);
      return;
    }
    const existsInImported = importedTargets.some((target) => target.email.toLowerCase() === email);
    const existsInManual = manualTargets.some((target) => target.email.toLowerCase() === email);
    if (existsInImported || existsInManual) {
      setManualTargetError(`Contact ${manualTargetDraft.email} already exists in target list.`);
      return;
    }
    setManualTargets((previous) => [
      ...previous,
      {
        email,
        fullName,
        organization: manualTargetDraft.organization?.trim() || undefined,
        farmerId: manualTargetDraft.farmerId?.trim() || undefined,
        plotId: manualTargetDraft.plotId?.trim() || undefined,
      },
    ]);
    setManualTargetDraft({
      email: '',
      fullName: '',
      organization: '',
      farmerId: '',
      plotId: '',
    });
    setManualTargetError(null);
  };

  const handleRemoveManualTarget = (email: string) => {
    setManualTargets((previous) => previous.filter((target) => target.email !== email));
  };

  const addSelectedSavedContacts = () => {
    if (selectedSavedContactIds.length === 0) return;
    const selectedContacts = savedContacts.filter((contact) => selectedSavedContactIds.includes(contact.id));
    setManualTargets((previous) => {
      const combined = [...previous];
      for (const contact of selectedContacts) {
        const normalized = contact.email.toLowerCase();
        const existsInManual = combined.some((target) => target.email.toLowerCase() === normalized);
        const existsInImported = importedTargets.some((target) => target.email.toLowerCase() === normalized);
        if (existsInManual || existsInImported) continue;
        combined.push({
          email: contact.email,
          fullName: contact.full_name,
          organization: contact.organization ?? undefined,
        });
      }
      return combined;
    });
    setSelectedSavedContactIds([]);
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
      markOnboardingAction('campaign_joined');
      markOnboardingAction('first_submission_synced');
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
      if (status === 'COMPLETED' || status === 'SUBMITTED') {
        markOnboardingAction('campaign_joined');
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

  const openCampaignDetails = (campaign: CampaignWithResponses) => {
    setSelectedCampaign(campaign);
    setCampaignDetailsOpen(true);
    setCampaignActionNotice(null);
  };

  const openCampaignResponses = (campaign: CampaignWithResponses) => {
    setSelectedCampaign(campaign);
    setCampaignDetailsOpen(true);
    setCampaignActionNotice(
      `Response summary: ${campaign.accepted_count} accepted, ${campaign.pending_count} pending, ${campaign.expired_count} refused.`,
    );
  };

  const handleEditDraftCampaign = (campaign: CampaignWithResponses) => {
    setEditingCampaignId(campaign.id);
    setNewCampaign({
      title: campaign.title,
      description: campaign.description,
      request_type: campaign.request_type,
      due_at: campaign.due_at.slice(0, 10),
    });
    setBulkTargetsInput('');
    setImportedTargets([]);
    setManualTargets([]);
    setManualTargetDraft({
      email: '',
      fullName: '',
      organization: '',
      farmerId: '',
      plotId: '',
    });
    setManualTargetError(null);
    setImportErrors([]);
    setImportAliasesUsed([]);
    setLastParsedRowCount(0);
    setSelectedSavedContactIds([]);
    setCampaignActionNotice(`Editing draft "${campaign.title}". Update fields and save.`);
    setCreateDialogOpen(true);
  };

  const handleCreateFollowUpDraft = (campaign: CampaignWithResponses) => {
    setEditingCampaignId(null);
    setNewCampaign({
      title: `${campaign.title} (Follow-up)`,
      description: campaign.description,
      request_type: campaign.request_type,
      due_at: campaign.due_at.slice(0, 10),
    });
    setBulkTargetsInput('');
    setImportedTargets([]);
    setManualTargets(
      (campaign.target_contact_emails ?? []).map((email) => ({
        email,
        fullName: email.split('@')[0] || 'Recipient',
      })),
    );
    setManualTargetDraft({
      email: '',
      fullName: '',
      organization: '',
      farmerId: '',
      plotId: '',
    });
    setManualTargetError(null);
    setImportErrors([]);
    setImportAliasesUsed([]);
    setLastParsedRowCount(0);
    setSelectedSavedContactIds([]);
    setCreateError(null);
    setCreateSuccess(null);
    setCampaignActionNotice(
      `Created follow-up draft from "${campaign.title}". Add or adjust recipients, then create the draft.`,
    );
    setCreateDialogOpen(true);
  };

  const handleSendDraftCampaign = async (campaign: CampaignWithResponses) => {
    setCampaignActionNotice(null);
    setCreateError(null);
    setSendingCampaignId(campaign.id);
    try {
      const response = await fetch(`/api/requests/campaigns/${encodeURIComponent(campaign.id)}/send`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string | string[];
        campaign_id?: string;
        campaign?: RequestCampaign;
      };
      if (!response.ok) {
        const backendMessage = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
        throw new Error(backendMessage ?? payload.error ?? 'Failed to send draft campaign.');
      }
      const updatedCampaign = payload.campaign
        ? ({
            ...payload.campaign,
            responses: {
              accepted: payload.campaign.accepted_count ?? 0,
              pending: payload.campaign.pending_count ?? 0,
              expired: payload.campaign.expired_count ?? 0,
            },
          } satisfies CampaignWithResponses)
        : null;
      if (updatedCampaign) {
        setCampaigns((previous) =>
          previous.map((entry) => (entry.id === campaign.id ? updatedCampaign : entry)),
        );
      } else {
        setCampaigns((previous) =>
          previous.map((entry) =>
            entry.id === campaign.id ? { ...entry, status: 'RUNNING', updated_at: new Date().toISOString() } : entry,
          ),
        );
      }
      setCampaignActionNotice(`Campaign "${campaign.title}" sent successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send draft campaign.';
      if (!handleAuthFailure(message)) {
        setCreateError(message);
      }
    } finally {
      setSendingCampaignId(null);
    }
  };

  const requestArchiveCampaign = (campaign: CampaignWithResponses) => {
    setArchiveCandidate(campaign);
    setArchiveConfirmOpen(true);
  };

  const handleArchiveCampaign = async () => {
    const campaign = archiveCandidate;
    if (!campaign) return;
    setCampaignActionNotice(null);
    setCreateError(null);
    setArchiveConfirmOpen(false);
    setArchivingCampaignId(campaign.id);
    try {
      const response = await fetch(`/api/requests/campaigns/${encodeURIComponent(campaign.id)}/archive`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        campaign?: RequestCampaign;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to archive campaign.');
      }
      setCampaigns((previous) =>
        previous.map((entry) =>
          entry.id === campaign.id
            ? {
                ...entry,
                ...(payload.campaign ?? {}),
                status: 'CANCELLED',
                updated_at: new Date().toISOString(),
              }
            : entry,
        ),
      );
      setCampaignActionNotice(`Campaign "${campaign.title}" archived.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive campaign.';
      if (!handleAuthFailure(message)) {
        setCreateError(message);
      }
    } finally {
      setArchivingCampaignId(null);
      setArchiveCandidate(null);
    }
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
              Core workflow: request EUDR shipment evidence from external recipients and organizations
            </p>
          </div>
          <PermissionGate permission="requests:create">
            <Dialog
              open={createDialogOpen}
              onOpenChange={(open) => {
                setCreateDialogOpen(open);
                if (!open) {
                  resetCampaignComposer();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={openCreateCampaignDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] w-[95vw] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Request Campaign</DialogTitle>
                  <DialogDescription>
                    Send a request to multiple recipients or organizations
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
                        Optional columns when adding recipients now: <code>email</code>, <code>full_name</code>
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
                  <div className="space-y-2">
                    <Label>Add contacts manually (one by one)</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        placeholder="Email"
                        value={manualTargetDraft.email}
                        onChange={(e) =>
                          setManualTargetDraft((prev) => ({ ...prev, email: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="Full name"
                        value={manualTargetDraft.fullName}
                        onChange={(e) =>
                          setManualTargetDraft((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="Organization (optional)"
                        value={manualTargetDraft.organization ?? ''}
                        onChange={(e) =>
                          setManualTargetDraft((prev) => ({ ...prev, organization: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="Farmer ID (optional)"
                        value={manualTargetDraft.farmerId ?? ''}
                        onChange={(e) =>
                          setManualTargetDraft((prev) => ({ ...prev, farmerId: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="Plot ID (optional)"
                        value={manualTargetDraft.plotId ?? ''}
                        onChange={(e) =>
                          setManualTargetDraft((prev) => ({ ...prev, plotId: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleAddManualTarget}>
                        Add contact
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        You can combine CSV import and manual contacts.
                      </span>
                    </div>
                    {manualTargetError ? (
                      <div className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700">
                        {manualTargetError}
                      </div>
                    ) : null}
                    {manualTargets.length > 0 ? (
                      <div className="rounded-md border border-border p-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Manual contacts ({manualTargets.length})
                        </p>
                        <div className="space-y-1">
                          {manualTargets.map((target) => (
                            <div key={target.email} className="flex items-center justify-between gap-2 text-xs">
                              <span>
                                {target.fullName} ({target.email})
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveManualTarget(target.email)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Use saved contacts from CRM</Label>
                    <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                      {savedContacts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No saved contacts yet. Add contacts in the Contacts page first.
                        </p>
                      ) : (
                        savedContacts.slice(0, 30).map((contact) => (
                          <label key={contact.id} className="flex cursor-pointer items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={selectedSavedContactIds.includes(contact.id)}
                              onChange={(event) =>
                                setSelectedSavedContactIds((previous) =>
                                  event.target.checked
                                    ? [...previous, contact.id]
                                    : previous.filter((id) => id !== contact.id),
                                )
                              }
                            />
                            <span>
                              {contact.full_name} ({contact.email})
                            </span>
                            <Badge variant="outline" className="ml-auto">
                              {contact.status}
                            </Badge>
                          </label>
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={addSelectedSavedContacts}>
                        Add selected contacts
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Reuses your tenant contacts without re-uploading CSV. Suggested contacts are pre-selected.
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Import contacts in bulk now or create the draft first and add recipients later.
                  </p>
                </div>
                <DialogFooter>
                  {createError ? (
                    <div className="mr-auto rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {createError}
                    </div>
                  ) : null}
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={
                      isCreatingDraft
                    }
                  >
                    {isCreatingDraft
                      ? editingCampaignId
                        ? 'Saving...'
                        : 'Creating...'
                      : editingCampaignId
                        ? 'Save Draft Changes'
                        : 'Create Draft'}
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
        {assessmentSetupNotice ? (
          <Card className="border-amber-300">
            <CardContent className="p-4 text-sm text-amber-700">{assessmentSetupNotice}</CardContent>
          </Card>
        ) : null}
        {campaignActionNotice ? (
          <Card className="border-blue-300">
            <CardContent className="p-4 text-sm text-blue-700">{campaignActionNotice}</CardContent>
          </Card>
        ) : null}

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
              <CardTitle className="text-sm font-medium text-muted-foreground">Refused</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Onboarding status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Activation progress: {onboardingProgress.completedSteps}/{onboardingProgress.totalSteps} first-value
              milestones complete.
            </p>
            <div className="grid gap-2 md:grid-cols-3">
              <div className="rounded-md border border-border p-3 text-sm">
                <p className="text-xs text-muted-foreground">Contacts added</p>
                <p className="mt-1 font-medium">{onboardingProgress.contactsAdded ? 'Complete' : 'Pending'}</p>
              </div>
              <div className="rounded-md border border-border p-3 text-sm">
                <p className="text-xs text-muted-foreground">Campaign sent</p>
                <p className="mt-1 font-medium">{onboardingProgress.campaignSent ? 'Complete' : 'Pending'}</p>
              </div>
              <div className="rounded-md border border-border p-3 text-sm">
                <p className="text-xs text-muted-foreground">First decision received</p>
                <p className="mt-1 font-medium">
                  {onboardingProgress.firstDecisionReceived ? 'Complete' : 'Pending'}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Last decision sync:{' '}
              {onboardingProgress.lastDecisionSyncTime
                ? new Date(onboardingProgress.lastDecisionSyncTime).toLocaleString()
                : 'No decision synced yet.'}
            </p>
          </CardContent>
        </Card>

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
                  <option value="EXPIRED">Refused</option>
                  <option value="CANCELLED">Archived</option>
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
                const responseTotal =
                  campaign.accepted_count + campaign.pending_count + campaign.expired_count;
                const responseProgressPct =
                  responseTotal > 0 ? (campaign.accepted_count / responseTotal) * 100 : 0;
                const targetCount = (() => {
                  const emailTargets = Array.isArray(campaign.target_contact_emails)
                    ? campaign.target_contact_emails.length
                    : 0;
                  const farmerTargets = Array.isArray(campaign.target_farmer_ids)
                    ? campaign.target_farmer_ids.length
                    : 0;
                  const organizationTargets = Array.isArray(campaign.target_organization_ids)
                    ? campaign.target_organization_ids.length
                    : 0;
                  const explicitTargets = Math.max(emailTargets, farmerTargets, organizationTargets);
                  if (explicitTargets > 0) return explicitTargets;
                  return responseTotal;
                })();

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
                              {targetCount} target{targetCount === 1 ? '' : 's'}
                            </span>
                          </div>
                          {/* Response Progress */}
                          {campaign.status !== 'DRAFT' && (
                            <div className="flex items-center gap-4 pt-2">
                              <div className="flex-1 max-w-xs">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Response Progress</span>
                                  <span>
                                    {campaign.accepted_count} / {responseTotal}
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 transition-all"
                                    style={{
                                      width: `${responseProgressPct}%`,
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
                                    {campaign.expired_count} refused
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {campaign.status === 'DRAFT' && (
                            <PermissionGate permission="requests:send">
                              <Button
                                size="sm"
                                onClick={() => void handleSendDraftCampaign(campaign)}
                                disabled={sendingCampaignId === campaign.id}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                {sendingCampaignId === campaign.id ? 'Sending...' : 'Send'}
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
                              <DropdownMenuItem onSelect={() => openCampaignDetails(campaign)}>
                                View Details
                              </DropdownMenuItem>
                              {campaign.status !== 'DRAFT' ? (
                                <DropdownMenuItem onSelect={() => openCampaignResponses(campaign)}>
                                  View Responses
                                </DropdownMenuItem>
                              ) : null}
                              {campaign.status === 'DRAFT' && (
                                <DropdownMenuItem onSelect={() => handleEditDraftCampaign(campaign)}>
                                  Edit Campaign
                                </DropdownMenuItem>
                              )}
                              {campaign.status !== 'DRAFT' && (
                                <DropdownMenuItem onSelect={() => handleCreateFollowUpDraft(campaign)}>
                                  Create Follow-up Draft
                                </DropdownMenuItem>
                              )}
                              {campaign.status !== 'CANCELLED' && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  disabled={archivingCampaignId === campaign.id}
                                  onSelect={() => requestArchiveCampaign(campaign)}
                                >
                                  {archivingCampaignId === campaign.id ? 'Archiving...' : 'Archive Campaign'}
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
              {incomingRequests.map((request) => {
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

              {incomingRequests.length === 0 && (
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

        <Card>
          <CardHeader>
            <CardTitle>Optional add-on: SAI + Cool Farm Assessments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This section is optional and secondary to the core EUDR shipment request workflow above.
            </p>
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
        <Dialog open={campaignDetailsOpen} onOpenChange={setCampaignDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedCampaign?.title ?? 'Campaign details'}</DialogTitle>
              <DialogDescription>
                {selectedCampaign
                  ? `Status: ${selectedCampaign.status} · Due ${new Date(selectedCampaign.due_at).toLocaleDateString()}`
                  : 'Review campaign metadata and response progress.'}
              </DialogDescription>
            </DialogHeader>
            {selectedCampaign ? (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">{selectedCampaign.description || 'No description provided.'}</p>
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Targeted contacts</p>
                  {Array.isArray(selectedCampaign.target_contact_emails) &&
                  selectedCampaign.target_contact_emails.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedCampaign.target_contact_emails.map((email) => (
                        <Badge key={email} variant="outline">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No recipient emails were stored for this campaign. Recipient identifiers may only exist in
                      legacy target fields.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Accepted</p>
                      <p className="text-lg font-semibold">{selectedCampaign.accepted_count}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-lg font-semibold">{selectedCampaign.pending_count}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">Refused</p>
                      <p className="text-lg font-semibold">{selectedCampaign.expired_count}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Recipient decision timeline</p>
                  <p className="text-xs text-muted-foreground">
                    Last sync:{' '}
                    {campaignDecisionSyncAt
                      ? new Date(campaignDecisionSyncAt).toLocaleString()
                      : 'No decision sync recorded yet.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={campaignDecisionFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => {
                        setCampaignDecisionFilter('all');
                        setCampaignDecisionTimeline([]);
                        setCampaignDecisionTimelineVisibleCount(10);
                      }}
                    >
                      All ({campaignDecisionCounts.all})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={campaignDecisionFilter === 'accept' ? 'default' : 'outline'}
                      onClick={() => {
                        setCampaignDecisionFilter('accept');
                        setCampaignDecisionTimeline([]);
                        setCampaignDecisionTimelineVisibleCount(10);
                      }}
                    >
                      Accepted ({campaignDecisionCounts.accept})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={campaignDecisionFilter === 'refuse' ? 'default' : 'outline'}
                      onClick={() => {
                        setCampaignDecisionFilter('refuse');
                        setCampaignDecisionTimeline([]);
                        setCampaignDecisionTimelineVisibleCount(10);
                      }}
                    >
                      Refused ({campaignDecisionCounts.refuse})
                    </Button>
                  </div>
                  {campaignDecisionTimelineLoading ? (
                    <p className="text-xs text-muted-foreground">Loading recipient timeline...</p>
                  ) : campaignDecisionTimeline.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No recipient decisions recorded for this filter yet.
                    </p>
                  ) : (
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                      {visibleDecisionTimeline.map((entry) => (
                        <div key={`${entry.campaign_id}-${entry.recipient_email}`} className="rounded border p-2">
                          <p className="text-xs font-medium">{entry.recipient_email}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.decision === 'accept' ? 'Accepted' : 'Refused'} via {entry.source} at{' '}
                            {new Date(entry.decided_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {campaignDecisionHasMore ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={campaignDecisionTimelineLoadingMore}
                          onClick={() => {
                            const nextOffset = campaignDecisionTimeline.length;
                            setCampaignDecisionTimelineVisibleCount((previous) => previous + 10);
                            void loadCampaignDecisionTimeline({ reset: false, offset: nextOffset });
                          }}
                        >
                          {campaignDecisionTimelineLoadingMore ? 'Loading...' : 'Load more'}
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setCampaignDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog
          open={archiveConfirmOpen}
          onOpenChange={(open) => {
            setArchiveConfirmOpen(open);
            if (!open) setArchiveCandidate(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Archive campaign?</DialogTitle>
              <DialogDescription>
                {archiveCandidate
                  ? `This will archive "${archiveCandidate.title}" and remove it from active campaigns. You can still see it using the Archived filter.`
                  : 'This will archive the selected campaign.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setArchiveConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleArchiveCampaign()}
                disabled={!archiveCandidate || archivingCampaignId === archiveCandidate.id}
              >
                {archiveCandidate && archivingCampaignId === archiveCandidate.id ? 'Archiving...' : 'Archive'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
