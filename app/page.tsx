'use client';

import { useState } from 'react';
import {
  Package,
  MapPin,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  FileText,
  ArrowUpRight,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Upload,
  Shield,
} from 'lucide-react';

// ─── Static mock data ────────────────────────────────────────────────────────

const navItems = [
  { label: 'Overview',     icon: BarChart3, active: true  },
  { label: 'DDS Packages', icon: Package,   badge: '156'  },
  { label: 'Plots',        icon: MapPin                   },
  { label: 'Farmers',      icon: Users                    },
  { label: 'Reports',      icon: FileText                 },
];

const packages = [
  { id: 'TRB-2026-0847', farmer: 'John Kiprotich',  plot: 'KE-NAK-001', commodity: 'Cocoa', weight: '2,450 kg', status: 'verified', date: 'Mar 18, 2026' },
  { id: 'TRB-2026-0846', farmer: 'Mary Wanjiku',    plot: 'KE-NAK-002', commodity: 'Coffee', weight: '1,820 kg', status: 'pending',  date: 'Mar 17, 2026' },
  { id: 'TRB-2026-0845', farmer: 'James Ochieng',   plot: 'KE-KIS-003', commodity: 'Cocoa',  weight: '3,100 kg', status: 'verified', date: 'Mar 17, 2026' },
  { id: 'TRB-2026-0844', farmer: 'Grace Akinyi',    plot: 'KE-KIS-004', commodity: 'Soy',    weight: '1,950 kg', status: 'issue',    date: 'Mar 16, 2026' },
  { id: 'TRB-2026-0843', farmer: 'Peter Kamau',     plot: 'KE-NAK-005', commodity: 'Coffee', weight: '2,780 kg', status: 'verified', date: 'Mar 16, 2026' },
  { id: 'TRB-2026-0842', farmer: 'Amina Hassan',    plot: 'KE-MOM-006', commodity: 'Cocoa',  weight: '2,100 kg', status: 'pending',  date: 'Mar 15, 2026' },
];

const monthlyData = [52, 61, 48, 70, 65, 82, 74, 69, 88, 79, 91, 103];
const months     = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const activity = [
  { label: 'Dossier exported',     sub: 'TRB-2026-0847 sent to EU importer',        time: '2h ago',    color: 'emerald' },
  { label: 'Deforestation check',  sub: 'KE-KIS-003 passed automated verification', time: '5h ago',    color: 'emerald' },
  { label: 'Plot flagged',         sub: 'KE-KIS-004 requires boundary correction',  time: '1d ago',    color: 'orange'  },
  { label: '42 plots imported',    sub: 'Batch upload from Nakuru region',          time: '2d ago',    color: 'stone'   },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; Icon: typeof CheckCircle2; label: string }> = {
    verified: { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', Icon: CheckCircle2, label: 'Verified' },
    pending:  { cls: 'bg-amber-50  text-amber-800  border-amber-200',  Icon: Clock,         label: 'Pending'  },
    issue:    { cls: 'bg-red-50    text-red-800    border-red-200',    Icon: AlertCircle,   label: 'Issue'    },
  };
  const { cls, Icon, label } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

function MetricCard({
  label, value, change, positive, sparkline,
}: {
  label: string; value: string; change: string; positive: boolean; sparkline: number[];
}) {
  const max = Math.max(...sparkline);
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md hover:shadow-stone-100 transition-shadow">
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stone-900 tracking-tight">{value}</p>
      <div className="mt-3 flex items-end justify-between">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-700' : 'text-red-600'}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change} vs last month
        </span>
        {/* sparkline */}
        <div className="flex items-end gap-px h-8">
          {sparkline.map((v, i) => (
            <div
              key={i}
              className="w-1 rounded-sm bg-emerald-300"
              style={{ height: `${(v / max) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AreaChart() {
  const max = Math.max(...monthlyData);
  const w = 500, h = 160;
  const pts = monthlyData.map((v, i) => ({
    x: (i / (monthlyData.length - 1)) * w,
    y: h - (v / max) * h * 0.9,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Package Submissions</h3>
          <p className="text-xs text-stone-400 mt-0.5">Last 12 months · 1,092 total</p>
        </div>
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          +18% YoY
        </span>
      </div>
      <div className="relative overflow-hidden" style={{ height: 160 }}>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#064e3b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0"    />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="#e7e5e4" strokeWidth="1" />
          ))}
          <path d={area} fill="url(#grad)" />
          <path d={line}  fill="none" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#064e3b" />
          ))}
        </svg>
      </div>
      <div className="flex justify-between mt-2">
        {months.map((m, i) => (
          <span key={i} className="text-[10px] text-stone-400">{m}</span>
        ))}
      </div>
    </div>
  );
}

function ComplianceRing() {
  const segments = [
    { label: 'Verified', count: 847, pct: 78, color: '#15803d' },
    { label: 'Pending',  count: 156, pct: 14, color: '#d97706' },
    { label: 'Issues',   count:  89, pct:  8, color: '#dc2626' },
  ];
  const r = 38, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  let cum = 0;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-stone-900">EUDR Compliance</h3>
      <p className="text-xs text-stone-400 mt-0.5 mb-4">1,092 packages assessed</p>
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f5f5f4" strokeWidth="12" />
            {segments.map((seg, i) => {
              const dash   = (seg.pct / 100) * circ;
              const offset = -(cum / 100) * circ;
              cum += seg.pct;
              return (
                <circle
                  key={i} cx={cx} cy={cy} r={r} fill="none"
                  stroke={seg.color} strokeWidth="12"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-stone-900">78%</span>
            <span className="text-[9px] text-stone-400 uppercase tracking-wide">compliant</span>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                <span className="text-stone-600">{seg.label}</span>
              </div>
              <span className="font-semibold text-stone-900">{seg.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const dotColor: Record<string, string> = {
    emerald: 'bg-emerald-500',
    orange:  'bg-orange-500',
    stone:   'bg-stone-400',
  };
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-stone-900 mb-4">Recent Activity</h3>
      <ol className="space-y-4">
        {activity.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor[item.color]}`} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-800 leading-snug">{item.label}</p>
              <p className="text-xs text-stone-500 mt-0.5 leading-snug">{item.sub}</p>
              <p className="text-[10px] text-stone-400 mt-1">{item.time}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ExporterDashboard() {
  const [search, setSearch] = useState('');
  const filtered = packages.filter(
    p =>
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.farmer.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex min-h-screen bg-stone-50 font-sans">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-white border-r border-stone-200 z-20">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-stone-100">
          <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-emerald-900 text-stone-50 text-sm font-bold shadow-sm shadow-emerald-900/20">
            T
          </span>
          <div className="leading-none">
            <span className="text-base font-bold tracking-tight text-stone-900">Tracebud</span>
            <span className="ml-2 text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              Exporter
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ label, icon: Icon, active, badge }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-emerald-900 text-stone-50 font-medium'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${active ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-200 text-stone-600'}`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-0.5 border-t border-stone-100 pt-3">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors">
            <Settings size={16} />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors">
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 ml-60 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-white/80 border-b border-stone-200 backdrop-blur-md">
          <div>
            <h1 className="text-base font-semibold text-stone-900">Overview</h1>
            <p className="text-xs text-stone-400">Green Valley Exports · Mar 18, 2026</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Actions */}
            <button className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors">
              <Upload size={14} />
              Import data
            </button>
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 shadow-sm shadow-orange-500/30 transition-colors">
              <Plus size={14} />
              New package
            </button>
            {/* Bell */}
            <button className="relative p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <Bell size={17} className="text-stone-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </button>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-emerald-900 flex items-center justify-center text-[11px] font-bold text-stone-50">
              GV
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-6 space-y-6">

          {/* EUDR banner */}
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-900">
            <Shield size={16} className="flex-shrink-0 text-emerald-700" />
            <p>
              <span className="font-semibold">EUDR compliance active.</span>
              {' '}78% of your packages are fully verified. 156 pending review.
            </p>
            <button className="ml-auto text-xs font-semibold text-orange-600 hover:text-orange-700 whitespace-nowrap">
              Review pending →
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Packages"   value="1,092" change="+12.5%" positive sparkline={[40,45,42,50,48,55,60,58,65,70,68,75]} />
            <MetricCard label="Pending Review"   value="156"   change="+8.2%"  positive sparkline={[20,25,22,28,30,25,32,35,30,38,40,35]} />
            <MetricCard label="Registered Plots" value="342"   change="+5.1%"  positive sparkline={[30,32,35,33,38,40,42,45,48,50,52,55]} />
            <MetricCard label="Active Farmers"   value="189"   change="+3.8%"  positive sparkline={[15,18,20,22,25,28,30,32,35,38,40,42]} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><AreaChart /></div>
            <ComplianceRing />
          </div>

          {/* Table + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Table */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <h3 className="text-sm font-semibold text-stone-900">Recent Packages</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="h-8 pl-8 pr-3 text-xs border border-stone-200 rounded-lg bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-900/30"
                    />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    View all
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50">
                      <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Dossier ID</th>
                      <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Farmer</th>
                      <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Commodity</th>
                      <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Weight</th>
                      <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Date</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filtered.map(pkg => (
                      <tr key={pkg.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="px-5 py-3.5 font-mono text-xs text-emerald-900 font-semibold">{pkg.id}</td>
                        <td className="px-5 py-3.5 text-stone-800">{pkg.farmer}</td>
                        <td className="px-5 py-3.5 text-stone-500">{pkg.commodity}</td>
                        <td className="px-5 py-3.5 text-stone-700 font-medium">{pkg.weight}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={pkg.status} /></td>
                        <td className="px-5 py-3.5 text-stone-400 text-xs">{pkg.date}</td>
                        <td className="px-5 py-3.5">
                          <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-stone-100 rounded-md transition-all">
                            <MoreHorizontal size={14} className="text-stone-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-sm text-stone-400">
                          No packages match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity */}
            <ActivityFeed />
          </div>
        </main>
      </div>
    </div>
  );
}
