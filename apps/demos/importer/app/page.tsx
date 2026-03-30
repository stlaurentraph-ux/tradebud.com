'use client';

import { useState, type MouseEventHandler } from 'react';
import {
  BarChart3,
  Building2,
  Package,
  Users,
  FileCheck,
  Shield,
  AlertTriangle,
  Globe,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  Eye,
  Lock,
  CheckCircle2,
  Clock,
  Download,
  Truck,
  MapPin,
  ClipboardList,
  Scale,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';

type PageId =
  | 'overview'
  | 'shipments'
  | 'suppliers'
  | 'diligence'
  | 'evidence'
  | 'risk'
  | 'traces'
  | 'reports'
  | 'settings';

const nav: { id: PageId; label: string; icon: typeof BarChart3; badge?: string }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'shipments', label: 'Inbound lots', icon: Package, badge: '12' },
  { id: 'suppliers', label: 'Suppliers', icon: Building2 },
  { id: 'diligence', label: 'DDS review', icon: FileCheck, badge: '3' },
  { id: 'evidence', label: 'Evidence vault', icon: FolderOpen },
  { id: 'risk', label: 'Risk & flags', icon: AlertTriangle, badge: '2' },
  { id: 'traces', label: 'TRACES NT', icon: Globe },
  { id: 'reports', label: 'CSRD / Audit', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const shipments = [
  {
    id: 'LOT-2026-1140',
    exporter: 'Green Valley Exports',
    origin: 'Honduras',
    commodity: 'Coffee',
    weight: '18,500 kg',
    dds: 'complete',
    article9: 'ready',
    traces: 'EUCERT.2026.HN.0847',
    eta: 'Apr 2, 2026',
  },
  {
    id: 'LOT-2026-1138',
    exporter: 'Côte Source SARL',
    origin: 'Ivory Coast',
    commodity: 'Cocoa',
    weight: '12,300 kg',
    dds: 'review',
    article9: 'blocked',
    traces: null,
    eta: 'Apr 5, 2026',
  },
  {
    id: 'LOT-2026-1135',
    exporter: 'Lake Victoria Coop',
    origin: 'Uganda',
    commodity: 'Coffee',
    weight: '8,750 kg',
    dds: 'complete',
    article9: 'ready',
    traces: 'EUCERT.2026.UG.0312',
    eta: 'Mar 30, 2026',
  },
];

const suppliers = [
  { name: 'Green Valley Exports', country: 'Honduras', tier: 'A', lotsYtd: 34, openFlags: 0 },
  { name: 'Côte Source SARL', country: 'Ivory Coast', tier: 'B', lotsYtd: 18, openFlags: 2 },
  { name: 'Lake Victoria Coop', country: 'Uganda', tier: 'A', lotsYtd: 22, openFlags: 0 },
];

const ddsQueue = [
  { lot: 'LOT-2026-1138', exporter: 'Côte Source SARL', issue: 'Yield cap variance vs. declared polygons', status: 'blocked' },
  { lot: 'LOT-2026-1129', exporter: 'Green Valley Exports', issue: 'FPIC minutes pending translation', status: 'review' },
  { lot: 'LOT-2026-1121', exporter: 'Lake Victoria Coop', issue: 'Optional: refresh satellite baseline', status: 'optional' },
];

const evidenceItems = [
  { title: 'Plot HN-COP-001 — polygon + photos', supplier: 'Green Valley Exports', type: 'GIS + 360°', sealed: true },
  { title: 'Community FPIC — assembly minutes', supplier: 'Green Valley Exports', type: 'PDF', sealed: true },
  { title: 'Labor checklist — ILO attestations', supplier: 'Côte Source SARL', type: 'Checklist + photos', sealed: false },
];

const riskFlags = [
  { id: 'RF-089', lot: 'LOT-2026-1138', severity: 'high', summary: 'Declared weight exceeds biological cap for linked plots' },
  { id: 'RF-087', lot: 'LOT-2026-1102', severity: 'medium', summary: 'Protected area buffer — manual review (amber)' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    complete: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    review: 'bg-amber-50 text-amber-800 border-amber-200',
    blocked: 'bg-red-50 text-red-800 border-red-200',
    optional: 'bg-stone-100 text-stone-700 border-stone-200',
    high: 'bg-red-50 text-red-800 border-red-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    A: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    B: 'bg-amber-50 text-amber-800 border-amber-200',
  };
  const cls = map[status] ?? 'bg-stone-100 text-stone-700 border-stone-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${cls}`}>
      {status}
    </span>
  );
}

function Card({
  children,
  className = '',
  hover = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      className={`bg-white border border-stone-200 rounded-xl ${hover ? 'hover:shadow-md hover:border-stone-300 transition-all cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  variant = 'primary',
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  onClick?: () => void;
}) {
  const v =
    variant === 'primary'
      ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm'
      : variant === 'secondary'
        ? 'bg-white border border-stone-200 text-stone-800 hover:bg-stone-50'
        : 'text-stone-600 hover:bg-stone-100';
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${v} ${className}`}>
      {children}
    </button>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        {subtitle ? <p className="text-sm text-stone-500 mt-1">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export default function ImporterDashboard() {
  const [page, setPage] = useState<PageId>('overview');

  return (
    <div className="min-h-screen flex bg-stone-50">
      <aside className="hidden lg:flex w-64 flex-col border-r border-stone-200 bg-white">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <img
              src="/images/tracebud-logo.png"
              alt="Tracebud"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain rounded-lg"
            />
            <div className="font-serif text-lg font-semibold text-emerald-950">Tracebud</div>
          </div>
          <p className="text-xs text-stone-500 mt-1">Importer of record</p>
          <p className="text-sm font-medium text-stone-800 mt-3">NordCup Roasters AB</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-emerald-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-stone-200 text-stone-700'}`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-stone-100 space-y-1">
          <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-600 hover:bg-stone-100">
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-stone-200">
          <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-4">
            <div className="lg:hidden flex items-center gap-2">
              <img
                src="/images/tracebud-logo.png"
                alt="Tracebud"
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 object-contain rounded-md"
              />
              <span className="font-serif font-semibold text-emerald-950">Tracebud</span>
              <select
                className="text-sm border border-stone-200 rounded-lg px-2 py-1 bg-white"
                value={page}
                onChange={(e) => setPage(e.target.value as PageId)}
              >
                {nav.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden lg:flex lg:items-center lg:gap-3 min-w-0">
              <img
                src="/images/tracebud-logo.png"
                alt="Tracebud"
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 object-contain rounded-md"
              />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-stone-900 truncate">
                  {nav.find((n) => n.id === page)?.label ?? 'Overview'}
                </h1>
                <p className="text-xs text-stone-500">Demo data — EUDR Article 9 & CSRD-oriented importer workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="search"
                  placeholder="Search lots, suppliers, TRACES ref…"
                  className="pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg w-48 md:w-64 bg-stone-50"
                  readOnly
                />
              </div>
              <button type="button" className="p-2 rounded-lg hover:bg-stone-100 text-stone-600">
                <Bell size={20} />
              </button>
              <div className="w-9 h-9 rounded-full bg-emerald-900/10 border border-emerald-900/20 flex items-center justify-center text-sm font-bold text-emerald-900">
                NR
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {page === 'overview' && (
            <>
              <SectionHeader
                title="Importer control tower"
                subtitle="Monitor due diligence completeness before you assume liability under EUDR Article 9."
                action={
                  <Button variant="secondary">
                    <Download size={16} />
                    Export audit snapshot
                  </Button>
                }
              />
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Lots ready for release', value: '9', hint: 'DDS + evidence complete', icon: Package },
                  { label: 'Blocked at gate', value: '2', hint: 'Action required', icon: Shield },
                  { label: 'Suppliers (active)', value: '24', hint: 'Tier A/B mix', icon: Building2 },
                  { label: 'Open risk flags', value: '2', hint: 'Yield / buffer reviews', icon: AlertTriangle },
                ].map((k) => {
                  const I = k.icon;
                  return (
                    <Card key={k.label} className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-stone-500">{k.label}</p>
                          <p className="text-2xl font-bold text-stone-900 mt-1">{k.value}</p>
                          <p className="text-xs text-stone-500 mt-2">{k.hint}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-900/5">
                          <I size={22} className="text-emerald-900" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <SectionHeader title="Article 9 readiness" subtitle="What your compliance team still needs before customs clearance." />
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                      <span className="text-stone-700">Polygon + timestamped evidence available for 94% of weight in active lots.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
                      <span className="text-stone-700">2 lots missing translated FPIC documents from upstream cooperative.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <Lock className="text-emerald-800 shrink-0 mt-0.5" size={18} />
                      <span className="text-stone-700">Farmer PII exposed only via RBAC — your role: Importer analyst (read decrypt).</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button onClick={() => setPage('diligence')}>Open DDS queue</Button>
                    <Button variant="secondary" onClick={() => setPage('risk')}>
                      Review flags
                    </Button>
                  </div>
                </Card>
                <Card className="p-6">
                  <SectionHeader title="Upstream chain (demo)" subtitle="Identity preservation — no mass-balance blending in this view." />
                  <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
                    <MapPin size={16} className="text-emerald-800" />
                    <span>Selected lot: LOT-2026-1140 · Honduras · Coffee</span>
                  </div>
                  <div className="space-y-3">
                    {['Farm polygons (IP)', 'Cooperative / exporter DDS', 'Your warehouse receipt'].map((step, i) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                        <div className="flex-1 border border-stone-100 rounded-lg px-3 py-2 bg-stone-50 text-sm font-medium text-stone-800">{step}</div>
                        {i < 2 ? <ArrowRight className="text-stone-300 hidden sm:block shrink-0" size={16} /> : null}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {page === 'shipments' && (
            <>
              <SectionHeader
                title="Inbound lots"
                subtitle="Link each consignment to exporter DDS packages and TRACES references."
                action={<Button variant="secondary">Register new ASN</Button>}
              />
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-600">
                        <th className="px-4 py-3 font-medium">Lot</th>
                        <th className="px-4 py-3 font-medium">Exporter</th>
                        <th className="px-4 py-3 font-medium">Origin</th>
                        <th className="px-4 py-3 font-medium">Weight</th>
                        <th className="px-4 py-3 font-medium">DDS</th>
                        <th className="px-4 py-3 font-medium">Art. 9</th>
                        <th className="px-4 py-3 font-medium">TRACES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((s) => (
                        <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50/80">
                          <td className="px-4 py-3 font-mono font-medium text-stone-900">{s.id}</td>
                          <td className="px-4 py-3 text-stone-700">{s.exporter}</td>
                          <td className="px-4 py-3 text-stone-600">{s.origin}</td>
                          <td className="px-4 py-3">{s.weight}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={s.dds} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={s.article9} />
                          </td>
                          <td className="px-4 py-3 text-stone-600 font-mono text-xs">{s.traces ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {page === 'suppliers' && (
            <>
              <SectionHeader title="Suppliers" subtitle="Risk tiering for downstream procurement and audit sampling." />
              <div className="grid md:grid-cols-3 gap-4">
                {suppliers.map((s) => (
                  <Card key={s.name} hover className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-stone-900">{s.name}</h3>
                        <p className="text-sm text-stone-500">{s.country}</p>
                      </div>
                      <StatusBadge status={s.tier} />
                    </div>
                    <div className="flex justify-between text-sm text-stone-600 mt-4">
                      <span>Lots YTD</span>
                      <span className="font-medium text-stone-900">{s.lotsYtd}</span>
                    </div>
                    <div className="flex justify-between text-sm text-stone-600 mt-2">
                      <span>Open flags</span>
                      <span className="font-medium text-stone-900">{s.openFlags}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'diligence' && (
            <>
              <SectionHeader
                title="DDS review queue"
                subtitle="Resolve exporter submissions before you sign off as importer of record."
                action={
                  <Button>
                    <Eye size={16} />
                    Open comparison view
                  </Button>
                }
              />
              <div className="space-y-3">
                {ddsQueue.map((row) => (
                  <Card key={row.lot} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-mono text-sm font-semibold text-stone-900">{row.lot}</p>
                      <p className="text-sm text-stone-600">{row.exporter}</p>
                      <p className="text-sm text-stone-700 mt-2">{row.issue}</p>
                    </div>
                    <StatusBadge status={row.status} />
                    <Button variant="secondary">View dossier</Button>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'evidence' && (
            <>
              <SectionHeader
                title="Evidence vault"
                subtitle="Read-only access to plot geometry, FPIC, and labor attestations (encrypted at rest)."
                action={
                  <span className="inline-flex items-center gap-2 text-xs text-stone-500">
                    <Lock size={14} />
                    RBAC: importer_analyst
                  </span>
                }
              />
              <div className="space-y-3">
                {evidenceItems.map((e) => (
                  <Card key={e.title} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-stone-900">{e.title}</p>
                      <p className="text-sm text-stone-500">{e.supplier} · {e.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-500">{e.sealed ? 'Sealed bundle' : 'Pending seal'}</span>
                      <Button variant="ghost">Open</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'risk' && (
            <>
              <SectionHeader title="Risk & flags" subtitle="Operational and compliance signals from yield caps, forest checks, and overlaps." />
              <div className="space-y-3">
                {riskFlags.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-semibold">{r.id}</span>
                      <span className="text-sm text-stone-500">{r.lot}</span>
                      <StatusBadge status={r.severity} />
                    </div>
                    <p className="text-sm text-stone-700">{r.summary}</p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="secondary">Assign reviewer</Button>
                      <Button variant="ghost">Link to plot</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'traces' && (
            <>
              <SectionHeader
                title="TRACES NT"
                subtitle="Track EU references returned from your exporter’s submissions (SOAP/XML layer in product)."
              />
              <Card className="p-6">
                <div className="flex items-center gap-3 text-stone-600 text-sm mb-4">
                  <Globe size={18} className="text-emerald-800" />
                  Last sync: Mar 28, 2026 · 14:02 CET (demo)
                </div>
                <ul className="space-y-2 text-sm text-stone-700">
                  <li>EUCERT.2026.HN.0847 — Accepted</li>
                  <li>EUCERT.2026.UG.0312 — Accepted</li>
                  <li>Pending — LOT-2026-1138 (blocked upstream)</li>
                </ul>
              </Card>
            </>
          )}

          {page === 'reports' && (
            <>
              <SectionHeader
                title="CSRD & audit exports"
                subtitle="Package evidence for statutory auditors and corporate ESG workflows."
                action={
                  <Button>
                    <Download size={16} />
                    Generate ESRS-aligned pack
                  </Button>
                }
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-5">
                  <ClipboardList className="text-emerald-900 mb-3" size={24} />
                  <h3 className="font-semibold text-stone-900">Due diligence statement log</h3>
                  <p className="text-sm text-stone-500 mt-2">Immutable history of DDS IDs you accepted or rejected.</p>
                </Card>
                <Card className="p-5">
                  <Scale className="text-emerald-900 mb-3" size={24} />
                  <h3 className="font-semibold text-stone-900">FLAG / carbon conduit (roadmap)</h3>
                  <p className="text-sm text-stone-500 mt-2">Placeholder for CFT + FSA-aligned metrics when you enable climate modules.</p>
                </Card>
              </div>
            </>
          )}

          {page === 'settings' && (
            <>
              <SectionHeader title="Workspace settings" subtitle="Demo only — no changes persisted." />
              <Card className="p-6 max-w-lg">
                <label className="block text-sm font-medium text-stone-700 mb-2">Default commodity focus</label>
                <select className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option>Coffee</option>
                  <option>Cocoa</option>
                  <option>Rubber</option>
                </select>
                <p className="text-xs text-stone-500 mt-4">Notifications for blocked lots: on (demo)</p>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
