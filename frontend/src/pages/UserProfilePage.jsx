import React from 'react';
import {
  User,
  ShieldCheck,
  UserCheck,
  Calendar,
  Lock,
  Mail,
  Award,
  CheckCircle2
} from 'lucide-react';

export default function UserProfilePage({ currentUser, onDemoLogin, onLogout }) {
  const user = currentUser || {
    name: 'B.Tech Student',
    email: 'student@autoscaler.local',
    role: 'user',
    created_at: '2026-01-01',
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 card-shadow">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">User Identity & Access Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Role-Based Access Control (RBAC) separating administrative system privileges from student evaluation sessions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onDemoLogin(isAdmin ? 'user' : 'admin')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            {isAdmin ? <UserCheck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            <span>Switch to {isAdmin ? 'Student (User)' : 'Faculty (Admin)'}</span>
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 card-shadow space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-3xl shadow-md shadow-blue-500/20">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isAdmin
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start space-x-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Active Role Privileges & Capabilities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Telemetry Exploration: </span>
                <span className="text-slate-500">View and export historical dataset logs</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Forecasting & Inference: </span>
                <span className="text-slate-500">Execute multi-horizon demand forecasting</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Simulation Runner: </span>
                <span className="text-slate-500">Run live and comparative autoscaling experiments</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
              <CheckCircle2 className={`h-4 w-4 ${isAdmin ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Model Retraining & Config: </span>
                <span className="text-slate-500">{isAdmin ? 'Authorized administrator privileges' : 'Available with Admin role'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
