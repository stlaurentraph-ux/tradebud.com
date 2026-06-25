import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import type { FieldAppRole } from '@/features/auth/fieldRolePermissionRegistry';
import {
  isFieldAgentRole,
  resolveFieldAppSessionRole,
} from '@/features/enumeration/fieldAppSessionRole';
import type {
  FieldRosterEntry,
  ProvisionalMemberInput,
} from '@/features/enumeration/fieldRosterTypes';
import { findMemberDedupMatches } from '@/features/enumeration/memberDedup';
import { validateProvisionalMemberInput } from '@/features/enumeration/validateProvisionalMember';
import { fetchFieldEnumerationPack } from '@/features/enumeration/fetchFieldEnumerationPack';
import { mergeEnumerationPackIntoRoster } from '@/features/enumeration/applyEnumerationPackToRoster';
import { syncAllProvisionalRosterMembers } from '@/features/enumeration/syncProvisionalRosterToServer';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import {
  loadFieldRosterEntries,
  persistFieldRosterEntry,
  updateFieldRosterMemberStatus,
  type FieldRosterEntryRow,
} from '@/features/state/persistence';
import { getSetting, setSetting } from '@/features/state/persistence';

const ACTIVE_MEMBER_SETTING_KEY = 'enumeration_active_member_id';

function createLocalFarmerId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function rowToEntry(row: FieldRosterEntryRow): FieldRosterEntry {
  return { ...row };
}

type EnumerationContextValue = {
  fieldAppRole: FieldAppRole | null;
  isEnumerationMode: boolean;
  roster: FieldRosterEntry[];
  activeMember: FieldRosterEntry | null;
  rosterLoading: boolean;
  refreshRoster: () => Promise<void>;
  selectMember: (farmerId: string) => Promise<void>;
  clearActiveMember: () => Promise<void>;
  createProvisionalMember: (
    input: ProvisionalMemberInput,
    options?: { allowDuplicate?: boolean },
  ) => Promise<
    | { ok: true; entry: FieldRosterEntry }
    | { ok: false; error: 'validation' | 'duplicate'; validationError?: string; matches?: ReturnType<typeof findMemberDedupMatches> }
  >;
  producerContactIdForFarmer: (farmerId: string) => string | null;
  assignmentIdForFarmer: (farmerId: string) => string | null;
  recordPlotCapturedForMember: (
    farmerId: string,
    options?: { captureIntent?: string | null },
  ) => Promise<void>;
  prefetchRoster: (campaignId?: string | null) => Promise<
    | { ok: true; memberCount: number; inserted: number; updated: number }
    | { ok: false; error: 'offline' | 'auth' | 'server'; message?: string }
  >;
  syncProvisionalMembers: () => Promise<{ synced: number; failed: number }>;
  packPrefetching: boolean;
};

const EnumerationContext = createContext<EnumerationContextValue | undefined>(undefined);

export function EnumerationProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, fieldAppRole, refreshAuth } = useSignInSheet();
  const [roster, setRoster] = useState<FieldRosterEntry[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [packPrefetching, setPackPrefetching] = useState(false);

  const isEnumerationMode = isSignedIn && isFieldAgentRole(fieldAppRole);

  const refreshRoster = useCallback(async () => {
    setRosterLoading(true);
    try {
      const rows = await loadFieldRosterEntries();
      setRoster(rows.map(rowToEntry));
      const savedActive = (await getSetting(ACTIVE_MEMBER_SETTING_KEY))?.trim() || null;
      if (savedActive && rows.some((row) => row.farmerId === savedActive)) {
        setActiveMemberId(savedActive);
      } else if (savedActive) {
        setActiveMemberId(null);
        await setSetting(ACTIVE_MEMBER_SETTING_KEY, '');
      }
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEnumerationMode) {
      setActiveMemberId(null);
      return;
    }
    trackEvent(ANALYTICS_EVENTS.ENUMERATION_MODE_ENTERED);
    void refreshRoster();
  }, [isEnumerationMode, refreshRoster]);

  const activeMember = useMemo(
    () => roster.find((entry) => entry.farmerId === activeMemberId) ?? null,
    [roster, activeMemberId],
  );

  const selectMember = useCallback(
    async (farmerId: string) => {
      const id = farmerId.trim();
      if (!id) return;
      const entry = roster.find((row) => row.farmerId === id);
      if (!entry) return;
      setActiveMemberId(id);
      await setSetting(ACTIVE_MEMBER_SETTING_KEY, id);
      await updateFieldRosterMemberStatus(id, 'in_progress');
      await refreshRoster();
      trackEvent(ANALYTICS_EVENTS.ENUMERATION_MEMBER_SELECTED, {
        farmerId: id,
        source: entry.source,
      });
    },
    [refreshRoster, roster],
  );

  const clearActiveMember = useCallback(async () => {
    setActiveMemberId(null);
    await setSetting(ACTIVE_MEMBER_SETTING_KEY, '');
  }, []);

  const createProvisionalMember = useCallback(
    async (
      input: ProvisionalMemberInput,
      options?: { allowDuplicate?: boolean },
    ): Promise<
      | { ok: true; entry: FieldRosterEntry }
      | {
          ok: false;
          error: 'validation' | 'duplicate';
          validationError?: string;
          matches?: ReturnType<typeof findMemberDedupMatches>;
        }
    > => {
      const validationError = validateProvisionalMemberInput(input);
      if (validationError) {
        return { ok: false, error: 'validation', validationError };
      }

      const matches = findMemberDedupMatches(input, roster);
      if (matches.length > 0 && !options?.allowDuplicate) {
        trackEvent(ANALYTICS_EVENTS.ENUMERATION_DUPLICATE_WARNING_SHOWN, {
          matchCount: matches.length,
          topReason: matches[0]?.reason,
        });
        return { ok: false, error: 'duplicate', matches };
      }

      const now = Date.now();
      const farmerId = createLocalFarmerId();
      const entry: FieldRosterEntryRow = {
        farmerId,
        source: 'provisional',
        fullName: input.fullName.trim(),
        village: input.village.trim(),
        phone: input.phone?.trim() || null,
        nationalId: input.nationalId?.trim() || null,
        email: input.email?.trim() || null,
        producerContactId: null,
        campaignId: null,
        assignmentId: null,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      await persistFieldRosterEntry(entry);
      await refreshRoster();
      await selectMember(farmerId);
      trackEvent(ANALYTICS_EVENTS.ENUMERATION_PROVISIONAL_CREATED, { farmerId });
      return { ok: true, entry: rowToEntry(entry) };
    },
    [refreshRoster, roster, selectMember],
  );

  const producerContactIdForFarmer = useCallback(
    (farmerId: string) => {
      return roster.find((entry) => entry.farmerId === farmerId.trim())?.producerContactId ?? null;
    },
    [roster],
  );

  const assignmentIdForFarmer = useCallback(
    (farmerId: string) => {
      return roster.find((entry) => entry.farmerId === farmerId.trim())?.assignmentId ?? null;
    },
    [roster],
  );

  const recordPlotCapturedForMember = useCallback(
    async (farmerId: string, options?: { captureIntent?: string | null }) => {
      const id = farmerId.trim();
      if (!id) return;
      await updateFieldRosterMemberStatus(id, 'in_progress');
      await refreshRoster();
      trackEvent(ANALYTICS_EVENTS.ENUMERATION_PLOT_COMPLETED, {
        farmerId: id,
        captureIntent: options?.captureIntent ?? null,
        campaignId: roster.find((entry) => entry.farmerId === id)?.campaignId ?? null,
      });
    },
    [refreshRoster, roster],
  );

  const prefetchRoster = useCallback(
    async (campaignId?: string | null) => {
      if (!isSignedIn) {
        return { ok: false as const, error: 'auth' as const };
      }
      setPackPrefetching(true);
      try {
        const response = await fetchFieldEnumerationPack(campaignId);
        if (!response.ok) {
          if (response.reason === 'no_access_token') {
            return { ok: false as const, error: 'auth' as const, message: response.message };
          }
          return { ok: false as const, error: 'server' as const, message: response.message };
        }
        const mergeResult = await mergeEnumerationPackIntoRoster(response.pack);
        await refreshRoster();
        trackEvent(ANALYTICS_EVENTS.ENUMERATION_ROSTER_PREFETCHED, {
          campaignId: response.pack.campaignId,
          memberCount: response.pack.members.length,
          inserted: mergeResult.inserted,
          updated: mergeResult.updated,
        });
        return {
          ok: true as const,
          memberCount: response.pack.members.length,
          inserted: mergeResult.inserted,
          updated: mergeResult.updated,
        };
      } finally {
        setPackPrefetching(false);
      }
    },
    [isSignedIn, refreshRoster],
  );

  const syncProvisionalMembers = useCallback(async () => {
    const result = await syncAllProvisionalRosterMembers();
    await refreshRoster();
    return { synced: result.synced, failed: result.failed };
  }, [refreshRoster]);

  useEffect(() => {
    if (!isEnumerationMode || !isSignedIn) return;
    void prefetchRoster().catch(() => undefined);
    void syncProvisionalMembers().catch(() => undefined);
  }, [isEnumerationMode, isSignedIn, prefetchRoster, syncProvisionalMembers]);

  const value = useMemo(
    (): EnumerationContextValue => ({
      fieldAppRole,
      isEnumerationMode,
      roster,
      activeMember,
      rosterLoading,
      refreshRoster,
      selectMember,
      clearActiveMember,
      createProvisionalMember,
      producerContactIdForFarmer,
      assignmentIdForFarmer,
      recordPlotCapturedForMember,
      prefetchRoster,
      syncProvisionalMembers,
      packPrefetching,
    }),
    [
      fieldAppRole,
      isEnumerationMode,
      roster,
      activeMember,
      rosterLoading,
      refreshRoster,
      selectMember,
      clearActiveMember,
      createProvisionalMember,
      producerContactIdForFarmer,
      assignmentIdForFarmer,
      recordPlotCapturedForMember,
      prefetchRoster,
      syncProvisionalMembers,
      packPrefetching,
    ],
  );

  return <EnumerationContext.Provider value={value}>{children}</EnumerationContext.Provider>;
}

export function useEnumeration(): EnumerationContextValue {
  const ctx = useContext(EnumerationContext);
  if (!ctx) {
    throw new Error('useEnumeration must be used within EnumerationProvider');
  }
  return ctx;
}

/** Safe hook for screens that may render outside enumeration-specific flows. */
export function useEnumerationOptional(): EnumerationContextValue | null {
  return useContext(EnumerationContext) ?? null;
}

export async function refreshFieldAppRoleForTests(): Promise<FieldAppRole | null> {
  return resolveFieldAppSessionRole();
}
