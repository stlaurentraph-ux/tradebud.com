'use client';

import { useState, useCallback, type MouseEventHandler } from 'react';
import { toast, Toaster } from 'sonner';
import {
  Package, MapPin, Users, BarChart3, Settings, LogOut, Bell, Search, Plus, FileText,
  ArrowUpRight, MoreHorizontal, CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown,
  Upload, Shield, ChevronRight, Globe, Camera, FileCheck, Scale, Truck, AlertTriangle,
  Map, Layers, Download, Eye, Send, X, Leaf, Building2, QrCode, Lock,
  History, Filter, RefreshCw, ExternalLink, Satellite, PenTool, Edit3,
  FolderOpen, UserCheck, Landmark, FileSignature, ShieldCheck, Workflow, Database,
  Info, CircleDot, Hexagon, Loader2, Play, CheckCircle, XCircle, Timer, Unlock, RotateCcw,
  ClipboardList, MessageSquare, FileQuestion, LockKeyhole
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Page = 'overview' | 'packages' | 'plots' | 'farmers' | 'contacts' | 'transactions' | 'compliance' | 'documents' | 'traces' | 'reports' | 'settings' | 'integrations' | 'assessments';
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
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: Truck },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'traces', label: 'TRACES NT', icon: Globe, badge: 'EU' },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'assessments', label: 'Assessments', icon: ClipboardList, badge: '4' },
  { id: 'integrations', label: 'Integrations', icon: Workflow },
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
                  Supports OCR for Clave Catastral, formal land titles, and{' '}
                  <span className="whitespace-nowrap">&ldquo;Productor en Posesión&rdquo;</span> declarations
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

function ContactsPage() {
  const [step, setStep] = useState<'select' | 'add-person' | 'add-org' | 'csv-import'>('select');
  const [contacts, setContacts] = useState<any[]>([]);

  const resetWizard = () => {
    setStep('select');
  };

  if (step === 'select') {
    return (
      <div className="space-y-6">
        <SectionHeader 
          title="Contacts & Organizations" 
          subtitle="Manage your network of buyers, suppliers, and partners"
          action={
            <Button variant="primary" onClick={() => setStep('add-person')}>
              <Plus size={16} />
              Add contact
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setStep('add-person')}>
            <Users size={32} className="text-emerald-700 mb-4" />
            <h3 className="font-semibold text-stone-900 mb-2">Add Person</h3>
            <p className="text-sm text-stone-600">Create a new contact profile with personal details</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setStep('add-org')}>
            <Building2 size={32} className="text-blue-700 mb-4" />
            <h3 className="font-semibold text-stone-900 mb-2">Add Organization</h3>
            <p className="text-sm text-stone-600">Register a new company or business entity</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setStep('csv-import')}>
            <Upload size={32} className="text-amber-700 mb-4" />
            <h3 className="font-semibold text-stone-900 mb-2">Import CSV</h3>
            <p className="text-sm text-stone-600">Bulk upload contacts or organizations from a file</p>
          </Card>
        </div>

        {/* Contacts Table */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h3 className="font-semibold text-stone-900">Recent Contacts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-stone-500">
                      No contacts yet. Start by adding your first contact.
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact, i) => (
                    <tr key={i} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-stone-900">{contact.name}</td>
                      <td className="px-5 py-3.5 text-stone-600">{contact.type}</td>
                      <td className="px-5 py-3.5 text-stone-600">{contact.email}</td>
                      <td className="px-5 py-3.5"><StatusBadge status="verified" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'add-person') {
    return <AddPersonWizard onBack={resetWizard} onComplete={(data) => { setContacts([...contacts, data]); resetWizard(); }} />;
  }

  if (step === 'add-org') {
    return <AddOrgWizard onBack={resetWizard} onComplete={(data) => { setContacts([...contacts, data]); resetWizard(); }} />;
  }

  if (step === 'csv-import') {
    return <CSVImportWizard onBack={resetWizard} onComplete={(data) => { setContacts([...contacts, ...data]); resetWizard(); }} />;
  }

  return null;
}

function AddPersonWizard({ onBack, onComplete }: { onBack: () => void; onComplete: (data: any) => void }) {
  const [personStep, setPersonStep] = useState(1);
  const [data, setData] = useState({ name: '', email: '', phone: '', organization: '', jobTitle: '' });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-lg">
          <X size={20} className="text-stone-500" />
        </button>
        <div>
          <h2 className="font-semibold text-stone-900">Add Person</h2>
          <p className="text-sm text-stone-500">Step {personStep} of 3</p>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        {personStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900">Basic Information</h3>
            <input
              type="text"
              placeholder="Full name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400"
            />
            <input
              type="email"
              placeholder="Email address"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400"
            />
          </div>
        )}

        {personStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900">Organization</h3>
            <input
              type="text"
              placeholder="Organization name"
              value={data.organization}
              onChange={(e) => setData({ ...data, organization: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400"
            />
            <input
              type="text"
              placeholder="Job title"
              value={data.jobTitle}
              onChange={(e) => setData({ ...data, jobTitle: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400"
            />
          </div>
        )}

        {personStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900">Review & Confirm</h3>
            <div className="bg-stone-50 p-4 rounded-lg space-y-2">
              <p><span className="text-stone-600">Name:</span> <span className="font-medium text-stone-900">{data.name}</span></p>
              <p><span className="text-stone-600">Email:</span> <span className="font-medium text-stone-900">{data.email}</span></p>
              <p><span className="text-stone-600">Phone:</span> <span className="font-medium text-stone-900">{data.phone || '—'}</span></p>
              <p><span className="text-stone-600">Organization:</span> <span className="font-medium text-stone-900">{data.organization || '—'}</span></p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= personStep ? 'bg-emerald-700' : 'bg-stone-200'}`} />
            ))}
          </div>
          <div className="flex gap-3">
            {personStep > 1 && (
              <Button variant="ghost" onClick={() => setPersonStep(personStep - 1)}>Back</Button>
            )}
            {personStep < 3 ? (
              <Button variant="primary" onClick={() => setPersonStep(personStep + 1)}>Next</Button>
            ) : (
              <Button variant="primary" onClick={() => onComplete(data)}>Add Contact</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function AddOrgWizard({ onBack, onComplete }: { onBack: () => void; onComplete: (data: any) => void }) {
  const [orgStep, setOrgStep] = useState(1);
  const [data, setData] = useState({ name: '', type: 'company', email: '', website: '' });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-lg">
          <X size={20} className="text-stone-500" />
        </button>
        <div>
          <h2 className="font-semibold text-stone-900">Add Organization</h2>
          <p className="text-sm text-stone-500">Step {orgStep} of 3</p>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        {orgStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900">Organization Details</h3>
            <input
              type="text"
              placeholder="Organization name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400"
            />
            <select
              value={data.type}
              onChange={(e) => setData({ ...data, type: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-900"
            >
              <option value="company">Company</option>
              <option value="ngo">NGO</option>
              <option value="cooperative">Cooperative</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
        )}

        {orgStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900">Contact Information</h3>
            <input
              type="email"
              placeholder="Email address"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400"
            />
            <input
              type="url"
              placeholder="Website"
              value={data.website}
              onChange={(e) => setData({ ...data, website: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400"
            />
          </div>
        )}

        {orgStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900">Review & Confirm</h3>
            <div className="bg-stone-50 p-4 rounded-lg space-y-2">
              <p><span className="text-stone-600">Name:</span> <span className="font-medium text-stone-900">{data.name}</span></p>
              <p><span className="text-stone-600">Type:</span> <span className="font-medium text-stone-900">{data.type}</span></p>
              <p><span className="text-stone-600">Email:</span> <span className="font-medium text-stone-900">{data.email}</span></p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= orgStep ? 'bg-blue-700' : 'bg-stone-200'}`} />
            ))}
          </div>
          <div className="flex gap-3">
            {orgStep > 1 && (
              <Button variant="ghost" onClick={() => setOrgStep(orgStep - 1)}>Back</Button>
            )}
            {orgStep < 3 ? (
              <Button variant="primary" onClick={() => setOrgStep(orgStep + 1)}>Next</Button>
            ) : (
              <Button variant="primary" onClick={() => onComplete(data)}>Add Organization</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function CSVImportWizard({ onBack, onComplete }: { onBack: () => void; onComplete: (data: any) => void }) {
  const [csvStep, setCsvStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-lg">
          <X size={20} className="text-stone-500" />
        </button>
        <div>
          <h2 className="font-semibold text-stone-900">Import Contacts via CSV</h2>
          <p className="text-sm text-stone-500">Step {csvStep} of 3</p>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        {csvStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900">Upload CSV File</h3>
            <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center cursor-pointer hover:border-stone-400 transition-colors">
              <Upload size={32} className="mx-auto text-stone-400 mb-2" />
              <p className="text-stone-900 font-medium">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-stone-500 mt-1">Maximum file size: 10 MB</p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
            {file && <p className="text-sm text-emerald-700 font-medium">✓ {file.name} selected</p>}
          </div>
        )}

        {csvStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900">Map Columns</h3>
            <p className="text-sm text-stone-600 mb-4">Match your CSV columns to contact fields:</p>
            <div className="space-y-3">
              {['Name', 'Email', 'Phone', 'Organization'].map(field => (
                <div key={field} className="flex items-center gap-3">
                  <label className="w-28 text-sm text-stone-600">{field}:</label>
                  <select className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-stone-900">
                    <option>Select column...</option>
                    <option>Column A</option>
                    <option>Column B</option>
                    <option>Column C</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {csvStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900">Review</h3>
            <div className="bg-stone-50 p-4 rounded-lg space-y-2">
              <p><span className="text-stone-600">File:</span> <span className="font-medium text-stone-900">{file?.name}</span></p>
              <p><span className="text-stone-600">Estimated records:</span> <span className="font-medium text-stone-900">150 contacts</span></p>
              <p><span className="text-stone-600">Status:</span> <span className="font-medium text-emerald-700">Ready to import</span></p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= csvStep ? 'bg-amber-700' : 'bg-stone-200'}`} />
            ))}
          </div>
          <div className="flex gap-3">
            {csvStep > 1 && (
              <Button variant="ghost" onClick={() => setCsvStep(csvStep - 1)}>Back</Button>
            )}
            {csvStep < 3 ? (
              <Button variant="primary" onClick={() => setCsvStep(csvStep + 1)} disabled={csvStep === 1 && !file}>Next</Button>
            ) : (
              <Button variant="primary" onClick={() => onComplete([])}>Import</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

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
              Exceeding the cap flags the transaction for{' '}
              <span className="whitespace-nowrap">&ldquo;Laundering/Illicit Blending&rdquo;</span> investigation.
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
              Bundle surplus of verified{' '}
              <span className="whitespace-nowrap">&ldquo;Farmer Vouchers&rdquo;</span> into delivery payloads for operational fluidity while maintaining 100% compliance.
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

// ═════════════════════════════════════════���═════════════════════════════════════
// PAGE: ASSESSMENTS
// ═══════════════════════════════════════════════════════════════════════════════

type RequestStatus = 'sent' | 'opened' | 'in_progress' | 'submitted' | 'reviewed' | 'needs_changes' | 'cancelled';
type RequestPathway = 'annuals' | 'rice';

interface AssessmentRequest {
  id: string;
  title: string;
  pathway: RequestPathway;
  farmerUserId: string;
  farmerName: string;
  instructions?: string;
  dueDate: string;
  status: RequestStatus;
  questionnaireDraftId?: string;
  questionnaireLocked: boolean;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  feedbackMessage?: string;
  events: RequestEvent[];
}

interface RequestEvent {
  id: string;
  type: 'created' | 'sent' | 'opened' | 'started' | 'submitted' | 'reviewed' | 'needs_changes' | 'cancelled';
  timestamp: string;
  actor: string;
  message: string;
}

// Mock assessment requests data
const mockAssessmentRequests: AssessmentRequest[] = [
  {
    id: 'REQ-001',
    title: '2026 Annual Assessment - Coffee Plot',
    pathway: 'annuals',
    farmerUserId: 'F-001',
    farmerName: 'Juan Carlos Mejía',
    instructions: 'Please complete the annual sustainability assessment for your coffee plot HN-COP-001. Include recent photos of the plot boundaries.',
    dueDate: '2026-04-30',
    status: 'submitted',
    questionnaireDraftId: 'QD-001',
    questionnaireLocked: true,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-18T14:30:00Z',
    submittedAt: '2026-04-18T14:30:00Z',
    events: [
      { id: 'e1', type: 'created', timestamp: '2026-04-01T10:00:00Z', actor: 'admin@tracebud.com', message: 'Assessment request created' },
      { id: 'e2', type: 'sent', timestamp: '2026-04-01T10:01:00Z', actor: 'system', message: 'Request sent to farmer' },
      { id: 'e3', type: 'opened', timestamp: '2026-04-02T08:15:00Z', actor: 'Juan Carlos Mejía', message: 'Farmer opened the request' },
      { id: 'e4', type: 'started', timestamp: '2026-04-15T09:00:00Z', actor: 'Juan Carlos Mejía', message: 'Farmer started filling the form' },
      { id: 'e5', type: 'submitted', timestamp: '2026-04-18T14:30:00Z', actor: 'Juan Carlos Mejía', message: 'Farmer submitted the assessment' },
    ]
  },
  {
    id: 'REQ-002',
    title: 'Rice Sustainability Survey Q1',
    pathway: 'rice',
    farmerUserId: 'F-002',
    farmerName: 'María Elena López',
    instructions: 'Complete the quarterly rice sustainability survey including water usage metrics.',
    dueDate: '2026-04-25',
    status: 'in_progress',
    questionnaireDraftId: 'QD-002',
    questionnaireLocked: true,
    createdAt: '2026-04-05T09:00:00Z',
    updatedAt: '2026-04-19T11:20:00Z',
    events: [
      { id: 'e1', type: 'created', timestamp: '2026-04-05T09:00:00Z', actor: 'admin@tracebud.com', message: 'Assessment request created' },
      { id: 'e2', type: 'sent', timestamp: '2026-04-05T09:01:00Z', actor: 'system', message: 'Request sent to farmer' },
      { id: 'e3', type: 'opened', timestamp: '2026-04-06T10:30:00Z', actor: 'María Elena López', message: 'Farmer opened the request' },
      { id: 'e4', type: 'started', timestamp: '2026-04-19T11:20:00Z', actor: 'María Elena López', message: 'Farmer started filling the form' },
    ]
  },
  {
    id: 'REQ-003',
    title: 'Annual Cocoa Assessment',
    pathway: 'annuals',
    farmerUserId: 'F-003',
    farmerName: 'Carlos Hernández',
    instructions: 'Please complete the sustainability assessment for your cocoa operations.',
    dueDate: '2026-05-15',
    status: 'sent',
    questionnaireDraftId: 'QD-003',
    questionnaireLocked: false,
    createdAt: '2026-04-10T14:00:00Z',
    updatedAt: '2026-04-10T14:00:00Z',
    events: [
      { id: 'e1', type: 'created', timestamp: '2026-04-10T14:00:00Z', actor: 'admin@tracebud.com', message: 'Assessment request created' },
      { id: 'e2', type: 'sent', timestamp: '2026-04-10T14:01:00Z', actor: 'system', message: 'Request sent to farmer' },
    ]
  },
  {
    id: 'REQ-004',
    title: 'Coffee Plot Re-assessment',
    pathway: 'annuals',
    farmerUserId: 'F-004',
    farmerName: 'Ana Sofía Reyes',
    instructions: 'Please address the issues flagged in the previous assessment and resubmit.',
    dueDate: '2026-04-22',
    status: 'needs_changes',
    questionnaireDraftId: 'QD-004',
    questionnaireLocked: true,
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-04-15T16:45:00Z',
    reviewedAt: '2026-04-15T16:45:00Z',
    reviewedBy: 'reviewer@tracebud.com',
    feedbackMessage: 'The plot boundary photos are not clear enough. Please retake the photos with better lighting and ensure all four corners are visible.',
    events: [
      { id: 'e1', type: 'created', timestamp: '2026-03-15T10:00:00Z', actor: 'admin@tracebud.com', message: 'Assessment request created' },
      { id: 'e2', type: 'sent', timestamp: '2026-03-15T10:01:00Z', actor: 'system', message: 'Request sent to farmer' },
      { id: 'e3', type: 'opened', timestamp: '2026-03-16T08:00:00Z', actor: 'Ana Sofía Reyes', message: 'Farmer opened the request' },
      { id: 'e4', type: 'started', timestamp: '2026-03-20T10:00:00Z', actor: 'Ana Sofía Reyes', message: 'Farmer started filling the form' },
      { id: 'e5', type: 'submitted', timestamp: '2026-04-10T14:00:00Z', actor: 'Ana Sofía Reyes', message: 'Farmer submitted the assessment' },
      { id: 'e6', type: 'needs_changes', timestamp: '2026-04-15T16:45:00Z', actor: 'reviewer@tracebud.com', message: 'Reviewer requested changes' },
    ]
  },
  {
    id: 'REQ-005',
    title: '2026 Annual Assessment - Plot HN-COP-005',
    pathway: 'annuals',
    farmerUserId: 'F-005',
    farmerName: 'Roberto Andrade',
    dueDate: '2026-04-28',
    status: 'reviewed',
    questionnaireDraftId: 'QD-005',
    questionnaireLocked: true,
    createdAt: '2026-03-20T09:00:00Z',
    updatedAt: '2026-04-20T10:30:00Z',
    submittedAt: '2026-04-18T11:00:00Z',
    reviewedAt: '2026-04-20T10:30:00Z',
    reviewedBy: 'reviewer@tracebud.com',
    events: [
      { id: 'e1', type: 'created', timestamp: '2026-03-20T09:00:00Z', actor: 'admin@tracebud.com', message: 'Assessment request created' },
      { id: 'e2', type: 'sent', timestamp: '2026-03-20T09:01:00Z', actor: 'system', message: 'Request sent to farmer' },
      { id: 'e3', type: 'opened', timestamp: '2026-03-21T07:30:00Z', actor: 'Roberto Andrade', message: 'Farmer opened the request' },
      { id: 'e4', type: 'started', timestamp: '2026-04-01T09:00:00Z', actor: 'Roberto Andrade', message: 'Farmer started filling the form' },
      { id: 'e5', type: 'submitted', timestamp: '2026-04-18T11:00:00Z', actor: 'Roberto Andrade', message: 'Farmer submitted the assessment' },
      { id: 'e6', type: 'reviewed', timestamp: '2026-04-20T10:30:00Z', actor: 'reviewer@tracebud.com', message: 'Assessment approved' },
    ]
  },
  {
    id: 'REQ-006',
    title: 'Rice Cultivation Survey',
    pathway: 'rice',
    farmerUserId: 'F-002',
    farmerName: 'María Elena López',
    dueDate: '2026-05-01',
    status: 'opened',
    questionnaireDraftId: 'QD-006',
    questionnaireLocked: true,
    createdAt: '2026-04-18T11:00:00Z',
    updatedAt: '2026-04-19T08:00:00Z',
    events: [
      { id: 'e1', type: 'created', timestamp: '2026-04-18T11:00:00Z', actor: 'admin@tracebud.com', message: 'Assessment request created' },
      { id: 'e2', type: 'sent', timestamp: '2026-04-18T11:01:00Z', actor: 'system', message: 'Request sent to farmer' },
      { id: 'e3', type: 'opened', timestamp: '2026-04-19T08:00:00Z', actor: 'María Elena López', message: 'Farmer opened the request' },
    ]
  },
  {
    id: 'REQ-007',
    title: 'Cancelled Assessment Request',
    pathway: 'annuals',
    farmerUserId: 'F-003',
    farmerName: 'Carlos Hernández',
    dueDate: '2026-04-15',
    status: 'cancelled',
    questionnaireLocked: false,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-10T14:00:00Z',
    events: [
      { id: 'e1', type: 'created', timestamp: '2026-03-01T10:00:00Z', actor: 'admin@tracebud.com', message: 'Assessment request created' },
      { id: 'e2', type: 'sent', timestamp: '2026-03-01T10:01:00Z', actor: 'system', message: 'Request sent to farmer' },
      { id: 'e3', type: 'cancelled', timestamp: '2026-03-10T14:00:00Z', actor: 'admin@tracebud.com', message: 'Request cancelled - duplicate entry' },
    ]
  },
];

function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const config: Record<RequestStatus, { cls: string; label: string; icon: typeof Clock }> = {
    sent: { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Sent', icon: Send },
    opened: { cls: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Opened', icon: Eye },
    in_progress: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'In Progress', icon: Loader2 },
    submitted: { cls: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Submitted', icon: CheckCircle },
    reviewed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Reviewed', icon: CheckCircle2 },
    needs_changes: { cls: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Needs Changes', icon: AlertCircle },
    cancelled: { cls: 'bg-stone-100 text-stone-500 border-stone-200', label: 'Cancelled', icon: XCircle },
  };
  const { cls, label, icon: Icon } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${cls}`}>
      <Icon size={12} className={status === 'in_progress' ? 'animate-spin' : ''} />
      {label}
    </span>
  );
}

function PathwayBadge({ pathway }: { pathway: RequestPathway }) {
  const config: Record<RequestPathway, { cls: string; label: string }> = {
    annuals: { cls: 'bg-emerald-50 text-emerald-700', label: 'Annuals' },
    rice: { cls: 'bg-cyan-50 text-cyan-700', label: 'Rice' },
  };
  const { cls, label } = config[pathway];
  return <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wide ${cls}`}>{label}</span>;
}

function RequestEventIcon({ type }: { type: RequestEvent['type'] }) {
  const icons: Record<RequestEvent['type'], { icon: typeof Clock; cls: string }> = {
    created: { icon: Plus, cls: 'text-stone-500 bg-stone-100' },
    sent: { icon: Send, cls: 'text-blue-600 bg-blue-50' },
    opened: { icon: Eye, cls: 'text-sky-600 bg-sky-50' },
    started: { icon: Play, cls: 'text-amber-600 bg-amber-50' },
    submitted: { icon: CheckCircle, cls: 'text-purple-600 bg-purple-50' },
    reviewed: { icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50' },
    needs_changes: { icon: AlertCircle, cls: 'text-orange-600 bg-orange-50' },
    cancelled: { icon: XCircle, cls: 'text-stone-500 bg-stone-100' },
  };
  const { icon: Icon, cls } = icons[type];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cls}`}>
      <Icon size={14} />
    </div>
  );
}

// Send Request Modal
function SendRequestModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: Partial<AssessmentRequest>) => void;
}) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [pathway, setPathway] = useState<RequestPathway>('annuals');
  const [farmerId, setFarmerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questionnaireDraftId, setQuestionnaireDraftId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const farmerOptions = [
    { id: 'F-001', name: 'Juan Carlos Mejía' },
    { id: 'F-002', name: 'María Elena López' },
    { id: 'F-003', name: 'Carlos Hernández' },
    { id: 'F-004', name: 'Ana Sofía Reyes' },
    { id: 'F-005', name: 'Roberto Andrade' },
  ];

  const selectedFarmer = farmerOptions.find(f => f.id === farmerId);

  const handleSubmit = async () => {
    if (!title || !farmerId || !dueDate) {
      toast.error('Missing required fields', { description: 'Please fill in all required fields' });
      return;
    }
    setIsSubmitting(true);
    // TODO: POST /api/assessments - create new request
    await new Promise(resolve => setTimeout(resolve, 800));
    onSubmit({
      title,
      instructions,
      pathway,
      farmerUserId: farmerId,
      farmerName: selectedFarmer?.name || '',
      dueDate,
      questionnaireDraftId: questionnaireDraftId || undefined,
    });
    setIsSubmitting(false);
    setTitle('');
    setInstructions('');
    setPathway('annuals');
    setFarmerId('');
    setDueDate('');
    setQuestionnaireDraftId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Send Assessment Request</h3>
            <p className="text-sm text-stone-500">Create and send a new assessment to a farmer</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg">
            <X size={18} className="text-stone-500" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., 2026 Annual Assessment - Coffee Plot"
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
            />
          </div>

          {/* Farmer */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Farmer <span className="text-red-500">*</span>
            </label>
            <select
              value={farmerId}
              onChange={e => setFarmerId(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
            >
              <option value="">Select a farmer...</option>
              {farmerOptions.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
              ))}
            </select>
          </div>

          {/* Pathway */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Pathway <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPathway('annuals')}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  pathway === 'annuals' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                Annuals
              </button>
              <button
                type="button"
                onClick={() => setPathway('rice')}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  pathway === 'rice' 
                    ? 'bg-cyan-50 border-cyan-200 text-cyan-700' 
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                Rice
              </button>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
            />
          </div>

          {/* Questionnaire Draft */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Linked Questionnaire (Optional)
            </label>
            <select
              value={questionnaireDraftId}
              onChange={e => setQuestionnaireDraftId(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
            >
              <option value="">No questionnaire linked</option>
              <option value="QD-001">Annuals Assessment v2.1 (Locked)</option>
              <option value="QD-002">Rice Sustainability Survey (Locked)</option>
              <option value="QD-003">Cocoa Assessment Draft (Not locked)</option>
            </select>
            {questionnaireDraftId === 'QD-003' && (
              <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle size={12} />
                This questionnaire is not locked. Farmer cannot submit until it is locked.
              </p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Instructions (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Add any specific instructions for the farmer..."
              rows={3}
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-900/20 resize-none"
            />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-stone-200 px-6 py-4 flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || !title || !farmerId || !dueDate}>
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Send Request
          </Button>
        </div>
      </div>
    </div>
  );
}

// Request Detail Drawer
function RequestDetailDrawer({
  request,
  onClose,
  onReview,
  onCancel,
}: {
  request: AssessmentRequest | null;
  onClose: () => void;
  onReview: (requestId: string, status: 'reviewed' | 'needs_changes', feedback?: string) => void;
  onCancel: (requestId: string) => void;
}) {
  const [feedbackText, setFeedbackText] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) return null;

  const canReview = request.status === 'submitted';
  const canCancel = !['reviewed', 'cancelled'].includes(request.status);

  const handleReview = async (status: 'reviewed' | 'needs_changes') => {
    if (status === 'needs_changes' && !feedbackText.trim()) {
      toast.error('Feedback required', { description: 'Please provide feedback when requesting changes' });
      return;
    }
    setIsSubmitting(true);
    // TODO: PATCH /api/assessments/[id] - update status
    await new Promise(resolve => setTimeout(resolve, 800));
    onReview(request.id, status, feedbackText);
    setIsSubmitting(false);
    setFeedbackText('');
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    // TODO: PATCH /api/assessments/[id] - cancel
    await new Promise(resolve => setTimeout(resolve, 800));
    onCancel(request.id);
    setIsSubmitting(false);
    setShowCancelConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="font-semibold text-stone-900">Assessment Request</h3>
            <p className="text-sm text-stone-500 font-mono">{request.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg" aria-label="Close">
            <X size={18} className="text-stone-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Title & Status */}
          <div>
            <h4 className="text-lg font-semibold text-stone-900 mb-2">{request.title}</h4>
            <div className="flex items-center gap-2">
              <RequestStatusBadge status={request.status} />
              <PathwayBadge pathway={request.pathway} />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Farmer</p>
              <p className="mt-1 text-sm text-stone-900 font-medium">{request.farmerName}</p>
              <p className="text-xs text-stone-500">{request.farmerUserId}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Due Date</p>
              <p className="mt-1 text-sm text-stone-900">{new Date(request.dueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Created</p>
              <p className="mt-1 text-sm text-stone-900">{new Date(request.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Last Updated</p>
              <p className="mt-1 text-sm text-stone-900">{new Date(request.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Questionnaire Status */}
          <div className="p-4 rounded-lg border border-stone-200 bg-stone-50">
            <div className="flex items-start gap-3">
              {request.questionnaireLocked ? (
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <LockKeyhole size={20} className="text-emerald-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FileQuestion size={20} className="text-amber-600" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-stone-900">
                  {request.questionnaireDraftId ? `Questionnaire ${request.questionnaireDraftId}` : 'No questionnaire linked'}
                </p>
                {request.questionnaireDraftId && (
                  <p className={`text-sm ${request.questionnaireLocked ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {request.questionnaireLocked ? 'Locked and ready for submission' : 'Not locked - farmer cannot submit'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          {request.instructions && (
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">Instructions</p>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg">
                <p className="text-sm text-stone-700">{request.instructions}</p>
              </div>
            </div>
          )}

          {/* Feedback (if needs_changes) */}
          {request.feedbackMessage && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <MessageSquare size={18} className="text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Reviewer Feedback</p>
                  <p className="mt-1 text-sm text-orange-700">{request.feedbackMessage}</p>
                  {request.reviewedBy && (
                    <p className="mt-2 text-xs text-orange-600">By {request.reviewedBy} on {new Date(request.reviewedAt!).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wide mb-3">Timeline</p>
            <div className="space-y-0">
              {request.events.map((event, idx) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <RequestEventIcon type={event.type} />
                    {idx < request.events.length - 1 && (
                      <div className="w-px h-full min-h-[24px] bg-stone-200 my-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-stone-900">{event.message}</p>
                    <p className="text-xs text-stone-500">
                      {new Date(event.timestamp).toLocaleString()}
                      {event.actor && event.actor !== 'system' && ` by ${event.actor}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Panel */}
          {canReview && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-3">Review Submission</h4>
              {!request.questionnaireLocked && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Questionnaire is not locked. Cannot approve until locked.
                  </p>
                </div>
              )}
              <div className="mb-3">
                <label className="block text-sm text-purple-700 mb-1.5">Feedback (required for changes)</label>
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Provide feedback to the farmer..."
                  rows={3}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleReview('reviewed')}
                  disabled={isSubmitting || !request.questionnaireLocked}
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <CheckCircle2 size={14} />
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 text-orange-700 border-orange-200 hover:bg-orange-50"
                  onClick={() => handleReview('needs_changes')}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <AlertCircle size={14} />
                  Request Changes
                </Button>
              </div>
            </div>
          )}

          {/* Cancel Action */}
          {canCancel && (
            <div className="pt-4 border-t border-stone-200">
              {showCancelConfirm ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 mb-3">Are you sure you want to cancel this request? This action cannot be undone.</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setShowCancelConfirm(false)} disabled={isSubmitting}>
                      Keep Request
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                      Cancel Request
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline"
                >
                  Cancel this request
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssessmentsPage() {
  const [requests, setRequests] = useState(mockAssessmentRequests);
  const [selectedRequest, setSelectedRequest] = useState<AssessmentRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [pathwayFilter, setPathwayFilter] = useState<RequestPathway | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (pathwayFilter !== 'all' && req.pathway !== pathwayFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return req.id.toLowerCase().includes(q) || 
             req.title.toLowerCase().includes(q) ||
             req.farmerName.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    sent: requests.filter(r => r.status === 'sent').length,
    in_progress: requests.filter(r => ['opened', 'in_progress'].includes(r.status)).length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    reviewed: requests.filter(r => r.status === 'reviewed').length,
    needs_changes: requests.filter(r => r.status === 'needs_changes').length,
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // TODO: GET /api/assessments - fetch fresh data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast.success('List refreshed', { description: `${requests.length} requests loaded` });
  }, [requests.length]);

  const handleSendRequest = useCallback((data: Partial<AssessmentRequest>) => {
    const newRequest: AssessmentRequest = {
      id: `REQ-${String(requests.length + 1).padStart(3, '0')}`,
      title: data.title || '',
      pathway: data.pathway || 'annuals',
      farmerUserId: data.farmerUserId || '',
      farmerName: data.farmerName || '',
      instructions: data.instructions,
      dueDate: data.dueDate || '',
      status: 'sent',
      questionnaireDraftId: data.questionnaireDraftId,
      questionnaireLocked: data.questionnaireDraftId !== 'QD-003',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      events: [
        { id: 'e1', type: 'created', timestamp: new Date().toISOString(), actor: 'admin@tracebud.com', message: 'Assessment request created' },
        { id: 'e2', type: 'sent', timestamp: new Date().toISOString(), actor: 'system', message: 'Request sent to farmer' },
      ]
    };
    setRequests(prev => [newRequest, ...prev]);
    toast.success('Request sent', { description: `Assessment request sent to ${data.farmerName}` });
  }, [requests.length]);

  const handleReview = useCallback((requestId: string, status: 'reviewed' | 'needs_changes', feedback?: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const newEvent: RequestEvent = {
        id: `e${r.events.length + 1}`,
        type: status,
        timestamp: new Date().toISOString(),
        actor: 'reviewer@tracebud.com',
        message: status === 'reviewed' ? 'Assessment approved' : 'Reviewer requested changes',
      };
      return {
        ...r,
        status,
        feedbackMessage: feedback || r.feedbackMessage,
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'reviewer@tracebud.com',
        updatedAt: new Date().toISOString(),
        events: [...r.events, newEvent],
      };
    }));
    setSelectedRequest(null);
    toast.success(status === 'reviewed' ? 'Assessment approved' : 'Changes requested', {
      description: `Request ${requestId} has been ${status === 'reviewed' ? 'approved' : 'sent back for changes'}`,
    });
  }, []);

  const handleCancel = useCallback((requestId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const newEvent: RequestEvent = {
        id: `e${r.events.length + 1}`,
        type: 'cancelled',
        timestamp: new Date().toISOString(),
        actor: 'admin@tracebud.com',
        message: 'Request cancelled',
      };
      return {
        ...r,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        events: [...r.events, newEvent],
      };
    }));
    setSelectedRequest(null);
    toast.success('Request cancelled', { description: `Request ${requestId} has been cancelled` });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Assessment Requests</h2>
          <p className="text-sm text-stone-500 mt-1">Send, track, and review farmer assessments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowSendModal(true)}>
            <Plus size={14} />
            Send Request
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 cursor-pointer hover:border-stone-300 transition-colors" onClick={() => setStatusFilter('sent')}>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Sent</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.sent}</p>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-stone-300 transition-colors" onClick={() => setStatusFilter('in_progress')}>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">In Progress</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.in_progress}</p>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-stone-300 transition-colors" onClick={() => setStatusFilter('submitted')}>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Awaiting Review</p>
          <p className="mt-1 text-2xl font-semibold text-purple-600">{stats.submitted}</p>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-stone-300 transition-colors" onClick={() => setStatusFilter('reviewed')}>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Reviewed</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{stats.reviewed}</p>
        </Card>
        <Card className="p-4 cursor-pointer hover:border-stone-300 transition-colors" onClick={() => setStatusFilter('needs_changes')}>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Needs Changes</p>
          <p className="mt-1 text-2xl font-semibold text-orange-600">{stats.needs_changes}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-stone-400" />
            <span className="text-sm font-medium text-stone-700">Filters:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as RequestStatus | 'all')}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="opened">Opened</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="needs_changes">Needs Changes</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={pathwayFilter}
            onChange={e => setPathwayFilter(e.target.value as RequestPathway | 'all')}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
            aria-label="Filter by pathway"
          >
            <option value="all">All Pathways</option>
            <option value="annuals">Annuals</option>
            <option value="rice">Rice</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900/20 w-48"
              aria-label="Search requests"
            />
          </div>
          <div className="flex-1" />
          {(statusFilter !== 'all' || pathwayFilter !== 'all' || searchQuery) && (
            <button 
              onClick={() => { setStatusFilter('all'); setPathwayFilter('all'); setSearchQuery(''); }}
              className="text-xs text-stone-500 hover:text-stone-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Request ID</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Farmer</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Pathway</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Questionnaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
                        <ClipboardList size={24} className="text-stone-400" />
                      </div>
                      <p className="text-sm font-medium text-stone-900">No requests found</p>
                      <p className="text-xs text-stone-500">
                        {searchQuery || statusFilter !== 'all' || pathwayFilter !== 'all' 
                          ? 'Try adjusting your filters or search query' 
                          : 'Send your first assessment request to get started'}
                      </p>
                      {!searchQuery && statusFilter === 'all' && pathwayFilter === 'all' && (
                        <Button variant="primary" size="sm" className="mt-2" onClick={() => setShowSendModal(true)}>
                          <Plus size={14} />
                          Send Request
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr 
                    key={req.id} 
                    className="hover:bg-stone-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRequest(req)}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedRequest(req)}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-emerald-900 font-semibold">{req.id}</td>
                    <td className="px-5 py-3.5 text-stone-800 max-w-[200px] truncate">{req.title}</td>
                    <td className="px-5 py-3.5 text-stone-700">{req.farmerName}</td>
                    <td className="px-5 py-3.5"><PathwayBadge pathway={req.pathway} /></td>
                    <td className="px-5 py-3.5"><RequestStatusBadge status={req.status} /></td>
                    <td className="px-5 py-3.5 text-stone-500 text-xs">{new Date(req.dueDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      {req.questionnaireDraftId ? (
                        <span className={`inline-flex items-center gap-1 text-xs ${req.questionnaireLocked ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {req.questionnaireLocked ? <LockKeyhole size={12} /> : <FileQuestion size={12} />}
                          {req.questionnaireDraftId}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredRequests.length > 0 && (
          <div className="px-5 py-3 border-t border-stone-100 bg-stone-50 text-xs text-stone-500">
            Showing {filteredRequests.length} of {requests.length} requests
          </div>
        )}
      </Card>

      {/* Send Request Modal */}
      <SendRequestModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSubmit={handleSendRequest}
      />

      {/* Request Detail Drawer */}
      <RequestDetailDrawer
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onReview={handleReview}
        onCancel={handleCancel}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: INTEGRATIONS OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

type RunStatus = 'pending' | 'claimed' | 'running' | 'complete' | 'failed' | 'stale';
type RunType = 'cool_farm' | 'sai_v2';

interface IntegrationRun {
  id: string;
  type: RunType;
  status: RunStatus;
  farmerId: string;
  farmerName: string;
  plotId: string;
  dueAt: string;
  startedAt: string | null;
  completedAt: string | null;
  claimedBy: string | null;
  retryCount: number;
  errorMessage: string | null;
  payload: Record<string, unknown>;
  events: RunEvent[];
}

interface RunEvent {
  id: string;
  type: 'created' | 'claimed' | 'started' | 'progress' | 'completed' | 'failed' | 'released' | 'retried';
  timestamp: string;
  actor: string | null;
  message: string;
  metadata?: Record<string, unknown>;
}

// Extended mock data with more variety
const mockRuns: IntegrationRun[] = [
  { id: 'run-001', type: 'cool_farm', status: 'pending', farmerId: 'F-001', farmerName: 'Juan Carlos Mejía', plotId: 'HN-COP-001', dueAt: '2026-04-21T14:00:00Z', startedAt: null, completedAt: null, claimedBy: null, retryCount: 0, errorMessage: null, payload: { farmSize: 2.8, commodity: 'Coffee', region: 'Copán' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T10:00:00Z', actor: 'system', message: 'Run created from scheduled job' }
  ]},
  { id: 'run-002', type: 'sai_v2', status: 'running', farmerId: 'F-002', farmerName: 'María Elena López', plotId: 'HN-COP-002', dueAt: '2026-04-21T13:30:00Z', startedAt: '2026-04-21T13:32:00Z', completedAt: null, claimedBy: 'worker-1', retryCount: 0, errorMessage: null, payload: { assessmentType: 'full', categories: ['land', 'labor', 'environment'] }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T10:00:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-21T13:30:00Z', actor: 'worker-1', message: 'Run claimed by worker' },
    { id: 'e3', type: 'started', timestamp: '2026-04-21T13:32:00Z', actor: 'worker-1', message: 'Execution started' },
    { id: 'e4', type: 'progress', timestamp: '2026-04-21T13:33:00Z', actor: 'worker-1', message: 'Processing land assessment (1/3)', metadata: { progress: 33 } }
  ]},
  { id: 'run-003', type: 'cool_farm', status: 'complete', farmerId: 'F-003', farmerName: 'Carlos Hernández', plotId: 'HN-YOR-003', dueAt: '2026-04-21T12:00:00Z', startedAt: '2026-04-21T12:01:00Z', completedAt: '2026-04-21T12:05:30Z', claimedBy: 'worker-2', retryCount: 0, errorMessage: null, payload: { farmSize: 5.2, commodity: 'Cocoa', region: 'Yoro' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T08:00:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-21T12:00:00Z', actor: 'worker-2', message: 'Run claimed by worker' },
    { id: 'e3', type: 'started', timestamp: '2026-04-21T12:01:00Z', actor: 'worker-2', message: 'Execution started' },
    { id: 'e4', type: 'completed', timestamp: '2026-04-21T12:05:30Z', actor: 'worker-2', message: 'Run completed successfully', metadata: { duration: '4m 30s', score: 87 } }
  ]},
  { id: 'run-004', type: 'sai_v2', status: 'failed', farmerId: 'F-004', farmerName: 'Ana Sofía Reyes', plotId: 'HN-COP-004', dueAt: '2026-04-21T11:00:00Z', startedAt: '2026-04-21T11:02:00Z', completedAt: '2026-04-21T11:03:45Z', claimedBy: 'worker-1', retryCount: 2, errorMessage: 'API timeout after 3 retries', payload: { assessmentType: 'quick' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T07:00:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-21T11:00:00Z', actor: 'worker-1', message: 'Run claimed by worker' },
    { id: 'e3', type: 'started', timestamp: '2026-04-21T11:02:00Z', actor: 'worker-1', message: 'Execution started' },
    { id: 'e4', type: 'failed', timestamp: '2026-04-21T11:03:45Z', actor: 'worker-1', message: 'API timeout after 3 retries', metadata: { errorCode: 'TIMEOUT', attempts: 3 } },
    { id: 'e5', type: 'retried', timestamp: '2026-04-21T11:10:00Z', actor: 'admin@tracebud.com', message: 'Manual retry initiated' },
    { id: 'e6', type: 'failed', timestamp: '2026-04-21T11:12:00Z', actor: 'worker-1', message: 'API timeout persists', metadata: { errorCode: 'TIMEOUT', attempts: 3 } }
  ]},
  { id: 'run-005', type: 'cool_farm', status: 'stale', farmerId: 'F-001', farmerName: 'Juan Carlos Mejía', plotId: 'HN-COP-001', dueAt: '2026-04-20T10:00:00Z', startedAt: '2026-04-20T10:01:00Z', completedAt: null, claimedBy: 'worker-3', retryCount: 0, errorMessage: null, payload: { farmSize: 2.8, commodity: 'Coffee' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-20T06:00:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-20T10:00:00Z', actor: 'worker-3', message: 'Run claimed by worker' },
    { id: 'e3', type: 'started', timestamp: '2026-04-20T10:01:00Z', actor: 'worker-3', message: 'Execution started' }
  ]},
  { id: 'run-006', type: 'sai_v2', status: 'claimed', farmerId: 'F-002', farmerName: 'María Elena López', plotId: 'HN-COP-002', dueAt: '2026-04-21T15:00:00Z', startedAt: null, completedAt: null, claimedBy: 'worker-2', retryCount: 0, errorMessage: null, payload: { assessmentType: 'full' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T11:00:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-21T14:55:00Z', actor: 'worker-2', message: 'Run claimed by worker' }
  ]},
  { id: 'run-007', type: 'cool_farm', status: 'pending', farmerId: 'F-003', farmerName: 'Carlos Hernández', plotId: 'HN-YOR-003', dueAt: '2026-04-21T16:00:00Z', startedAt: null, completedAt: null, claimedBy: null, retryCount: 0, errorMessage: null, payload: { farmSize: 5.2, commodity: 'Cocoa' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T12:00:00Z', actor: 'system', message: 'Run created from scheduled job' }
  ]},
  { id: 'run-008', type: 'sai_v2', status: 'complete', farmerId: 'F-004', farmerName: 'Ana Sofía Reyes', plotId: 'HN-COP-004', dueAt: '2026-04-21T09:00:00Z', startedAt: '2026-04-21T09:01:00Z', completedAt: '2026-04-21T09:04:20Z', claimedBy: 'worker-1', retryCount: 1, errorMessage: null, payload: { assessmentType: 'quick' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T05:00:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-21T09:00:00Z', actor: 'worker-1', message: 'Run claimed by worker' },
    { id: 'e3', type: 'started', timestamp: '2026-04-21T09:01:00Z', actor: 'worker-1', message: 'Execution started' },
    { id: 'e4', type: 'completed', timestamp: '2026-04-21T09:04:20Z', actor: 'worker-1', message: 'Run completed successfully', metadata: { duration: '3m 20s', score: 92 } }
  ]},
  // Additional runs for more variety
  { id: 'run-009', type: 'cool_farm', status: 'pending', farmerId: 'F-005', farmerName: 'Roberto Martínez', plotId: 'HN-ATL-005', dueAt: '2026-04-21T17:00:00Z', startedAt: null, completedAt: null, claimedBy: null, retryCount: 0, errorMessage: null, payload: { farmSize: 3.1, commodity: 'Coffee', region: 'Atlántida' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T13:00:00Z', actor: 'system', message: 'Run created from scheduled job' }
  ]},
  { id: 'run-010', type: 'sai_v2', status: 'running', farmerId: 'F-006', farmerName: 'Patricia Gómez', plotId: 'HN-COR-006', dueAt: '2026-04-21T14:30:00Z', startedAt: '2026-04-21T14:32:00Z', completedAt: null, claimedBy: 'worker-2', retryCount: 0, errorMessage: null, payload: { assessmentType: 'full', categories: ['land', 'labor'] }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T10:30:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-21T14:30:00Z', actor: 'worker-2', message: 'Run claimed by worker' },
    { id: 'e3', type: 'started', timestamp: '2026-04-21T14:32:00Z', actor: 'worker-2', message: 'Execution started' },
    { id: 'e4', type: 'progress', timestamp: '2026-04-21T14:34:00Z', actor: 'worker-2', message: 'Processing land assessment (1/2)', metadata: { progress: 50 } }
  ]},
  { id: 'run-011', type: 'cool_farm', status: 'complete', farmerId: 'F-007', farmerName: 'Fernando Díaz', plotId: 'HN-OLA-007', dueAt: '2026-04-21T08:00:00Z', startedAt: '2026-04-21T08:02:00Z', completedAt: '2026-04-21T08:06:15Z', claimedBy: 'worker-1', retryCount: 0, errorMessage: null, payload: { farmSize: 4.5, commodity: 'Cocoa', region: 'Olancho' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T04:00:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-21T08:00:00Z', actor: 'worker-1', message: 'Run claimed by worker' },
    { id: 'e3', type: 'started', timestamp: '2026-04-21T08:02:00Z', actor: 'worker-1', message: 'Execution started' },
    { id: 'e4', type: 'completed', timestamp: '2026-04-21T08:06:15Z', actor: 'worker-1', message: 'Run completed successfully', metadata: { duration: '4m 15s', score: 78 } }
  ]},
  { id: 'run-012', type: 'sai_v2', status: 'stale', farmerId: 'F-008', farmerName: 'Lucía Fernández', plotId: 'HN-COP-008', dueAt: '2026-04-20T15:00:00Z', startedAt: '2026-04-20T15:02:00Z', completedAt: null, claimedBy: 'worker-3', retryCount: 0, errorMessage: null, payload: { assessmentType: 'quick' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-20T11:00:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-20T15:00:00Z', actor: 'worker-3', message: 'Run claimed by worker' },
    { id: 'e3', type: 'started', timestamp: '2026-04-20T15:02:00Z', actor: 'worker-3', message: 'Execution started' }
  ]},
  { id: 'run-013', type: 'cool_farm', status: 'failed', farmerId: 'F-009', farmerName: 'Diego Morales', plotId: 'HN-INT-009', dueAt: '2026-04-21T10:00:00Z', startedAt: '2026-04-21T10:01:00Z', completedAt: '2026-04-21T10:02:30Z', claimedBy: 'worker-2', retryCount: 1, errorMessage: 'Invalid farm coordinates', payload: { farmSize: 2.2, commodity: 'Coffee', region: 'Intibucá' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T06:00:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-21T10:00:00Z', actor: 'worker-2', message: 'Run claimed by worker' },
    { id: 'e3', type: 'started', timestamp: '2026-04-21T10:01:00Z', actor: 'worker-2', message: 'Execution started' },
    { id: 'e4', type: 'failed', timestamp: '2026-04-21T10:02:30Z', actor: 'worker-2', message: 'Invalid farm coordinates', metadata: { errorCode: 'INVALID_COORDS' } }
  ]},
  { id: 'run-014', type: 'sai_v2', status: 'pending', farmerId: 'F-010', farmerName: 'Carmen Ortiz', plotId: 'HN-LEM-010', dueAt: '2026-04-21T18:00:00Z', startedAt: null, completedAt: null, claimedBy: null, retryCount: 0, errorMessage: null, payload: { assessmentType: 'full', categories: ['land', 'labor', 'environment', 'governance'] }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T14:00:00Z', actor: 'system', message: 'Run created from scheduled job' }
  ]},
  { id: 'run-015', type: 'cool_farm', status: 'claimed', farmerId: 'F-011', farmerName: 'Miguel Ángel Torres', plotId: 'HN-COP-011', dueAt: '2026-04-21T15:30:00Z', startedAt: null, completedAt: null, claimedBy: 'worker-1', retryCount: 0, errorMessage: null, payload: { farmSize: 6.8, commodity: 'Coffee', region: 'Copán' }, events: [
    { id: 'e1', type: 'created', timestamp: '2026-04-21T11:30:00Z', actor: 'system', message: 'Run created from scheduled job' },
    { id: 'e2', type: 'claimed', timestamp: '2026-04-21T15:25:00Z', actor: 'worker-1', message: 'Run claimed by worker' }
  ]},
];

function RunStatusBadge({ status }: { status: RunStatus }) {
  const config: Record<RunStatus, { cls: string; label: string; icon: typeof Clock }> = {
    pending: { cls: 'bg-stone-100 text-stone-700 border-stone-200', label: 'Pending', icon: Clock },
    claimed: { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Claimed', icon: Lock },
    running: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Running', icon: Loader2 },
    complete: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Complete', icon: CheckCircle },
    failed: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'Failed', icon: XCircle },
    stale: { cls: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Stale', icon: Timer },
  };
  const { cls, label, icon: Icon } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${cls}`}>
      <Icon size={12} className={status === 'running' ? 'animate-spin' : ''} />
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: RunType }) {
  const config: Record<RunType, { cls: string; label: string }> = {
    cool_farm: { cls: 'bg-emerald-50 text-emerald-700', label: 'Cool Farm' },
    sai_v2: { cls: 'bg-violet-50 text-violet-700', label: 'SAI V2' },
  };
  const { cls, label } = config[type];
  return <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded ${cls}`}>{label}</span>;
}

function EventIcon({ type }: { type: RunEvent['type'] }) {
  const icons: Record<RunEvent['type'], { icon: typeof Clock; cls: string }> = {
    created: { icon: Plus, cls: 'text-stone-500 bg-stone-100' },
    claimed: { icon: Lock, cls: 'text-blue-600 bg-blue-50' },
    started: { icon: Play, cls: 'text-amber-600 bg-amber-50' },
    progress: { icon: Loader2, cls: 'text-amber-600 bg-amber-50' },
    completed: { icon: CheckCircle, cls: 'text-emerald-600 bg-emerald-50' },
    failed: { icon: XCircle, cls: 'text-red-600 bg-red-50' },
    released: { icon: Unlock, cls: 'text-orange-600 bg-orange-50' },
    retried: { icon: RotateCcw, cls: 'text-blue-600 bg-blue-50' },
  };
  const { icon: Icon, cls } = icons[type];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cls}`}>
      <Icon size={14} />
    </div>
  );
}

// Confirmation Modal Component
function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmLabel, 
  confirmVariant = 'primary',
  isLoading = false 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  description: string; 
  confirmLabel: string; 
  confirmVariant?: 'primary' | 'destructive';
  isLoading?: boolean;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
        <p className="mt-2 text-sm text-stone-600">{description}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant={confirmVariant === 'destructive' ? 'secondary' : 'primary'} 
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmVariant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : ''}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'scheduler'>('queue');
  const [selectedRun, setSelectedRun] = useState<IntegrationRun | null>(null);
  const [statusFilter, setStatusFilter] = useState<RunStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<RunType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [runs, setRuns] = useState(mockRuns);
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant: 'primary' | 'destructive';
    onConfirm: () => void;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const filteredRuns = runs.filter(run => {
    if (statusFilter !== 'all' && run.status !== statusFilter) return false;
    if (typeFilter !== 'all' && run.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return run.id.toLowerCase().includes(q) || 
             run.farmerName.toLowerCase().includes(q) || 
             run.plotId.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    pending: runs.filter(r => r.status === 'pending').length,
    running: runs.filter(r => r.status === 'running' || r.status === 'claimed').length,
    complete: runs.filter(r => r.status === 'complete').length,
    failed: runs.filter(r => r.status === 'failed').length,
    stale: runs.filter(r => r.status === 'stale').length,
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast.success('Queue refreshed', { description: `${runs.length} runs loaded` });
  }, [runs.length]);

  const handleClaimRun = useCallback((run: IntegrationRun) => {
    setConfirmModal({
      isOpen: true,
      title: 'Claim Run',
      description: `Are you sure you want to claim run ${run.id}? This will assign it to your worker.`,
      confirmLabel: 'Claim Run',
      confirmVariant: 'primary',
      onConfirm: async () => {
        setIsActionLoading(true);
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setRuns(prev => prev.map(r => r.id === run.id ? { ...r, status: 'claimed' as RunStatus, claimedBy: 'current-user' } : r));
        setIsActionLoading(false);
        setConfirmModal(null);
        toast.success('Run claimed', { description: `${run.id} has been assigned to you` });
      }
    });
  }, []);

  const handleReleaseRun = useCallback((run: IntegrationRun, force = false) => {
    setConfirmModal({
      isOpen: true,
      title: force ? 'Force Release Run' : 'Release Run',
      description: force 
        ? `This will forcefully release ${run.id} even though it may be in progress. This could cause data inconsistency.`
        : `Are you sure you want to release ${run.id}? It will return to the pending queue.`,
      confirmLabel: force ? 'Force Release' : 'Release',
      confirmVariant: force ? 'destructive' : 'primary',
      onConfirm: async () => {
        setIsActionLoading(true);
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setRuns(prev => prev.map(r => r.id === run.id ? { ...r, status: 'pending' as RunStatus, claimedBy: null, startedAt: null } : r));
        setIsActionLoading(false);
        setConfirmModal(null);
        setSelectedRun(null);
        toast.success('Run released', { description: `${run.id} is now available in the queue` });
      }
    });
  }, []);

  const handleRetryRun = useCallback((run: IntegrationRun) => {
    setConfirmModal({
      isOpen: true,
      title: 'Retry Run',
      description: `This will reset ${run.id} and queue it for re-execution. Retry count: ${run.retryCount + 1}`,
      confirmLabel: 'Retry Run',
      confirmVariant: 'primary',
      onConfirm: async () => {
        setIsActionLoading(true);
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setRuns(prev => prev.map(r => r.id === run.id ? { 
          ...r, 
          status: 'pending' as RunStatus, 
          claimedBy: null, 
          startedAt: null, 
          completedAt: null,
          errorMessage: null,
          retryCount: r.retryCount + 1 
        } : r));
        setIsActionLoading(false);
        setConfirmModal(null);
        setSelectedRun(null);
        toast.success('Run queued for retry', { description: `${run.id} will be re-executed` });
      }
    });
  }, []);

  const handleBulkReleaseStale = useCallback(() => {
    const staleRuns = runs.filter(r => r.status === 'stale');
    if (staleRuns.length === 0) {
      toast.info('No stale runs', { description: 'There are no stale runs to release' });
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: 'Release All Stale Runs',
      description: `This will release ${staleRuns.length} stale run(s) back to the pending queue. This action cannot be undone.`,
      confirmLabel: `Release ${staleRuns.length} Runs`,
      confirmVariant: 'destructive',
      onConfirm: async () => {
        setIsActionLoading(true);
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1200));
        setRuns(prev => prev.map(r => r.status === 'stale' ? { ...r, status: 'pending' as RunStatus, claimedBy: null, startedAt: null } : r));
        setIsActionLoading(false);
        setConfirmModal(null);
        toast.success('Stale runs released', { description: `${staleRuns.length} runs returned to queue` });
      }
    });
  }, [runs]);

  const handleTriggerSweep = useCallback(async () => {
    setIsActionLoading(true);
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    const staleCount = runs.filter(r => r.status === 'stale').length;
    setRuns(prev => prev.map(r => r.status === 'stale' ? { ...r, status: 'pending' as RunStatus, claimedBy: null, startedAt: null } : r));
    setIsActionLoading(false);
    toast.success('Sweep completed', { description: `Released ${staleCount} stale runs` });
  }, [runs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Integrations Operations</h2>
          <p className="text-sm text-stone-500 mt-1">Monitor and operate Cool Farm + SAI V2 run workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-lg w-fit" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'queue'}
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'queue' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
        >
          Run Queue
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'scheduler'}
          onClick={() => setActiveTab('scheduler')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'scheduler' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
        >
          Scheduler
        </button>
      </div>

      {activeTab === 'queue' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 cursor-pointer hover:border-stone-300 transition-colors" onClick={() => setStatusFilter('pending')}>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-stone-700">{stats.pending}</p>
            </Card>
            <Card className="p-4 cursor-pointer hover:border-stone-300 transition-colors" onClick={() => setStatusFilter('running')}>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">In Progress</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.running}</p>
            </Card>
            <Card className="p-4 cursor-pointer hover:border-stone-300 transition-colors" onClick={() => setStatusFilter('complete')}>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Completed</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">{stats.complete}</p>
            </Card>
            <Card className="p-4 cursor-pointer hover:border-stone-300 transition-colors" onClick={() => setStatusFilter('failed')}>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Failed</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">{stats.failed}</p>
            </Card>
            <Card className="p-4 cursor-pointer hover:border-stone-300 transition-colors" onClick={() => setStatusFilter('stale')}>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Stale</p>
              <p className="mt-1 text-2xl font-semibold text-orange-600">{stats.stale}</p>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-stone-400" />
                <span className="text-sm font-medium text-stone-700">Filters:</span>
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as RunStatus | 'all')}
                className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="claimed">Claimed</option>
                <option value="running">Running</option>
                <option value="complete">Complete</option>
                <option value="failed">Failed</option>
                <option value="stale">Stale</option>
              </select>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as RunType | 'all')}
                className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
                aria-label="Filter by type"
              >
                <option value="all">All Types</option>
                <option value="cool_farm">Cool Farm</option>
                <option value="sai_v2">SAI V2</option>
              </select>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search runs..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900/20 w-48"
                  aria-label="Search runs"
                />
              </div>
              <div className="flex-1" />
              {statusFilter !== 'all' && (
                <button 
                  onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearchQuery(''); }}
                  className="text-xs text-stone-500 hover:text-stone-700 underline"
                >
                  Clear filters
                </button>
              )}
              <Button variant="secondary" size="sm" onClick={handleBulkReleaseStale} disabled={stats.stale === 0}>
                <AlertTriangle size={14} />
                Release Stale ({stats.stale})
              </Button>
            </div>
          </Card>

          {/* Run Queue Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Run ID</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Farmer</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Plot</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Due</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredRuns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
                            <Package size={24} className="text-stone-400" />
                          </div>
                          <p className="text-sm font-medium text-stone-900">No runs found</p>
                          <p className="text-xs text-stone-500">
                            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                              ? 'Try adjusting your filters or search query' 
                              : 'No integration runs are currently queued'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRuns.map(run => (
                      <tr 
                        key={run.id} 
                        className="hover:bg-stone-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedRun(run)}
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && setSelectedRun(run)}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs text-emerald-900 font-semibold">{run.id}</td>
                        <td className="px-5 py-3.5"><TypeBadge type={run.type} /></td>
                        <td className="px-5 py-3.5 text-stone-800">{run.farmerName}</td>
                        <td className="px-5 py-3.5 text-stone-500 font-mono text-xs">{run.plotId}</td>
                        <td className="px-5 py-3.5"><RunStatusBadge status={run.status} /></td>
                        <td className="px-5 py-3.5 text-stone-500 text-xs">{new Date(run.dueAt).toLocaleString()}</td>
                        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedRun(run)}
                              className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
                              title="View Details"
                              aria-label={`View details for ${run.id}`}
                            >
                              <Eye size={14} className="text-stone-500" />
                            </button>
                            {run.status === 'pending' && (
                              <button 
                                onClick={() => handleClaimRun(run)}
                                className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors" 
                                title="Claim"
                                aria-label={`Claim ${run.id}`}
                              >
                                <Lock size={14} className="text-emerald-600" />
                              </button>
                            )}
                            {(run.status === 'claimed' || run.status === 'stale') && (
                              <button 
                                onClick={() => handleReleaseRun(run, run.status === 'stale')}
                                className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors" 
                                title={run.status === 'stale' ? 'Force Release' : 'Release'}
                                aria-label={`Release ${run.id}`}
                              >
                                <Unlock size={14} className="text-orange-600" />
                              </button>
                            )}
                            {run.status === 'failed' && (
                              <button 
                                onClick={() => handleRetryRun(run)}
                                className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="Retry"
                                aria-label={`Retry ${run.id}`}
                              >
                                <RotateCcw size={14} className="text-blue-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredRuns.length > 0 && (
              <div className="px-5 py-3 border-t border-stone-100 bg-stone-50 text-xs text-stone-500">
                Showing {filteredRuns.length} of {runs.length} runs
              </div>
            )}
          </Card>

          {/* Run Details Drawer */}
          {selectedRun && (
            <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
              <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedRun(null)} />
              <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
                <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
                  <div>
                    <h3 id="drawer-title" className="font-semibold text-stone-900">Run Details</h3>
                    <p className="text-sm text-stone-500 font-mono">{selectedRun.id}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedRun(null)} 
                    className="p-2 hover:bg-stone-100 rounded-lg"
                    aria-label="Close drawer"
                  >
                    <X size={18} className="text-stone-500" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {/* Status and Type */}
                  <div className="flex items-center gap-3">
                    <RunStatusBadge status={selectedRun.status} />
                    <TypeBadge type={selectedRun.type} />
                    {selectedRun.retryCount > 0 && (
                      <span className="text-xs text-stone-500">Retry #{selectedRun.retryCount}</span>
                    )}
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-stone-500 uppercase tracking-wide">Farmer</p>
                      <p className="mt-1 text-sm text-stone-900 font-medium">{selectedRun.farmerName}</p>
                      <p className="text-xs text-stone-500">{selectedRun.farmerId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase tracking-wide">Plot ID</p>
                      <p className="mt-1 text-sm text-stone-900 font-mono">{selectedRun.plotId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase tracking-wide">Due At</p>
                      <p className="mt-1 text-sm text-stone-900">{new Date(selectedRun.dueAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500 uppercase tracking-wide">Claimed By</p>
                      <p className="mt-1 text-sm text-stone-900">{selectedRun.claimedBy || '—'}</p>
                    </div>
                  </div>

                  {/* Error Message */}
                  {selectedRun.errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <XCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Error</p>
                          <p className="mt-1 text-sm text-red-700">{selectedRun.errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-3">Timeline</p>
                    <div className="space-y-0">
                      {selectedRun.events.map((event, idx) => (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <EventIcon type={event.type} />
                            {idx < selectedRun.events.length - 1 && (
                              <div className="w-px h-full min-h-[24px] bg-stone-200 my-1" />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className="text-sm text-stone-900">{event.message}</p>
                            <p className="text-xs text-stone-500">
                              {new Date(event.timestamp).toLocaleString()}
                              {event.actor && event.actor !== 'system' && ` by ${event.actor}`}
                            </p>
                            {event.metadata && (
                              <div className="mt-1 text-xs text-stone-600">
                                {Object.entries(event.metadata).map(([k, v]) => (
                                  <span key={k} className="mr-3">{k}: <span className="font-medium">{String(v)}</span></span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payload */}
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">Payload</p>
                    <pre className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 overflow-x-auto">
                      {JSON.stringify(selectedRun.payload, null, 2)}
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-stone-100">
                    {selectedRun.status === 'pending' && (
                      <Button variant="primary" className="flex-1" onClick={() => handleClaimRun(selectedRun)}>
                        <Lock size={14} />
                        Claim Run
                      </Button>
                    )}
                    {selectedRun.status === 'claimed' && (
                      <Button variant="secondary" className="flex-1" onClick={() => handleReleaseRun(selectedRun)}>
                        <Unlock size={14} />
                        Release
                      </Button>
                    )}
                    {selectedRun.status === 'stale' && (
                      <Button variant="secondary" className="flex-1 text-orange-700 border-orange-200 hover:bg-orange-50" onClick={() => handleReleaseRun(selectedRun, true)}>
                        <Unlock size={14} />
                        Force Release
                      </Button>
                    )}
                    {selectedRun.status === 'failed' && (
                      <Button variant="primary" className="flex-1" onClick={() => handleRetryRun(selectedRun)}>
                        <RotateCcw size={14} />
                        Retry Run
                      </Button>
                    )}
                    {(selectedRun.status === 'complete' || selectedRun.status === 'running') && (
                      <div className="flex-1 text-center text-sm text-stone-500 py-2">
                        {selectedRun.status === 'running' ? 'Run is currently in progress' : 'Run completed successfully'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stale Sweeper */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-semibold text-stone-900">Stale Sweeper</h3>
                <p className="text-sm text-stone-500 mt-1">Automatically release stale runs</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Active
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="stale-threshold" className="text-sm font-medium text-stone-700">Stale Threshold (minutes)</label>
                <input
                  id="stale-threshold"
                  type="number"
                  defaultValue={30}
                  min={5}
                  max={120}
                  className="mt-1 w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
                />
              </div>
              <div>
                <label htmlFor="max-releases" className="text-sm font-medium text-stone-700">Max Releases per Sweep</label>
                <input
                  id="max-releases"
                  type="number"
                  defaultValue={10}
                  min={1}
                  max={100}
                  className="mt-1 w-full px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
                />
              </div>
              <Button variant="primary" className="w-full" onClick={handleTriggerSweep} disabled={isActionLoading}>
                {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {isActionLoading ? 'Running Sweep...' : 'Trigger Sweep Now'}
              </Button>
            </div>
          </Card>

          {/* Token Status */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-semibold text-stone-900">API Token Status</h3>
                <p className="text-sm text-stone-500 mt-1">Integration credentials health</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Leaf size={20} className="text-emerald-700" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Cool Farm Token</p>
                    <p className="text-xs text-stone-500">Expires in 23 days</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle size={12} />
                  Valid
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Database size={20} className="text-violet-700" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">SAI V2 Token</p>
                    <p className="text-xs text-stone-500">Expires in 45 days</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle size={12} />
                  Valid
                </span>
              </div>
            </div>
          </Card>

          {/* Last Sweep Result */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-semibold text-stone-900 mb-4">Last Sweep Result</h3>
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-stone-400" />
                  <span className="text-stone-500">Executed:</span>
                  <span className="text-stone-900">Apr 21, 2026 at 1:30 PM</span>
                </div>
                <div className="w-px h-4 bg-stone-200 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-stone-500">Released:</span>
                  <span className="text-emerald-700 font-semibold">3 runs</span>
                </div>
                <div className="w-px h-4 bg-stone-200 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <Timer size={14} className="text-stone-400" />
                  <span className="text-stone-500">Duration:</span>
                  <span className="text-stone-900">1.2s</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Sweep History */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-semibold text-stone-900 mb-4">Recent Sweep History</h3>
            <div className="space-y-2">
              {[
                { time: 'Apr 21, 2026 at 1:30 PM', released: 3, duration: '1.2s', status: 'success' },
                { time: 'Apr 21, 2026 at 1:00 PM', released: 0, duration: '0.8s', status: 'success' },
                { time: 'Apr 21, 2026 at 12:30 PM', released: 1, duration: '0.9s', status: 'success' },
                { time: 'Apr 21, 2026 at 12:00 PM', released: 5, duration: '1.5s', status: 'success' },
                { time: 'Apr 21, 2026 at 11:30 AM', released: 2, duration: '1.1s', status: 'success' },
              ].map((sweep, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle size={12} className="text-emerald-600" />
                    </div>
                    <span className="text-sm text-stone-700">{sweep.time}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-stone-500">{sweep.released} released</span>
                    <span className="text-stone-400">{sweep.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          confirmVariant={confirmModal.confirmVariant}
          isLoading={isActionLoading}
        />
      )}
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
      case 'contacts': return <ContactsPage />;
      case 'transactions': return <TransactionsPage />;
      case 'compliance': return <CompliancePage />;
      case 'documents': return <DocumentsPage />;
      case 'traces': return <TracesPage />;
      case 'reports': return <ReportsPage />;
case 'settings': return <SettingsPage />;
  case 'assessments': return <AssessmentsPage />;
  case 'integrations': return <IntegrationsPage />;
  default: return <OverviewPage setPage={setPage} />;
    }
  };

  const pageTitle = navItems.find(n => n.id === currentPage)?.label || (currentPage === 'settings' ? 'Settings' : 'Overview');

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-stone-200 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-stone-100">
          <span className="inline-flex w-9 h-9 items-center justify-center rounded-lg bg-emerald-900 text-stone-50 text-sm font-bold shadow-sm flex-shrink-0">
            T
          </span>
          {sidebarOpen && (
            <div className="leading-none overflow-hidden">
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
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <ChevronRight size={18} className={`text-stone-500 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-stone-900">{pageTitle}</h1>
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
      
      {/* Toast Notifications */}
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
