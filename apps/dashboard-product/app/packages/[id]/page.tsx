'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api';

type Lot = {
  voucherId: string;
  plotId: string;
  plotName: string;
  plotKind: string;
  plotAreaHa: number;
  declaredAreaHa: number | null;
  kg: number;
  harvestDate: string | null;
};

type TracesJson = {
  tracesReference: string | null;
  exporterId: string;
  ddsPackageId: string;
  label: string | null;
  createdAt: string;
  status: string;
  commodity: string;
  hsCode: string;
  totalKg: number;
  lots: Lot[];
};

type ComplianceSummary = {
  status: 'green' | 'amber' | 'red' | 'unknown';
  alertCount: number | null;
  alertAreaHa: number | null;
  requiredEvidenceMissing?: string[];
};

export default function PackageDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<TracesJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [compliance, setCompliance] = useState<Record<string, ComplianceSummary>>({});
  const [loadingCompliance, setLoadingCompliance] = useState(false);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem('tracebud_exporter_token');
  }, []);

  async function fetchPlotCompliance(plotId: string): Promise<ComplianceSummary> {
    if (!token) throw new Error('Missing token');
    const res = await fetch(
      `${API_BASE_URL}/v1/plots/${encodeURIComponent(plotId)}/compliance-history`,
      {
        headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
      },
    );
    if (!res.ok) {
      return {
        status: 'unknown',
        alertCount: null,
        alertAreaHa: null,
        requiredEvidenceMissing: ['history_unavailable'],
      };
    }
    const rows = (await res.json()) as any[];
    const gfwPayload = rows.find((r) => r.event_type === 'gfw_check_run')?.payload ?? null;
    const overlapPayload =
      rows.find((r) => r.event_type === 'plot_compliance_checked')?.payload ?? null;
    const plotPhotosSynced = rows.some((r) => r.event_type === 'plot_photos_synced');

    const evidenceKinds = new Set<string>();
    for (const r of rows) {
      if (r.event_type === 'plot_evidence_synced') {
        const k = r.payload?.kind;
        if (typeof k === 'string') evidenceKinds.add(k);
      }
    }

    let status: ComplianceSummary['status'] = 'unknown';
    let alertCount: number | null = null;
    let alertAreaHa: number | null = null;
    if (gfwPayload?.summary?.status) {
      status = gfwPayload.summary.status;
      alertCount = gfwPayload.summary.alertCount ?? null;
      alertAreaHa = gfwPayload.summary.alertAreaHa ?? null;
    }

    const requiredEvidenceMissing: string[] = [];
    if (overlapPayload?.indigenousOverlap === true && !evidenceKinds.has('fpic_repository')) {
      requiredEvidenceMissing.push('fpic_repository');
    }
    if (
      overlapPayload?.sinaphOverlap === true &&
      !evidenceKinds.has('protected_area_permit')
    ) {
      requiredEvidenceMissing.push('protected_area_permit');
    }
    if (!plotPhotosSynced) {
      requiredEvidenceMissing.push('ground_truth_photos');
    }

    return { status, alertCount, alertAreaHa, requiredEvidenceMissing };
  }

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError(null);
      try {
        if (!token) {
          setError('No exporter token. Go back and log in first.');
          return;
        }
        const res = await fetch(
          `${API_BASE_URL}/v1/harvest/packages/${encodeURIComponent(
            params.id,
          )}/traces-json`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              accept: 'application/json',
            },
          },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.message ?? `Backend responded with ${res.status}`);
          return;
        }
        const json = (await res.json()) as TracesJson;
        setData(json);

        setLoadingCompliance(true);
        const uniquePlotIds = Array.from(
          new Set(json.lots.map((l) => l.plotId).filter(Boolean)),
        );
        const entries = await Promise.all(
          uniquePlotIds.map(async (plotId) => {
            try {
              const c = await fetchPlotCompliance(plotId);
              return [plotId, c] as const;
            } catch {
              return [plotId, { status: 'unknown', alertCount: null, alertAreaHa: null }] as const;
            }
          }),
        );
        setCompliance(Object.fromEntries(entries));
      } catch (e: any) {
        setError(e?.message ?? 'Could not reach backend.');
      } finally {
        setLoadingCompliance(false);
        setLoading(false);
      }
    }
    run();
  }, [params.id, token]);

  const complianceBlockingIssues = useMemo(() => {
    if (!data) return [];
    const issues: string[] = [];
    const uniquePlotIds = Array.from(new Set(data.lots.map((l) => l.plotId).filter(Boolean)));
    for (const plotId of uniquePlotIds) {
      const c = compliance[plotId];
      if (!c) {
        issues.push(`${plotId}: missing compliance data`);
        continue;
      }
      if (c.status === 'red' || c.status === 'unknown') {
        issues.push(`${plotId}: status ${c.status}`);
      }
      if (c.requiredEvidenceMissing && c.requiredEvidenceMissing.length > 0) {
        issues.push(`${plotId}: missing evidence (${c.requiredEvidenceMissing.join(', ')})`);
      }
    }
    return issues;
  }, [compliance, data]);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 24,
        backgroundColor: '#020617',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>DDS package</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{params.id}</div>
        </div>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: 13 }}>
          ← Back to packages
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#0f172a' }}>Loading…</div>
      ) : error ? (
        <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#0f172a' }}>
          <div style={{ color: '#fecaca', fontWeight: 600, marginBottom: 6 }}>Error</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>{error}</div>
        </div>
      ) : data ? (
        <>
          <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#0f172a' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>TRACES ref</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{data.tracesReference ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Status</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{data.status}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Total kg</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{Number(data.totalKg).toFixed(1)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Lots</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{data.lots.length}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 10 }}>
              Timeline: draft → submitted (TRACES reference assigned)
            </div>
            {loadingCompliance ? (
              <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
                Loading plot compliance…
              </div>
            ) : complianceBlockingIssues.length > 0 ? (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: '#2a0f0f' }}>
                <div style={{ fontWeight: 700, color: '#fecaca', marginBottom: 6 }}>
                  Submission blocked (compliance issues)
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, opacity: 0.95 }}>
                  {complianceBlockingIssues.slice(0, 8).map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                  Fix missing evidence in the offline app and re-run GFW checks, then reload.
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: '#0b2a14' }}>
                <div style={{ fontWeight: 700, color: '#bbf7d0' }}>Ready to submit</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  All plots are green/amber and required evidence is present.
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={submitting || data.status === 'submitted' || complianceBlockingIssues.length > 0}
                onClick={async () => {
                  if (!token) return;
                  setSubmitting(true);
                  setError(null);
                  try {
                    const res = await fetch(
                      `${API_BASE_URL}/v1/harvest/packages/${encodeURIComponent(
                        params.id,
                      )}/submit`,
                      {
                        method: 'PATCH',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          accept: 'application/json',
                        },
                      },
                    );
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}));
                      setError(body.message ?? `Submit failed: ${res.status}`);
                      return;
                    }
                    // Refresh TRACES JSON view after submission
                    const refreshed = await fetch(
                      `${API_BASE_URL}/v1/harvest/packages/${encodeURIComponent(
                        params.id,
                      )}/traces-json`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          accept: 'application/json',
                        },
                      },
                    );
                    if (refreshed.ok) {
                      setData((await refreshed.json()) as TracesJson);
                    }
                  } catch (e: any) {
                    setError(e?.message ?? 'Could not reach backend.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: 'none',
                  backgroundColor:
                    submitting || data.status === 'submitted' || complianceBlockingIssues.length > 0
                      ? '#4b5563'
                      : '#22c55e',
                  color: '#022c22',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor:
                    submitting || data.status === 'submitted' || complianceBlockingIssues.length > 0
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {data.status === 'submitted'
                  ? 'Submitted'
                  : submitting
                    ? 'Submitting…'
                    : 'Submit package'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  } catch {
                    // ignore
                  }
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: 'none',
                  backgroundColor: '#38bdf8',
                  color: '#082f49',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {copied ? 'Copied' : 'Copy DDS JSON'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `dds-${data.ddsPackageId}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid #374151',
                  backgroundColor: 'transparent',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Download JSON
              </button>
            </div>
          </div>

          <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#0f172a' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Lots</div>
            {data.lots.length === 0 ? (
              <div style={{ fontSize: 13, opacity: 0.85 }}>No lots in this package.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #1f2937' }}>
                    <th style={{ padding: '6px 4px' }}>Voucher</th>
                    <th style={{ padding: '6px 4px' }}>Plot</th>
                    <th style={{ padding: '6px 4px' }}>Area (ha)</th>
                    <th style={{ padding: '6px 4px' }}>Kg</th>
                    <th style={{ padding: '6px 4px' }}>Harvest</th>
                    <th style={{ padding: '6px 4px' }}>Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lots.map((lot) => {
                    const c = compliance[lot.plotId];
                    const badge =
                      !c
                        ? { label: '—', bg: '#334155', fg: 'white' }
                        : c.status === 'green'
                          ? {
                              label: `Green${c.alertCount != null ? ` (${c.alertCount})` : ''}`,
                              bg: '#14532d',
                              fg: '#bbf7d0',
                            }
                          : c.status === 'amber'
                            ? {
                                label: `Amber${c.alertCount != null ? ` (${c.alertCount})` : ''}`,
                                bg: '#78350f',
                                fg: '#fed7aa',
                              }
                            : c.status === 'red'
                              ? {
                                  label: `Red${c.alertCount != null ? ` (${c.alertCount})` : ''}`,
                                  bg: '#7f1d1d',
                                  fg: '#fecaca',
                                }
                              : { label: 'Unknown', bg: '#334155', fg: 'white' };
                    return (
                      <tr key={lot.voucherId} style={{ borderBottom: '1px solid #111827' }}>
                        <td style={{ padding: '6px 4px' }}>{lot.voucherId.slice(0, 8)}…</td>
                        <td style={{ padding: '6px 4px' }}>{lot.plotName}</td>
                        <td style={{ padding: '6px 4px' }}>{Number(lot.plotAreaHa).toFixed(4)}</td>
                        <td style={{ padding: '6px 4px' }}>{Number(lot.kg).toFixed(1)}</td>
                        <td style={{ padding: '6px 4px' }}>{lot.harvestDate ?? '—'}</td>
                        <td style={{ padding: '6px 4px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              backgroundColor: badge.bg,
                              color: badge.fg,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {badge.label}
                          </span>
                          {c?.requiredEvidenceMissing && c.requiredEvidenceMissing.length > 0 ? (
                            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                              Missing: {c.requiredEvidenceMissing.join(', ')}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </main>
  );
}

