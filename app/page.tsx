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
  ChevronDown,
  Plus,
  FileText,
  ArrowUpRight,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const navItems = [
  { label: 'Overview', icon: BarChart3, active: true },
  { label: 'DDS Packages', icon: Package },
  { label: 'Plots', icon: MapPin },
  { label: 'Farmers', icon: Users },
  { label: 'Reports', icon: FileText },
];

const packages = [
  { id: 'PKG-2026-0847', farmer: 'John Kiprotich', plot: 'KE-NAK-001', weight: '2,450 kg', status: 'verified', date: 'Mar 18, 2026' },
  { id: 'PKG-2026-0846', farmer: 'Mary Wanjiku', plot: 'KE-NAK-002', weight: '1,820 kg', status: 'pending', date: 'Mar 17, 2026' },
  { id: 'PKG-2026-0845', farmer: 'James Ochieng', plot: 'KE-KIS-003', weight: '3,100 kg', status: 'verified', date: 'Mar 17, 2026' },
  { id: 'PKG-2026-0844', farmer: 'Grace Akinyi', plot: 'KE-KIS-004', weight: '1,950 kg', status: 'issue', date: 'Mar 16, 2026' },
  { id: 'PKG-2026-0843', farmer: 'Peter Kamau', plot: 'KE-NAK-005', weight: '2,780 kg', status: 'verified', date: 'Mar 16, 2026' },
];

const chartData = [65, 72, 58, 80, 75, 90, 85, 78, 92, 88, 95, 102];
const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

function StatusBadge({ status }: { status: string }) {
  const styles = {
    verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    issue: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  
  const icons = {
    verified: <CheckCircle2 size={12} />,
    pending: <Clock size={12} />,
    issue: <AlertCircle size={12} />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
      {icons[status as keyof typeof icons]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function MetricCard({ label, value, change, chart }: { label: string; value: string; change: string; chart: number[] }) {
  const max = Math.max(...chart);
  const isPositive = change.startsWith('+');
  
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-zinc-400">{label}</span>
        <button className="p-1 hover:bg-zinc-800 rounded transition-colors">
          <ArrowUpRight size={14} className="text-zinc-500" />
        </button>
      </div>
      
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
          <p className={`text-xs mt-1 flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            <TrendingUp size={12} className={!isPositive ? 'rotate-180' : ''} />
            {change}
          </p>
        </div>
        
        {/* Mini sparkline */}
        <div className="flex items-end gap-0.5 h-10">
          {chart.map((val, i) => (
            <div
              key={i}
              className="w-1.5 bg-blue-500/60 rounded-sm"
              style={{ height: `${(val / max) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AreaChart() {
  const max = Math.max(...chartData);
  const points = chartData.map((val, i) => ({
    x: (i / (chartData.length - 1)) * 100,
    y: 100 - (val / max) * 80
  }));
  
  const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaPath = `${linePath} L 100,100 L 0,100 Z`;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-white">Package Submissions</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Last 12 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-zinc-400">Submissions</span>
          </div>
        </div>
      </div>
      
      <div className="relative h-48">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#27272a" strokeWidth="0.5" />
          ))}
          
          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGradient)" />
          
          {/* Line */}
          <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" fill="#3b82f6" className="opacity-0 hover:opacity-100 transition-opacity" />
          ))}
        </svg>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-zinc-600 -mb-5">
          {months.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComplianceChart() {
  const data = [
    { label: 'Verified', value: 847, percent: 78, color: '#22c55e' },
    { label: 'Pending', value: 156, percent: 14, color: '#f59e0b' },
    { label: 'Issues', value: 89, percent: 8, color: '#ef4444' },
  ];

  let offset = 0;
  
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-white">Compliance Status</h3>
          <p className="text-xs text-zinc-500 mt-0.5">1,092 total packages</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.map((item, i) => {
              const circumference = 2 * Math.PI * 40;
              const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -(offset / 100) * circumference;
              offset += item.percent;
              
              return (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-semibold text-white">78%</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-3">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-400">{item.label}</span>
              </div>
              <span className="text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExporterDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-zinc-900 bg-black flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-sm">T</span>
            </div>
            <div>
              <span className="text-white font-semibold text-sm">TradeBud</span>
              <span className="text-zinc-600 text-xs ml-1.5 px-1.5 py-0.5 bg-zinc-900 rounded">Exporter</span>
            </div>
          </div>
        </div>
        
        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active 
                    ? 'bg-zinc-900 text-white' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.label === 'DDS Packages' && (
                  <span className="ml-auto text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">156</span>
                )}
              </button>
            );
          })}
        </nav>
        
        {/* User */}
        <div className="p-3 border-t border-zinc-900">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-colors">
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-colors">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-zinc-900 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between h-14 px-6">
            <div className="flex items-center gap-6">
              <h1 className="text-sm font-medium text-white">Overview</h1>
              <div className="flex items-center gap-1 text-xs">
                <button className="px-3 py-1.5 bg-zinc-900 text-white rounded-md">Production</button>
                <button className="px-3 py-1.5 text-zinc-500 hover:text-white transition-colors">Preview</button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 h-8 pl-9 pr-3 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>
              <button className="p-2 hover:bg-zinc-900 rounded-md transition-colors relative">
                <Bell size={16} className="text-zinc-500" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
              </button>
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                GV
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Top row - Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard 
              label="Total Packages" 
              value="1,092" 
              change="+12.5%"
              chart={[40, 45, 42, 50, 48, 55, 60, 58, 65, 70, 68, 75]}
            />
            <MetricCard 
              label="Pending Review" 
              value="156" 
              change="+8.2%"
              chart={[20, 25, 22, 28, 30, 25, 32, 35, 30, 38, 40, 35]}
            />
            <MetricCard 
              label="Registered Plots" 
              value="342" 
              change="+5.1%"
              chart={[30, 32, 35, 33, 38, 40, 42, 45, 48, 50, 52, 55]}
            />
            <MetricCard 
              label="Active Farmers" 
              value="189" 
              change="+3.8%"
              chart={[15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 42]}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <AreaChart />
            </div>
            <ComplianceChart />
          </div>

          {/* Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-white">Recent Packages</h3>
                <span className="text-xs text-zinc-500">Showing 5 of 1,092</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-md hover:border-zinc-700 transition-colors">
                  <Plus size={12} />
                  New Package
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors">
                  View All
                  <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Package ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Farmer</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Plot</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Weight</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-zinc-900/50 transition-colors group">
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-blue-400">{pkg.id}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-300">{pkg.farmer}</td>
                      <td className="py-3 px-4 text-sm text-zinc-500 font-mono">{pkg.plot}</td>
                      <td className="py-3 px-4 text-sm text-zinc-300">{pkg.weight}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={pkg.status} />
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-500">{pkg.date}</td>
                      <td className="py-3 px-4">
                        <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 rounded transition-all">
                          <MoreHorizontal size={14} className="text-zinc-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
