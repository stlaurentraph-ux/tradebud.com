'use client';

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, ChevronDown, Loader2, Package, QrCode, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildPackageCreateHref } from '@/lib/harvest-capture-policy';
import { parseDeliveryIntakeRef } from '@/lib/delivery-intake-qr';
import {
  listTenantHarvestVouchers,
  lookupTenantIntakeByRef,
  type TenantHarvestVoucher,
} from '@/lib/harvest-voucher-client';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { getHarvestReceiveDeliveryCopy } from '@/lib/workflow-terminology-labels';
import { trackDashboardEvent, DASHBOARD_EVENTS } from '@/lib/observability/analytics';
import { DeliveryHandoffDialog } from '@/components/harvests/delivery-handoff-dialog';
import { VoucherQrScannerDialog } from '@/components/harvests/voucher-qr-scanner-dialog';
import { cn } from '@/lib/utils';

function formatKg(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString()} kg`;
}

type IntakeSource = 'scan' | 'paste' | 'auto_claim';

type PendingHandoff = {
  intakeRef: string;
  hits: TenantHarvestVoucher[];
  source: IntakeSource;
  kind: 'voucher' | 'trip';
};

type HarvestReceiveDeliveryPanelProps = {
  initialClaimRef?: string | null;
};

export function HarvestReceiveDeliveryPanel({ initialClaimRef = null }: HarvestReceiveDeliveryPanelProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const role = user?.active_role;
  const copy = useCallback(
    (field: Parameters<typeof getHarvestReceiveDeliveryCopy>[0], values?: Record<string, string | number>) =>
      getHarvestReceiveDeliveryCopy(field, t, values, role),
    [role, t],
  );
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<TenantHarvestVoucher[]>([]);
  const [qrInput, setQrInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stagedIds, setStagedIds] = useState<string[]>([]);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [pendingHandoff, setPendingHandoff] = useState<PendingHandoff | null>(null);
  const autoClaimHandled = useRef<string | null>(null);
  const [resolvedClaimRef, setResolvedClaimRef] = useState<string | null>(initialClaimRef?.trim() || null);

  useEffect(() => {
    if (initialClaimRef?.trim()) {
      setResolvedClaimRef(initialClaimRef.trim());
      return;
    }
    if (typeof window === 'undefined') return;
    const claim = new URLSearchParams(window.location.search).get('claim')?.trim();
    if (claim) setResolvedClaimRef(claim);
  }, [initialClaimRef]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    void listTenantHarvestVouchers()
      .then((rows) => {
        if (!cancelled) setVouchers(rows);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load vouchers.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stagedVouchers = useMemo(
    () => vouchers.filter((voucher) => stagedIds.includes(voucher.id)),
    [stagedIds, vouchers],
  );

  const directedInbox = useMemo(
    () =>
      vouchers.filter(
        (voucher) =>
          voucher.directed_to_tenant === true &&
          voucher.eligible_for_package &&
          !stagedIds.includes(voucher.id),
      ),
    [stagedIds, vouchers],
  );

  const availableVouchers = useMemo(
    () =>
      vouchers.filter(
        (voucher) =>
          voucher.eligible_for_package &&
          !stagedIds.includes(voucher.id) &&
          voucher.directed_to_tenant !== true,
      ),
    [stagedIds, vouchers],
  );

  const filteredAvailable = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return availableVouchers.slice(0, 6);
    return availableVouchers
      .filter((voucher) => {
        const haystack = [
          voucher.qr_code_ref,
          voucher.plot_name,
          voucher.farmer_id,
          voucher.plot_id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [availableVouchers, searchQuery]);

  const stagedTotalKg = useMemo(
    () => stagedVouchers.reduce((sum, voucher) => sum + (voucher.kg ?? 0), 0),
    [stagedVouchers],
  );

  const stageVoucher = useCallback(
    (voucher: TenantHarvestVoucher, source: 'inbox' | 'scan' | 'browse' | 'auto_claim', options?: { announce?: boolean }) => {
      if (!voucher.eligible_for_package) {
        toast.error(copy('ineligible_toast'));
        trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_CLAIM_FAILURE, {
          reason: 'ineligible',
          source,
          qrRef: voucher.qr_code_ref,
        });
        return false;
      }
      let added = false;
      setStagedIds((prev) => {
        if (prev.includes(voucher.id)) return prev;
        added = true;
        return [...prev, voucher.id];
      });
      if (!added) return false;
      trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_CLAIM_SUCCESS, {
        source,
        qrRef: voucher.qr_code_ref,
      });
      if (options?.announce !== false) {
        toast.success(copy('qr_added'));
      }
      return true;
    },
    [copy],
  );

  const completeIntakeStaging = useCallback(
    (pending: PendingHandoff) => {
      let stagedCount = 0;
      for (const hit of pending.hits) {
        const staged = stageVoucher(
          hit,
          pending.source === 'auto_claim' ? 'auto_claim' : pending.source === 'scan' ? 'scan' : 'browse',
          { announce: false },
        );
        if (staged) stagedCount += 1;
      }
      if (stagedCount === 0) {
        toast.error(copy('ineligible_toast'));
        return;
      }
      setQrInput('');
      if (pending.kind === 'trip') {
        trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_TRIP_CLAIM_SUCCESS, {
          tripRef: pending.intakeRef,
          stagedCount,
        });
        toast.success(copy('trip_added', { count: stagedCount }));
      } else {
        toast.success(copy('qr_added'));
      }
    },
    [copy, stageVoucher],
  );

  const registerQrRef = useCallback(
    async (rawInput: string, source: IntakeSource) => {
      const parsed = parseDeliveryIntakeRef(rawInput);
      if (!parsed) {
        toast.error(copy('qr_not_found'));
        trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_CLAIM_FAILURE, {
          reason: 'invalid_input',
          source,
        });
        return;
      }
      setLookupBusy(true);
      try {
        const hits = await lookupTenantIntakeByRef(parsed.ref);
        if (hits.length === 0) {
          toast.error(copy('qr_not_found'));
          trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_CLAIM_FAILURE, {
            reason: 'not_found',
            source,
            intakeRef: parsed.ref,
          });
          return;
        }
        setVouchers((prev) => {
          const merged = [...prev];
          for (const hit of hits) {
            if (!merged.some((row) => row.id === hit.id)) {
              merged.unshift(hit);
            }
          }
          return merged;
        });
        setPendingHandoff({
          intakeRef: parsed.ref,
          hits,
          source,
          kind: parsed.kind,
        });
        setHandoffOpen(true);
      } finally {
        setLookupBusy(false);
      }
    },
    [copy],
  );

  const handleHandoffConfirmed = useCallback(() => {
    if (!pendingHandoff) return;
    trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_HANDOFF_CONFIRMED, {
      intakeRef: pendingHandoff.intakeRef,
      intakeKind: pendingHandoff.kind,
      voucherCount: pendingHandoff.hits.length,
      source: pendingHandoff.source,
    });
    completeIntakeStaging(pendingHandoff);
    setPendingHandoff(null);
  }, [completeIntakeStaging, pendingHandoff]);

  useEffect(() => {
    const claim = resolvedClaimRef?.trim();
    if (!claim || isLoading || autoClaimHandled.current === claim) return;
    autoClaimHandled.current = claim;
    trackDashboardEvent(DASHBOARD_EVENTS.DELIVERY_DESK_AUTO_CLAIM, { qrRef: claim });
    void registerQrRef(claim, 'auto_claim');
  }, [resolvedClaimRef, isLoading, registerQrRef]);

  const handleQrLookup = () => void registerQrRef(qrInput, 'paste');

  return (
    <>
      <Card id="register-delivery" className="scroll-mt-20 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
            {copy('title')}
          </CardTitle>
          <CardDescription>{copy('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resolvedClaimRef ? (
            <div
              className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm"
              role="status"
            >
              <p className="font-medium">{copy('auto_claim_banner_title')}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{copy('auto_claim_banner_body')}</p>
            </div>
          ) : null}

          {!isLoading && directedInbox.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-medium">{copy('inbox_title')}</p>
              <ul className="space-y-1.5">
                {directedInbox.slice(0, 5).map((voucher) => (
                  <li
                    key={voucher.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{voucher.plot_name ?? 'Plot'}</p>
                      <p className="text-xs text-muted-foreground">
                        {voucher.qr_code_ref} · {formatKg(voucher.kg)}
                      </p>
                    </div>
                    <Button type="button" size="sm" onClick={() => stageVoucher(voucher, 'inbox')}>
                      {copy('add_voucher')}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : !isLoading ? (
            <p className="text-xs text-muted-foreground">{copy('inbox_empty')}</p>
          ) : null}

          <div className="space-y-2">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setScannerOpen(true)}
            >
              <Camera className="mr-2 h-4 w-4" />
              {copy('scan_cta')}
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="flex-1"
                value={qrInput}
                onChange={(event) => setQrInput(event.target.value)}
                placeholder={copy('qr_placeholder')}
                aria-label={copy('qr_aria')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleQrLookup();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                disabled={lookupBusy || !qrInput.trim()}
                onClick={() => void handleQrLookup()}
              >
                {lookupBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {copy('qr_cta')}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {copy('loading')}
            </p>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : stagedVouchers.length > 0 ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {copy('staged_title', { count: stagedVouchers.length })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {copy('staged_total', { kg: stagedTotalKg.toLocaleString() })}
                </p>
              </div>
              <ul className="space-y-1.5">
                {stagedVouchers.map((voucher) => (
                  <li
                    key={voucher.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{voucher.plot_name ?? 'Plot'}</p>
                      <p className="text-xs text-muted-foreground">
                        {voucher.qr_code_ref} · {formatKg(voucher.kg)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={copy('remove_voucher')}
                      onClick={() => setStagedIds((prev) => prev.filter((id) => id !== voucher.id))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => router.push(buildPackageCreateHref(stagedIds))}
              >
                <Package className="mr-2 h-4 w-4" />
                {copy('assemble_cta')}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{copy('staged_empty')}</p>
          )}

          <div className="rounded-lg border border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40"
              onClick={() => setBrowseOpen((open) => !open)}
              aria-expanded={browseOpen}
            >
              <span>
                {copy('browse_toggle')}
                {!isLoading && availableVouchers.length > 0 ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({availableVouchers.length})
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className={cn('h-4 w-4 text-muted-foreground transition-transform', browseOpen && 'rotate-180')}
              />
            </button>
            {browseOpen ? (
              <div className="space-y-3 border-t border-border px-3 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={copy('search_placeholder')}
                  />
                </div>
                {filteredAvailable.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{copy('available_empty')}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {filteredAvailable.map((voucher) => (
                      <li
                        key={voucher.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {voucher.plot_name ?? 'Plot'} · {formatKg(voucher.kg)}
                          </p>
                          <p className="text-xs text-muted-foreground">{voucher.qr_code_ref}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => stageVoucher(voucher, 'browse')}
                        >
                          {copy('add_voucher')}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            {copy('footnote')}{' '}
            <Link href="/settings" className="text-primary hover:underline">
              {copy('footnote_link')}
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <VoucherQrScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={(qrRef) => void registerQrRef(qrRef, 'scan')}
      />

      {pendingHandoff ? (
        <DeliveryHandoffDialog
          open={handoffOpen}
          onOpenChange={(open) => {
            setHandoffOpen(open);
            if (!open) setPendingHandoff(null);
          }}
          intakeRef={pendingHandoff.intakeRef}
          vouchers={pendingHandoff.hits}
          onConfirmed={handleHandoffConfirmed}
        />
      ) : null}
    </>
  );
}
