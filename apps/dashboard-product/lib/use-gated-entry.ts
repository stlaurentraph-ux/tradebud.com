'use client';

import { useEffect, useState } from 'react';
import { listUsers, subscribeAdminData } from '@/lib/admin-service';

export interface GatedEntryEvent {
  id: string;
  timestamp: string;
  event_type: 'dashboard_gated_entry_attempt';
  payload: {
    tenantId: string;
    gate: 'request_campaigns' | 'annual_reporting';
    role: string;
    feature: 'mvp_gated';
    redirectedPath?: string;
    capturedAt?: string;
  };
}

export interface GatedEntryExportEvent {
  id: string;
  timestamp: string;
  user_id?: string | null;
  event_type: 'dashboard_gated_entry_exported';
  actorLabel?: string;
  payload: {
    tenantId: string;
    gate: 'request_campaigns' | 'annual_reporting' | 'all';
    fromHours: number;
    sort: 'desc' | 'asc';
    rowCount: number;
    rowLimit: number;
    truncated: boolean;
    format: 'csv';
    exportedBy?: string | null;
    exportedAt?: string;
  };
}

export interface AssignmentExportEvent {
  id: string;
  timestamp: string;
  user_id?: string | null;
  event_type:
    | 'plot_assignment_export_requested'
    | 'plot_assignment_export_succeeded'
    | 'plot_assignment_export_failed';
  actorLabel?: string;
  payload: {
    plotId: string;
    tenantId: string;
    exportedBy?: string | null;
    rowCount?: number | null;
    status: 'all' | 'active' | 'completed' | 'cancelled';
    fromDays: number;
    agentUserId?: string | null;
    error?: string | null;
  };
}

export interface AssignmentExportFilterOptions extends Omit<UseGatedEntryOptions, 'gate'> {
  phase?: 'all' | 'requested' | 'succeeded' | 'failed';
  status?: 'all' | 'active' | 'completed' | 'cancelled';
}

export interface RiskScoreEvent {
  id: string;
  timestamp: string;
  user_id?: string | null;
  event_type:
    | 'dds_package_risk_score_requested'
    | 'dds_package_risk_score_evaluated'
    | 'dds_package_risk_score_low'
    | 'dds_package_risk_score_medium'
    | 'dds_package_risk_score_high';
  actorLabel?: string;
  payload: {
    packageId: string;
    tenantId: string;
    exportedBy?: string | null;
    provider?: 'internal_v1' | null;
    score?: number | null;
    band?: 'low' | 'medium' | 'high' | null;
    reasonCount?: number | null;
    scoredAt?: string | null;
  };
}

export interface RiskScoreFilterOptions extends Omit<UseGatedEntryOptions, 'gate'> {
  phase?: 'all' | 'requested' | 'evaluated' | 'low' | 'medium' | 'high';
  band?: 'all' | 'low' | 'medium' | 'high';
}

export interface FilingActivityEvent {
  id: string;
  timestamp: string;
  user_id?: string | null;
  event_type:
    | 'dds_package_generation_requested'
    | 'dds_package_generation_generated'
    | 'dds_package_submission_requested'
    | 'dds_package_submission_accepted'
    | 'dds_package_submission_replayed';
  actorLabel?: string;
  payload: {
    packageId: string;
    tenantId: string;
    exportedBy?: string | null;
    status?: 'package_generated' | null;
    artifactVersion?: 'v1' | null;
    lotCount?: number | null;
    generatedAt?: string | null;
    idempotencyKey?: string | null;
    submissionState?: 'submitted' | null;
    tracesReference?: string | null;
    replayed?: boolean | null;
    persistedAt?: string | null;
  };
}

export interface FilingActivityFilterOptions extends Omit<UseGatedEntryOptions, 'gate'> {
  phase?: 'all' | 'generation_requested' | 'generation_generated' | 'submission_requested' | 'submission_accepted' | 'submission_replayed';
}

export interface ChatThreadActivityEvent {
  id: string;
  timestamp: string;
  user_id?: string | null;
  event_type:
    | 'chat_thread_created'
    | 'chat_thread_message_posted'
    | 'chat_thread_message_replayed'
    | 'chat_thread_resolved'
    | 'chat_thread_reopened'
    | 'chat_thread_archived';
  actorLabel?: string;
  payload: {
    tenantId: string;
    threadId: string;
    recordId?: string | null;
    messageId: string;
    idempotencyKey?: string | null;
    actorRole: 'farmer' | 'agent' | 'exporter';
    actorUserId?: string | null;
    capturedAt?: string | null;
  };
}

export interface ChatThreadActivityFilterOptions extends Omit<UseGatedEntryOptions, 'gate'> {
  phase?: 'all' | 'created' | 'posted' | 'replayed' | 'resolved' | 'reopened' | 'archived';
}

export interface WorkflowActivityEvent {
  id: string;
  timestamp: string;
  user_id?: string | null;
  event_type:
    | 'workflow_template_created'
    | 'workflow_stage_transitioned'
    | 'workflow_stage_sla_warning'
    | 'workflow_stage_sla_breached'
    | 'workflow_stage_sla_escalated'
    | 'workflow_stage_sla_recovered';
  actorLabel?: string;
  payload: {
    tenantId: string;
    templateId: string;
    stageId?: string | null;
    transitionId?: string | null;
    fromStatus?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | null;
    toStatus?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | null;
    slaState?: 'on_track' | 'warning' | 'breached' | 'escalated' | null;
    actorRole: 'farmer' | 'agent' | 'exporter';
    actorUserId?: string | null;
    capturedAt?: string | null;
  };
}

export interface WorkflowActivityFilterOptions extends Omit<UseGatedEntryOptions, 'gate'> {
  phase?:
    | 'all'
    | 'template_created'
    | 'stage_transitioned'
    | 'sla_warning'
    | 'sla_breached'
    | 'sla_escalated'
    | 'sla_recovered';
  slaState?: 'all' | 'on_track' | 'warning' | 'breached' | 'escalated';
}

export interface WebhookRegistrationEvent {
  id: string;
  timestamp: string;
  event_type: 'integration_webhook_registered';
  payload: {
    tenantId: string;
    webhookId: string;
    endpointUrl: string;
    eventTypes: string[];
    secretRotationPolicy: string;
    actorRole: 'farmer' | 'agent' | 'exporter';
    actorUserId?: string | null;
    capturedAt?: string | null;
    status?: 'registered' | null;
  };
}

export interface WebhookDeliveryEvent {
  id: string;
  timestamp: string;
  event_type:
    | 'integration_delivery_attempt_queued'
    | 'integration_delivery_succeeded'
    | 'integration_delivery_retryable_failed'
    | 'integration_delivery_terminal_failed';
  payload: {
    tenantId: string;
    webhookId: string;
    deliveryId: string;
    attempt: number;
    status: 'queued' | 'succeeded' | 'retryable_failed' | 'terminal_failed';
    latencyMs?: number | null;
    errorClass?: string | null;
    capturedAt?: string | null;
  };
}

export interface DashboardDiagnosticsSummary {
  tenantId: string;
  fromHours: number;
  totalDiagnostics: number;
  counters: {
    gatedEntryAttempts: number;
    assignmentExportEvents: number;
    riskScoreEvents: number;
    filingActivityEvents: number;
    chatActivityEvents: number;
  };
  breakdown: {
    assignmentPhase: { requested: number; succeeded: number; failed: number };
    assignmentStatus: { active: number; completed: number; cancelled: number };
    riskBand: { low: number; medium: number; high: number };
    filingFamily: { generation: number; submission: number };
    chatPhase: { created: number; posted: number; replayed: number; resolved: number; reopened: number; archived: number };
  };
  readiness: {
    hasAnyDiagnostics: boolean;
    canExportDetailed: boolean;
    latestEventAt: string | null;
  };
}

interface GatedEntryListResponse {
  items?:
    | GatedEntryEvent[]
    | GatedEntryExportEvent[]
    | AssignmentExportEvent[]
    | RiskScoreEvent[]
    | FilingActivityEvent[]
    | ChatThreadActivityEvent[]
    | WorkflowActivityEvent[]
    | WebhookRegistrationEvent[]
    | WebhookDeliveryEvent[];
  total?: number;
  limit?: number;
  offset?: number;
}

const ACTOR_DIRECTORY_CACHE_TTL_MS = 60_000;
let actorDirectoryCache:
  | {
      fetchedAt: number;
      userMap: Map<string, string>;
    }
  | null = null;
const exportHookDebugState = {
  mutationEvents: 0,
  debounceFlushes: 0,
  fetchLoads: 0,
};
const telemetryDebugCounterListeners = new Set<() => void>();

function isTelemetryDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem('tb:debug:telemetry') === '1';
}

export function getTelemetryDebugEnabled(): boolean {
  return isTelemetryDebugEnabled();
}

export function setTelemetryDebugEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) {
    window.sessionStorage.setItem('tb:debug:telemetry', '1');
  } else {
    window.sessionStorage.removeItem('tb:debug:telemetry');
  }
}

export function getTelemetryDebugCounters(): {
  mutationEvents: number;
  debounceFlushes: number;
  fetchLoads: number;
} {
  return { ...exportHookDebugState };
}

export function subscribeTelemetryDebugCounters(listener: () => void): () => void {
  telemetryDebugCounterListeners.add(listener);
  return () => telemetryDebugCounterListeners.delete(listener);
}

function emitTelemetryDebugCounterUpdate() {
  telemetryDebugCounterListeners.forEach((listener) => listener());
}

function logExportHookDebugState(reason: string) {
  if (!isTelemetryDebugEnabled()) return;
  console.debug('[telemetry-export-hook]', reason, {
    ...exportHookDebugState,
  });
}

async function getActorDirectoryMap(forceRefresh = false): Promise<Map<string, string>> {
  const now = Date.now();
  if (!forceRefresh && actorDirectoryCache && now - actorDirectoryCache.fetchedAt < ACTOR_DIRECTORY_CACHE_TTL_MS) {
    return actorDirectoryCache.userMap;
  }
  const users = await listUsers().catch(() => []);
  const userMap = new Map(users.map((user) => [user.id, `${user.name} (${user.email})`]));
  actorDirectoryCache = { fetchedAt: now, userMap };
  return userMap;
}

async function resolveActorLabels(ids: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(ids.filter((id) => id && id.trim().length > 0)));
  if (uniqueIds.length === 0) return new Map();
  const params = new URLSearchParams();
  params.set('eventKind', 'actors');
  params.set('ids', uniqueIds.join(','));
  const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    return new Map();
  }
  const body = (await response.json().catch(() => ({}))) as {
    actors?: Record<string, string>;
  };
  return new Map(Object.entries(body.actors ?? {}));
}

export interface UseGatedEntryOptions {
  gate?: 'all' | 'request_campaigns' | 'annual_reporting';
  fromHours?: number;
  page?: number;
  pageSize?: number;
  sort?: 'desc' | 'asc';
}

function getAuthHeaders(): Record<string, string> | undefined {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('tracebud_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function useGatedEntryEvents(options?: UseGatedEntryOptions) {
  const [events, setEvents] = useState<GatedEntryEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const gate = options?.gate;
        if (gate && gate !== 'all') params.set('gate', gate);
        if (options?.fromHours) params.set('fromHours', String(options.fromHours));
        if (options?.pageSize) params.set('limit', String(options.pageSize));
        if (options?.page && options?.pageSize) {
          params.set('offset', String((options.page - 1) * options.pageSize));
        }
        if (options?.sort) params.set('sort', options.sort);
        const query = params.toString();
        const response = await fetch(`/api/analytics/gated-entry${query ? `?${query}` : ''}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Telemetry API unavailable.');
        }
        const body = (await response.json()) as GatedEntryListResponse | GatedEntryEvent[];
        if (!cancelled) {
          if (Array.isArray(body)) {
            setEvents(body);
            setTotal(body.length);
          } else {
            setEvents(body.items ?? []);
            setTotal(body.total ?? 0);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load gated-entry telemetry.');
          setEvents([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [options?.fromHours, options?.gate, options?.page, options?.pageSize, options?.sort, reloadTick]);

  return { events, total, isLoading, error, reload };
}

export function useGatedEntryExportEvents(options?: Omit<UseGatedEntryOptions, 'gate'>) {
  const [events, setEvents] = useState<GatedEntryExportEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => {
    actorDirectoryCache = null;
    setReloadTick((tick) => tick + 1);
    emitTelemetryDebugCounterUpdate();
    logExportHookDebugState('manual-reload');
  };

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeAdminData(() => {
      exportHookDebugState.mutationEvents += 1;
      emitTelemetryDebugCounterUpdate();
      actorDirectoryCache = null;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        exportHookDebugState.debounceFlushes += 1;
        emitTelemetryDebugCounterUpdate();
        setReloadTick((tick) => tick + 1);
        logExportHookDebugState('mutation-debounced-reload');
      }, 200);
    });
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      exportHookDebugState.fetchLoads += 1;
      emitTelemetryDebugCounterUpdate();
      logExportHookDebugState('fetch-start');
      setIsLoading(true);
      setError(null);
      try {
        const userMap = await getActorDirectoryMap();
        const params = new URLSearchParams();
        params.set('eventKind', 'exports');
        if (options?.fromHours) params.set('fromHours', String(options.fromHours));
        if (options?.pageSize) params.set('limit', String(options.pageSize));
        if (options?.page && options?.pageSize) {
          params.set('offset', String((options.page - 1) * options.pageSize));
        }
        if (options?.sort) params.set('sort', options.sort);
        const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Telemetry export activity API unavailable.');
        }
        const body = (await response.json()) as GatedEntryListResponse;
        if (!cancelled) {
        const baseEvents = (body.items as GatedEntryExportEvent[]) ?? [];
        const actorIds = baseEvents
          .map((event) =>
            event.payload.exportedBy?.startsWith('user:')
              ? event.payload.exportedBy.slice('user:'.length)
              : event.user_id ?? '',
          )
          .filter((id) => id.length > 0);
        const backendActorMap = await resolveActorLabels(actorIds);
        const exportEvents = baseEvents.map((event) => {
            if (event.payload.exportedBy && !event.payload.exportedBy.startsWith('user:')) {
              return { ...event, actorLabel: event.payload.exportedBy };
            }
            const derivedUserId = event.payload.exportedBy?.startsWith('user:')
              ? event.payload.exportedBy.slice('user:'.length)
              : event.user_id ?? undefined;
            if (!derivedUserId) return { ...event, actorLabel: 'unknown' };
            return {
              ...event,
              actorLabel: backendActorMap.get(derivedUserId) ?? userMap.get(derivedUserId) ?? `user:${derivedUserId}`,
            };
          });
          setEvents(exportEvents);
          setTotal(body.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load export activity telemetry.');
          setEvents([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [options?.fromHours, options?.page, options?.pageSize, options?.sort, reloadTick]);

  return { events, total, isLoading, error, reload };
}

export function useAssignmentExportEvents(options?: AssignmentExportFilterOptions) {
  const [events, setEvents] = useState<AssignmentExportEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userMap = await getActorDirectoryMap();
        const params = new URLSearchParams();
        params.set('eventKind', 'assignment_exports');
        if (options?.fromHours) params.set('fromHours', String(options.fromHours));
        if (options?.pageSize) params.set('limit', String(options.pageSize));
        if (options?.page && options?.pageSize) {
          params.set('offset', String((options.page - 1) * options.pageSize));
        }
        if (options?.sort) params.set('sort', options.sort);
        if (options?.phase && options.phase !== 'all') params.set('phase', options.phase);
        if (options?.status && options.status !== 'all') params.set('status', options.status);
        const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Assignment export activity API unavailable.');
        }
        const body = (await response.json()) as GatedEntryListResponse;
        if (!cancelled) {
          const assignmentEvents = ((body.items ?? []) as AssignmentExportEvent[]).map((event) => {
            const userId = event.user_id ?? undefined;
            if (!userId) return { ...event, actorLabel: event.payload.exportedBy ?? 'unknown' };
            return {
              ...event,
              actorLabel: userMap.get(userId) ?? event.payload.exportedBy ?? `user:${userId}`,
            };
          });
          setEvents(assignmentEvents);
          setTotal(body.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load assignment export activity.');
          setEvents([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [options?.fromHours, options?.page, options?.pageSize, options?.sort, options?.phase, options?.status, reloadTick]);

  return { events, total, isLoading, error, reload };
}

export function useRiskScoreEvents(options?: RiskScoreFilterOptions) {
  const [events, setEvents] = useState<RiskScoreEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userMap = await getActorDirectoryMap();
        const params = new URLSearchParams();
        params.set('eventKind', 'risk_scores');
        if (options?.fromHours) params.set('fromHours', String(options.fromHours));
        if (options?.pageSize) params.set('limit', String(options.pageSize));
        if (options?.page && options?.pageSize) {
          params.set('offset', String((options.page - 1) * options.pageSize));
        }
        if (options?.sort) params.set('sort', options.sort);
        if (options?.phase && options.phase !== 'all') params.set('phase', options.phase);
        if (options?.band && options.band !== 'all') params.set('band', options.band);

        const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Risk-score activity API unavailable.');
        }
        const body = (await response.json()) as GatedEntryListResponse;
        if (!cancelled) {
          const riskEvents = ((body.items ?? []) as RiskScoreEvent[]).map((event) => {
            const userId = event.user_id ?? undefined;
            if (!userId) return { ...event, actorLabel: event.payload.exportedBy ?? 'unknown' };
            return {
              ...event,
              actorLabel: userMap.get(userId) ?? event.payload.exportedBy ?? `user:${userId}`,
            };
          });
          setEvents(riskEvents);
          setTotal(body.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load risk-score activity.');
          setEvents([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [options?.fromHours, options?.page, options?.pageSize, options?.sort, options?.phase, options?.band, reloadTick]);

  return { events, total, isLoading, error, reload };
}

export function useFilingActivityEvents(options?: FilingActivityFilterOptions) {
  const [events, setEvents] = useState<FilingActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userMap = await getActorDirectoryMap();
        const params = new URLSearchParams();
        params.set('eventKind', 'filing_activity');
        if (options?.fromHours) params.set('fromHours', String(options.fromHours));
        if (options?.pageSize) params.set('limit', String(options.pageSize));
        if (options?.page && options?.pageSize) {
          params.set('offset', String((options.page - 1) * options.pageSize));
        }
        if (options?.sort) params.set('sort', options.sort);
        if (options?.phase && options.phase !== 'all') params.set('phase', options.phase);
        const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Filing activity API unavailable.');
        }
        const body = (await response.json()) as GatedEntryListResponse;
        if (!cancelled) {
          const filingEvents = ((body.items ?? []) as FilingActivityEvent[]).map((event) => {
            const userId = event.user_id ?? undefined;
            if (!userId) return { ...event, actorLabel: event.payload.exportedBy ?? 'unknown' };
            return {
              ...event,
              actorLabel: userMap.get(userId) ?? event.payload.exportedBy ?? `user:${userId}`,
            };
          });
          setEvents(filingEvents);
          setTotal(body.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load filing activity.');
          setEvents([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [options?.fromHours, options?.page, options?.pageSize, options?.sort, options?.phase, reloadTick]);

  return { events, total, isLoading, error, reload };
}

export function useChatThreadActivityEvents(options?: ChatThreadActivityFilterOptions) {
  const [events, setEvents] = useState<ChatThreadActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userMap = await getActorDirectoryMap();
        const params = new URLSearchParams();
        params.set('eventKind', 'chat_threads');
        if (options?.fromHours) params.set('fromHours', String(options.fromHours));
        if (options?.pageSize) params.set('limit', String(options.pageSize));
        if (options?.page && options?.pageSize) {
          params.set('offset', String((options.page - 1) * options.pageSize));
        }
        if (options?.sort) params.set('sort', options.sort);
        if (options?.phase && options.phase !== 'all') params.set('phase', options.phase);
        const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Chat-thread diagnostics API unavailable.');
        }
        const body = (await response.json()) as GatedEntryListResponse;
        if (!cancelled) {
          const chatEvents = ((body.items ?? []) as ChatThreadActivityEvent[]).map((event) => {
            const userId = event.user_id ?? event.payload.actorUserId ?? undefined;
            return {
              ...event,
              actorLabel: userId ? userMap.get(userId) ?? `user:${userId}` : 'unknown',
            };
          });
          setEvents(chatEvents);
          setTotal(body.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load chat-thread diagnostics.');
          setEvents([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [options?.fromHours, options?.page, options?.pageSize, options?.sort, options?.phase, reloadTick]);

  return { events, total, isLoading, error, reload };
}

export function useDashboardDiagnosticsSummary(options?: Omit<UseGatedEntryOptions, 'gate' | 'page' | 'pageSize' | 'sort'>) {
  const [summary, setSummary] = useState<DashboardDiagnosticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('eventKind', 'dashboard_summary');
        if (options?.fromHours) params.set('fromHours', String(options.fromHours));
        const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Dashboard diagnostics summary API unavailable.');
        }
        const body = (await response.json()) as DashboardDiagnosticsSummary;
        if (!cancelled) setSummary(body);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard diagnostics summary.');
          setSummary(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [options?.fromHours, reloadTick]);

  return { summary, isLoading, error, reload };
}

export function useWorkflowActivityEvents(options?: WorkflowActivityFilterOptions) {
  const [events, setEvents] = useState<WorkflowActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userMap = await getActorDirectoryMap();
        const params = new URLSearchParams();
        params.set('eventKind', 'workflow_activity');
        if (options?.fromHours) params.set('fromHours', String(options.fromHours));
        if (options?.pageSize) params.set('limit', String(options.pageSize));
        if (options?.page && options?.pageSize) {
          params.set('offset', String((options.page - 1) * options.pageSize));
        }
        if (options?.sort) params.set('sort', options.sort);
        if (options?.phase && options.phase !== 'all') params.set('phase', options.phase);
        if (options?.slaState && options.slaState !== 'all') params.set('slaState', options.slaState);
        const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Workflow diagnostics API unavailable.');
        }
        const body = (await response.json()) as GatedEntryListResponse;
        if (!cancelled) {
          const workflowEvents = ((body.items ?? []) as WorkflowActivityEvent[]).map((event) => {
            const userId = event.user_id ?? event.payload.actorUserId ?? undefined;
            return {
              ...event,
              actorLabel: userId ? userMap.get(userId) ?? `user:${userId}` : 'unknown',
            };
          });
          setEvents(workflowEvents);
          setTotal(body.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load workflow diagnostics.');
          setEvents([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [options?.fromHours, options?.page, options?.pageSize, options?.sort, options?.phase, options?.slaState, reloadTick]);

  return { events, total, isLoading, error, reload };
}

export function useWebhookRegistrationEvents(options?: Omit<UseGatedEntryOptions, 'gate' | 'sort'>) {
  const [events, setEvents] = useState<WebhookRegistrationEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('eventKind', 'webhooks');
        if (options?.pageSize) params.set('limit', String(options.pageSize));
        if (options?.page && options?.pageSize) {
          params.set('offset', String((options.page - 1) * options.pageSize));
        }
        const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Webhook registration diagnostics API unavailable.');
        }
        const body = (await response.json()) as GatedEntryListResponse;
        if (!cancelled) {
          setEvents((body.items ?? []) as WebhookRegistrationEvent[]);
          setTotal(body.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load webhook registration diagnostics.');
          setEvents([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [options?.page, options?.pageSize, reloadTick]);

  return { events, total, isLoading, error, reload };
}

export function useWebhookDeliveryEvents(
  webhookId: string | null,
  options?: Omit<UseGatedEntryOptions, 'gate' | 'sort'>,
) {
  const [events, setEvents] = useState<WebhookDeliveryEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!webhookId) {
        setEvents([]);
        setTotal(0);
        setError(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('eventKind', 'webhook_deliveries');
        params.set('webhookId', webhookId);
        if (options?.pageSize) params.set('limit', String(options.pageSize));
        if (options?.page && options?.pageSize) {
          params.set('offset', String((options.page - 1) * options.pageSize));
        }
        const response = await fetch(`/api/analytics/gated-entry?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Webhook delivery diagnostics API unavailable.');
        }
        const body = (await response.json()) as GatedEntryListResponse;
        if (!cancelled) {
          setEvents((body.items ?? []) as WebhookDeliveryEvent[]);
          setTotal(body.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load webhook delivery diagnostics.');
          setEvents([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [webhookId, options?.page, options?.pageSize, reloadTick]);

  return { events, total, isLoading, error, reload };
}
