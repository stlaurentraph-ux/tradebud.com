'use client';

import { useState, type MouseEventHandler } from 'react';
import {
  BarChart3,
  Building2,
  MapPin,
  FileCheck,
  Shield,
  AlertTriangle,
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
  FolderOpen,
  ArrowRight,
  Landmark,
  Database,
  Link2,
  Server,
  ClipboardList,
  Scale,
  Users,
  Radio,
} from 'lucide-react';

type PageId =
  | 'overview'
  | 'registry'
  | 'operators'
  | 'eudr'
  | 'evidence'
  | 'risk'
  | 'api'
  | 'reports'
  | 'settings';

const nav: { id: PageId; label: string; icon: typeof BarChart3; badge?: string }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'registry', label: 'Plot registry', icon: MapPin, badge: '847' },
  { id: 'operators', label: 'Licensed operators', icon: Building2 },
  { id: 'eudr', label: 'EU submissions', icon: FileCheck, badge: '4' },
  { id: 'evidence', label: 'Evidence vault', icon: FolderOpen },
  { id: 'risk', label: 'Risk & forest alerts', icon: AlertTriangle, badge: '2' },
  { id: 'api', label: 'API & interop', icon: Link2 },
  { id: 'reports', label: 'Transparency & audit', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const registryRows = [
  {
    id: 'PLT-HN-908421',
    municipality: 'Copán',
    commodity: 'Coffee',
    hectares: '2.4',
    cadastre: 'matched',
    lastSync: 'Mar 27, 2026',
  },
  {
    id: 'PLT-HN-908418',
    municipality: 'Santa Bárbara',
    commodity: 'Coffee',
    hectares: '1.1',
    cadastre: 'review',
    lastSync: 'Mar 26, 2026',
  },
  {
    id: 'PLT-HN-908401',
    municipality: 'Yoro',
    commodity: 'Coffee',
    hectares: '3.8',
    cadastre: 'matched',
    lastSync: 'Mar 25, 2026',
  },
];

const operators = [
  { name: 'IHCAFE — national coffee institute', type: 'Registry authority', status: 'active', actors: 2847 },
  { name: 'Green Valley Exports S.A.', type: 'Exporter', status: 'licensed', actors: 0 },
  { name: 'Copán Highlands Cooperative', type: 'Cooperative', status: 'licensed', actors: 412 },
  { name: 'Atlas Cocoa Processors', type: 'Exporter', status: 'pilot', actors: 0 },
];

const eudrBatches = [
  { ref: 'NAT-DD-2026-0312', commodity: 'Coffee', weight: '4,820 MT', euStatus: 'acknowledged', traces: '12 refs' },
  { ref: 'NAT-DD-2026-0308', commodity: 'Cocoa', weight: '1,200 MT', euStatus: 'pending', traces: '—' },
  { ref: 'NAT-DD-2026-0299', commodity: 'Coffee', weight: '6,100 MT', euStatus: 'acknowledged', traces: '18 refs' },
];

const evidenceBundles = [
  { title: 'National polygon baseline — Q1 2026', scope: 'Coffee belt', sealed: true, records: '12,456 plots' },
  { title: 'FPIC template + bilingual guidance', scope: 'All commodities', sealed: true, records: 'Policy pack' },
  { title: 'Exporter DDS mirror — Green Valley', scope: 'Coffee', sealed: false, records: '156 packages' },
];

const riskAlerts = [
  { id: 'NA-204', region: 'Río Plátano buffer', severity: 'high', summary: 'GLAD alert overlap with 14 registered polygons — review queue' },
  { id: 'NA-198', region: 'Atlántida', severity: 'medium', summary: 'Cadastre boundary drift vs. farmer-drawn geometry (amber)' },
];

const apiServices = [
  { name: 'Registry sync API', version: 'v2', health: 'ok', rps: '1.2k' },
  { name: 'GeoJSON parcel ingest', version: 'v1', health: 'ok', rps: '340' },
  { name: 'Webhook — EU DDS status', version: 'v1', health: 'degraded', rps: '—' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    matched: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    review: 'bg-amber-50 text-amber-800 border-amber-200',
    active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    licensed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    pilot: 'bg-amber-50 text-amber-800 border-amber-200',
    acknowledged: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    degraded: 'bg-amber-50 text-amber-800 border-amber-200',
    high: 'bg-red-50 text-red-800 border-red-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
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

export default function CountryDashboard() {
  const [page, setPage] = useState<PageId>('overview');

  return (
    <div className="min-h-screen flex bg-stone-50">
      <aside className="hidden lg:flex w-64 flex-col border-r border-stone-200 bg-white">
        <div className="p-6 border-b border-stone-100">
          <div className="font-serif text-lg font-semibold text-emerald-950">Tracebud</div>
          <p className="text-xs text-stone-500 mt-1">National registry console</p>
          <p className="text-sm font-medium text-stone-800 mt-3 flex items-center gap-2">
            <Landmark size={16} className="text-emerald-800 shrink-0" />
            Ministry of Agriculture (demo)
          </p>
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
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-stone-900">
                {nav.find((n) => n.id === page)?.label ?? 'Overview'}
              </h1>
              <p className="text-xs text-stone-500">Demo data — sovereign DPI, EUDR alignment & registry interoperability</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="search"
                  placeholder="Search plots, operators, batch refs…"
                  className="pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg w-48 md:w-64 bg-stone-50"
                  readOnly
                />
              </div>
              <button type="button" className="p-2 rounded-lg hover:bg-stone-100 text-stone-600">
                <Bell size={20} />
              </button>
              <div className="w-9 h-9 rounded-full bg-emerald-900/10 border border-emerald-900/20 flex items-center justify-center text-sm font-bold text-emerald-900">
                MA
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {page === 'overview' && (
            <>
              <SectionHeader
                title="National control tower"
                subtitle="Aggregate visibility across producer plots, licensed operators, and EU-facing due diligence — data sovereignty retained in-country."
                action={
                  <Button variant="secondary">
                    <Download size={16} />
                    Export executive brief
                  </Button>
                }
              />
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Verified polygons', value: '12,456', hint: 'WGS84 / GeoJSON', icon: MapPin },
                  { label: 'Active producers', value: '28.4k', hint: 'Linked to registry IDs', icon: Users },
                  { label: 'Licensed exporters', value: '24', hint: 'Coffee & cocoa', icon: Building2 },
                  { label: 'Open compliance items', value: '4', hint: 'EU + national queues', icon: Shield },
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
                  <SectionHeader title="EUDR & registry posture" subtitle="How your jurisdiction presents deforestation-free and traceability evidence to the EU." />
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                      <span className="text-stone-700">National API mirrors exporter DDS packages with immutable audit hash (demo).</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
                      <span className="text-stone-700">1 webhook endpoint retrying — EU acknowledgment backlog for NAT-DD-2026-0308.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <Lock className="text-emerald-800 shrink-0 mt-0.5" size={18} />
                      <span className="text-stone-700">Farmer PII encrypted; ministry keys held in HSM partition (simulated in demo).</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button onClick={() => setPage('eudr')}>Open EU submission queue</Button>
                    <Button variant="secondary" onClick={() => setPage('registry')}>
                      Registry reconciliation
                    </Button>
                  </div>
                </Card>
                <Card className="p-6">
                  <SectionHeader title="Data flow (sovereign)" subtitle="Tracebud hosts infrastructure; authoritative identifiers stay with national registries." />
                  <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
                    <Database size={16} className="text-emerald-800" />
                    <span>Cadastre + IHCAFE IDs → Tracebud edge → EU TRACES references</span>
                  </div>
                  <div className="space-y-3">
                    {['National cadastre / parcel API', 'Ministry validation rules', 'Exporter & cooperative onboarding', 'EU-facing DDS mirror'].map((step, i) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                        <div className="flex-1 border border-stone-100 rounded-lg px-3 py-2 bg-stone-50 text-sm font-medium text-stone-800">{step}</div>
                        {i < 3 ? <ArrowRight className="text-stone-300 hidden sm:block shrink-0" size={16} /> : null}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {page === 'registry' && (
            <>
              <SectionHeader
                title="Plot & cadastre registry"
                subtitle="Reconcile farmer-drawn polygons with national parcel boundaries and commodity programs."
                action={<Button variant="secondary">Trigger bulk sync</Button>}
              />
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-600">
                        <th className="px-4 py-3 font-medium">Plot ID</th>
                        <th className="px-4 py-3 font-medium">Municipality</th>
                        <th className="px-4 py-3 font-medium">Commodity</th>
                        <th className="px-4 py-3 font-medium">Ha</th>
                        <th className="px-4 py-3 font-medium">Cadastre</th>
                        <th className="px-4 py-3 font-medium">Last sync</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registryRows.map((r) => (
                        <tr key={r.id} className="border-b border-stone-100 hover:bg-stone-50/80">
                          <td className="px-4 py-3 font-mono font-medium text-stone-900">{r.id}</td>
                          <td className="px-4 py-3 text-stone-700">{r.municipality}</td>
                          <td className="px-4 py-3 text-stone-600">{r.commodity}</td>
                          <td className="px-4 py-3">{r.hectares}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.cadastre} />
                          </td>
                          <td className="px-4 py-3 text-stone-500">{r.lastSync}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {page === 'operators' && (
            <>
              <SectionHeader title="Licensed operators" subtitle="Exporters, cooperatives, and statutory bodies connected to the national traceability graph." />
              <div className="grid md:grid-cols-2 gap-4">
                {operators.map((o) => (
                  <Card key={o.name} hover className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-stone-900">{o.name}</h3>
                        <p className="text-sm text-stone-500">{o.type}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    {o.actors > 0 ? (
                      <div className="flex justify-between text-sm text-stone-600 mt-4">
                        <span>Linked producers</span>
                        <span className="font-medium text-stone-900">{o.actors.toLocaleString()}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-stone-500 mt-2">Gateway role — no direct producer count.</p>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'eudr' && (
            <>
              <SectionHeader
                title="EU submission queue"
                subtitle="National batches aggregated for EU market access — mirrors exporter DDS without breaking mass-balance rules in product."
                action={
                  <Button>
                    <Eye size={16} />
                    Open validation report
                  </Button>
                }
              />
              <div className="space-y-3">
                {eudrBatches.map((row) => (
                  <Card key={row.ref} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-mono text-sm font-semibold text-stone-900">{row.ref}</p>
                      <p className="text-sm text-stone-600">
                        {row.commodity} · {row.weight}
                      </p>
                      <p className="text-sm text-stone-500 mt-2">TRACES references linked: {row.traces}</p>
                    </div>
                    <StatusBadge status={row.euStatus} />
                    <Button variant="secondary">View dossier</Button>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'evidence' && (
            <>
              <SectionHeader
                title="Sovereign evidence vault"
                subtitle="National sealed bundles for audits, FTA partners, and parliamentary disclosure (redacted exports)."
                action={
                  <span className="inline-flex items-center gap-2 text-xs text-stone-500">
                    <Lock size={14} />
                    RBAC: ministry_supervisor
                  </span>
                }
              />
              <div className="space-y-3">
                {evidenceBundles.map((e) => (
                  <Card key={e.title} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-stone-900">{e.title}</p>
                      <p className="text-sm text-stone-500">
                        {e.scope} · {e.records}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-500">{e.sealed ? 'Sealed bundle' : 'Open collection'}</span>
                      <Button variant="ghost">Open</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'risk' && (
            <>
              <SectionHeader title="Risk & forest alerts" subtitle="GLAD / RADD-style signals crossed with your national polygon registry (demo overlay)." />
              <div className="space-y-3">
                {riskAlerts.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-semibold">{r.id}</span>
                      <span className="text-sm text-stone-500">{r.region}</span>
                      <StatusBadge status={r.severity} />
                    </div>
                    <p className="text-sm text-stone-700">{r.summary}</p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="secondary">Assign analyst</Button>
                      <Button variant="ghost">Open map</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'api' && (
            <>
              <SectionHeader
                title="API & interoperability"
                subtitle="REST, GeoJSON, GS1 EPCIS-friendly payloads — align with existing national systems."
              />
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {apiServices.map((s) => (
                  <Card key={s.name} className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Server className="text-emerald-900" size={22} />
                      <StatusBadge status={s.health} />
                    </div>
                    <h3 className="font-semibold text-stone-900 text-sm">{s.name}</h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {s.version}
                      {s.rps !== '—' ? ` · ~${s.rps} rps` : ''}
                    </p>
                  </Card>
                ))}
              </div>
              <Card className="p-6">
                <div className="flex items-center gap-3 text-stone-600 text-sm mb-4">
                  <Radio size={18} className="text-emerald-800" />
                  Webhook secret rotation due: Apr 15, 2026 (demo)
                </div>
                <ul className="space-y-2 text-sm text-stone-700">
                  <li>OpenAPI spec: /registry/v2/openapi.json</li>
                  <li>mTLS: enabled for cadastre partner (simulated)</li>
                  <li>GS1 Digital Link resolver: reserved namespace TB-HN-REG</li>
                </ul>
              </Card>
            </>
          )}

          {page === 'reports' && (
            <>
              <SectionHeader
                title="Transparency & audit exports"
                subtitle="Aggregated, anonymized statistics for policy and SDG reporting — no raw PII in default packs."
                action={
                  <Button>
                    <Download size={16} />
                    Generate public statistics pack
                  </Button>
                }
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-5">
                  <ClipboardList className="text-emerald-900 mb-3" size={24} />
                  <h3 className="font-semibold text-stone-900">National DDS mirror log</h3>
                  <p className="text-sm text-stone-500 mt-2">Immutable record of batches presented to EU operators.</p>
                </Card>
                <Card className="p-5">
                  <Scale className="text-emerald-900 mb-3" size={24} />
                  <h3 className="font-semibold text-stone-900">Legal hold & parliamentary request</h3>
                  <p className="text-sm text-stone-500 mt-2">Workflow placeholder for lawful disclosure with court order tracking.</p>
                </Card>
              </div>
            </>
          )}

          {page === 'settings' && (
            <>
              <SectionHeader title="Jurisdiction settings" subtitle="Demo only — no changes persisted." />
              <Card className="p-6 max-w-lg">
                <label className="block text-sm font-medium text-stone-700 mb-2">Primary commodity programs</label>
                <select className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option>Coffee (IHCAFE)</option>
                  <option>Cocoa (pilot)</option>
                  <option>Multi-commodity</option>
                </select>
                <p className="text-xs text-stone-500 mt-4">Default map projection: WGS84 · alerts: GLAD weekly digest (demo)</p>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
