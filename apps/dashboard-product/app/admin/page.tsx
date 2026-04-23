'use client';

import React, { useMemo, useState } from 'react';
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
import type { TenantRole } from '@/types';
import type { AdminOrgType, AdminStatus } from '@/lib/admin-service';
import { createOrganization, inviteUser, updateUserRole, updateUserStatus } from '@/lib/admin-service';
import { buildEudrDdsSubmitSuccessMessage } from '@/lib/eudr-dds-submit-feedback';
import {
  buildEudrDdsStatusErrorMessage,
  isMalformedEudrDdsStatusPayloadError,
} from '@/lib/eudr-dds-status-feedback';
import {
  EUDR_DDS_STATUS_ERROR_FILENAME_TIMESTAMP_TOKEN,
  buildEudrDdsStatusErrorFilename,
  serializeEudrDdsStatusErrorContext,
  type EudrDdsStatusErrorContext,
} from '@/lib/eudr-dds-status-error-context';
import { validateEudrDdsStatement } from '@/lib/eudr-dds-validation';
import { buildTelemetryCsv, DIAGNOSTICS_PRESETS } from '@/lib/gated-entry-diagnostics';
import { redactSensitivePayload } from '@/lib/payload-redaction';
import { useAdminData } from '@/lib/use-admin-data';
import {
  useDashboardDiagnosticsSummary,
  useChatThreadActivityEvents,
  getTelemetryDebugCounters,
  getTelemetryDebugEnabled,
  setTelemetryDebugEnabled,
  subscribeTelemetryDebugCounters,
  useAssignmentExportEvents,
  useFilingActivityEvents,
  useGatedEntryEvents,
  useGatedEntryExportEvents,
  useRiskScoreEvents,
  useWorkflowActivityEvents,
  useWebhookDeliveryEvents,
  useWebhookRegistrationEvents,
} from '@/lib/use-gated-entry';
import { resetDemoWorkspace, seedFirstCustomerWorkspace } from '@/lib/demo-bootstrap';

const roleLabels: Record<TenantRole, string> = {
  exporter: 'Exporter',
  importer: 'Importer',
  cooperative: 'Cooperative',
  country_reviewer: 'Country Reviewer',
};

const orgTypeLabels: Record<AdminOrgType, string> = {
  COOPERATIVE: 'Cooperative',
  EXPORTER: 'Exporter',
  IMPORTER: 'Importer',
};

const statusColors: Record<AdminStatus, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
};

type EudrSamplePreset = 'import' | 'export' | 'domestic';
type LaunchFeatureKey =
  | 'dashboard_campaigns'
  | 'dashboard_compliance'
  | 'dashboard_reporting'
  | 'dashboard_exports';
type FeatureEntitlementStatus = 'enabled' | 'disabled' | 'trial';

interface LaunchFeatureEntitlement {
  tenant_id: string;
  feature_key: LaunchFeatureKey;
  entitlement_status: FeatureEntitlementStatus;
  effective_from: string;
  effective_to: string | null;
  updated_at: string;
}

const EUDR_SAMPLE_STATEMENTS: Record<EudrSamplePreset, Record<string, unknown>> = {
  import: {
    declarationType: 'import',
    referenceNumber: 'TB-DEMO-IMPORT-001',
    operator: {
      country: 'RW',
      name: 'Tracebud Import Operator',
    },
    product: {
      commodity: 'coffee',
      hsCode: '0901',
    },
  },
  export: {
    declarationType: 'export',
    referenceNumber: 'TB-DEMO-EXPORT-001',
    operator: {
      country: 'RW',
      name: 'Tracebud Export Operator',
    },
    product: {
      commodity: 'cocoa',
      hsCode: '1801',
    },
  },
  domestic: {
    declarationType: 'domestic_production',
    referenceNumber: 'TB-DEMO-DOMESTIC-001',
    operator: {
      country: 'RW',
      name: 'Tracebud Domestic Operator',
    },
    product: {
      commodity: 'rubber',
      hsCode: '4001',
    },
  },
};


export default function AdminPage() {
  const { organizations, users, isLoading, error } = useAdminData();
  const [selectedGate, setSelectedGate] = useState<'all' | 'request_campaigns' | 'annual_reporting'>('all');
  const [timeWindow, setTimeWindow] = useState<'24h' | '7d' | '30d'>('7d');
  const [telemetrySort, setTelemetrySort] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [assignmentPhaseFilter, setAssignmentPhaseFilter] = useState<'all' | 'requested' | 'succeeded' | 'failed'>('all');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [assignmentExportPage, setAssignmentExportPage] = useState(1);
  const [riskScorePhaseFilter, setRiskScorePhaseFilter] = useState<'all' | 'requested' | 'evaluated' | 'low' | 'medium' | 'high'>('all');
  const [riskScoreBandFilter, setRiskScoreBandFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [riskScorePage, setRiskScorePage] = useState(1);
  const [filingPhaseFilter, setFilingPhaseFilter] = useState<'all' | 'generation_requested' | 'generation_generated' | 'submission_requested' | 'submission_accepted' | 'submission_replayed'>('all');
  const [filingPage, setFilingPage] = useState(1);
  const [chatPhaseFilter, setChatPhaseFilter] = useState<
    'all' | 'created' | 'posted' | 'replayed' | 'resolved' | 'reopened' | 'archived'
  >('all');
  const [chatPage, setChatPage] = useState(1);
  const [workflowPhaseFilter, setWorkflowPhaseFilter] = useState<
    'all' | 'template_created' | 'stage_transitioned' | 'sla_warning' | 'sla_breached' | 'sla_escalated' | 'sla_recovered'
  >('all');
  const [workflowSlaStateFilter, setWorkflowSlaStateFilter] = useState<
    'all' | 'on_track' | 'warning' | 'breached' | 'escalated'
  >('all');
  const [workflowPage, setWorkflowPage] = useState(1);
  const [webhookPage, setWebhookPage] = useState(1);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [webhookDeliveryPage, setWebhookDeliveryPage] = useState(1);
  const [eudrStatementJson, setEudrStatementJson] = useState('{\n  "declarationType": "import",\n  "referenceNumber": "TB-DEMO-001"\n}');
  const [eudrIdempotencyKey, setEudrIdempotencyKey] = useState(`eudr_dds_${Date.now()}`);
  const [eudrSamplePreset, setEudrSamplePreset] = useState<EudrSamplePreset>('import');
  const [isEudrSubmitLoading, setIsEudrSubmitLoading] = useState(false);
  const [eudrStatusReferenceNumber, setEudrStatusReferenceNumber] = useState('TB-DEMO-IMPORT-001');
  const [isEudrStatusLoading, setIsEudrStatusLoading] = useState(false);
  const [eudrStatusResult, setEudrStatusResult] = useState<{
    referenceNumber: string;
    statusCode: number;
    payload: unknown;
    checkedAt: string;
  } | null>(null);
  const [eudrStatusHintMessage, setEudrStatusHintMessage] = useState<string | null>(null);
  const [eudrStatusLastError, setEudrStatusLastError] = useState<EudrDdsStatusErrorContext | null>(null);
  const [entitlements, setEntitlements] = useState<LaunchFeatureEntitlement[]>([]);
  const [isEntitlementsLoading, setIsEntitlementsLoading] = useState(false);
  const [isEntitlementSavingFeature, setIsEntitlementSavingFeature] = useState<LaunchFeatureKey | null>(null);
  const eudrStatusErrorFilenamePreview = eudrStatusLastError
    ? buildEudrDdsStatusErrorFilename(eudrStatusLastError.referenceNumber, EUDR_DDS_STATUS_ERROR_FILENAME_TIMESTAMP_TOKEN)
    : null;
  const redactedEudrStatusPayload = eudrStatusResult
    ? redactSensitivePayload(eudrStatusResult.payload)
    : null;
  const telemetryPageSize = 10;
  const assignmentExportPageSize = 8;
  const riskScorePageSize = 8;
  const filingPageSize = 8;
  const chatPageSize = 8;
  const workflowPageSize = 8;
  const webhookPageSize = 8;
  const webhookDeliveryPageSize = 8;
  const fromHours = timeWindow === '24h' ? 24 : timeWindow === '7d' ? 24 * 7 : 24 * 30;
  const {
    events: gatedEntryEvents,
    total: totalTelemetryEvents,
    isLoading: isTelemetryLoading,
    error: telemetryError,
    reload: reloadTelemetry,
  } = useGatedEntryEvents({
    gate: selectedGate,
    fromHours,
    page: currentPage,
    pageSize: telemetryPageSize,
    sort: telemetrySort,
  });
  const {
    summary: dashboardSummary,
    isLoading: isDashboardSummaryLoading,
    error: dashboardSummaryError,
    reload: reloadDashboardSummary,
  } = useDashboardDiagnosticsSummary({
    fromHours,
  });
  const {
    events: gatedEntryExportEvents,
    isLoading: isExportActivityLoading,
    error: exportActivityError,
    reload: reloadExportActivity,
  } = useGatedEntryExportEvents({
    fromHours,
    page: 1,
    pageSize: 5,
    sort: 'desc',
  });
  const {
    events: assignmentExportEvents,
    total: totalAssignmentExportEvents,
    isLoading: isAssignmentExportLoading,
    error: assignmentExportError,
    reload: reloadAssignmentExport,
  } = useAssignmentExportEvents({
    fromHours,
    page: assignmentExportPage,
    pageSize: assignmentExportPageSize,
    sort: 'desc',
    phase: assignmentPhaseFilter,
    status: assignmentStatusFilter,
  });
  const {
    events: riskScoreEvents,
    total: totalRiskScoreEvents,
    isLoading: isRiskScoreLoading,
    error: riskScoreError,
    reload: reloadRiskScore,
  } = useRiskScoreEvents({
    fromHours,
    page: riskScorePage,
    pageSize: riskScorePageSize,
    sort: 'desc',
    phase: riskScorePhaseFilter,
    band: riskScoreBandFilter,
  });
  const {
    events: filingEvents,
    total: totalFilingEvents,
    isLoading: isFilingLoading,
    error: filingError,
    reload: reloadFiling,
  } = useFilingActivityEvents({
    fromHours,
    page: filingPage,
    pageSize: filingPageSize,
    sort: 'desc',
    phase: filingPhaseFilter,
  });
  const {
    events: chatThreadEvents,
    total: totalChatThreadEvents,
    isLoading: isChatThreadLoading,
    error: chatThreadError,
    reload: reloadChatThreadActivity,
  } = useChatThreadActivityEvents({
    fromHours,
    page: chatPage,
    pageSize: chatPageSize,
    sort: 'desc',
    phase: chatPhaseFilter,
  });
  const {
    events: webhookEvents,
    total: totalWebhookEvents,
    isLoading: isWebhookLoading,
    error: webhookError,
    reload: reloadWebhookEvents,
  } = useWebhookRegistrationEvents({
    page: webhookPage,
    pageSize: webhookPageSize,
  });
  const {
    events: workflowEvents,
    total: totalWorkflowEvents,
    isLoading: isWorkflowLoading,
    error: workflowError,
    reload: reloadWorkflowActivity,
  } = useWorkflowActivityEvents({
    fromHours,
    page: workflowPage,
    pageSize: workflowPageSize,
    sort: 'desc',
    phase: workflowPhaseFilter,
    slaState: workflowSlaStateFilter,
  });
  const {
    events: webhookDeliveryEvents,
    total: totalWebhookDeliveryEvents,
    isLoading: isWebhookDeliveryLoading,
    error: webhookDeliveryError,
    reload: reloadWebhookDeliveryEvents,
  } = useWebhookDeliveryEvents(selectedWebhookId, {
    page: webhookDeliveryPage,
    pageSize: webhookDeliveryPageSize,
  });
  const [activeTab, setActiveTab] = useState<'organizations' | 'users' | 'roles'>('organizations');
  const [isOrgFormOpen, setIsOrgFormOpen] = useState(false);
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [isExportAllTelemetryLoading, setIsExportAllTelemetryLoading] = useState(false);
  const [isTelemetryDebugEnabled, setIsTelemetryDebugEnabledState] = useState(false);
  const [telemetryDebugCounters, setTelemetryDebugCounters] = useState(getTelemetryDebugCounters());
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
  const totalTelemetryPages = Math.max(1, Math.ceil(totalTelemetryEvents / telemetryPageSize));
  const totalAssignmentExportPages = Math.max(1, Math.ceil(totalAssignmentExportEvents / assignmentExportPageSize));
  const totalRiskScorePages = Math.max(1, Math.ceil(totalRiskScoreEvents / riskScorePageSize));
  const totalFilingPages = Math.max(1, Math.ceil(totalFilingEvents / filingPageSize));
  const totalChatPages = Math.max(1, Math.ceil(totalChatThreadEvents / chatPageSize));
  const totalWorkflowPages = Math.max(1, Math.ceil(totalWorkflowEvents / workflowPageSize));
  const totalWebhookPages = Math.max(1, Math.ceil(totalWebhookEvents / webhookPageSize));
  const totalWebhookDeliveryPages = Math.max(1, Math.ceil(totalWebhookDeliveryEvents / webhookDeliveryPageSize));

  const telemetryAuthError =
    telemetryError?.toLowerCase().includes('auth token') ||
    telemetryError?.toLowerCase().includes('forbidden') ||
    telemetryError?.toLowerCase().includes('unauthorized');

  const handleTelemetryRefresh = () => {
    setCurrentPage(1);
    setAssignmentExportPage(1);
    setRiskScorePage(1);
    setFilingPage(1);
    setChatPage(1);
    setWorkflowPage(1);
    setWebhookPage(1);
    setWebhookDeliveryPage(1);
    reloadTelemetry();
    reloadExportActivity();
    reloadAssignmentExport();
    reloadRiskScore();
    reloadFiling();
    reloadChatThreadActivity();
    reloadWorkflowActivity();
    reloadWebhookEvents();
    reloadWebhookDeliveryEvents();
    reloadDashboardSummary();
  };

  const applySummaryDrilldown = (
    target:
      | 'assignmentPhase'
      | 'assignmentStatus'
      | 'riskBand'
      | 'filingFamily'
      | 'chatPhase',
    value: string,
  ) => {
    if (target === 'assignmentPhase') {
      setAssignmentPhaseFilter(value as 'requested' | 'succeeded' | 'failed');
      setAssignmentExportPage(1);
      return;
    }
    if (target === 'assignmentStatus') {
      setAssignmentStatusFilter(value as 'active' | 'completed' | 'cancelled');
      setAssignmentExportPage(1);
      return;
    }
    if (target === 'riskBand') {
      setRiskScoreBandFilter(value as 'low' | 'medium' | 'high');
      setRiskScorePage(1);
      return;
    }
    if (target === 'filingFamily') {
      setFilingPhaseFilter(value === 'generation' ? 'generation_generated' : 'submission_accepted');
      setFilingPage(1);
      return;
    }
    setChatPhaseFilter(value as 'created' | 'posted' | 'replayed' | 'resolved' | 'reopened' | 'archived');
    setChatPage(1);
  };

  const applyTelemetryPreset = (presetId: (typeof DIAGNOSTICS_PRESETS)[number]['id']) => {
    const preset = DIAGNOSTICS_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    setSelectedGate(preset.options.gate);
    setTimeWindow(preset.options.fromHours === 24 ? '24h' : preset.options.fromHours === 24 * 30 ? '30d' : '7d');
    setTelemetrySort(preset.options.sort);
    setCurrentPage(1);
  };

  const handleTelemetryExportCsv = () => {
    if (!gatedEntryEvents.length) {
      toast.error('No telemetry rows available for export on this page.');
      return;
    }
    const csv = buildTelemetryCsv(gatedEntryEvents);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gated-entry-telemetry-page-${currentPage}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success('Telemetry CSV exported for current page.');
  };

  const handleTelemetryExportAllCsv = async () => {
    if (isExportAllTelemetryLoading) return;
    setIsExportAllTelemetryLoading(true);
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const params = new URLSearchParams();
      if (selectedGate !== 'all') params.set('gate', selectedGate);
      params.set('fromHours', String(fromHours));
      params.set('sort', telemetrySort);
      params.set('format', 'csv');
      const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to export telemetry rows.');
      }
      const csv = await response.text();
      const rowCount = csv.trim().split('\n').length - 1;
      const exportedCount = Number(response.headers.get('x-export-row-count') ?? rowCount);
      const exportedLimit = Number(response.headers.get('x-export-row-limit') ?? 0);
      const truncated = response.headers.get('x-export-truncated') === 'true';
      if (rowCount <= 0) {
        toast.error('No telemetry rows available for export for current filters.');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `gated-entry-telemetry-all-${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${exportedCount} telemetry rows.`);
      if (truncated && exportedLimit > 0) {
        toast.warning(`Export capped at ${exportedLimit} rows. Narrow filters for complete extraction.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export telemetry rows.');
    } finally {
      setIsExportAllTelemetryLoading(false);
    }
  };

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

  const handleSeedWorkspace = () => {
    seedFirstCustomerWorkspace();
    toast.success('Seeded first-customer demo workspace.');
  };

  const handleResetWorkspace = () => {
    resetDemoWorkspace();
    toast.success('Reset demo workspace to baseline.');
  };

  React.useEffect(() => {
    setIsTelemetryDebugEnabledState(getTelemetryDebugEnabled());
  }, []);

  React.useEffect(() => {
    if (!isTelemetryDebugEnabled) return;
    const unsubscribe = subscribeTelemetryDebugCounters(() => {
      setTelemetryDebugCounters(getTelemetryDebugCounters());
    });
    setTelemetryDebugCounters(getTelemetryDebugCounters());
    return () => unsubscribe();
  }, [isTelemetryDebugEnabled]);

  const handleTelemetryDebugToggle = () => {
    const next = !isTelemetryDebugEnabled;
    setTelemetryDebugEnabled(next);
    setIsTelemetryDebugEnabledState(next);
    setTelemetryDebugCounters(getTelemetryDebugCounters());
    toast.success(next ? 'Telemetry debug enabled for this session.' : 'Telemetry debug disabled.');
  };

  const handleAssignmentExportCsv = () => {
    if (!assignmentExportEvents.length) {
      toast.error('No assignment export activity rows available for current filters.');
      return;
    }
    const header = ['captured_at', 'actor', 'phase', 'status', 'from_days', 'agent_user_id', 'row_count', 'error'];
    const rows = assignmentExportEvents.map((event) => {
      const actor = event.actorLabel ?? event.payload.exportedBy ?? event.user_id ?? 'unknown';
      const phase = event.event_type.replace('plot_assignment_export_', '');
      return [
        new Date(event.timestamp).toISOString(),
        actor,
        phase,
        event.payload.status ?? '',
        String(event.payload.fromDays ?? ''),
        event.payload.agentUserId ?? '',
        String(event.payload.rowCount ?? ''),
        event.payload.error ?? '',
      ]
        .map((item) => {
          const value = String(item);
          return value.includes(',') || value.includes('"') || value.includes('\n')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `assignment-export-activity-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success('Assignment export activity CSV exported.');
  };

  const handleAssignmentExportAllCsv = async () => {
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const params = new URLSearchParams();
      params.set('eventKind', 'assignment_exports');
      params.set('format', 'csv');
      params.set('fromHours', String(fromHours));
      params.set('sort', 'desc');
      if (assignmentPhaseFilter !== 'all') params.set('phase', assignmentPhaseFilter);
      if (assignmentStatusFilter !== 'all') params.set('status', assignmentStatusFilter);
      const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to export assignment export activity.');
      }
      const csv = await response.text();
      const rowCount = csv.trim().split('\n').length - 1;
      const exportedCount = Number(response.headers.get('x-export-row-count') ?? rowCount);
      if (rowCount <= 0) {
        toast.error('No assignment export activity rows available for current filters.');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `assignment-export-activity-all-${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${exportedCount} assignment export activity rows.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export assignment export activity.');
    }
  };

  const handleRiskScoreCsv = () => {
    if (!riskScoreEvents.length) {
      toast.error('No risk score activity rows available for current filters.');
      return;
    }
    const header = ['captured_at', 'actor', 'phase', 'package_id', 'provider', 'band', 'score', 'reason_count', 'scored_at'];
    const rows = riskScoreEvents.map((event) => {
      const actor = event.actorLabel ?? event.payload.exportedBy ?? event.user_id ?? 'unknown';
      const phase = event.event_type.replace('dds_package_risk_score_', '');
      return [
        new Date(event.timestamp).toISOString(),
        actor,
        phase,
        event.payload.packageId ?? '',
        event.payload.provider ?? '',
        event.payload.band ?? '',
        String(event.payload.score ?? ''),
        String(event.payload.reasonCount ?? ''),
        event.payload.scoredAt ?? '',
      ]
        .map((item) => {
          const value = String(item);
          return value.includes(',') || value.includes('"') || value.includes('\n')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `risk-score-activity-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success('Risk score activity CSV exported.');
  };

  const handleRiskScoreAllCsv = async () => {
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const params = new URLSearchParams();
      params.set('eventKind', 'risk_scores');
      params.set('format', 'csv');
      params.set('fromHours', String(fromHours));
      params.set('sort', 'desc');
      if (riskScorePhaseFilter !== 'all') params.set('phase', riskScorePhaseFilter);
      if (riskScoreBandFilter !== 'all') params.set('band', riskScoreBandFilter);
      const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to export risk score activity.');
      }
      const csv = await response.text();
      const rowCount = csv.trim().split('\n').length - 1;
      const exportedCount = Number(response.headers.get('x-export-row-count') ?? rowCount);
      if (rowCount <= 0) {
        toast.error('No risk score activity rows available for current filters.');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `risk-score-activity-all-${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${exportedCount} risk score activity rows.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export risk score activity.');
    }
  };

  const handleFilingCsv = () => {
    if (!filingEvents.length) {
      toast.error('No filing activity rows available for current filters.');
      return;
    }
    const header = ['captured_at', 'actor', 'phase', 'package_id', 'status', 'artifact_version', 'lot_count', 'idempotency_key', 'submission_state', 'traces_reference', 'replayed', 'persisted_at', 'generated_at'];
    const rows = filingEvents.map((event) => {
      const actor = event.actorLabel ?? event.payload.exportedBy ?? event.user_id ?? 'unknown';
      const phase = event.event_type.replace('dds_package_generation_', 'generation_').replace('dds_package_submission_', 'submission_');
      return [
        new Date(event.timestamp).toISOString(),
        actor,
        phase,
        event.payload.packageId ?? '',
        event.payload.status ?? '',
        event.payload.artifactVersion ?? '',
        String(event.payload.lotCount ?? ''),
        event.payload.idempotencyKey ?? '',
        event.payload.submissionState ?? '',
        event.payload.tracesReference ?? '',
        String(event.payload.replayed ?? ''),
        event.payload.persistedAt ?? '',
        event.payload.generatedAt ?? '',
      ]
        .map((item) => {
          const value = String(item);
          return value.includes(',') || value.includes('"') || value.includes('\n')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `filing-activity-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success('Filing activity CSV exported.');
  };

  const handleFilingAllCsv = async () => {
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const params = new URLSearchParams();
      params.set('eventKind', 'filing_activity');
      params.set('format', 'csv');
      params.set('fromHours', String(fromHours));
      params.set('sort', 'desc');
      if (filingPhaseFilter !== 'all') params.set('phase', filingPhaseFilter);
      const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to export filing activity.');
      }
      const csv = await response.text();
      const rowCount = csv.trim().split('\n').length - 1;
      const exportedCount = Number(response.headers.get('x-export-row-count') ?? rowCount);
      if (rowCount <= 0) {
        toast.error('No filing activity rows available for current filters.');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `filing-activity-all-${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${exportedCount} filing activity rows.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export filing activity.');
    }
  };

  const handleEudrDdsSubmit = async () => {
    if (isEudrSubmitLoading) return;

    let statement: Record<string, unknown>;
    try {
      const parsed = JSON.parse(eudrStatementJson);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        toast.error('EUDR statement must be a JSON object.');
        return;
      }
      statement = parsed as Record<string, unknown>;
    } catch {
      toast.error('EUDR statement must be valid JSON.');
      return;
    }

    const idempotencyKey = eudrIdempotencyKey.trim();
    if (!idempotencyKey) {
      toast.error('Idempotency key is required.');
      return;
    }
    const schemaResult = validateEudrDdsStatement(statement);
    if (!schemaResult.valid) {
      toast.error(schemaResult.error);
      return;
    }

    setIsEudrSubmitLoading(true);
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const response = await fetch('/api/integrations/eudr/dds', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ statement, idempotencyKey }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        statusCode?: number;
        replayed?: boolean;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to submit EUDR DDS payload.');
      }
      toast.success(
        buildEudrDdsSubmitSuccessMessage({
          statusCode: payload.statusCode ?? response.status,
          replayed: payload.replayed,
        }),
      );
      setEudrIdempotencyKey(`eudr_dds_${Date.now()}`);
      reloadFiling();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit EUDR DDS payload.');
    } finally {
      setIsEudrSubmitLoading(false);
    }
  };

  const handleLoadSampleEudrDds = () => {
    setEudrStatementJson(JSON.stringify(EUDR_SAMPLE_STATEMENTS[eudrSamplePreset], null, 2));
    setEudrIdempotencyKey(`eudr_dds_${Date.now()}`);
    toast.success(`Loaded sample EUDR DDS payload (${eudrSamplePreset}).`);
  };

  const handleCopyEudrStatementJson = async () => {
    try {
      await navigator.clipboard.writeText(eudrStatementJson);
      toast.success('EUDR statement JSON copied to clipboard.');
    } catch {
      toast.error('Failed to copy EUDR statement JSON.');
    }
  };

  const handleEudrDdsStatusRead = async () => {
    if (isEudrStatusLoading) return;
    const referenceNumber = eudrStatusReferenceNumber.trim();
    if (!referenceNumber) {
      toast.error('Reference number is required for status read.');
      return;
    }

    setIsEudrStatusLoading(true);
    try {
      setEudrStatusHintMessage(null);
      const token = sessionStorage.getItem('tracebud_token');
      const response = await fetch(
        `/api/integrations/eudr/dds/status?referenceNumber=${encodeURIComponent(referenceNumber)}`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        statusCode?: number;
        payload?: unknown;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to read EUDR DDS status.');
      }
      setEudrStatusResult({
        referenceNumber,
        statusCode: payload.statusCode ?? response.status,
        payload: payload.payload ?? payload,
        checkedAt: new Date().toISOString(),
      });
      setEudrStatusHintMessage(null);
      setEudrStatusLastError(null);
      toast.success(`EUDR DDS status read completed (status ${payload.statusCode ?? response.status}).`);
    } catch (err) {
      setEudrStatusResult(null);
      const rawMessage = err instanceof Error ? err.message : undefined;
      const toastMessage = buildEudrDdsStatusErrorMessage({ message: rawMessage });
      setEudrStatusLastError({
        message: toastMessage,
        occurredAt: new Date().toISOString(),
        referenceNumber,
      });
      if (isMalformedEudrDdsStatusPayloadError({ message: rawMessage })) {
        setEudrStatusHintMessage(
          'Retry once after 30 seconds. If it repeats, capture this reference and escalate to integration support.',
        );
      } else {
        setEudrStatusHintMessage(null);
      }
      toast.error(toastMessage);
    } finally {
      setIsEudrStatusLoading(false);
    }
  };

  const loadLaunchEntitlements = async () => {
    setIsEntitlementsLoading(true);
    try {
      const response = await fetch('/api/launch/entitlements', {
        method: 'GET',
      });
      const payload = (await response.json().catch(() => ({ error: 'Failed to read launch entitlements.' }))) as {
        error?: string;
      } & LaunchFeatureEntitlement[];
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to read launch entitlements.');
      }
      setEntitlements(Array.isArray(payload) ? payload : []);
      toast.success('Launch entitlements loaded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to read launch entitlements.');
    } finally {
      setIsEntitlementsLoading(false);
    }
  };

  const setLaunchEntitlementStatus = async (
    feature: LaunchFeatureKey,
    entitlementStatus: FeatureEntitlementStatus,
  ) => {
    setIsEntitlementSavingFeature(feature);
    try {
      const response = await fetch('/api/launch/entitlements', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature,
          entitlementStatus,
        }),
      });
      const payload = (await response.json().catch(() => ({ error: 'Failed to update launch entitlement.' }))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to update launch entitlement.');
      }
      await loadLaunchEntitlements();
      toast.success(`Updated entitlement: ${feature} -> ${entitlementStatus}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update launch entitlement.');
    } finally {
      setIsEntitlementSavingFeature(null);
    }
  };

  const handleCopyEudrStatusPayload = async () => {
    if (!eudrStatusResult) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(redactedEudrStatusPayload, null, 2));
      toast.success('EUDR status payload copied to clipboard.');
    } catch {
      toast.error('Failed to copy EUDR status payload.');
    }
  };

  const handleCopyEudrStatusErrorContext = async () => {
    if (!eudrStatusLastError) return;
    const payload = serializeEudrDdsStatusErrorContext(eudrStatusLastError);
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success('EUDR status error context copied to clipboard.');
    } catch {
      toast.error('Failed to copy EUDR status error context.');
    }
  };

  const handleDownloadEudrStatusErrorContext = () => {
    if (!eudrStatusLastError) return;
    const payload = serializeEudrDdsStatusErrorContext(eudrStatusLastError);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = buildEudrDdsStatusErrorFilename(eudrStatusLastError.referenceNumber, String(Date.now()));
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success('EUDR status error context downloaded.');
  };

  const handleCopyEudrStatusErrorFilename = async () => {
    if (!eudrStatusErrorFilenamePreview) return;
    try {
      await navigator.clipboard.writeText(eudrStatusErrorFilenamePreview);
      toast.success('EUDR status error filename copied to clipboard.');
    } catch {
      toast.error('Failed to copy EUDR status error filename.');
    }
  };

  const handleDownloadEudrStatusPayload = () => {
    if (!eudrStatusResult) return;
    const blob = new Blob([JSON.stringify(redactedEudrStatusPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `eudr-dds-status-${eudrStatusResult.referenceNumber}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success('EUDR status payload downloaded.');
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Admin Panel"
        subtitle="Manage organizations, user invitations, and role assignments"
        actions={
          <Button
            size="sm"
            onClick={() => (activeTab === 'organizations' ? setIsOrgFormOpen((v) => !v) : setIsInviteFormOpen((v) => !v))}
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'organizations' ? 'Add Organization' : 'Invite User'}
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSeedWorkspace}>
            Seed First Customers
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetWorkspace}>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Deferred Route Gate Diagnostics</CardTitle>
              <CardDescription>
                Recent tenant-scoped gated-entry attempts captured by telemetry (`feature=mvp_gated`).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleTelemetryExportCsv}>
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleTelemetryExportAllCsv()}
                disabled={isExportAllTelemetryLoading || !dashboardSummary?.readiness.canExportDetailed}
              >
                {isExportAllTelemetryLoading ? 'Exporting all...' : 'Export All CSV'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleTelemetryRefresh}>
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleTelemetryDebugToggle}>
                {isTelemetryDebugEnabled ? 'Debug: On' : 'Debug: Off'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2">
              {DIAGNOSTICS_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTelemetryPreset(preset.id)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="mb-4 rounded-lg border p-3">
              <div className="mb-2 text-sm font-medium">Diagnostics Summary</div>
              {isDashboardSummaryLoading && <p className="text-sm text-muted-foreground">Loading diagnostics summary...</p>}
              {!isDashboardSummaryLoading && dashboardSummaryError && (
                <p className="text-sm text-destructive">{dashboardSummaryError}</p>
              )}
              {!isDashboardSummaryLoading && !dashboardSummaryError && dashboardSummary && (
                <>
                  <div className="grid gap-2 text-sm md:grid-cols-3">
                    <div>Total diagnostics: {dashboardSummary.totalDiagnostics}</div>
                    <div>Gated entry: {dashboardSummary.counters.gatedEntryAttempts}</div>
                    <div>Assignment exports: {dashboardSummary.counters.assignmentExportEvents}</div>
                    <div>Risk scores: {dashboardSummary.counters.riskScoreEvents}</div>
                    <div>Filing activity: {dashboardSummary.counters.filingActivityEvents}</div>
                    <div>Chat activity: {dashboardSummary.counters.chatActivityEvents}</div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    <div>
                      Assignment phase: req={dashboardSummary.breakdown.assignmentPhase.requested}, ok=
                      {dashboardSummary.breakdown.assignmentPhase.succeeded}, fail={dashboardSummary.breakdown.assignmentPhase.failed}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentPhase', 'requested')}>
                          Requested
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentPhase', 'succeeded')}>
                          Succeeded
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentPhase', 'failed')}>
                          Failed
                        </Button>
                      </div>
                    </div>
                    <div>
                      Assignment status: active={dashboardSummary.breakdown.assignmentStatus.active}, completed=
                      {dashboardSummary.breakdown.assignmentStatus.completed}, cancelled=
                      {dashboardSummary.breakdown.assignmentStatus.cancelled}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentStatus', 'active')}>
                          Active
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentStatus', 'completed')}>
                          Completed
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentStatus', 'cancelled')}>
                          Cancelled
                        </Button>
                      </div>
                    </div>
                    <div>
                      Risk bands: low={dashboardSummary.breakdown.riskBand.low}, medium={dashboardSummary.breakdown.riskBand.medium}, high=
                      {dashboardSummary.breakdown.riskBand.high}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('riskBand', 'low')}>
                          Low
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('riskBand', 'medium')}>
                          Medium
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('riskBand', 'high')}>
                          High
                        </Button>
                      </div>
                    </div>
                    <div>
                      Filing family: generation={dashboardSummary.breakdown.filingFamily.generation}, submission=
                      {dashboardSummary.breakdown.filingFamily.submission}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('filingFamily', 'generation')}>
                          Generation
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('filingFamily', 'submission')}>
                          Submission
                        </Button>
                      </div>
                    </div>
                    <div>
                      Chat phase: created={dashboardSummary.breakdown.chatPhase.created}, posted=
                      {dashboardSummary.breakdown.chatPhase.posted}, replayed={dashboardSummary.breakdown.chatPhase.replayed}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('chatPhase', 'created')}>
                          Created
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('chatPhase', 'posted')}>
                          Posted
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('chatPhase', 'resolved')}>
                          Resolved
                        </Button>
                      </div>
                    </div>
                    <div>
                      Readiness: {dashboardSummary.readiness.canExportDetailed ? 'export-ready' : 'no export data'}
                      {dashboardSummary.readiness.latestEventAt
                        ? ` | latest ${new Date(dashboardSummary.readiness.latestEventAt).toLocaleString()}`
                        : ''}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedGate}
                onChange={(e) => {
                  setSelectedGate(e.target.value as 'all' | 'request_campaigns' | 'annual_reporting');
                  setCurrentPage(1);
                }}
              >
                <option value="all">All gates</option>
                <option value="request_campaigns">Request campaigns</option>
                <option value="annual_reporting">Annual reporting</option>
              </select>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={timeWindow}
                onChange={(e) => {
                  setTimeWindow(e.target.value as '24h' | '7d' | '30d');
                  setCurrentPage(1);
                }}
              >
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={telemetrySort}
                onChange={(e) => {
                  setTelemetrySort(e.target.value as 'desc' | 'asc');
                  setCurrentPage(1);
                }}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
              <div className="text-sm text-muted-foreground flex items-center">
                {totalTelemetryEvents} matching event(s)
              </div>
            </div>
            {telemetryError && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {telemetryError}
              </div>
            )}
            {telemetryAuthError && (
              <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
                Telemetry auth check: current session token may be invalid for backend reads in this environment.
              </div>
            )}
            {isTelemetryDebugEnabled && (
              <div className="mb-4 rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
                Debug counters: mutationEvents={telemetryDebugCounters.mutationEvents}, debounceFlushes=
                {telemetryDebugCounters.debounceFlushes}, fetchLoads={telemetryDebugCounters.fetchLoads}
              </div>
            )}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Captured At</TableHead>
                    <TableHead>Gate</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Redirect</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTelemetryLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        Loading gated-entry telemetry...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isTelemetryLoading && totalTelemetryEvents === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        No gated-entry attempts captured for this tenant yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isTelemetryLoading &&
                    gatedEntryEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {event.payload.gate}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{event.payload.role}</TableCell>
                        <TableCell className="text-sm">{event.payload.feature}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {event.payload.redirectedPath ?? '/'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-medium">Recent Export Activity</h4>
              {exportActivityError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {exportActivityError}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exported At</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Sort</TableHead>
                      <TableHead>Truncated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isExportActivityLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          Loading export activity...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isExportActivityLoading && gatedEntryExportEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          No export activity captured for this tenant yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isExportActivityLoading &&
                      gatedEntryExportEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.actorLabel ?? event.payload.exportedBy ?? event.user_id ?? 'unknown'}
                          </TableCell>
                          <TableCell className="text-sm">{event.payload.gate}</TableCell>
                          <TableCell className="text-sm">
                            {event.payload.rowCount}/{event.payload.rowLimit}
                          </TableCell>
                          <TableCell className="text-sm">{event.payload.sort}</TableCell>
                          <TableCell className="text-sm">
                            {event.payload.truncated ? (
                              <Badge variant="outline" className="text-xs text-yellow-300 border-yellow-500/40">
                                Yes
                              </Badge>
                            ) : (
                              'No'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="mt-6">
              <div className="mb-3 rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium">Launch Feature Entitlements (Admin)</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadLaunchEntitlements()}
                    disabled={isEntitlementsLoading || isEntitlementSavingFeature !== null}
                  >
                    {isEntitlementsLoading ? 'Loading...' : 'Load entitlements'}
                  </Button>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated at</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entitlements.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground">
                            No entitlement rows loaded yet. Use the Load entitlements action.
                          </TableCell>
                        </TableRow>
                      )}
                      {entitlements.map((row) => (
                        <TableRow key={row.feature_key}>
                          <TableCell className="text-sm">{row.feature_key}</TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline">{row.entitlement_status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(row.updated_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  isEntitlementSavingFeature !== null || row.entitlement_status === 'enabled'
                                }
                                onClick={() => void setLaunchEntitlementStatus(row.feature_key, 'enabled')}
                              >
                                Enable
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  isEntitlementSavingFeature !== null || row.entitlement_status === 'trial'
                                }
                                onClick={() => void setLaunchEntitlementStatus(row.feature_key, 'trial')}
                              >
                                Trial
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  isEntitlementSavingFeature !== null || row.entitlement_status === 'disabled'
                                }
                                onClick={() => void setLaunchEntitlementStatus(row.feature_key, 'disabled')}
                              >
                                Disable
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="mb-3 rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium">EUDR DDS Submit (Operator Trigger)</h4>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-md border bg-background px-2 py-1 text-xs"
                      value={eudrSamplePreset}
                      onChange={(e) => setEudrSamplePreset(e.target.value as EudrSamplePreset)}
                      disabled={isEudrSubmitLoading}
                    >
                      <option value="import">Import sample</option>
                      <option value="export">Export sample</option>
                      <option value="domestic">Domestic sample</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={() => void handleCopyEudrStatementJson()} disabled={isEudrSubmitLoading}>
                      Copy JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLoadSampleEudrDds} disabled={isEudrSubmitLoading}>
                      Load sample JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void handleEudrDdsSubmit()} disabled={isEudrSubmitLoading}>
                      {isEudrSubmitLoading ? 'Submitting...' : 'Submit DDS'}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Idempotency key</label>
                    <input
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={eudrIdempotencyKey}
                      onChange={(e) => setEudrIdempotencyKey(e.target.value)}
                      placeholder="eudr_dds_..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Statement JSON</label>
                    <textarea
                      className="min-h-[110px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
                      value={eudrStatementJson}
                      onChange={(e) => setEudrStatementJson(e.target.value)}
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
              <div className="mb-3 rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium">EUDR DDS Status Read (Operator Trigger)</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleEudrDdsStatusRead()}
                    disabled={isEudrStatusLoading}
                  >
                    {isEudrStatusLoading ? 'Checking...' : 'Check Status'}
                  </Button>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Reference number</label>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={eudrStatusReferenceNumber}
                    onChange={(e) => setEudrStatusReferenceNumber(e.target.value)}
                    placeholder="TB-REF-..."
                  />
                </div>
                {eudrStatusLastError && (
                  <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-medium">Last status error:</span> {eudrStatusLastError.message} (
                        {new Date(eudrStatusLastError.occurredAt).toLocaleString()} - {eudrStatusLastError.referenceNumber})
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleCopyEudrStatusErrorContext()}
                        aria-label="Copy DDS status error context JSON"
                      >
                        Copy error context
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadEudrStatusErrorContext}
                        aria-label="Download DDS status error context JSON"
                      >
                        Download error JSON
                      </Button>
                    </div>
                    <p className="mt-2 text-[11px] text-destructive/80">
                      Downloads are saved by your browser to its default Downloads folder.
                    </p>
                    {eudrStatusErrorFilenamePreview && (
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-destructive/80">
                        <span>
                          Suggested filename: <span className="font-mono">{eudrStatusErrorFilenamePreview}</span>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleCopyEudrStatusErrorFilename()}
                          aria-label="Copy DDS status error export filename"
                        >
                          Copy filename
                        </Button>
                      </div>
                    )}
                    {eudrStatusErrorFilenamePreview && (
                      <p className="mt-1 text-[11px] text-destructive/80">
                        Note: <span className="font-mono">{EUDR_DDS_STATUS_ERROR_FILENAME_TIMESTAMP_TOKEN}</span> is replaced at
                        download time.
                      </p>
                    )}
                  </div>
                )}
                {eudrStatusHintMessage && (
                  <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">
                    <span className="font-medium">Retry + Escalation Hint:</span> {eudrStatusHintMessage}
                  </div>
                )}
                {eudrStatusResult && (
                  <div className="mt-3 rounded-md border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        Last status check: {new Date(eudrStatusResult.checkedAt).toLocaleString()} -{' '}
                        {eudrStatusResult.referenceNumber} (HTTP {eudrStatusResult.statusCode})
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => void handleCopyEudrStatusPayload()}>
                          Copy payload
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadEudrStatusPayload}>
                          Download JSON
                        </Button>
                      </div>
                    </div>
                    <pre className="max-h-52 overflow-auto rounded bg-background p-2 text-xs">
                      {JSON.stringify(redactedEudrStatusPayload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">Integration Webhook Registrations</h4>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">{totalWebhookEvents} registered webhook event(s)</div>
              {webhookError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {webhookError}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Captured At</TableHead>
                      <TableHead>Webhook</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Policy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isWebhookLoading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          Loading integration webhooks...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWebhookLoading && webhookEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No integration webhooks captured for this tenant yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWebhookLoading &&
                      webhookEvents.map((event) => (
                        <TableRow
                          key={event.id}
                          className={selectedWebhookId === event.payload.webhookId ? 'bg-muted/40' : ''}
                          onClick={() => {
                            setSelectedWebhookId(event.payload.webhookId);
                            setWebhookDeliveryPage(1);
                          }}
                        >
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.webhookId}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.endpointUrl}</TableCell>
                          <TableCell className="text-sm">{event.payload.secretRotationPolicy}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {!isWebhookLoading && totalWebhookEvents > webhookPageSize && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {webhookPage} of {totalWebhookPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={webhookPage <= 1}
                      onClick={() => setWebhookPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={webhookPage >= totalWebhookPages}
                      onClick={() => setWebhookPage((page) => Math.min(totalWebhookPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">Webhook Delivery Evidence</h4>
                <div className="text-xs text-muted-foreground">
                  {selectedWebhookId ? `Selected webhook: ${selectedWebhookId}` : 'Select a webhook row to inspect deliveries'}
                </div>
              </div>
              {webhookDeliveryError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {webhookDeliveryError}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Captured At</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Attempt</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isWebhookDeliveryLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          Loading webhook delivery evidence...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWebhookDeliveryLoading && !selectedWebhookId && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          Select a webhook registration to load immutable delivery evidence.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWebhookDeliveryLoading && selectedWebhookId && webhookDeliveryEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          No delivery evidence captured for this webhook yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWebhookDeliveryLoading &&
                      webhookDeliveryEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline" className="text-xs">
                              {event.event_type.replace('integration_delivery_', '')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.deliveryId}</TableCell>
                          <TableCell className="text-sm">{event.payload.attempt}</TableCell>
                          <TableCell className="text-sm">{event.payload.status}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {!isWebhookDeliveryLoading && selectedWebhookId && totalWebhookDeliveryEvents > webhookDeliveryPageSize && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {webhookDeliveryPage} of {totalWebhookDeliveryPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={webhookDeliveryPage <= 1}
                      onClick={() => setWebhookDeliveryPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={webhookDeliveryPage >= totalWebhookDeliveryPages}
                      onClick={() => setWebhookDeliveryPage((page) => Math.min(totalWebhookDeliveryPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">Filing Activity</h4>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleFilingCsv}>
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleFilingAllCsv()}
                    disabled={!dashboardSummary?.readiness.canExportDetailed}
                  >
                    Export All CSV
                  </Button>
                </div>
              </div>
              <div className="mb-3 grid gap-2 md:grid-cols-1">
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={filingPhaseFilter}
                  onChange={(e) => {
                    setFilingPhaseFilter(e.target.value as 'all' | 'generation_requested' | 'generation_generated' | 'submission_requested' | 'submission_accepted' | 'submission_replayed');
                    setFilingPage(1);
                  }}
                >
                  <option value="all">All phases</option>
                  <option value="generation_requested">Generation requested</option>
                  <option value="generation_generated">Generation generated</option>
                  <option value="submission_requested">Submission requested</option>
                  <option value="submission_accepted">Submission accepted</option>
                  <option value="submission_replayed">Submission replayed</option>
                </select>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {totalFilingEvents} matching filing activity event(s)
              </div>
              {filingError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {filingError}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Captured At</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Idempotency</TableHead>
                      <TableHead>TRACES Ref</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFilingLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          Loading filing activity...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isFilingLoading && filingEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          No filing activity captured for this tenant yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isFilingLoading &&
                      filingEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.actorLabel ?? event.payload.exportedBy ?? event.user_id ?? 'unknown'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline" className="text-xs">
                              {event.event_type.replace('dds_package_generation_', 'generation_').replace('dds_package_submission_', 'submission_')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.packageId ?? '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.idempotencyKey ?? '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.tracesReference ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {!isFilingLoading && totalFilingEvents > filingPageSize && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {filingPage} of {totalFilingPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filingPage <= 1}
                      onClick={() => setFilingPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filingPage >= totalFilingPages}
                      onClick={() => setFilingPage((page) => Math.min(totalFilingPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">Chat Thread Activity</h4>
              </div>
              <div className="mb-3 grid gap-2 md:grid-cols-1">
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={chatPhaseFilter}
                  onChange={(e) => {
                    setChatPhaseFilter(
                      e.target.value as 'all' | 'created' | 'posted' | 'replayed' | 'resolved' | 'reopened' | 'archived',
                    );
                    setChatPage(1);
                  }}
                >
                  <option value="all">All phases</option>
                  <option value="created">Thread created</option>
                  <option value="posted">Message posted</option>
                  <option value="replayed">Message replayed</option>
                  <option value="resolved">Thread resolved</option>
                  <option value="reopened">Thread reopened</option>
                  <option value="archived">Thread archived</option>
                </select>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {totalChatThreadEvents} matching chat-thread event(s)
              </div>
              {chatThreadError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {chatThreadError}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Captured At</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Thread</TableHead>
                      <TableHead>Record</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isChatThreadLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          Loading chat-thread activity...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isChatThreadLoading && chatThreadEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          No chat-thread activity captured for this tenant yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isChatThreadLoading &&
                      chatThreadEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.actorLabel ?? event.payload.actorUserId ?? event.user_id ?? 'unknown'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline" className="text-xs">
                              {event.event_type.replace('chat_thread_', '').replace('message_', '')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.threadId ?? '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.recordId ?? '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.messageId ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {!isChatThreadLoading && totalChatThreadEvents > chatPageSize && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {chatPage} of {totalChatPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={chatPage <= 1}
                      onClick={() => setChatPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={chatPage >= totalChatPages}
                      onClick={() => setChatPage((page) => Math.min(totalChatPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">Workflow Activity</h4>
              </div>
              <div className="mb-3 grid gap-2 md:grid-cols-2">
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={workflowPhaseFilter}
                  onChange={(e) => {
                    setWorkflowPhaseFilter(
                      e.target.value as
                        | 'all'
                        | 'template_created'
                        | 'stage_transitioned'
                        | 'sla_warning'
                        | 'sla_breached'
                        | 'sla_escalated'
                        | 'sla_recovered',
                    );
                    setWorkflowPage(1);
                  }}
                >
                  <option value="all">All phases</option>
                  <option value="template_created">Template created</option>
                  <option value="stage_transitioned">Stage transitioned</option>
                  <option value="sla_warning">SLA warning</option>
                  <option value="sla_breached">SLA breached</option>
                  <option value="sla_escalated">SLA escalated</option>
                  <option value="sla_recovered">SLA recovered</option>
                </select>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={workflowSlaStateFilter}
                  onChange={(e) => {
                    setWorkflowSlaStateFilter(
                      e.target.value as 'all' | 'on_track' | 'warning' | 'breached' | 'escalated',
                    );
                    setWorkflowPage(1);
                  }}
                >
                  <option value="all">All SLA states</option>
                  <option value="on_track">On track</option>
                  <option value="warning">Warning</option>
                  <option value="breached">Breached</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {totalWorkflowEvents} matching workflow event(s)
              </div>
              {workflowError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {workflowError}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Captured At</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isWorkflowLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          Loading workflow activity...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWorkflowLoading && workflowEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          No workflow activity captured for this tenant yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWorkflowLoading &&
                      workflowEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.actorLabel ?? event.payload.actorUserId ?? event.user_id ?? 'unknown'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline" className="text-xs">
                              {event.event_type.replace('workflow_', '')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.templateId ?? '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.stageId ?? '-'}</TableCell>
                          <TableCell className="text-sm">{event.payload.slaState ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {!isWorkflowLoading && totalWorkflowEvents > workflowPageSize && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {workflowPage} of {totalWorkflowPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={workflowPage <= 1}
                      onClick={() => setWorkflowPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={workflowPage >= totalWorkflowPages}
                      onClick={() => setWorkflowPage((page) => Math.min(totalWorkflowPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">Risk Score Activity</h4>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleRiskScoreCsv}>
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleRiskScoreAllCsv()}
                    disabled={!dashboardSummary?.readiness.canExportDetailed}
                  >
                    Export All CSV
                  </Button>
                </div>
              </div>
              <div className="mb-3 grid gap-2 md:grid-cols-2">
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={riskScorePhaseFilter}
                  onChange={(e) => {
                    setRiskScorePhaseFilter(e.target.value as 'all' | 'requested' | 'evaluated' | 'low' | 'medium' | 'high');
                    setRiskScorePage(1);
                  }}
                >
                  <option value="all">All phases</option>
                  <option value="requested">Requested</option>
                  <option value="evaluated">Evaluated</option>
                  <option value="low">Low band event</option>
                  <option value="medium">Medium band event</option>
                  <option value="high">High band event</option>
                </select>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={riskScoreBandFilter}
                  onChange={(e) => {
                    setRiskScoreBandFilter(e.target.value as 'all' | 'low' | 'medium' | 'high');
                    setRiskScorePage(1);
                  }}
                >
                  <option value="all">All bands</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {totalRiskScoreEvents} matching risk score event(s)
              </div>
              {riskScoreError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {riskScoreError}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Captured At</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Band</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isRiskScoreLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          Loading risk score activity...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isRiskScoreLoading && riskScoreEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          No risk score activity captured for this tenant yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isRiskScoreLoading &&
                      riskScoreEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.actorLabel ?? event.payload.exportedBy ?? event.user_id ?? 'unknown'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline" className="text-xs">
                              {event.event_type.replace('dds_package_risk_score_', '')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.packageId ?? '-'}</TableCell>
                          <TableCell className="text-sm">{event.payload.band ?? '-'}</TableCell>
                          <TableCell className="text-sm">{event.payload.score ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {!isRiskScoreLoading && totalRiskScoreEvents > riskScorePageSize && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {riskScorePage} of {totalRiskScorePages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={riskScorePage <= 1}
                      onClick={() => setRiskScorePage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={riskScorePage >= totalRiskScorePages}
                      onClick={() => setRiskScorePage((page) => Math.min(totalRiskScorePages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">Assignment Export Activity</h4>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleAssignmentExportCsv}>
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleAssignmentExportAllCsv()}
                    disabled={!dashboardSummary?.readiness.canExportDetailed}
                  >
                    Export All CSV
                  </Button>
                </div>
              </div>
              <div className="mb-3 grid gap-2 md:grid-cols-2">
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={assignmentPhaseFilter}
                  onChange={(e) => {
                    setAssignmentPhaseFilter(e.target.value as 'all' | 'requested' | 'succeeded' | 'failed');
                    setAssignmentExportPage(1);
                  }}
                >
                  <option value="all">All phases</option>
                  <option value="requested">Requested</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={assignmentStatusFilter}
                  onChange={(e) => {
                    setAssignmentStatusFilter(e.target.value as 'all' | 'active' | 'completed' | 'cancelled');
                    setAssignmentExportPage(1);
                  }}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {totalAssignmentExportEvents} matching assignment export event(s)
              </div>
              {assignmentExportError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {assignmentExportError}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Captured At</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Filters</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAssignmentExportLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          Loading assignment export activity...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isAssignmentExportLoading && assignmentExportEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          No assignment export activity captured for this tenant yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isAssignmentExportLoading &&
                      assignmentExportEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.actorLabel ?? event.payload.exportedBy ?? event.user_id ?? 'unknown'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline" className="text-xs">
                              {event.event_type.replace('plot_assignment_export_', '')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            status={event.payload.status}, days={event.payload.fromDays}
                            {event.payload.agentUserId ? `, agent=${event.payload.agentUserId}` : ''}
                          </TableCell>
                          <TableCell className="text-sm">{event.payload.rowCount ?? '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{event.payload.error ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {!isAssignmentExportLoading && totalAssignmentExportEvents > assignmentExportPageSize && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {assignmentExportPage} of {totalAssignmentExportPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={assignmentExportPage <= 1}
                      onClick={() => setAssignmentExportPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={assignmentExportPage >= totalAssignmentExportPages}
                      onClick={() => setAssignmentExportPage((page) => Math.min(totalAssignmentExportPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {!isTelemetryLoading && totalTelemetryEvents > telemetryPageSize && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalTelemetryPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalTelemetryPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalTelemetryPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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

              {error && (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

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
