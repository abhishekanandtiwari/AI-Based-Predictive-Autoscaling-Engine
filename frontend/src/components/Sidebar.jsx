import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Cpu,
  GitCompare,
  DollarSign,
  Award,
  Database,
  FileText,
  Settings,
  User,
  LogIn
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard, category: 'Core' },
  { id: 'analytics', label: 'Workload Analytics', icon: BarChart3, category: 'Core' },
  { id: 'forecasting', label: 'AI Forecasting', icon: TrendingUp, category: 'Machine Learning' },
  { id: 'simulator', label: 'Autoscaling Simulator', icon: Cpu, category: 'Simulation' },
  { id: 'comparison', label: 'Predictive vs Reactive', icon: GitCompare, category: 'Simulation', badge: 'Featured' },
  { id: 'cost', label: 'Cost Optimization', icon: DollarSign, category: 'Optimization' },
  { id: 'performance', label: 'Model Performance', icon: Award, category: 'Machine Learning' },
  { id: 'metrics', label: 'Historical Metrics', icon: Database, category: 'Data' },
  { id: 'reports', label: 'Reports & Exports', icon: FileText, category: 'Academic' },
  { id: 'settings', label: 'Engine Settings', icon: Settings, category: 'Config' },
  { id: 'profile', label: 'User Profile', icon: User, category: 'Account' },
  { id: 'login', label: 'Authentication', icon: LogIn, category: 'Account' },
];

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static top-16 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-20
        flex flex-col justify-between overflow-y-auto transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Navigation Menu
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-amber-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Academic Project Meta */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">B.Tech CSE Major Project</p>
            <p className="text-[10px] text-slate-400">Random Forest &middot; HPA &middot; Cloud Sim</p>
            <div className="pt-2 flex items-center space-x-1.5 text-[10px] text-emerald-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>Backend Connected: Localhost</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
