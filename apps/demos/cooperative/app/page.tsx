'use client';

import { useState, type MouseEventHandler } from 'react';
import {
  BarChart3,
  Building2,
  Package,
  Users,
  FileCheck,
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
  MapPin,
  ClipboardList,
  Scale,
  FolderOpen,
  ArrowRight,
  Truck,
  Handshake,
} from 'lucide-react';

type PageId =
  | 'overview'
  | 'members'
  | 'plots'
  | 'batches'
  | 'review'
  | 'evidence'
  | 'buyers'
  | 'reports'
  | 'settings';

const nav: { id: PageId; label: string; icon: typeof BarChart3; badge?: string }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'members', label: 'Members', icon: Users, badge: '412' },
  { id: 'plots', label: 'Plots & GIS', icon: MapPin, badge: '7' },
  { id: 'batches', label: 'Coop batches', icon: Package, badge: '5' },
  { id: 'review', label: 'Member review', icon: FileCheck, badge: '6' },
  { id: 'evidence', label: 'Evidence vault', icon: FolderOpen },
  { id: 'buyers', label: 'Exporter buyers', icon: Handshake },
  { id: 'reports', label: 'Reports & TRACES', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const members = [
  { name: 'María López', memberId: 'M-10482', plots: 2, status: 'verified', coffeeKg: '2,450' },
  { name: 'Carlos Mejía', memberId: 'M-10471', plots: 1, status: 'pending', coffeeKg: '1,820' },
  { name: 'Ana Reyes', memberId: 'M-10465', plots: 3, status: 'verified', coffeeKg: '4,100' },
];

const plotQueue = [
  { id: 'PLT-HN-COP-8821', member: 'Carlos Mejía', issue: 'Awaiting field photos (rain delay)', status: 'review' },
  { id: 'PLT-HN-COP-8814', member: 'María López', issue: 'Polygon snapped to trail — OK', status: 'complete' },
];

const batches = [
  {
    id: 'COOP-2026-089',
    members: 34,
    weight: '42,800 kg',
    exporter: 'Green Valley Exports',
    dds: 'complete',
    traces: 'Queued',
  },
  {
    id: 'COOP-2026-087',
    members: 28,
    weight: '36,200 kg',
    exporter: 'Green Valley Exports',
    dds: 'review',
    traces: '—',
  },
];

const reviewQueue = [
  { member: 'Carlos Mejía', topic: 'FPIC minutes — scan quality low', status: 'blocked' },
  { member: 'Luis Hernández', topic: 'Harvest window vs. declared yield', status: 'review' },
  { member: 'Sofía Martínez', topic: 'Optional: refresh boundary after road works', status: 'optional' },
];

const evidenceItems = [
  { title: 'Assembly FPIC — March 2026 (signed)', scope: 'Cooperative seal', sealed: true },
  { title: 'Member photo roll — dry mill intake', scope: 'COOP-2026-089', sealed: true },
  { title: 'Internal QC cupping notes', scope: 'Internal only', sealed: false },
];

const buyers = [
  { name: 'Green Valley Exports S.A.', country: 'Germany contract', activeBatches: 2, tier: 'A' },
  { name: 'EuroRoast Trading GmbH', country: 'Spot + 2026 frame', activeBatches: 0, tier: 'B' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    complete: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    review: 'bg-amber-50 text-amber-800 border-amber-200',
    blocked: 'bg-red-50 text-red-800 border-red-200',
    optional: 'bg-stone-100 text-stone-700 border-stone-200',
    A: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    B: 'bg-amber-50 text-amber-800 border-amber-200',
    Queued: 'bg-amber-50 text-amber-800 border-amber-200',
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

export default function CooperativeDashboard() {
  const [page, setPage] = useState<PageId>('overview');

  return (
    <div className="min-h-screen flex bg-stone-50">
      <aside className="hidden lg:flex w-64 flex-col border-r border-stone-200 bg-white">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <img src="/images/tracebud-logo.png" alt="Tracebud" width={36} height={36} className="h-9 w-9 shrink-0 object-contain rounded-lg" />
            <div className="font-serif text-lg font-semibold text-emerald-950">Tracebud</div>
          </div>
          <p className="text-xs text-stone-500 mt-1">Cooperative console</p>
          <p className="text-sm font-medium text-stone-800 mt-3 flex items-center gap-2">
            <Building2 size={16} className="text-emerald-800 shrink-0" />
            Copán Highlands Coop (demo)
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
              <img src="/images/tracebud-logo.png" alt="Tracebud" width={28} height={28} className="h-7 w-7 shrink-0 object-contain rounded-md" />
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
              <img src="/images/tracebud-logo.png" alt="Tracebud" width={28} height={28} className="h-7 w-7 shrink-0 object-contain rounded-md" />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-stone-900 truncate">
                  {nav.find((n) => n.id === page)?.label ?? 'Overview'}
                </h1>
                <p className="text-xs text-stone-500">Demo data — member aggregation, exporter handoff & EUDR-aligned batches</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="search"
                  placeholder="Search members, plots, batch IDs…"
                  className="pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg w-48 md:w-64 bg-stone-50"
                  readOnly
                />
              </div>
              <button type="button" className="p-2 rounded-lg hover:bg-stone-100 text-stone-600">
                <Bell size={20} />
              </button>
              <div className="w-9 h-9 rounded-full bg-emerald-900/10 border border-emerald-900/20 flex items-center justify-center text-sm font-bold text-emerald-900">
                CH
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {page === 'overview' && (
            <>
              <SectionHeader
                title="Cooperative control tower"
                subtitle="Roll up member plots and compliance before you consolidate coffee for exporter DDS packages."
                action={
                  <Button variant="secondary">
                    <Download size={16} />
                    Export board pack
                  </Button>
                }
              />
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Active members', value: '412', hint: 'Linked app accounts', icon: Users },
                  { label: 'Plots verified', value: '1,204', hint: 'Across all members', icon: MapPin },
                  { label: 'Open member reviews', value: '6', hint: 'Before batch seal', icon: FileCheck },
                  { label: 'Batches ready to ship', value: '2', hint: 'DDS complete', icon: Package },
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
                  <SectionHeader title="Exporter handoff readiness" subtitle="What still blocks sealing COOP-2026-089 for Green Valley." />
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                      <span className="text-stone-700">94% of weight in batch traced to verified member polygons.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
                      <span className="text-stone-700">3 members still in review — FPIC scans and yield checks.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <Lock className="text-emerald-800 shrink-0 mt-0.5" size={18} />
                      <span className="text-stone-700">Member PII encrypted; coop managers see aggregates until export seal.</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button onClick={() => setPage('review')}>Open review queue</Button>
                    <Button variant="secondary" onClick={() => setPage('batches')}>
                      View batches
                    </Button>
                  </div>
                </Card>
                <Card className="p-6">
                  <SectionHeader title="Value chain (demo)" subtitle="From member phones to exporter DDS — identity preserved per lot line." />
                  <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
                    <Truck size={16} className="text-emerald-800" />
                    <span>Selected batch: COOP-2026-089 · 34 members · Honduras</span>
                  </div>
                  <div className="space-y-3">
                    {['Member app → plot + photos', 'Coop validation & seal', 'Exporter DDS + TRACES'].map((step, i) => (
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

          {page === 'members' && (
            <>
              <SectionHeader title="Members" subtitle="Producer roster linked to offline app accounts and plot registrations." action={<Button variant="secondary">Invite members</Button>} />
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-600">
                        <th className="px-4 py-3 font-medium">Member</th>
                        <th className="px-4 py-3 font-medium">ID</th>
                        <th className="px-4 py-3 font-medium">Plots</th>
                        <th className="px-4 py-3 font-medium">Est. coffee (season)</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.memberId} className="border-b border-stone-100 hover:bg-stone-50/80">
                          <td className="px-4 py-3 font-medium text-stone-900">{m.name}</td>
                          <td className="px-4 py-3 font-mono text-stone-600">{m.memberId}</td>
                          <td className="px-4 py-3">{m.plots}</td>
                          <td className="px-4 py-3">{m.coffeeKg}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={m.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {page === 'plots' && (
            <>
              <SectionHeader
                title="Plots & GIS"
                subtitle="Member-drawn polygons and cooperative-level QA before inclusion in export batches."
                action={<Button variant="secondary">Open map view</Button>}
              />
              <div className="space-y-3">
                {plotQueue.map((p) => (
                  <Card key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-mono text-sm font-semibold text-stone-900">{p.id}</p>
                      <p className="text-sm text-stone-600">{p.member}</p>
                      <p className="text-sm text-stone-700 mt-2">{p.issue}</p>
                    </div>
                    <StatusBadge status={p.status} />
                    <Button variant="secondary">Open dossier</Button>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'batches' && (
            <>
              <SectionHeader
                title="Cooperative batches"
                subtitle="Consolidated lots for exporter due diligence — mirrors exporter dashboard package view from the coop side."
                action={<Button>Draft new batch</Button>}
              />
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-600">
                        <th className="px-4 py-3 font-medium">Batch</th>
                        <th className="px-4 py-3 font-medium">Members</th>
                        <th className="px-4 py-3 font-medium">Weight</th>
                        <th className="px-4 py-3 font-medium">Exporter</th>
                        <th className="px-4 py-3 font-medium">DDS</th>
                        <th className="px-4 py-3 font-medium">TRACES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b) => (
                        <tr key={b.id} className="border-b border-stone-100 hover:bg-stone-50/80">
                          <td className="px-4 py-3 font-mono font-medium text-stone-900">{b.id}</td>
                          <td className="px-4 py-3">{b.members}</td>
                          <td className="px-4 py-3">{b.weight}</td>
                          <td className="px-4 py-3 text-stone-700">{b.exporter}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={b.dds} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={b.traces} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {page === 'review' && (
            <>
              <SectionHeader
                title="Member review queue"
                subtitle="Approve member submissions before they roll into sealed cooperative batches."
                action={
                  <Button>
                    <Eye size={16} />
                    Bulk compare
                  </Button>
                }
              />
              <div className="space-y-3">
                {reviewQueue.map((row) => (
                  <Card key={row.member + row.topic} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{row.member}</p>
                      <p className="text-sm text-stone-700 mt-1">{row.topic}</p>
                    </div>
                    <StatusBadge status={row.status} />
                    <Button variant="secondary">Resolve</Button>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'evidence' && (
            <>
              <SectionHeader
                title="Evidence vault"
                subtitle="Cooperative-sealed bundles plus member-level photos and documents shared with authorized buyers."
                action={
                  <span className="inline-flex items-center gap-2 text-xs text-stone-500">
                    <Lock size={14} />
                    RBAC: coop_manager
                  </span>
                }
              />
              <div className="space-y-3">
                {evidenceItems.map((e) => (
                  <Card key={e.title} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-stone-900">{e.title}</p>
                      <p className="text-sm text-stone-500">{e.scope}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-500">{e.sealed ? 'Sealed' : 'Editable'}</span>
                      <Button variant="ghost">Open</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'buyers' && (
            <>
              <SectionHeader title="Exporter buyers" subtitle="Relationships, active batches, and risk tiering for procurement teams." />
              <div className="grid md:grid-cols-2 gap-4">
                {buyers.map((b) => (
                  <Card key={b.name} hover className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-stone-900">{b.name}</h3>
                        <p className="text-sm text-stone-500">{b.country}</p>
                      </div>
                      <StatusBadge status={b.tier} />
                    </div>
                    <div className="flex justify-between text-sm text-stone-600 mt-4">
                      <span>Active coop batches</span>
                      <span className="font-medium text-stone-900">{b.activeBatches}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {page === 'reports' && (
            <>
              <SectionHeader
                title="Reports & TRACES"
                subtitle="Audit trails for members, boards, and downstream importer questions."
                action={
                  <Button>
                    <Download size={16} />
                    Export compliance log
                  </Button>
                }
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-5">
                  <ClipboardList className="text-emerald-900 mb-3" size={24} />
                  <h3 className="font-semibold text-stone-900">Batch seal history</h3>
                  <p className="text-sm text-stone-500 mt-2">Who approved each consolidation step before exporter pickup.</p>
                </Card>
                <Card className="p-5">
                  <Scale className="text-emerald-900 mb-3" size={24} />
                  <h3 className="font-semibold text-stone-900">TRACES handoff status</h3>
                  <p className="text-sm text-stone-500 mt-2">References returned once exporter submits EU DDS (demo).</p>
                </Card>
              </div>
            </>
          )}

          {page === 'settings' && (
            <>
              <SectionHeader title="Cooperative settings" subtitle="Demo only — no changes persisted." />
              <Card className="p-6 max-w-lg">
                <label className="block text-sm font-medium text-stone-700 mb-2">Default harvest year</label>
                <select className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option>2025/26</option>
                  <option>2024/25</option>
                </select>
                <p className="text-xs text-stone-500 mt-4">Notify managers when member review queue exceeds 5: on (demo)</p>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
