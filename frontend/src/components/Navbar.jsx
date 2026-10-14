import React from 'react';
import { Cpu, Server, Activity, ShieldCheck, UserCheck, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ currentUser, onDemoLogin, onLogout, activeTab, setActiveTab }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 card-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">AI Predictive Autoscaler</span>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  ML Engine v2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Workload Forecasting & Resource Cost Optimization</p>
            </div>
          </div>

          {/* System Status & Demo Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Live Indicator */}
            <div className="hidden md:flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Inference Engine: Active</span>
            </div>

            {/* Quick Demo Switcher */}
            <div className="hidden lg:flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => onDemoLogin('admin')}
                className="px-2.5 py-1 rounded-md hover:bg-white text-slate-700 hover:shadow-xs transition font-medium flex items-center space-x-1"
                title="Switch to Faculty / Admin view"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span>Demo Admin</span>
              </button>
              <button
                onClick={() => onDemoLogin('user')}
                className="px-2.5 py-1 rounded-md hover:bg-white text-slate-700 hover:shadow-xs transition font-medium flex items-center space-x-1"
                title="Switch to Student view"
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Demo Student</span>
              </button>
            </div>

            {/* User Profile Pill */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition"
                >
                  <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUser.name}</p>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                      {currentUser.role || 'user'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
