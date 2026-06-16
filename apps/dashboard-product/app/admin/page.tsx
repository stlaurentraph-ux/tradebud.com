'use client';

import React, { useMemo, useState, useContext } from 'react';
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
import { isMalformedEudrDdsStatusPayloadError } from '@/lib/eudr-dds-status-feedback';
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
import { LocaleContext } from '@/lib/locale-context';
import { translatePageHeader } from '@/lib/nav-labels';
import { getAdminPanelCtaLabel, getAdminActionLabel, getAdminStatLabel, getAdminTabLabel, getAdminSectionCopy, getAdminToastMessage, getAdminUsersSubtitle, getAdminRolesSubtitle, getAdminInvitePlaceholder, getAdminUsersTableColumnLabel, getAdminUsersLoadingLabel, getAdminRolesCanonicalBadge, getAdminOrganizationsLoadingLabel, getAdminDiagnosticsLabel, getAdminDiagnosticsCopy, getAdminDiagnosticsPresetLabel, getAdminFilingPhaseFilterLabel, getAdminChatPhaseFilterLabel, getAdminWorkflowPhaseFilterLabel, getAdminWorkflowSlaFilterLabel, getAdminRiskScorePhaseFilterLabel, getAdminRiskScoreBandFilterLabel, getAdminAssignmentPhaseFilterLabel, getAdminAssignmentStatusFilterLabel, getAdminEntitlementsCopy, getAdminEntitlementStatusLabel, getAdminEudrDdsCopy, getAdminEudrDdsSubmitSuccessMessage, getAdminEudrDdsStatusErrorMessage, getAdminWebhookCopy, getAdminPageTitle, getAdminPageSubtitle, getAdminTenantRoleLabel, getAdminOrgTypeLabel, getAdminOrganizationsTableColumnLabel, getAdminOrgStatusLabel, getAdminRbacCommercialPermissionLabel } from '@/lib/workflow-terminology-labels';

const TENANT_ROLES: TenantRole[] = ['exporter', 'importer', 'cooperative', 'country_reviewer', 'sponsor'];
const ADMIN_ORG_TYPES: AdminOrgType[] = ['COOPERATIVE', 'EXPORTER', 'IMPORTER'];
const ADMIN_STATUSES: AdminStatus[] = ['ACTIVE', 'PENDING', 'SUSPENDED'];

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
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const pageHeader = translatePageHeader(t, 'admin', {
    title: getAdminPageTitle(t),
    subtitle: getAdminPageSubtitle(t),
  });
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
      toast.error(getAdminDiagnosticsCopy('toast_telemetry_no_rows_page', t));
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
    toast.success(getAdminDiagnosticsCopy('toast_telemetry_exported_page', t));
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
        throw new Error(body.error ?? getAdminDiagnosticsCopy('toast_telemetry_export_failed', t));
      }
      const csv = await response.text();
      const rowCount = csv.trim().split('\n').length - 1;
      const exportedCount = Number(response.headers.get('x-export-row-count') ?? rowCount);
      const exportedLimit = Number(response.headers.get('x-export-row-limit') ?? 0);
      const truncated = response.headers.get('x-export-truncated') === 'true';
      if (rowCount <= 0) {
        toast.error(getAdminDiagnosticsCopy('toast_telemetry_no_rows_filters', t));
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
      toast.success(getAdminDiagnosticsCopy('toast_telemetry_exported_count', t, { count: exportedCount }));
      if (truncated && exportedLimit > 0) {
        toast.warning(getAdminDiagnosticsCopy('toast_telemetry_export_capped', t, { limit: exportedLimit }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminDiagnosticsCopy('toast_telemetry_export_failed', t));
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
      toast.success(getAdminDiagnosticsCopy('toast_org_created', t));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminDiagnosticsCopy('toast_org_failed', t));
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.organisation_id) return;
    try {
      await inviteUser(inviteForm);
      setInviteForm({ name: '', email: '', organisation_id: '', role: 'cooperative' });
      setIsInviteFormOpen(false);
      toast.success(getAdminDiagnosticsCopy('toast_user_invited', t));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminDiagnosticsCopy('toast_invite_failed', t));
    }
  };

  const handleRoleChange = async (userId: string, role: TenantRole) => {
    try {
      await updateUserRole(userId, role);
      toast.success(getAdminDiagnosticsCopy('toast_role_updated', t));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminDiagnosticsCopy('toast_role_failed', t));
    }
  };

  const handleStatusChange = async (userId: string, status: AdminStatus) => {
    try {
      await updateUserStatus(userId, status);
      toast.success(getAdminDiagnosticsCopy('toast_user_status_updated', t));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminDiagnosticsCopy('toast_user_status_failed', t));
    }
  };

  const handleSeedWorkspace = () => {
    seedFirstCustomerWorkspace();
    toast.success(getAdminToastMessage('seeded', t));
  };

  const handleResetWorkspace = () => {
    resetDemoWorkspace();
    toast.success(getAdminToastMessage('reset', t));
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
    toast.success(
      next
        ? getAdminDiagnosticsCopy('toast_debug_enabled', t)
        : getAdminDiagnosticsCopy('toast_debug_disabled', t),
    );
  };

  const handleAssignmentExportCsv = () => {
    if (!assignmentExportEvents.length) {
      toast.error(getAdminDiagnosticsCopy('toast_assignment_no_rows', t));
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
    toast.success(getAdminDiagnosticsCopy('toast_assignment_exported_page', t));
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
        throw new Error(body.error ?? getAdminDiagnosticsCopy('toast_assignment_export_failed', t));
      }
      const csv = await response.text();
      const rowCount = csv.trim().split('\n').length - 1;
      const exportedCount = Number(response.headers.get('x-export-row-count') ?? rowCount);
      if (rowCount <= 0) {
        toast.error(getAdminDiagnosticsCopy('toast_assignment_no_rows', t));
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
      toast.success(getAdminDiagnosticsCopy('toast_assignment_exported_count', t, { count: exportedCount }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminDiagnosticsCopy('toast_assignment_export_failed', t));
    }
  };

  const handleRiskScoreCsv = () => {
    if (!riskScoreEvents.length) {
      toast.error(getAdminDiagnosticsCopy('toast_risk_no_rows', t));
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
    toast.success(getAdminDiagnosticsCopy('toast_risk_exported_page', t));
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
        throw new Error(body.error ?? getAdminDiagnosticsCopy('toast_risk_export_failed', t));
      }
      const csv = await response.text();
      const rowCount = csv.trim().split('\n').length - 1;
      const exportedCount = Number(response.headers.get('x-export-row-count') ?? rowCount);
      if (rowCount <= 0) {
        toast.error(getAdminDiagnosticsCopy('toast_risk_no_rows', t));
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
      toast.success(getAdminDiagnosticsCopy('toast_risk_exported_count', t, { count: exportedCount }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminDiagnosticsCopy('toast_risk_export_failed', t));
    }
  };

  const handleFilingCsv = () => {
    if (!filingEvents.length) {
      toast.error(getAdminDiagnosticsCopy('toast_filing_no_rows', t));
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
    toast.success(getAdminDiagnosticsCopy('toast_filing_exported_page', t));
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
        throw new Error(body.error ?? getAdminDiagnosticsCopy('toast_filing_export_failed', t));
      }
      const csv = await response.text();
      const rowCount = csv.trim().split('\n').length - 1;
      const exportedCount = Number(response.headers.get('x-export-row-count') ?? rowCount);
      if (rowCount <= 0) {
        toast.error(getAdminDiagnosticsCopy('toast_filing_no_rows', t));
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
      toast.success(getAdminDiagnosticsCopy('toast_filing_exported_count', t, { count: exportedCount }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminDiagnosticsCopy('toast_filing_export_failed', t));
    }
  };

  const handleEudrDdsSubmit = async () => {
    if (isEudrSubmitLoading) return;

    let statement: Record<string, unknown>;
    try {
      const parsed = JSON.parse(eudrStatementJson);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        toast.error(getAdminEudrDdsCopy('toast_statement_not_object', t));
        return;
      }
      statement = parsed as Record<string, unknown>;
    } catch {
      toast.error(getAdminEudrDdsCopy('toast_statement_invalid_json', t));
      return;
    }

    const idempotencyKey = eudrIdempotencyKey.trim();
    if (!idempotencyKey) {
      toast.error(getAdminEudrDdsCopy('toast_idempotency_required', t));
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
        throw new Error(payload.error ?? getAdminEudrDdsCopy('toast_submit_failed', t));
      }
      toast.success(
        getAdminEudrDdsSubmitSuccessMessage(
          {
            statusCode: payload.statusCode ?? response.status,
            replayed: payload.replayed,
          },
          t,
        ),
      );
      setEudrIdempotencyKey(`eudr_dds_${Date.now()}`);
      reloadFiling();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminEudrDdsCopy('toast_submit_failed', t));
    } finally {
      setIsEudrSubmitLoading(false);
    }
  };

  const handleLoadSampleEudrDds = () => {
    setEudrStatementJson(JSON.stringify(EUDR_SAMPLE_STATEMENTS[eudrSamplePreset], null, 2));
    setEudrIdempotencyKey(`eudr_dds_${Date.now()}`);
    toast.success(getAdminEudrDdsCopy('toast_sample_loaded', t, { preset: eudrSamplePreset }));
  };

  const handleCopyEudrStatementJson = async () => {
    try {
      await navigator.clipboard.writeText(eudrStatementJson);
      toast.success(getAdminEudrDdsCopy('toast_statement_copied', t));
    } catch {
      toast.error(getAdminEudrDdsCopy('toast_statement_copy_failed', t));
    }
  };

  const handleEudrDdsStatusRead = async () => {
    if (isEudrStatusLoading) return;
    const referenceNumber = eudrStatusReferenceNumber.trim();
    if (!referenceNumber) {
      toast.error(getAdminEudrDdsCopy('toast_reference_required', t));
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
        throw new Error(payload.error ?? getAdminEudrDdsCopy('toast_status_read_failed', t));
      }
      setEudrStatusResult({
        referenceNumber,
        statusCode: payload.statusCode ?? response.status,
        payload: payload.payload ?? payload,
        checkedAt: new Date().toISOString(),
      });
      setEudrStatusHintMessage(null);
      setEudrStatusLastError(null);
      toast.success(
        getAdminEudrDdsCopy('toast_status_read_success', t, {
          statusCode: payload.statusCode ?? response.status,
        }),
      );
    } catch (err) {
      setEudrStatusResult(null);
      const rawMessage = err instanceof Error ? err.message : undefined;
      const toastMessage = getAdminEudrDdsStatusErrorMessage({ message: rawMessage }, t);
      setEudrStatusLastError({
        message: toastMessage,
        occurredAt: new Date().toISOString(),
        referenceNumber,
      });
      if (isMalformedEudrDdsStatusPayloadError({ message: rawMessage })) {
        setEudrStatusHintMessage(getAdminEudrDdsCopy('hint_retry_message', t));
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
      const payload = (await response.json().catch(() => ({ error: getAdminEntitlementsCopy('toast_load_error', t) }))) as {
        error?: string;
      } & LaunchFeatureEntitlement[];
      if (!response.ok) {
        throw new Error(payload.error ?? getAdminEntitlementsCopy('toast_load_error', t));
      }
      setEntitlements(Array.isArray(payload) ? payload : []);
      toast.success(getAdminEntitlementsCopy('toast_loaded', t));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminEntitlementsCopy('toast_load_error', t));
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
      const payload = (await response.json().catch(() => ({ error: getAdminEntitlementsCopy('toast_update_error', t) }))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? getAdminEntitlementsCopy('toast_update_error', t));
      }
      await loadLaunchEntitlements();
      toast.success(
        getAdminEntitlementsCopy('toast_updated', t, { feature, status: entitlementStatus }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getAdminEntitlementsCopy('toast_update_error', t));
    } finally {
      setIsEntitlementSavingFeature(null);
    }
  };

  const handleCopyEudrStatusPayload = async () => {
    if (!eudrStatusResult) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(redactedEudrStatusPayload, null, 2));
      toast.success(getAdminEudrDdsCopy('toast_payload_copied', t));
    } catch {
      toast.error(getAdminEudrDdsCopy('toast_payload_copy_failed', t));
    }
  };

  const handleCopyEudrStatusErrorContext = async () => {
    if (!eudrStatusLastError) return;
    const payload = serializeEudrDdsStatusErrorContext(eudrStatusLastError);
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success(getAdminEudrDdsCopy('toast_error_context_copied', t));
    } catch {
      toast.error(getAdminEudrDdsCopy('toast_error_context_copy_failed', t));
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
    toast.success(getAdminEudrDdsCopy('toast_error_context_downloaded', t));
  };

  const handleCopyEudrStatusErrorFilename = async () => {
    if (!eudrStatusErrorFilenamePreview) return;
    try {
      await navigator.clipboard.writeText(eudrStatusErrorFilenamePreview);
      toast.success(getAdminEudrDdsCopy('toast_error_filename_copied', t));
    } catch {
      toast.error(getAdminEudrDdsCopy('toast_error_filename_copy_failed', t));
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
    toast.success(getAdminEudrDdsCopy('toast_payload_downloaded', t));
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pageHeader.title}
        subtitle={pageHeader.subtitle}
        actions={
          <Button
            size="sm"
            onClick={() => (activeTab === 'organizations' ? setIsOrgFormOpen((v) => !v) : setIsInviteFormOpen((v) => !v))}
          >
            <Plus className="w-4 h-4 mr-2" />
            {getAdminPanelCtaLabel(activeTab === 'organizations' ? 'organizations' : 'users', t)}
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSeedWorkspace}>
            {getAdminActionLabel('seed', t)}
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetWorkspace}>
            {getAdminActionLabel('reset', t)}
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
                  <p className="text-xs text-muted-foreground">{getAdminStatLabel('organizations', t)}</p>
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
                  <p className="text-xs text-muted-foreground">{getAdminStatLabel('total_users', t)}</p>
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
                  <p className="text-xs text-muted-foreground">{getAdminStatLabel('active_users', t)}</p>
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
                  <p className="text-xs text-muted-foreground">{getAdminStatLabel('pending_approval', t)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{getAdminDiagnosticsLabel('title', t)}</CardTitle>
              <CardDescription>
                {getAdminDiagnosticsLabel('subtitle', t)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleTelemetryExportCsv}>
                {getAdminDiagnosticsLabel('export_csv', t)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleTelemetryExportAllCsv()}
                disabled={isExportAllTelemetryLoading || !dashboardSummary?.readiness.canExportDetailed}
              >
                {isExportAllTelemetryLoading ? getAdminDiagnosticsLabel('exporting_all', t) : getAdminDiagnosticsLabel('export_all_csv', t)}
              </Button>
              <Button variant="outline" size="sm" onClick={handleTelemetryRefresh}>
                {getAdminDiagnosticsLabel('refresh', t)}
              </Button>
              <Button variant="outline" size="sm" onClick={handleTelemetryDebugToggle}>
                {isTelemetryDebugEnabled ? getAdminDiagnosticsLabel('debug_on', t) : getAdminDiagnosticsLabel('debug_off', t)}
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
                  {getAdminDiagnosticsPresetLabel(preset.id, t)}
                </Button>
              ))}
            </div>
            <div className="mb-4 rounded-lg border p-3">
              <div className="mb-2 text-sm font-medium">{getAdminDiagnosticsLabel('summary', t)}</div>
              {isDashboardSummaryLoading && <p className="text-sm text-muted-foreground">{getAdminDiagnosticsLabel('loading_summary', t)}</p>}
              {!isDashboardSummaryLoading && dashboardSummaryError && (
                <p className="text-sm text-destructive">{dashboardSummaryError}</p>
              )}
              {!isDashboardSummaryLoading && !dashboardSummaryError && dashboardSummary && (
                <>
                  <div className="grid gap-2 text-sm md:grid-cols-3">
                    <div>{getAdminDiagnosticsCopy('counter_total_diagnostics', t)}: {dashboardSummary.totalDiagnostics}</div>
                    <div>{getAdminDiagnosticsCopy('counter_gated_entry', t)}: {dashboardSummary.counters.gatedEntryAttempts}</div>
                    <div>{getAdminDiagnosticsCopy('counter_assignment_exports', t)}: {dashboardSummary.counters.assignmentExportEvents}</div>
                    <div>{getAdminDiagnosticsCopy('counter_risk_scores', t)}: {dashboardSummary.counters.riskScoreEvents}</div>
                    <div>{getAdminDiagnosticsCopy('counter_filing_activity', t)}: {dashboardSummary.counters.filingActivityEvents}</div>
                    <div>{getAdminDiagnosticsCopy('counter_chat_activity', t)}: {dashboardSummary.counters.chatActivityEvents}</div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    <div>
                      {getAdminDiagnosticsCopy('breakdown_assignment_phase', t, { requested: dashboardSummary.breakdown.assignmentPhase.requested, succeeded: dashboardSummary.breakdown.assignmentPhase.succeeded, failed: dashboardSummary.breakdown.assignmentPhase.failed })}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentPhase', 'requested')}>
                          {getAdminDiagnosticsCopy('drilldown_requested', t)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentPhase', 'succeeded')}>
                          {getAdminDiagnosticsCopy('drilldown_succeeded', t)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentPhase', 'failed')}>
                          {getAdminDiagnosticsCopy('drilldown_failed', t)}
                        </Button>
                      </div>
                    </div>
                    <div>
                      {getAdminDiagnosticsCopy('breakdown_assignment_status', t, { active: dashboardSummary.breakdown.assignmentStatus.active, completed: dashboardSummary.breakdown.assignmentStatus.completed, cancelled: dashboardSummary.breakdown.assignmentStatus.cancelled })}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentStatus', 'active')}>
                          {getAdminDiagnosticsCopy('drilldown_active', t)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentStatus', 'completed')}>
                          {getAdminDiagnosticsCopy('drilldown_completed', t)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('assignmentStatus', 'cancelled')}>
                          {getAdminDiagnosticsCopy('drilldown_cancelled', t)}
                        </Button>
                      </div>
                    </div>
                    <div>
                      {getAdminDiagnosticsCopy('breakdown_risk_band', t, { low: dashboardSummary.breakdown.riskBand.low, medium: dashboardSummary.breakdown.riskBand.medium, high: dashboardSummary.breakdown.riskBand.high })}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('riskBand', 'low')}>
                          {getAdminDiagnosticsCopy('drilldown_low', t)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('riskBand', 'medium')}>
                          {getAdminDiagnosticsCopy('drilldown_medium', t)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('riskBand', 'high')}>
                          {getAdminDiagnosticsCopy('drilldown_high', t)}
                        </Button>
                      </div>
                    </div>
                    <div>
                      {getAdminDiagnosticsCopy('breakdown_filing_family', t, { generation: dashboardSummary.breakdown.filingFamily.generation, submission: dashboardSummary.breakdown.filingFamily.submission })}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('filingFamily', 'generation')}>
                          {getAdminDiagnosticsCopy('drilldown_generation', t)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('filingFamily', 'submission')}>
                          {getAdminDiagnosticsCopy('drilldown_submission', t)}
                        </Button>
                      </div>
                    </div>
                    <div>
                      {getAdminDiagnosticsCopy('breakdown_chat_phase', t, { created: dashboardSummary.breakdown.chatPhase.created, posted: dashboardSummary.breakdown.chatPhase.posted, replayed: dashboardSummary.breakdown.chatPhase.replayed })}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('chatPhase', 'created')}>
                          {getAdminDiagnosticsCopy('drilldown_created', t)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('chatPhase', 'posted')}>
                          {getAdminDiagnosticsCopy('drilldown_posted', t)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => applySummaryDrilldown('chatPhase', 'resolved')}>
                          {getAdminDiagnosticsCopy('drilldown_resolved', t)}
                        </Button>
                      </div>
                    </div>
                    <div>
                      {getAdminDiagnosticsCopy('readiness_label', t)}: {dashboardSummary.readiness.canExportDetailed ? getAdminDiagnosticsCopy('readiness_export_ready', t) : getAdminDiagnosticsCopy('readiness_no_export_data', t)}
                      {dashboardSummary.readiness.latestEventAt
                        ? getAdminDiagnosticsCopy('readiness_latest', t, { date: new Date(dashboardSummary.readiness.latestEventAt).toLocaleString() })
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
                <option value="all">{getAdminDiagnosticsCopy('filter_all_gates', t)}</option>
                <option value="request_campaigns">{getAdminDiagnosticsCopy('filter_request_campaigns', t)}</option>
                <option value="annual_reporting">{getAdminDiagnosticsCopy('filter_annual_reporting', t)}</option>
              </select>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={timeWindow}
                onChange={(e) => {
                  setTimeWindow(e.target.value as '24h' | '7d' | '30d');
                  setCurrentPage(1);
                }}
              >
                <option value="24h">{getAdminDiagnosticsCopy('filter_last_24h', t)}</option>
                <option value="7d">{getAdminDiagnosticsCopy('filter_last_7d', t)}</option>
                <option value="30d">{getAdminDiagnosticsCopy('filter_last_30d', t)}</option>
              </select>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={telemetrySort}
                onChange={(e) => {
                  setTelemetrySort(e.target.value as 'desc' | 'asc');
                  setCurrentPage(1);
                }}
              >
                <option value="desc">{getAdminDiagnosticsCopy('filter_newest_first', t)}</option>
                <option value="asc">{getAdminDiagnosticsCopy('filter_oldest_first', t)}</option>
              </select>
              <div className="text-sm text-muted-foreground flex items-center">
                {getAdminDiagnosticsCopy('filter_matching_events', t, { count: totalTelemetryEvents })}
              </div>
            </div>
            {telemetryError && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {telemetryError}
              </div>
            )}
            {telemetryAuthError && (
              <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
                {getAdminDiagnosticsCopy('message_telemetry_auth', t)}
              </div>
            )}
            {isTelemetryDebugEnabled && (
              <div className="mb-4 rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
                {getAdminDiagnosticsCopy('message_debug_counters', t, { mutationEvents: telemetryDebugCounters.mutationEvents, debounceFlushes: telemetryDebugCounters.debounceFlushes, fetchLoads: telemetryDebugCounters.fetchLoads })}
              </div>
            )}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{getAdminDiagnosticsCopy('table_captured_at', t)}</TableHead>
                    <TableHead>{getAdminDiagnosticsCopy('table_gate', t)}</TableHead>
                    <TableHead>{getAdminDiagnosticsCopy('table_role', t)}</TableHead>
                    <TableHead>{getAdminDiagnosticsCopy('table_feature', t)}</TableHead>
                    <TableHead>{getAdminDiagnosticsCopy('table_redirect', t)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTelemetryLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        {getAdminDiagnosticsCopy('loading_telemetry', t)}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isTelemetryLoading && totalTelemetryEvents === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        {getAdminDiagnosticsCopy('empty_telemetry', t)}
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
              <h4 className="mb-2 text-sm font-medium">{getAdminDiagnosticsCopy('section_export_activity', t)}</h4>
              {exportActivityError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {exportActivityError}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{getAdminDiagnosticsCopy('table_exported_at', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_actor', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_gate', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_rows', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_sort', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_truncated', t)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isExportActivityLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('loading_export_activity', t)}
                        </TableCell>
                      </TableRow>
                    )}
                    {!isExportActivityLoading && gatedEntryExportEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('empty_export_activity', t)}
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
                                {getAdminDiagnosticsCopy('yes', t)}
                              </Badge>
                            ) : (
                              getAdminDiagnosticsCopy('no', t)
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
                  <h4 className="text-sm font-medium">{getAdminEntitlementsCopy('title', t)}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadLaunchEntitlements()}
                    disabled={isEntitlementsLoading || isEntitlementSavingFeature !== null}
                  >
                    {isEntitlementsLoading
                      ? getAdminEntitlementsCopy('action_loading', t)
                      : getAdminEntitlementsCopy('action_load', t)}
                  </Button>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{getAdminEntitlementsCopy('table_feature', t)}</TableHead>
                        <TableHead>{getAdminEntitlementsCopy('table_status', t)}</TableHead>
                        <TableHead>{getAdminEntitlementsCopy('table_updated_at', t)}</TableHead>
                        <TableHead>{getAdminEntitlementsCopy('table_actions', t)}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entitlements.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground">
                            {getAdminEntitlementsCopy('empty', t)}
                          </TableCell>
                        </TableRow>
                      )}
                      {entitlements.map((row) => (
                        <TableRow key={row.feature_key}>
                          <TableCell className="text-sm">{row.feature_key}</TableCell>
                          <TableCell className="text-sm">
                            <Badge variant="outline">
                              {getAdminEntitlementStatusLabel(row.entitlement_status, t)}
                            </Badge>
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
                                {getAdminEntitlementsCopy('action_enable', t)}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  isEntitlementSavingFeature !== null || row.entitlement_status === 'trial'
                                }
                                onClick={() => void setLaunchEntitlementStatus(row.feature_key, 'trial')}
                              >
                                {getAdminEntitlementsCopy('action_trial', t)}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  isEntitlementSavingFeature !== null || row.entitlement_status === 'disabled'
                                }
                                onClick={() => void setLaunchEntitlementStatus(row.feature_key, 'disabled')}
                              >
                                {getAdminEntitlementsCopy('action_disable', t)}
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
                  <h4 className="text-sm font-medium">{getAdminEudrDdsCopy('title_submit', t)}</h4>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-md border bg-background px-2 py-1 text-xs"
                      value={eudrSamplePreset}
                      onChange={(e) => setEudrSamplePreset(e.target.value as EudrSamplePreset)}
                      disabled={isEudrSubmitLoading}
                    >
                      <option value="import">{getAdminEudrDdsCopy('preset_import', t)}</option>
                      <option value="export">{getAdminEudrDdsCopy('preset_export', t)}</option>
                      <option value="domestic">{getAdminEudrDdsCopy('preset_domestic', t)}</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={() => void handleCopyEudrStatementJson()} disabled={isEudrSubmitLoading}>
                      {getAdminEudrDdsCopy('action_copy_json', t)}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLoadSampleEudrDds} disabled={isEudrSubmitLoading}>
                      {getAdminEudrDdsCopy('action_load_sample', t)}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void handleEudrDdsSubmit()} disabled={isEudrSubmitLoading}>
                      {isEudrSubmitLoading
                        ? getAdminEudrDdsCopy('action_submitting', t)
                        : getAdminEudrDdsCopy('action_submit', t)}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {getAdminEudrDdsCopy('field_idempotency_key', t)}
                    </label>
                    <input
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={eudrIdempotencyKey}
                      onChange={(e) => setEudrIdempotencyKey(e.target.value)}
                      placeholder={getAdminEudrDdsCopy('placeholder_idempotency', t)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {getAdminEudrDdsCopy('field_statement_json', t)}
                    </label>
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
                  <h4 className="text-sm font-medium">{getAdminEudrDdsCopy('title_status', t)}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleEudrDdsStatusRead()}
                    disabled={isEudrStatusLoading}
                  >
                    {isEudrStatusLoading
                      ? getAdminEudrDdsCopy('action_checking', t)
                      : getAdminEudrDdsCopy('action_check', t)}
                  </Button>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {getAdminEudrDdsCopy('field_reference_number', t)}
                  </label>
                  <input
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={eudrStatusReferenceNumber}
                    onChange={(e) => setEudrStatusReferenceNumber(e.target.value)}
                    placeholder={getAdminEudrDdsCopy('placeholder_reference', t)}
                  />
                </div>
                {eudrStatusLastError && (
                  <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-medium">{getAdminEudrDdsCopy('error_last', t)}</span>{' '}
                        {eudrStatusLastError.message} (
                        {new Date(eudrStatusLastError.occurredAt).toLocaleString()} - {eudrStatusLastError.referenceNumber})
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleCopyEudrStatusErrorContext()}
                        aria-label={getAdminEudrDdsCopy('aria_copy_error_context', t)}
                      >
                        {getAdminEudrDdsCopy('action_copy_error_context', t)}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadEudrStatusErrorContext}
                        aria-label={getAdminEudrDdsCopy('aria_download_error_json', t)}
                      >
                        {getAdminEudrDdsCopy('action_download_error_json', t)}
                      </Button>
                    </div>
                    <p className="mt-2 text-[11px] text-destructive/80">
                      {getAdminEudrDdsCopy('hint_download_folder', t)}
                    </p>
                    {eudrStatusErrorFilenamePreview && (
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-destructive/80">
                        <span>
                          {getAdminEudrDdsCopy('hint_suggested_filename', t)}{' '}
                          <span className="font-mono">{eudrStatusErrorFilenamePreview}</span>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleCopyEudrStatusErrorFilename()}
                          aria-label={getAdminEudrDdsCopy('aria_copy_filename', t)}
                        >
                          {getAdminEudrDdsCopy('action_copy_filename', t)}
                        </Button>
                      </div>
                    )}
                    {eudrStatusErrorFilenamePreview && (
                      <p className="mt-1 text-[11px] text-destructive/80">
                        {getAdminEudrDdsCopy('hint_timestamp_token', t, {
                          token: EUDR_DDS_STATUS_ERROR_FILENAME_TIMESTAMP_TOKEN,
                        })}
                      </p>
                    )}
                  </div>
                )}
                {eudrStatusHintMessage && (
                  <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">
                    <span className="font-medium">{getAdminEudrDdsCopy('hint_retry', t)}</span> {eudrStatusHintMessage}
                  </div>
                )}
                {eudrStatusResult && (
                  <div className="mt-3 rounded-md border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        {getAdminEudrDdsCopy('status_last_check', t, {
                          checkedAt: new Date(eudrStatusResult.checkedAt).toLocaleString(),
                          referenceNumber: eudrStatusResult.referenceNumber,
                          statusCode: eudrStatusResult.statusCode,
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => void handleCopyEudrStatusPayload()}>
                          {getAdminEudrDdsCopy('action_copy_payload', t)}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadEudrStatusPayload}>
                          {getAdminEudrDdsCopy('action_download_json', t)}
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
                <h4 className="text-sm font-medium">{getAdminWebhookCopy('title_registrations', t)}</h4>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {getAdminWebhookCopy('count_registrations', t, { count: totalWebhookEvents })}
              </div>
              {webhookError && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {webhookError}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{getAdminDiagnosticsCopy('table_captured_at', t)}</TableHead>
                      <TableHead>{getAdminWebhookCopy('table_webhook', t)}</TableHead>
                      <TableHead>{getAdminWebhookCopy('table_endpoint', t)}</TableHead>
                      <TableHead>{getAdminWebhookCopy('table_policy', t)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isWebhookLoading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          {getAdminWebhookCopy('loading_registrations', t)}
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWebhookLoading && webhookEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          {getAdminWebhookCopy('empty_registrations', t)}
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
                    {getAdminDiagnosticsCopy('pagination_page', t, {
                      page: webhookPage,
                      totalPages: totalWebhookPages,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={webhookPage <= 1}
                      onClick={() => setWebhookPage((page) => Math.max(1, page - 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_previous', t)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={webhookPage >= totalWebhookPages}
                      onClick={() => setWebhookPage((page) => Math.min(totalWebhookPages, page + 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_next', t)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">{getAdminWebhookCopy('title_delivery', t)}</h4>
                <div className="text-xs text-muted-foreground">
                  {selectedWebhookId
                    ? getAdminWebhookCopy('selected_webhook', t, { webhookId: selectedWebhookId })
                    : getAdminWebhookCopy('select_webhook_hint', t)}
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
                      <TableHead>{getAdminDiagnosticsCopy('table_captured_at', t)}</TableHead>
                      <TableHead>{getAdminWebhookCopy('table_phase', t)}</TableHead>
                      <TableHead>{getAdminWebhookCopy('table_delivery', t)}</TableHead>
                      <TableHead>{getAdminWebhookCopy('table_attempt', t)}</TableHead>
                      <TableHead>{getAdminWebhookCopy('table_status', t)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isWebhookDeliveryLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          {getAdminWebhookCopy('loading_delivery', t)}
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWebhookDeliveryLoading && !selectedWebhookId && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          {getAdminWebhookCopy('empty_no_selection', t)}
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWebhookDeliveryLoading && selectedWebhookId && webhookDeliveryEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          {getAdminWebhookCopy('empty_delivery', t)}
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
                    {getAdminDiagnosticsCopy('pagination_page', t, {
                      page: webhookDeliveryPage,
                      totalPages: totalWebhookDeliveryPages,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={webhookDeliveryPage <= 1}
                      onClick={() => setWebhookDeliveryPage((page) => Math.max(1, page - 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_previous', t)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={webhookDeliveryPage >= totalWebhookDeliveryPages}
                      onClick={() => setWebhookDeliveryPage((page) => Math.min(totalWebhookDeliveryPages, page + 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_next', t)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">{getAdminDiagnosticsCopy('section_filing', t)}</h4>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleFilingCsv}>
                    {getAdminDiagnosticsLabel('export_csv', t)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleFilingAllCsv()}
                    disabled={!dashboardSummary?.readiness.canExportDetailed}
                  >
                    {getAdminDiagnosticsCopy('export_all_csv', t)}
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
                  <option value="all">{getAdminFilingPhaseFilterLabel('all', t)}</option>
                  <option value="generation_requested">{getAdminFilingPhaseFilterLabel('generation_requested', t)}</option>
                  <option value="generation_generated">{getAdminFilingPhaseFilterLabel('generation_generated', t)}</option>
                  <option value="submission_requested">{getAdminFilingPhaseFilterLabel('submission_requested', t)}</option>
                  <option value="submission_accepted">{getAdminFilingPhaseFilterLabel('submission_accepted', t)}</option>
                  <option value="submission_replayed">{getAdminFilingPhaseFilterLabel('submission_replayed', t)}</option>
                </select>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {getAdminDiagnosticsCopy('count_filing', t, { count: totalFilingEvents })}
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
                      <TableHead>{getAdminDiagnosticsCopy('table_captured_at', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_actor', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_phase', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_package', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_idempotency', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_traces_ref', t)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFilingLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('loading_filing', t)}
                        </TableCell>
                      </TableRow>
                    )}
                    {!isFilingLoading && filingEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('empty_filing', t)}
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
                            {event.actorLabel ?? event.payload.exportedBy ?? event.user_id ?? getAdminDiagnosticsCopy('unknown_actor', t)}
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
                    {getAdminDiagnosticsCopy('pagination_page', t, {
                      page: filingPage,
                      totalPages: totalFilingPages,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filingPage <= 1}
                      onClick={() => setFilingPage((page) => Math.max(1, page - 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_previous', t)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filingPage >= totalFilingPages}
                      onClick={() => setFilingPage((page) => Math.min(totalFilingPages, page + 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_next', t)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">{getAdminDiagnosticsCopy('section_chat', t)}</h4>
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
                  <option value="all">{getAdminChatPhaseFilterLabel('all', t)}</option>
                  <option value="created">{getAdminChatPhaseFilterLabel('created', t)}</option>
                  <option value="posted">{getAdminChatPhaseFilterLabel('posted', t)}</option>
                  <option value="replayed">{getAdminChatPhaseFilterLabel('replayed', t)}</option>
                  <option value="resolved">{getAdminChatPhaseFilterLabel('resolved', t)}</option>
                  <option value="reopened">{getAdminChatPhaseFilterLabel('reopened', t)}</option>
                  <option value="archived">{getAdminChatPhaseFilterLabel('archived', t)}</option>
                </select>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {getAdminDiagnosticsCopy('count_chat', t, { count: totalChatThreadEvents })}
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
                      <TableHead>{getAdminDiagnosticsCopy('table_captured_at', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_actor', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_phase', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_thread', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_record', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_message', t)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isChatThreadLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('loading_chat', t)}
                        </TableCell>
                      </TableRow>
                    )}
                    {!isChatThreadLoading && chatThreadEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('empty_chat', t)}
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
                            {event.actorLabel ?? event.payload.actorUserId ?? event.user_id ?? getAdminDiagnosticsCopy('unknown_actor', t)}
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
                    {getAdminDiagnosticsCopy('pagination_page', t, {
                      page: chatPage,
                      totalPages: totalChatPages,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={chatPage <= 1}
                      onClick={() => setChatPage((page) => Math.max(1, page - 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_previous', t)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={chatPage >= totalChatPages}
                      onClick={() => setChatPage((page) => Math.min(totalChatPages, page + 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_next', t)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">{getAdminDiagnosticsCopy('section_workflow', t)}</h4>
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
                  <option value="all">{getAdminWorkflowPhaseFilterLabel('all', t)}</option>
                  <option value="template_created">{getAdminWorkflowPhaseFilterLabel('template_created', t)}</option>
                  <option value="stage_transitioned">{getAdminWorkflowPhaseFilterLabel('stage_transitioned', t)}</option>
                  <option value="sla_warning">{getAdminWorkflowPhaseFilterLabel('sla_warning', t)}</option>
                  <option value="sla_breached">{getAdminWorkflowPhaseFilterLabel('sla_breached', t)}</option>
                  <option value="sla_escalated">{getAdminWorkflowPhaseFilterLabel('sla_escalated', t)}</option>
                  <option value="sla_recovered">{getAdminWorkflowPhaseFilterLabel('sla_recovered', t)}</option>
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
                  <option value="all">{getAdminWorkflowSlaFilterLabel('all', t)}</option>
                  <option value="on_track">{getAdminWorkflowSlaFilterLabel('on_track', t)}</option>
                  <option value="warning">{getAdminWorkflowSlaFilterLabel('warning', t)}</option>
                  <option value="breached">{getAdminWorkflowSlaFilterLabel('breached', t)}</option>
                  <option value="escalated">{getAdminWorkflowSlaFilterLabel('escalated', t)}</option>
                </select>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {getAdminDiagnosticsCopy('count_workflow', t, { count: totalWorkflowEvents })}
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
                      <TableHead>{getAdminDiagnosticsCopy('table_captured_at', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_actor', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_phase', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_template', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_stage', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_sla', t)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isWorkflowLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('loading_workflow', t)}
                        </TableCell>
                      </TableRow>
                    )}
                    {!isWorkflowLoading && workflowEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('empty_workflow', t)}
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
                            {event.actorLabel ?? event.payload.actorUserId ?? event.user_id ?? getAdminDiagnosticsCopy('unknown_actor', t)}
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
                    {getAdminDiagnosticsCopy('pagination_page', t, {
                      page: workflowPage,
                      totalPages: totalWorkflowPages,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={workflowPage <= 1}
                      onClick={() => setWorkflowPage((page) => Math.max(1, page - 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_previous', t)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={workflowPage >= totalWorkflowPages}
                      onClick={() => setWorkflowPage((page) => Math.min(totalWorkflowPages, page + 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_next', t)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">{getAdminDiagnosticsCopy('section_risk_score', t)}</h4>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleRiskScoreCsv}>
                    {getAdminDiagnosticsLabel('export_csv', t)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleRiskScoreAllCsv()}
                    disabled={!dashboardSummary?.readiness.canExportDetailed}
                  >
                    {getAdminDiagnosticsCopy('export_all_csv', t)}
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
                  <option value="all">{getAdminRiskScorePhaseFilterLabel('all', t)}</option>
                  <option value="requested">{getAdminRiskScorePhaseFilterLabel('requested', t)}</option>
                  <option value="evaluated">{getAdminRiskScorePhaseFilterLabel('evaluated', t)}</option>
                  <option value="low">{getAdminRiskScorePhaseFilterLabel('low', t)}</option>
                  <option value="medium">{getAdminRiskScorePhaseFilterLabel('medium', t)}</option>
                  <option value="high">{getAdminRiskScorePhaseFilterLabel('high', t)}</option>
                </select>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={riskScoreBandFilter}
                  onChange={(e) => {
                    setRiskScoreBandFilter(e.target.value as 'all' | 'low' | 'medium' | 'high');
                    setRiskScorePage(1);
                  }}
                >
                  <option value="all">{getAdminRiskScoreBandFilterLabel('all', t)}</option>
                  <option value="low">{getAdminRiskScoreBandFilterLabel('low', t)}</option>
                  <option value="medium">{getAdminRiskScoreBandFilterLabel('medium', t)}</option>
                  <option value="high">{getAdminRiskScoreBandFilterLabel('high', t)}</option>
                </select>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {getAdminDiagnosticsCopy('count_risk_score', t, { count: totalRiskScoreEvents })}
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
                      <TableHead>{getAdminDiagnosticsCopy('table_captured_at', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_actor', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_phase', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_package', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_band', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_score', t)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isRiskScoreLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('loading_risk_score', t)}
                        </TableCell>
                      </TableRow>
                    )}
                    {!isRiskScoreLoading && riskScoreEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('empty_risk_score', t)}
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
                            {event.actorLabel ?? event.payload.exportedBy ?? event.user_id ?? getAdminDiagnosticsCopy('unknown_actor', t)}
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
                    {getAdminDiagnosticsCopy('pagination_page', t, {
                      page: riskScorePage,
                      totalPages: totalRiskScorePages,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={riskScorePage <= 1}
                      onClick={() => setRiskScorePage((page) => Math.max(1, page - 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_previous', t)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={riskScorePage >= totalRiskScorePages}
                      onClick={() => setRiskScorePage((page) => Math.min(totalRiskScorePages, page + 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_next', t)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">{getAdminDiagnosticsCopy('section_assignment_export', t)}</h4>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleAssignmentExportCsv}>
                    {getAdminDiagnosticsLabel('export_csv', t)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleAssignmentExportAllCsv()}
                    disabled={!dashboardSummary?.readiness.canExportDetailed}
                  >
                    {getAdminDiagnosticsCopy('export_all_csv', t)}
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
                  <option value="all">{getAdminAssignmentPhaseFilterLabel('all', t)}</option>
                  <option value="requested">{getAdminAssignmentPhaseFilterLabel('requested', t)}</option>
                  <option value="succeeded">{getAdminAssignmentPhaseFilterLabel('succeeded', t)}</option>
                  <option value="failed">{getAdminAssignmentPhaseFilterLabel('failed', t)}</option>
                </select>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={assignmentStatusFilter}
                  onChange={(e) => {
                    setAssignmentStatusFilter(e.target.value as 'all' | 'active' | 'completed' | 'cancelled');
                    setAssignmentExportPage(1);
                  }}
                >
                  <option value="all">{getAdminAssignmentStatusFilterLabel('all', t)}</option>
                  <option value="active">{getAdminAssignmentStatusFilterLabel('active', t)}</option>
                  <option value="completed">{getAdminAssignmentStatusFilterLabel('completed', t)}</option>
                  <option value="cancelled">{getAdminAssignmentStatusFilterLabel('cancelled', t)}</option>
                </select>
              </div>
              <div className="mb-3 text-sm text-muted-foreground">
                {getAdminDiagnosticsCopy('count_assignment_export', t, { count: totalAssignmentExportEvents })}
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
                      <TableHead>{getAdminDiagnosticsCopy('table_captured_at', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_actor', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_phase', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_filters', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_rows', t)}</TableHead>
                      <TableHead>{getAdminDiagnosticsCopy('table_error', t)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAssignmentExportLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('loading_assignment_export', t)}
                        </TableCell>
                      </TableRow>
                    )}
                    {!isAssignmentExportLoading && assignmentExportEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminDiagnosticsCopy('empty_assignment_export', t)}
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
                            {event.actorLabel ?? event.payload.exportedBy ?? event.user_id ?? getAdminDiagnosticsCopy('unknown_actor', t)}
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
                    {getAdminDiagnosticsCopy('pagination_page', t, {
                      page: assignmentExportPage,
                      totalPages: totalAssignmentExportPages,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={assignmentExportPage <= 1}
                      onClick={() => setAssignmentExportPage((page) => Math.max(1, page - 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_previous', t)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={assignmentExportPage >= totalAssignmentExportPages}
                      onClick={() => setAssignmentExportPage((page) => Math.min(totalAssignmentExportPages, page + 1))}
                    >
                      {getAdminDiagnosticsCopy('pagination_next', t)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {!isTelemetryLoading && totalTelemetryEvents > telemetryPageSize && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {getAdminDiagnosticsCopy('pagination_page', t, {
                    page: currentPage,
                    totalPages: totalTelemetryPages,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    {getAdminDiagnosticsCopy('pagination_previous', t)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalTelemetryPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalTelemetryPages, p + 1))}
                  >
                    {getAdminDiagnosticsCopy('pagination_next', t)}
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
            {getAdminTabLabel('organizations', t)}
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
            {getAdminTabLabel('users', t)}
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
            {getAdminTabLabel('roles', t)}
          </button>
        </div>

        {/* Organizations Table */}
        {activeTab === 'organizations' && (
          <Card>
            <CardHeader>
              <CardTitle>{getAdminSectionCopy('organizations', 'title', t)}</CardTitle>
              <CardDescription>{getAdminSectionCopy('organizations', 'subtitle', t)}</CardDescription>
            </CardHeader>
            <CardContent>
              {isOrgFormOpen && (
                <div className="mb-4 rounded-lg border p-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <input
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder={getAdminSectionCopy('organizations', 'create_placeholder', t)}
                      value={orgForm.name}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <select
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      value={orgForm.type}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, type: e.target.value as AdminOrgType }))}
                    >
                      {ADMIN_ORG_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {getAdminOrgTypeLabel(type, t)}
                        </option>
                      ))}
                    </select>
                    <input
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder={getAdminSectionCopy('organizations', 'country_placeholder', t)}
                      value={orgForm.country}
                      onChange={(e) => setOrgForm((prev) => ({ ...prev, country: e.target.value }))}
                    />
                    <Button onClick={handleCreateOrganization}>{getAdminActionLabel('create', t)}</Button>
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
                      <TableHead>{getAdminOrganizationsTableColumnLabel('organization', t)}</TableHead>
                      <TableHead>{getAdminOrganizationsTableColumnLabel('type', t)}</TableHead>
                      <TableHead>{getAdminOrganizationsTableColumnLabel('users', t)}</TableHead>
                      <TableHead>{getAdminOrganizationsTableColumnLabel('status', t)}</TableHead>
                      <TableHead>{getAdminOrganizationsTableColumnLabel('created', t)}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          {getAdminOrganizationsLoadingLabel(t)}
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
                            {getAdminOrgTypeLabel(org.type, t)}
                          </Badge>
                        </TableCell>
                        <TableCell>{usersByOrg.get(org.id) ?? 0}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[org.status]}`}>
                            {getAdminOrgStatusLabel(org.status, t)}
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
              <CardTitle>{getAdminSectionCopy('users', 'title', t)}</CardTitle>
              <CardDescription>{getAdminUsersSubtitle(t)}</CardDescription>
            </CardHeader>
            <CardContent>
              {isInviteFormOpen && (
                <div className="mb-4 rounded-lg border p-4">
                  <div className="grid gap-3 md:grid-cols-5">
                    <input
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder={getAdminInvitePlaceholder('name', t)}
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <input
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder={getAdminInvitePlaceholder('email', t)}
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    <select
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      value={inviteForm.organisation_id}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, organisation_id: e.target.value }))}
                    >
                      <option value="">{getAdminInvitePlaceholder('select_org', t)}</option>
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
                      {TENANT_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {getAdminTenantRoleLabel(role, t)}
                        </option>
                      ))}
                    </select>
                    <Button onClick={handleInviteUser}>{getAdminActionLabel('invite', t)}</Button>
                  </div>
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{getAdminUsersTableColumnLabel('user', t)}</TableHead>
                      <TableHead>{getAdminUsersTableColumnLabel('email', t)}</TableHead>
                      <TableHead>{getAdminUsersTableColumnLabel('role', t)}</TableHead>
                      <TableHead>{getAdminUsersTableColumnLabel('organization', t)}</TableHead>
                      <TableHead>{getAdminUsersTableColumnLabel('status', t)}</TableHead>
                      <TableHead>{getAdminUsersTableColumnLabel('last_login', t)}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-muted-foreground">
                          {getAdminUsersLoadingLabel(t)}
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
                            {TENANT_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {getAdminTenantRoleLabel(role, t)}
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
                            {ADMIN_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {getAdminOrgStatusLabel(status, t)}
                              </option>
                            ))}
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
              <CardTitle>{getAdminSectionCopy('roles', 'title', t)}</CardTitle>
              <CardDescription>{getAdminRolesSubtitle(t)}</CardDescription>
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
                      <span className="font-medium">{getAdminTenantRoleLabel(item.role as TenantRole, t)}</span>
                    </div>
                    <Badge variant="outline">{getAdminRolesCanonicalBadge(t)}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {getAdminRbacCommercialPermissionLabel(perm, t)}
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
