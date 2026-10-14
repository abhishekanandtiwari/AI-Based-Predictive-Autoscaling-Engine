import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Lock,
  Mail,
  User
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess, onDemoLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('demo_admin@autoscaler.local');
  const [password, setPassword] = useState('admin1234');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register(name, email, password, role);
        onLoginSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <Cpu className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Predictive Autoscaler</h1>
        <p className="text-xs text-slate-500">Sign in to manage predictive models and run cloud simulations</p>
      </div>

      {/* 1-Click Viva / Demo Account Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200/60 text-center space-y-2">
        <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
          Faculty / Evaluator Instant Access
        </span>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => onDemoLogin('admin')}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 shadow-xs transition"
          >
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Faculty Admin Demo</span>
          </button>
          <button
            type="button"
            onClick={() => onDemoLogin('user')}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-xs transition"
          >
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span>Student Demo</span>
          </button>
        </div>
      </div>

      {/* Main Auth Form Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 card-shadow space-y-6">
        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              !isRegister ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              isRegister ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Register Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center space-x-2 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Abhishek Anand"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="user">Student / Evaluator (User)</option>
                <option value="admin">System Administrator (Faculty)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-2"
          >
            {isRegister ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
