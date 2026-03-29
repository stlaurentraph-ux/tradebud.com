'use client';

import { useState, type MouseEventHandler } from 'react';
import { DemoBrandLogo } from '../../DemoBrandLogo';
import {
  Package, MapPin, Users, BarChart3, Settings, LogOut, Bell, Search, Plus, FileText,
  ArrowUpRight, MoreHorizontal, CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown,
  Upload, Shield, ChevronRight, Globe, Camera, FileCheck, Scale, Truck, AlertTriangle,
  Map, Layers, Download, Eye, Send, X, ChevronDown, Leaf, Building2, QrCode, Lock,
  History, Filter, RefreshCw, ExternalLink, Satellite, PenTool, Trash2, Edit3, Copy,
  FolderOpen, UserCheck, Landmark, FileSignature, ShieldCheck, Workflow, Database,
  ArrowRight, Check, Info, Minus, CircleDot, Hexagon
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Page = 'overview' | 'packages' | 'plots' | 'farmers' | 'transactions' | 'compliance' | 'documents' | 'traces' | 'reports' | 'settings';
type PlotStatus = 'compliant' | 'pending' | 'flagged';
type PackageStatus = 'verified' | 'pending' | 'issue' | 'submitted';

interface NavItem {
  id: Page;
  label: string;
  icon: typeof Package;
  badge?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'packages', label: 'DDS Packages', icon: Package, badge: '156' },
  { id: 'plots', label: 'Plots & GIS', icon: MapPin },
  { id: 'farmers', label: 'Farmers', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: Truck },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'traces', label: 'TRACES NT', icon: Globe, badge: 'EU' },
  { id: 'reports', label: 'Reports', icon: FileText },
];

const packages = [
  { id: 'TRB-2026-0847', farmer: 'Juan Carlos Mejía', plot: 'HN-COP-001', commodity: 'Coffee', weight: '2,450 kg', yieldCheck: true, status: 'verified' as PackageStatus, tracesRef: 'EUCERT.2026.HN.0847', date: 'Mar 18, 2026' },
  { id: 'TRB-2026-0846', farmer: 'María Elena López', plot: 'HN-COP-002', commodity: 'Coffee', weight: '1,820 kg', yieldCheck: true, status: 'pending' as PackageStatus, tracesRef: null, date: 'Mar 17, 2026' },
  { id: 'TRB-2026-0845', farmer: 'Carlos Hernández', plot: 'HN-YOR-003', commodity: 'Cocoa', weight: '3,100 kg', yieldCheck: true, status: 'verified' as PackageStatus, tracesRef: 'EUCERT.2026.HN.0845', date: 'Mar 17, 2026' },
  { id: 'TRB-2026-0844', farmer: 'Ana Sofía Reyes', plot: 'HN-COP-004', commodity: 'Coffee', weight: '4,950 kg', yieldCheck: false, status: 'issue' as PackageStatus, tracesRef: null, date: 'Mar 16, 2026' },
  { id: 'TRB-2026-0843', farmer: 'Roberto Andrade', plot: 'HN-COP-005', commodity: 'Coffee', weight: '2,780 kg', yieldCheck: true, status: 'submitted' as PackageStatus, tracesRef: 'EUCERT.2026.HN.0843', date: 'Mar 16, 2026' },
];

const plots = [
  { id: 'HN-COP-001', farmer: 'Juan Carlos Mejía', area: '2.8 ha', type: 'Polygon', coords: '14.7845°N, 87.9123°W', forest: 'compliant' as PlotStatus, tenure: 'Titled', photos: 12, lastVerified: 'Mar 15, 2026' },
  { id: 'HN-COP-002', farmer: 'María Elena López', area: '1.5 ha', type: 'Centroid', coords: '14.8012°N, 87.8956°W', forest: 'compliant' as PlotStatus, tenure: 'Possession', photos: 8, lastVerified: 'Mar 14, 2026' },
  { id: 'HN-YOR-003', farmer: 'Carlos Hernández', area: '5.2 ha', type: 'Polygon', coords: '15.1234°N, 87.4567°W', forest: 'pending' as PlotStatus, tenure: 'Titled', photos: 15, lastVerified: 'Mar 12, 2026' },
  { id: 'HN-COP-004', farmer: 'Ana Sofía Reyes', area: '3.1 ha', type: 'Polygon', coords: '14.6789°N, 87.9876°W', forest: 'flagged' as PlotStatus, tenure: 'Buffer Zone', photos: 6, lastVerified: 'Mar 10, 2026' },
];

const farmers = [
  { id: 'F-001', name: 'Juan Carlos Mejía', region: 'Copán', plots: 3, packages: 28, tenure: 'Clave Catastral', fpic: true, labor: true },
  { id: 'F-002', name: 'María Elena López', region: 'Copán', plots: 1, packages: 12, tenure: 'Posesión', fpic: true, labor: true },
  { id: 'F-003', name: 'Carlos Hernández', region: 'Yoro', plots: 2, packages: 19, tenure: 'Clave Catastral', fpic: false, labor: true },
  { id: 'F-004', name: 'Ana Sofía Reyes', region: 'Copán', plots: 1, packages: 8, tenure: 'Buffer Permit', fpic: true, labor: false },
];

const transactions = [
  { id: 'TX-0892', package: 'TRB-2026-0847', from: 'Juan Carlos Mejía', to: 'Green Valley Exports', weight: '2,450 kg', yieldCap: '2,800 kg', status: 'valid', date: 'Mar 18, 2026' },
  { id: 'TX-0891', package: 'TRB-2026-0844', from: 'Ana Sofía Reyes', to: 'Green Valley Exports', weight: '4,950 kg', yieldCap: '3,100 kg', status: 'flagged', date: 'Mar 16, 2026' },
  { id: 'TX-0890', package: 'TRB-2026-0845', from: 'Carlos Hernández', to: 'Green Valley Exports', weight: '3,100 kg', yieldCap: '5,200 kg', status: 'valid', date: 'Mar 17, 2026' },
];

const monthlyData = [52, 61, 48, 70, 65, 82, 74, 69, 88, 79, 91, 103];
const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS - SHARED
// ═══════════════════════════════════════════════════════════════════════════════

function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'lg' }) {
  const map: Record<string, { cls: string; Icon: typeof CheckCircle2; label: string }> = {
    verified: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2, label: 'Verified' },
    compliant: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2, label: 'Compliant' },
    pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock, label: 'Pending' },
    issue: { cls: 'bg-red-50 text-red-700 border-red-200', Icon: AlertCircle, label: 'Issue' },
    flagged: { cls: 'bg-red-50 text-red-700 border-red-200', Icon: AlertTriangle, label: 'Flagged' },
    submitted: { cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: Send, label: 'Submitted' },
    valid: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2, label: 'Valid' },
  };
  const { cls, Icon, label } = map[status] ?? map.pending;
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClass} font-medium rounded-full border ${cls}`}>
      <Icon size={size === 'lg' ? 14 : 11} />
      {label}
    </span>
  );
}

function Card({ children, className = '', hover = false, onClick }: { children: React.ReactNode; className?: string; hover?: boolean; onClick?: MouseEventHandler<HTMLDivElement> }) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e as unknown as React.MouseEvent<HTMLDivElement>); } } : undefined}
      className={`bg-white border border-stone-200 rounded-xl ${hover ? 'hover:shadow-md hover:shadow-stone-100 hover:border-stone-300 transition-all cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function Button({ children, variant = 'primary', size = 'md', className = '', onClick }: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}) {
  const variants = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm shadow-orange-500/20',
    secondary: 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300',
    ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2',
  };
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        {subtitle && <p className="text-sm text-stone-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { 
  icon: typeof Package; 
  title: string; 
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-stone-400" />
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-1">{title}</h3>
      <p className="text-sm text-stone-500 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, status, onClick }: {
  icon: typeof Package;
  title: string;
  description: string;
  status?: 'complete' | 'pending' | 'required';
  onClick?: () => void;
}) {
  const statusColors = {
    complete: 'text-emerald-600 bg-emerald-50',
    pending: 'text-amber-600 bg-amber-50',
    required: 'text-red-600 bg-red-50',
  };
  return (
    <Card hover className="p-5" onClick={onClick}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-900/5 flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-emerald-900" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-stone-900">{title}</h4>
            {status && (
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusColors[status]}`}>
                {status}
              </span>
            )}
          </div>
          <p className="text-sm text-stone-500 leading-relaxed">{description}</p>
        </div>
        <ChevronRight size={18} className="text-stone-300 flex-shrink-0" />
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewPage({ setPage }: { setPage: (p: Page) => void }) {
  const max = Math.max(...monthlyData);
  const w = 500, h = 160;
  const pts = monthlyData.map((v, i) => ({
    x: (i / (monthlyData.length - 1)) * w,
    y: h - (v / max) * h * 0.9,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;

  const metrics = [
    { label: 'Total Packages', value: '1,092', change: '+12.5%', positive: true, icon: Package },
    { label: 'Pending Review', value: '156', change: '+8.2%', positive: true, icon: Clock },
    { label: 'Registered Plots', value: '342', change: '+5.1%', positive: true, icon: MapPin },
    { label: 'Active Farmers', value: '189', change: '+3.8%', positive: true, icon: Users },
  ];

  const segments = [
    { label: 'Verified', count: 847, pct: 78, color: '#15803d' },
    { label: 'Pending', count: 156, pct: 14, color: '#d97706' },
    { label: 'Issues', count: 89, pct: 8, color: '#dc2626' },
  ];
  const r = 38, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  let cum = 0;

  return (
    <div className="space-y-6">
      {/* EUDR Banner */}
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-900 flex items-center justify-center flex-shrink-0">
            <Shield size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-900">EUDR Compliance Dashboard</h3>
            <p className="text-sm text-emerald-700 mt-0.5">
              Deadline: <span className="font-semibold">December 30, 2026</span> for Large/Medium enterprises. 78% of packages verified.
            </p>
          </div>
          <Button variant="primary" onClick={() => setPage('compliance')}>
            <ShieldCheck size={16} />
            Review Compliance
          </Button>
        </div>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} hover className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{m.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-stone-900 tracking-tight">{m.value}</p>
                  <p className={`mt-2 text-xs font-medium flex items-center gap-1 ${m.positive ? 'text-emerald-700' : 'text-red-600'}`}>
                    {m.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {m.change} vs last month
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Icon size={20} className="text-emerald-700" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-stone-900">Package Submissions</h3>
              <p className="text-xs text-stone-400 mt-0.5">Last 12 months</p>
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              +18% YoY
            </span>
          </div>
          <div className="relative" style={{ height: 160 }}>
            <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14532d" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#14532d" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map(f => (
                <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="#e7e5e4" strokeWidth="1" />
              ))}
              <path d={area} fill="url(#areaGrad)" />
              <path d={line} fill="none" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#14532d" />
              ))}
            </svg>
          </div>
          <div className="flex justify-between mt-2">
            {months.map((m, i) => (
              <span key={i} className="text-[10px] text-stone-400">{m}</span>
            ))}
          </div>
        </Card>

        {/* Compliance Ring */}
        <Card className="p-5">
          <h3 className="font-semibold text-stone-900">EUDR Compliance</h3>
          <p className="text-xs text-stone-400 mt-0.5 mb-4">1,092 packages assessed</p>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f5f5f4" strokeWidth="12" />
                {segments.map((seg, i) => {
                  const dash = (seg.pct / 100) * circ;
                  const offset = -(cum / 100) * circ;
                  cum += seg.pct;
                  return (
                    <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="12"
                      strokeDasharray={`${dash} ${circ}`} strokeDashoffset={offset} />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-stone-900">78%</span>
                <span className="text-[9px] text-stone-400 uppercase">compliant</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {segments.map((seg, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
                    <span className="text-stone-600">{seg.label}</span>
                  </div>
                  <span className="font-semibold text-stone-900">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-stone-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard icon={Plus} title="New DDS Package" description="Create a new Due Diligence Statement" onClick={() => setPage('packages')} />
          <FeatureCard icon={MapPin} title="Register Plot" description="Add polygon or centroid coordinates" onClick={() => setPage('plots')} />
          <FeatureCard icon={Send} title="Submit to TRACES" description="Send verified packages to EU portal" onClick={() => setPage('traces')} />
          <FeatureCard icon={FileText} title="Generate Report" description="Export compliance documentation" onClick={() => setPage('reports')} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-semibold text-stone-900">Recent Packages</h3>
            <Button variant="ghost" size="sm" onClick={() => setPage('packages')}>
              View all <ArrowUpRight size={12} />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Farmer</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Commodity</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {packages.slice(0, 4).map(pkg => (
                  <tr key={pkg.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-emerald-900 font-semibold">{pkg.id}</td>
                    <td className="px-5 py-3.5 text-stone-800">{pkg.farmer}</td>
                    <td className="px-5 py-3.5 text-stone-500">{pkg.commodity}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={pkg.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-stone-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { label: 'Package verified', sub: 'TRB-2026-0847 passed all checks', time: '2h ago', color: 'emerald' },
              { label: 'TRACES submission', sub: 'Batch of 12 packages sent to EU', time: '5h ago', color: 'blue' },
              { label: 'Plot flagged', sub: 'HN-COP-004 requires review', time: '1d ago', color: 'orange' },
              { label: 'Farmer registered', sub: 'Roberto Andrade added to system', time: '2d ago', color: 'stone' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  item.color === 'emerald' ? 'bg-emerald-500' : 
                  item.color === 'blue' ? 'bg-blue-500' :
                  item.color === 'orange' ? 'bg-orange-500' : 'bg-stone-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-stone-800">{item.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{item.sub}</p>
                  <p className="text-[10px] text-stone-400 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: DDS PACKAGES
// ═══════════════════════════════════════════════════════════════════════════════

function PackagesPage({ setPage }: { setPage: (p: Page) => void }) {
  const [search, setSearch] = useState('');
  const [selectedPkg, setSelectedPkg] = useState<typeof packages[0] | null>(null);
  const filtered = packages.filter(p => 
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.farmer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="DDS Packages" 
        subtitle="Manage Due Diligence Statements for EUDR compliance"
        action={
          <div className="flex gap-3">
            <Button variant="secondary">
              <Upload size={16} />
              Import batch
            </Button>
            <Button variant="primary">
              <Plus size={16} />
              New package
            </Button>
          </div>
        }
      />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-700" />
            <div>
              <p className="text-2xl font-bold text-emerald-900">847</p>
              <p className="text-xs text-emerald-700">Verified & Ready</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-amber-700" />
            <div>
              <p className="text-2xl font-bold text-amber-900">156</p>
              <p className="text-xs text-amber-700">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Send size={20} className="text-blue-700" />
            <div>
              <p className="text-2xl font-bold text-blue-900">89</p>
              <p className="text-xs text-blue-700">Submitted to TRACES</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search packages..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 pl-9 pr-4 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-900/20 focus:border-emerald-900/30 w-64"
              />
            </div>
            <Button variant="ghost" size="sm">
              <Filter size={14} />
              Filter
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPage('traces')}>
            <Send size={14} />
            Submit selected to TRACES
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Dossier ID</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Farmer</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Plot</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Commodity</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Weight</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Yield Check</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">TRACES Ref</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map(pkg => (
                <tr key={pkg.id} className="hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => setSelectedPkg(pkg)}>
                  <td className="px-5 py-3.5 font-mono text-xs text-emerald-900 font-semibold">{pkg.id}</td>
                  <td className="px-5 py-3.5 text-stone-800">{pkg.farmer}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-stone-500">{pkg.plot}</td>
                  <td className="px-5 py-3.5 text-stone-600">{pkg.commodity}</td>
                  <td className="px-5 py-3.5 text-stone-700 font-medium">{pkg.weight}</td>
                  <td className="px-5 py-3.5">
                    {pkg.yieldCheck ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs"><CheckCircle2 size={12} /> Valid</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 text-xs"><AlertTriangle size={12} /> Exceeded</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={pkg.status} /></td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-stone-400">{pkg.tracesRef || '—'}</td>
                  <td className="px-5 py-3.5">
                    <button className="p-1 hover:bg-stone-100 rounded-md">
                      <MoreHorizontal size={14} className="text-stone-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Package Detail Modal */}
      {selectedPkg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPkg(null)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900">Package Details</h3>
                <p className="text-xs text-stone-500 mt-0.5 font-mono">{selectedPkg.id}</p>
              </div>
              <button onClick={() => setSelectedPkg(null)} className="p-2 hover:bg-stone-100 rounded-lg">
                <X size={18} className="text-stone-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase mb-1">Farmer</p>
                  <p className="text-stone-900 font-medium">{selectedPkg.farmer}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase mb-1">Plot ID</p>
                  <p className="text-stone-900 font-mono">{selectedPkg.plot}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase mb-1">Commodity</p>
                  <p className="text-stone-900">{selectedPkg.commodity}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase mb-1">Weight</p>
                  <p className="text-stone-900 font-medium">{selectedPkg.weight}</p>
                </div>
              </div>

              {/* Compliance Checklist */}
              <div>
                <h4 className="font-semibold text-stone-900 mb-3">Compliance Checklist</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Deforestation-free (Dec 31, 2020 baseline)', checked: true },
                    { label: 'No forest degradation detected', checked: true },
                    { label: 'Legal land tenure documented', checked: true },
                    { label: 'FPIC consultation complete', checked: selectedPkg.status !== 'issue' },
                    { label: 'Yield within biological capacity', checked: selectedPkg.yieldCheck },
                    { label: 'Geo-coordinates verified (6 decimal places)', checked: true },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${item.checked ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {item.checked ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <AlertCircle size={16} className="text-red-600" />
                      )}
                      <span className={`text-sm ${item.checked ? 'text-emerald-900' : 'text-red-900'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1">
                  <QrCode size={16} />
                  Generate QR
                </Button>
                <Button variant="secondary" className="flex-1">
                  <Download size={16} />
                  Export PDF
                </Button>
                <Button variant="primary" className="flex-1" onClick={() => setPage('traces')}>
                  <Send size={16} />
                  Submit to TRACES
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: PLOTS & GIS
// ═══════════════════════════════════════════════════════════════════════════════

function PlotsPage() {
  const [selectedPlot, setSelectedPlot] = useState<typeof plots[0] | null>(null);
  const [showCapture, setShowCapture] = useState(false);

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Plots & GIS Management" 
        subtitle="Manage plot boundaries, deforestation checks, and photo vault"
        action={
          <Button variant="primary" onClick={() => setShowCapture(true)}>
            <MapPin size={16} />
            Register new plot
          </Button>
        }
      />

      {/* GIS Requirements Info */}
      <Card className="p-5 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">EUDR GIS Requirements</h4>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>- Coordinates must use WGS84 (EPSG:4326) with minimum 6 decimal places</li>
              <li>- Plots &lt; 4 hectares: Centroid point OR polygon</li>
              <li>- Plots &ge; 4 hectares: Must be captured as complete polygon</li>
              <li>- Separate GeoIDs required for non-contiguous fields</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Layers size={18} className="text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">342</p>
              <p className="text-xs text-stone-500">Total Plots</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">298</p>
              <p className="text-xs text-stone-500">Deforestation-free</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={18} className="text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">32</p>
              <p className="text-xs text-stone-500">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">12</p>
              <p className="text-xs text-stone-500">Flagged</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Map Placeholder */}
      <Card className="p-0 overflow-hidden">
        <div className="h-72 bg-gradient-to-br from-emerald-900/5 to-emerald-900/10 flex items-center justify-center relative">
          <div className="absolute inset-0 opacity-10">
            {/* Grid pattern */}
            <svg width="100%" height="100%">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#14532d" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="text-center relative z-10">
            <Map size={48} className="text-emerald-700 mx-auto mb-3 opacity-50" />
            <p className="text-emerald-900 font-medium">Interactive Map View</p>
            <p className="text-sm text-emerald-700 mt-1">GIS integration with offline vector tiles</p>
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button variant="secondary" size="sm">
              <Satellite size={14} />
              Satellite
            </Button>
            <Button variant="secondary" size="sm">
              <PenTool size={14} />
              Draw polygon
            </Button>
          </div>
        </div>
      </Card>

      {/* Plots Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900">Registered Plots</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Filter size={14} />
              Filter
            </Button>
            <Button variant="ghost" size="sm">
              <Download size={14} />
              Export GeoJSON
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Plot ID</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Farmer</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Area</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Type</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Coordinates</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Forest Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Tenure</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Photos</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {plots.map(plot => (
                <tr key={plot.id} className="hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => setSelectedPlot(plot)}>
                  <td className="px-5 py-3.5 font-mono text-xs text-emerald-900 font-semibold">{plot.id}</td>
                  <td className="px-5 py-3.5 text-stone-800">{plot.farmer}</td>
                  <td className="px-5 py-3.5 text-stone-700 font-medium">{plot.area}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-stone-100 text-stone-600 rounded-md">
                      {plot.type === 'Polygon' ? <Hexagon size={10} /> : <CircleDot size={10} />}
                      {plot.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-stone-500">{plot.coords}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={plot.forest} /></td>
                  <td className="px-5 py-3.5 text-stone-600">{plot.tenure}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-stone-600 text-xs">
                      <Camera size={12} />
                      {plot.photos}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="p-1 hover:bg-stone-100 rounded-md">
                      <MoreHorizontal size={14} className="text-stone-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Plot Detail Modal */}
      {selectedPlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPlot(null)}>
          <Card className="w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900">Plot Details</h3>
                <p className="text-xs text-stone-500 mt-0.5 font-mono">{selectedPlot.id}</p>
              </div>
              <button onClick={() => setSelectedPlot(null)} className="p-2 hover:bg-stone-100 rounded-lg">
                <X size={18} className="text-stone-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Map placeholder */}
              <div className="h-48 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-200">
                <div className="text-center">
                  <Map size={32} className="text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm text-emerald-800">Plot boundary visualization</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase mb-1">Farmer</p>
                  <p className="text-stone-900 font-medium">{selectedPlot.farmer}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase mb-1">Area</p>
                  <p className="text-stone-900 font-medium">{selectedPlot.area}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase mb-1">Capture Type</p>
                  <p className="text-stone-900">{selectedPlot.type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase mb-1">Coordinates</p>
                  <p className="text-stone-900 font-mono text-sm">{selectedPlot.coords}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase mb-1">Land Tenure</p>
                  <p className="text-stone-900">{selectedPlot.tenure}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase mb-1">Last Verified</p>
                  <p className="text-stone-900">{selectedPlot.lastVerified}</p>
                </div>
              </div>

              {/* Deforestation Analysis */}
              <div>
                <h4 className="font-semibold text-stone-900 mb-3">Deforestation Analysis</h4>
                <div className={`p-4 rounded-xl border ${
                  selectedPlot.forest === 'compliant' ? 'bg-emerald-50 border-emerald-200' :
                  selectedPlot.forest === 'pending' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {selectedPlot.forest === 'compliant' ? (
                      <CheckCircle2 size={24} className="text-emerald-600" />
                    ) : selectedPlot.forest === 'pending' ? (
                      <Clock size={24} className="text-amber-600" />
                    ) : (
                      <AlertTriangle size={24} className="text-red-600" />
                    )}
                    <div>
                      <p className={`font-semibold ${
                        selectedPlot.forest === 'compliant' ? 'text-emerald-900' :
                        selectedPlot.forest === 'pending' ? 'text-amber-900' :
                        'text-red-900'
                      }`}>
                        {selectedPlot.forest === 'compliant' ? 'Deforestation-free verified' :
                         selectedPlot.forest === 'pending' ? 'Analysis pending' :
                         'Potential deforestation detected'}
                      </p>
                      <p className="text-sm text-stone-600 mt-0.5">
                        Baseline: December 31, 2020 (FAO definition: &gt;0.5ha, &gt;5m height, &gt;10% canopy)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Vault */}
              <div>
                <h4 className="font-semibold text-stone-900 mb-3">Ground-Truth Photo Vault</h4>
                <p className="text-sm text-stone-500 mb-3">
                  Timestamped, geo-tagged photos for false-positive mitigation during EU audits
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-square bg-stone-100 rounded-lg flex items-center justify-center">
                      <Camera size={24} className="text-stone-400" />
                    </div>
                  ))}
                </div>
                <Button variant="secondary" size="sm" className="mt-3">
                  <Camera size={14} />
                  Add photos
                </Button>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1">
                  <Edit3 size={16} />
                  Edit boundaries
                </Button>
                <Button variant="secondary" className="flex-1">
                  <RefreshCw size={16} />
                  Re-analyze
                </Button>
                <Button variant="primary" className="flex-1">
                  <Download size={16} />
                  Export GeoJSON
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Plot Capture Modal */}
      {showCapture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCapture(false)}>
          <Card className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-900">Register New Plot</h3>
              <button onClick={() => setShowCapture(false)} className="p-2 hover:bg-stone-100 rounded-lg">
                <X size={18} className="text-stone-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Capture Method Selection */}
              <div>
                <h4 className="font-semibold text-stone-900 mb-3">Select Capture Method</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card hover className="p-4 border-2 border-emerald-500">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Hexagon size={20} className="text-emerald-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">Polygon Capture</p>
                        <p className="text-xs text-stone-500">Required for plots &ge; 4 hectares</p>
                      </div>
                    </div>
                  </Card>
                  <Card hover className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                        <CircleDot size={20} className="text-stone-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">Centroid Point</p>
                        <p className="text-xs text-stone-500">For plots &lt; 4 hectares</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* GNSS Info */}
              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <Satellite size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Adaptive GNSS Capture</p>
                    <p className="text-sm text-amber-800 mt-1">
                      Waypoint averaging (60-120s per vertex) will be used to filter multipath errors under tropical canopy.
                      L1/L5 dual-frequency GNSS enabled if hardware supports it.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Offline fallback */}
              <Card className="p-4 bg-stone-50 border-stone-200">
                <div className="flex items-start gap-3">
                  <Map size={18} className="text-stone-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-stone-900">Offline Fallback</p>
                    <p className="text-sm text-stone-600 mt-1">
                      If GNSS fails, you can manually trace the polygon on pre-cached satellite imagery.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCapture(false)}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1">
                  <MapPin size={16} />
                  Start capture
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: FARMERS
// ═══════════════════════════════════════════════════════════════════════════════

function FarmersPage() {
  const [selectedFarmer, setSelectedFarmer] = useState<typeof farmers[0] | null>(null);

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Farmer Registry" 
        subtitle="Manage farmer profiles, land tenure documents, and social compliance"
        action={
          <Button variant="primary">
            <Plus size={16} />
            Add farmer
          </Button>
        }
      />

      {/* User Hierarchy Info */}
      <Card className="p-5">
        <h4 className="font-semibold text-stone-900 mb-4">EUDR User Hierarchy</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: Users, title: 'Farmers', desc: 'Full owners of their data profile', color: 'emerald' },
            { icon: Building2, title: 'Micro/Small Operators', desc: 'Simplified declaration workflow', color: 'blue' },
            { icon: Truck, title: 'Exporters (Operators)', desc: 'Aggregate farmer IDs & generate payloads', color: 'amber' },
            { icon: Globe, title: 'Importers (Sponsors)', desc: 'Ultimate liability holders', color: 'orange' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className={`p-4 rounded-xl bg-${item.color}-50 border border-${item.color}-200`}>
                <Icon size={20} className={`text-${item.color}-700 mb-2`} />
                <p className="font-semibold text-stone-900">{item.title}</p>
                <p className="text-xs text-stone-600 mt-1">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Farmers Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900">Registered Farmers</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search farmers..."
                className="h-9 pl-9 pr-4 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-900/20 w-56"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">ID</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Name</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Region</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Plots</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Packages</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Land Tenure</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">FPIC</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Labor</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {farmers.map(farmer => (
                <tr key={farmer.id} className="hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => setSelectedFarmer(farmer)}>
                  <td className="px-5 py-3.5 font-mono text-xs text-emerald-900 font-semibold">{farmer.id}</td>
                  <td className="px-5 py-3.5 text-stone-800 font-medium">{farmer.name}</td>
                  <td className="px-5 py-3.5 text-stone-600">{farmer.region}</td>
                  <td className="px-5 py-3.5 text-stone-700">{farmer.plots}</td>
                  <td className="px-5 py-3.5 text-stone-700">{farmer.packages}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded-md">
                      <FileText size={10} />
                      {farmer.tenure}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {farmer.fpic ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={16} className="text-amber-500" />
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {farmer.labor ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="p-1 hover:bg-stone-100 rounded-md">
                      <MoreHorizontal size={14} className="text-stone-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Farmer Detail Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedFarmer(null)}>
          <Card className="w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-900 flex items-center justify-center text-white font-bold">
                  {selectedFarmer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">{selectedFarmer.name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{selectedFarmer.region}, Honduras</p>
                </div>
              </div>
              <button onClick={() => setSelectedFarmer(null)} className="p-2 hover:bg-stone-100 rounded-lg">
                <X size={18} className="text-stone-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-stone-900">{selectedFarmer.plots}</p>
                  <p className="text-xs text-stone-500">Registered Plots</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-stone-900">{selectedFarmer.packages}</p>
                  <p className="text-xs text-stone-500">Total Packages</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">96%</p>
                  <p className="text-xs text-stone-500">Compliance Rate</p>
                </Card>
              </div>

              {/* Land Tenure */}
              <div>
                <h4 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <Landmark size={18} />
                  Land Tenure Documentation
                </h4>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <FileText size={18} className="text-emerald-700" />
                      </div>
                      <div>
                        <p className="font-medium text-stone-900">{selectedFarmer.tenure}</p>
                        <p className="text-xs text-stone-500">
                          {selectedFarmer.tenure === 'Clave Catastral' ? 'National cadastral key verified' : 
                           selectedFarmer.tenure === 'Posesión' ? 'Producer in Possession declaration' :
                           'Buffer zone permit uploaded'}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye size={14} />
                      View
                    </Button>
                  </div>
                </Card>
                <p className="text-xs text-stone-500 mt-2">
                  Supports OCR for Clave Catastral, formal land titles, and "Productor en Posesión" declarations
                </p>
              </div>

              {/* FPIC */}
              <div>
                <h4 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <UserCheck size={18} />
                  FPIC Consultation Repository
                </h4>
                <Card className={`p-4 ${selectedFarmer.fpic ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-3">
                    {selectedFarmer.fpic ? (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={20} className="text-amber-600" />
                    )}
                    <div>
                      <p className={`font-medium ${selectedFarmer.fpic ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {selectedFarmer.fpic ? 'FPIC documentation complete' : 'FPIC documentation pending'}
                      </p>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Free, Prior, and Informed Consent verification
                      </p>
                    </div>
                  </div>
                </Card>
                <div className="mt-3 space-y-2">
                  {[
                    { label: 'Community assembly minutes', uploaded: true },
                    { label: 'Participatory mapping exercise', uploaded: true },
                    { label: 'Social agreement documentation', uploaded: selectedFarmer.fpic },
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 bg-stone-50 rounded-lg">
                      <span className="text-sm text-stone-700">{doc.label}</span>
                      {doc.uploaded ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Uploaded
                        </span>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <Upload size={12} />
                          Upload
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Labor Standards */}
              <div>
                <h4 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <Scale size={18} />
                  Labor Standards (ILO Conventions)
                </h4>
                <Card className={`p-4 ${selectedFarmer.labor ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    {selectedFarmer.labor ? (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    ) : (
                      <AlertTriangle size={20} className="text-red-600" />
                    )}
                    <div>
                      <p className={`font-medium ${selectedFarmer.labor ? 'text-emerald-900' : 'text-red-900'}`}>
                        {selectedFarmer.labor ? 'Labor compliance verified' : 'Labor compliance issues detected'}
                      </p>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Child labor & forced labor checks
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1">
                  <QrCode size={16} />
                  Generate voucher
                </Button>
                <Button variant="primary" className="flex-1">
                  <FileText size={16} />
                  Export profile
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function TransactionsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Transactions & Supply Chain" 
        subtitle="Identity Preservation (IP) tracking with yield validation"
        action={
          <Button variant="primary">
            <Plus size={16} />
            Record transaction
          </Button>
        }
      />

      {/* IP Info */}
      <Card className="p-5 bg-emerald-50 border-emerald-200">
        <div className="flex items-start gap-4">
          <Shield size={24} className="text-emerald-700 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-emerald-900">Strict Segregation - No Mass Balance</h4>
            <p className="text-sm text-emerald-800 mt-1">
              EUDR prohibits Mass Balance chains of custody. All batches are tracked with Identity Preservation (IP) 
              and strict segregation. Origin coordinates are never obscured.
            </p>
          </div>
        </div>
      </Card>

      {/* Yield Validation Explanation */}
      <Card className="p-5 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-4">
          <Scale size={24} className="text-amber-700 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900">Yield Cap Validation (Anti-Fraud)</h4>
            <p className="text-sm text-amber-800 mt-1">
              Delivery weights are cross-referenced against biological carrying capacity (e.g., 1ha &asymp; 1,500kg coffee).
              Exceeding the cap flags the transaction for "Laundering/Illicit Blending" investigation.
            </p>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">TX ID</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Package</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">From</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">To</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Weight</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Yield Cap</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Validation</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-stone-600">{tx.id}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-emerald-900 font-semibold">{tx.package}</td>
                  <td className="px-5 py-3.5 text-stone-800">{tx.from}</td>
                  <td className="px-5 py-3.5 text-stone-600">{tx.to}</td>
                  <td className="px-5 py-3.5 text-stone-700 font-medium">{tx.weight}</td>
                  <td className="px-5 py-3.5 text-stone-500">{tx.yieldCap}</td>
                  <td className="px-5 py-3.5">
                    {tx.status === 'valid' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle2 size={11} />
                        Within capacity
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">
                        <AlertTriangle size={11} />
                        Exceeds cap
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-stone-400 text-xs">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Declaration in Excess */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-stone-900">Declaration in Excess</h4>
            <p className="text-sm text-stone-500 mt-1">
              Bundle surplus of verified "Farmer Vouchers" into delivery payloads for operational fluidity while maintaining 100% compliance.
            </p>
          </div>
          <Button variant="secondary">
            <Workflow size={16} />
            Create batch
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════════

function CompliancePage() {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Compliance & Verification" 
        subtitle="EUDR compliance engine with deforestation checks and legality verification"
      />

      {/* Deadline Banner */}
      <Card className="p-5 bg-gradient-to-r from-orange-50 to-orange-100/50 border-orange-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center flex-shrink-0">
            <Clock size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900">EUDR Compliance Deadlines</h3>
            <div className="flex gap-6 mt-2">
              <div>
                <p className="text-xs text-orange-700">Large/Medium Enterprises</p>
                <p className="font-bold text-orange-900">December 30, 2026</p>
              </div>
              <div>
                <p className="text-xs text-orange-700">Micro/Small Enterprises</p>
                <p className="font-bold text-orange-900">June 30, 2027</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Compliance Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h4 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Leaf size={18} />
            Deforestation & Degradation Checks
          </h4>
          <div className="space-y-3">
            {[
              { label: 'Deforestation-free (Dec 31, 2020 baseline)', status: 'pass', desc: 'FAO definition: >0.5ha, >5m height, >10% canopy' },
              { label: 'No forest degradation detected', status: 'pass', desc: 'Structural changes monitored (e.g., primary to plantation)' },
              { label: 'AI satellite cross-reference', status: 'pass', desc: 'Historical polygon analysis complete' },
            ].map((check, i) => (
              <div key={i} className={`p-4 rounded-xl ${check.status === 'pass' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-3">
                  {check.status === 'pass' ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <AlertTriangle size={18} className="text-red-600" />
                  )}
                  <div>
                    <p className={`font-medium ${check.status === 'pass' ? 'text-emerald-900' : 'text-red-900'}`}>{check.label}</p>
                    <p className="text-xs text-stone-600 mt-0.5">{check.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h4 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Landmark size={18} />
            Legality & Land Tenure
          </h4>
          <div className="space-y-3">
            {[
              { label: 'Legal land tenure documented', status: 'pass', desc: 'Clave Catastral or Posesión declaration verified' },
              { label: 'Protected area check', status: 'review', desc: 'SINAPH overlap requires buffer zone permit' },
              { label: 'FPIC consultation complete', status: 'pass', desc: 'Community agreements uploaded' },
              { label: 'Labor standards (ILO)', status: 'pass', desc: 'No child/forced labor violations' },
            ].map((check, i) => (
              <div key={i} className={`p-4 rounded-xl ${
                check.status === 'pass' ? 'bg-emerald-50 border border-emerald-200' : 
                check.status === 'review' ? 'bg-amber-50 border border-amber-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {check.status === 'pass' ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : check.status === 'review' ? (
                    <Clock size={18} className="text-amber-600" />
                  ) : (
                    <AlertTriangle size={18} className="text-red-600" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      check.status === 'pass' ? 'text-emerald-900' : 
                      check.status === 'review' ? 'text-amber-900' :
                      'text-red-900'
                    }`}>{check.label}</p>
                    <p className="text-xs text-stone-600 mt-0.5">{check.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Audit Trail */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-stone-900 flex items-center gap-2">
            <History size={18} />
            Immutable Audit Trail
          </h4>
          <span className="text-xs text-stone-500">5-year retention policy (EUDR Article 9)</span>
        </div>
        <div className="space-y-3">
          {[
            { action: 'Plot boundary updated', user: 'Maria Lopez', reason: 'GPS refinement', time: '2 hours ago', device: 'Android (SM-A536)' },
            { action: 'Deforestation check passed', user: 'System', reason: 'Automated verification', time: '5 hours ago', device: 'Server' },
            { action: 'FPIC document uploaded', user: 'Juan Mejía', reason: 'Community assembly minutes', time: '1 day ago', device: 'iOS (iPhone 14)' },
          ].map((entry, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-stone-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                <History size={14} className="text-stone-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900">{entry.action}</p>
                <p className="text-sm text-stone-600 mt-0.5">By: {entry.user} | Reason: {entry.reason}</p>
                <p className="text-xs text-stone-400 mt-1">Device: {entry.device} | {entry.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Data Privacy */}
      <Card className="p-5">
        <h4 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <Lock size={18} />
          Privacy & RBAC (Role-Based Access Control)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-stone-50">
            <p className="font-semibold text-stone-900">Public View</p>
            <p className="text-xs text-stone-600 mt-1">QR code shows anonymized Polygon ID and regional data only</p>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <p className="font-semibold text-amber-900">Importer Access</p>
            <p className="text-xs text-amber-800 mt-1">Full supply chain visibility for liability assumption</p>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <p className="font-semibold text-emerald-900">EU Authority Access</p>
            <p className="text-xs text-emerald-800 mt-1">Decryption keys via RBAC for plaintext PII access</p>
          </Card>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

function DocumentsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Document Repository" 
        subtitle="Manage land tenure, FPIC, and compliance documentation"
        action={
          <Button variant="primary">
            <Upload size={16} />
            Upload document
          </Button>
        }
      />

      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Landmark, title: 'Land Tenure', count: 156, desc: 'Clave Catastral, titles, possession declarations' },
          { icon: UserCheck, title: 'FPIC Consultation', count: 89, desc: 'Assembly minutes, social agreements' },
          { icon: Scale, title: 'Labor Standards', count: 45, desc: 'ILO compliance, working conditions' },
          { icon: FileSignature, title: 'Buffer Zone Permits', count: 12, desc: 'SINAPH management plans' },
          { icon: Camera, title: 'Photo Vault', count: 1247, desc: 'Ground-truth verification images' },
          { icon: Shield, title: 'Risk Assessments', count: 34, desc: 'Due diligence reports' },
        ].map((cat, i) => {
          const Icon = cat.icon;
          return (
            <Card key={i} hover className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-emerald-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-stone-900">{cat.title}</h4>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{cat.count}</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">{cat.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* OCR Feature */}
      <Card className="p-5 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <FileCheck size={24} className="text-blue-700 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900">OCR Document Scanning</h4>
            <p className="text-sm text-blue-800 mt-1">
              Automatic extraction of Clave Catastral (national cadastral key) and formal land title data using optical character recognition.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: TRACES NT
// ═══════════════════════════════════════════════════════════════════════════════

function TracesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="TRACES NT Integration" 
        subtitle="Submit verified packages to the European Commission's TRACES NT system"
      />

      {/* TRACES Info */}
      <Card className="p-5 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <Globe size={24} className="text-blue-700 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900">SOAP/XML Middleware</h4>
            <p className="text-sm text-blue-800 mt-1">
              Tracebud automatically constructs the verbose SOAP/XML envelopes required by TRACES NT, including 
              WS-Security headers with cryptographic digests. GeoJSON polygons are chunked to meet file size limits.
            </p>
          </div>
        </div>
      </Card>

      {/* Submission Queue */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-stone-900">Ready for Submission</h4>
          <Button variant="primary">
            <Send size={16} />
            Submit all (24)
          </Button>
        </div>
        <div className="space-y-3">
          {packages.filter(p => p.status === 'verified').map(pkg => (
            <div key={pkg.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center gap-4">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <div>
                  <p className="font-mono text-sm font-semibold text-stone-900">{pkg.id}</p>
                  <p className="text-xs text-stone-500">{pkg.farmer} | {pkg.commodity} | {pkg.weight}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                <Send size={12} />
                Submit
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Submitted */}
      <Card className="p-5">
        <h4 className="font-semibold text-stone-900 mb-4">Submitted to TRACES</h4>
        <div className="space-y-3">
          {packages.filter(p => p.tracesRef).map(pkg => (
            <div key={pkg.id} className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-4">
                <Send size={20} className="text-emerald-600" />
                <div>
                  <p className="font-mono text-sm font-semibold text-emerald-900">{pkg.id}</p>
                  <p className="text-xs text-emerald-700">TRACES Ref: {pkg.tracesRef}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <ExternalLink size={12} />
                View in TRACES
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* External Registries */}
      <Card className="p-5">
        <h4 className="font-semibold text-stone-900 mb-4">External Registry Sync</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-stone-50">
            <div className="flex items-center gap-3 mb-2">
              <Database size={18} className="text-stone-600" />
              <p className="font-semibold text-stone-900">ICF (Forest Institute)</p>
            </div>
            <p className="text-xs text-stone-600">Sync cadastral boundaries and forest status</p>
            <Button variant="ghost" size="sm" className="mt-3">
              <RefreshCw size={12} />
              Sync now
            </Button>
          </Card>
          <Card className="p-4 bg-stone-50">
            <div className="flex items-center gap-3 mb-2">
              <Database size={18} className="text-stone-600" />
              <p className="font-semibold text-stone-900">IHCAFE (Coffee Institute)</p>
            </div>
            <p className="text-xs text-stone-600">Verify producer status and certifications</p>
            <Button variant="ghost" size="sm" className="mt-3">
              <RefreshCw size={12} />
              Sync now
            </Button>
          </Card>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

function ReportsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Reports & Analytics" 
        subtitle="Generate compliance reports and export documentation"
      />

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Shield, title: 'EUDR Compliance Report', desc: 'Full due diligence documentation for EU submission' },
          { icon: MapPin, title: 'GIS Export', desc: 'Plot boundaries in GeoJSON/Shapefile format' },
          { icon: Package, title: 'Package Manifest', desc: 'Complete shipment documentation with traceability' },
          { icon: Users, title: 'Farmer Registry Export', desc: 'Farmer profiles with compliance status' },
          { icon: Truck, title: 'Transaction Ledger', desc: 'Supply chain transactions with yield validation' },
          { icon: History, title: 'Audit Trail', desc: '5-year retention compliant audit log' },
        ].map((report, i) => {
          const Icon = report.icon;
          return (
            <Card key={i} hover className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-emerald-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-stone-900">{report.title}</h4>
                  <p className="text-xs text-stone-500 mt-1">{report.desc}</p>
                  <Button variant="ghost" size="sm" className="mt-3 -ml-2">
                    <Download size={12} />
                    Generate
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" subtitle="Configure your exporter dashboard" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Organization */}
          <Card className="p-6">
            <h4 className="font-semibold text-stone-900 mb-4">Organization</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700">Company Name</label>
                <input type="text" defaultValue="Green Valley Exports" className="mt-1 w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Country</label>
                <input type="text" defaultValue="Honduras" className="mt-1 w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Enterprise Size</label>
                <select className="mt-1 w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/20">
                  <option>Large Enterprise (Deadline: Dec 30, 2026)</option>
                  <option>Medium Enterprise (Deadline: Dec 30, 2026)</option>
                  <option>Small Enterprise (Deadline: Jun 30, 2027)</option>
                  <option>Micro Enterprise (Deadline: Jun 30, 2027)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* API Keys */}
          <Card className="p-6">
            <h4 className="font-semibold text-stone-900 mb-4">API Integration</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700">TRACES NT API Key</label>
                <div className="mt-1 flex gap-2">
                  <input type="password" defaultValue="••••••••••••" className="flex-1 px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/20" />
                  <Button variant="secondary">
                    <Eye size={16} />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">ICF Registry Endpoint</label>
                <input type="text" defaultValue="https://api.icf.gob.hn/v1" className="mt-1 w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/20" />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-5">
            <h4 className="font-semibold text-stone-900 mb-3">Commodities</h4>
            <div className="space-y-2">
              {['Coffee (HS 0901)', 'Cocoa (HS 1801)', 'Rubber', 'Soy', 'Timber'].map((c, i) => (
                <label key={i} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked={i < 2} className="w-4 h-4 text-emerald-600 rounded border-stone-300" />
                  <span className="text-sm text-stone-700">{c}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="font-semibold text-stone-900 mb-3">Data Retention</h4>
            <p className="text-sm text-stone-600">
              All due diligence documentation is retained for <span className="font-semibold">5 years</span> per EUDR requirements.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ExporterDashboard() {
  const [currentPage, setPage] = useState<Page>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <OverviewPage setPage={setPage} />;
      case 'packages': return <PackagesPage setPage={setPage} />;
      case 'plots': return <PlotsPage />;
      case 'farmers': return <FarmersPage />;
      case 'transactions': return <TransactionsPage />;
      case 'compliance': return <CompliancePage />;
      case 'documents': return <DocumentsPage />;
      case 'traces': return <TracesPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      default: return <OverviewPage setPage={setPage} />;
    }
  };

  const pageTitle = navItems.find(n => n.id === currentPage)?.label || (currentPage === 'settings' ? 'Settings' : 'Overview');

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-stone-200 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        {/* Brand */}
        <div className={`flex items-center gap-2.5 h-16 border-b border-stone-100 flex-shrink-0 ${sidebarOpen ? 'px-4' : 'justify-center px-2'}`}>
          <DemoBrandLogo size={sidebarOpen ? 'md' : 'sm'} className="flex-shrink-0" />
          {sidebarOpen && (
            <div className="leading-none overflow-hidden min-w-0">
              <span className="text-base font-bold tracking-tight text-stone-900">Tracebud</span>
              <span className="ml-1.5 text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                Exporter
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                currentPage === id
                  ? 'bg-emerald-900 text-stone-50 font-medium'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left truncate">{label}</span>
                  {badge && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      currentPage === id ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 space-y-1 border-t border-stone-100 pt-3">
          <button 
            onClick={() => setPage('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              currentPage === 'settings' ? 'bg-emerald-900 text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
            }`}
          >
            <Settings size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors">
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-white/90 border-b border-stone-200 backdrop-blur-md">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors shrink-0">
              <ChevronRight size={18} className={`text-stone-500 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <DemoBrandLogo size="sm" className="shrink-0 hidden sm:flex" />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-stone-900 truncate">{pageTitle}</h1>
              <p className="text-xs text-stone-400">Green Valley Exports</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" className="hidden md:flex">
              <Upload size={14} />
              Import
            </Button>
            <Button variant="primary" size="sm" onClick={() => setPage('packages')}>
              <Plus size={14} />
              New package
            </Button>
            <button className="relative p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <Bell size={18} className="text-stone-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-emerald-900 flex items-center justify-center text-xs font-bold text-stone-50">
              GV
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
