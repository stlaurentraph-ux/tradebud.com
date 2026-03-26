'use client';

import { ArrowUpRight, ArrowDownRight, Package, Clock, MapPin, Users, Plus, Upload, CheckCircle, BarChart3, Settings, LogOut, Bell, Search, TrendingUp } from 'lucide-react';

export default function ExporterDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-800 bg-slate-950/50 backdrop-blur p-6 flex flex-col">
        <div className="mb-8">
          <div className="text-2xl font-bold text-white">TradeBud</div>
          <p className="text-xs text-slate-500 mt-1">Exporter Portal</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium">
            <BarChart3 size={20} />
            <span>Overview</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 transition">
            <Package size={20} />
            <span>DDS Packages</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 transition">
            <MapPin size={20} />
            <span>Plots</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 transition">
            <Users size={20} />
            <span>Farmers</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 transition">
            <BarChart3 size={20} />
            <span>Reports</span>
          </a>
        </nav>

        <div className="space-y-2 pt-6 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 transition">
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 transition">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">Welcome back, Green Valley Exports</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
              </div>
              <button className="p-2 hover:bg-slate-800 rounded-lg transition">
                <Bell size={20} className="text-slate-400" />
              </button>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold">GV</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Packages', value: '248', change: '+12%', positive: true, icon: Package },
              { label: 'Pending', value: '24', change: '+5%', positive: false, icon: Clock },
              { label: 'Plots', value: '156', change: '+8%', positive: true, icon: MapPin },
              { label: 'Active Farmers', value: '89', change: '+3%', positive: true, icon: Users },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">{metric.label}</p>
                      <p className="text-3xl font-bold text-white mt-2">{metric.value}</p>
                      <p className={`text-xs mt-2 flex items-center gap-1 ${metric.positive ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {metric.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {metric.change} vs last month
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <Icon className="text-emerald-400" size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line Chart */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Package Submissions</h2>
              <div className="h-64 flex items-end justify-between gap-2">
                {[40, 60, 35, 75, 55, 85, 70, 45, 90, 65, 80, 95].map((height, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t opacity-70 hover:opacity-100 transition" style={{ height: `${(height / 100) * 100}%` }} />
                ))}
              </div>
              <div className="mt-4 text-xs text-slate-500 text-center">Last 12 months</div>
            </div>

            {/* Donut Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Compliance Status</h2>
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray="75 100" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="20 100" strokeDashoffset="-75" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray="5 100" strokeDashoffset="-95" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">75%</span>
                  </div>
                </div>
                <div className="space-y-2 w-full text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Compliant</span>
                    <span className="text-emerald-400 font-semibold">75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Pending</span>
                    <span className="text-orange-400 font-semibold">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Issues</span>
                    <span className="text-red-400 font-semibold">5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Plus, label: 'New Package', color: 'emerald' },
                { icon: Upload, label: 'Import Data', color: 'blue' },
                { icon: CheckCircle, label: 'Verify Plots', color: 'amber' },
                { icon: BarChart3, label: 'Export Report', color: 'violet' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.label} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition text-slate-300 hover:text-white">
                    <Icon size={20} />
                    <span className="font-medium">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Packages Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Packages</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Package ID</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Farmer</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Crop</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Weight</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    { id: 'PKG-2024-001', farmer: 'John Kiprotich', crop: 'Maize', weight: '500kg', status: 'Verified', color: 'emerald' },
                    { id: 'PKG-2024-002', farmer: 'Mary Kipchoge', crop: 'Wheat', weight: '450kg', status: 'Pending', color: 'amber' },
                    { id: 'PKG-2024-003', farmer: 'James Kiplagat', crop: 'Rice', weight: '600kg', status: 'Verified', color: 'emerald' },
                    { id: 'PKG-2024-004', farmer: 'Sarah Koech', crop: 'Beans', weight: '350kg', status: 'Issue', color: 'red' },
                    { id: 'PKG-2024-005', farmer: 'David Rotich', crop: 'Maize', weight: '480kg', status: 'Verified', color: 'emerald' },
                  ].map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-white font-medium">{pkg.id}</td>
                      <td className="py-3 px-4 text-slate-300">{pkg.farmer}</td>
                      <td className="py-3 px-4 text-slate-300">{pkg.crop}</td>
                      <td className="py-3 px-4 text-slate-300">{pkg.weight}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${pkg.color}-500/20 text-${pkg.color}-400`}>
                          {pkg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: 'Package Verified', desc: 'PKG-2024-001 by John Kiprotich', time: '2 hours ago', icon: '✓', color: 'emerald' },
                { action: 'New Submission', desc: 'PKG-2024-005 submitted by David Rotich', time: '4 hours ago', icon: '↑', color: 'blue' },
                { action: 'Compliance Check', desc: 'Plot verification completed', time: '1 day ago', icon: '✓', color: 'emerald' },
                { action: 'Data Import', desc: '156 plot records imported', time: '2 days ago', icon: '↓', color: 'violet' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-slate-800 last:border-b-0">
                  <div className={`p-2 rounded-lg bg-${item.color}-500/20 text-${item.color}-400 text-sm font-bold flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium">{item.action}</p>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                    <p className="text-slate-600 text-xs mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
