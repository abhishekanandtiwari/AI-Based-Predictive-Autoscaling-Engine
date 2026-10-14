import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Layers,
  DollarSign
} from 'lucide-react';

const DEFAULT_SETTINGS = {
  capacity_per_replica: 250,
  target_cpu: 70,
  min_replicas: 2,
  max_replicas: 25,
  safety_buffer: 15,
  cooldown_periods: 3,
  cost_per_replica_hour: 0.05,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('autoscaling_engine_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('autoscaling_engine_settings', JSON.stringify(settings));
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('autoscaling_engine_settings');
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 card-shadow">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Autoscaling Engine Hyperparameters</h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              System Policy
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure replica thresholds, capacity ratings, safety buffers, and stabilization cooldown periods.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to Academic Defaults</span>
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Engine parameters saved successfully to local runtime configuration.</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-slate-200 card-shadow space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Capacity per Replica */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Safe Capacity per Replica (Requests/sec)
            </label>
            <input
              type="number"
              min="50"
              max="2000"
              value={settings.capacity_per_replica}
              onChange={(e) => setSettings({ ...settings, capacity_per_replica: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">Maximum throughput handled by one instance before queuing begins.</p>
          </div>

          {/* Target CPU Utilization */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Target CPU Utilization (%)
            </label>
            <input
              type="number"
              min="30"
              max="90"
              value={settings.target_cpu}
              onChange={(e) => setSettings({ ...settings, target_cpu: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">Optimal steady-state target (standard cloud industry default is 70%).</p>
          </div>

          {/* Min Replicas Floor */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Minimum Replicas (High Availability Floor)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.min_replicas}
              onChange={(e) => setSettings({ ...settings, min_replicas: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">Availability floor to withstand unexpected baseline traffic.</p>
          </div>

          {/* Max Replicas Ceiling */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Maximum Replicas (Budget Cost Ceiling)
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={settings.max_replicas}
              onChange={(e) => setSettings({ ...settings, max_replicas: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">Hard upper bound to protect infrastructure budget.</p>
          </div>

          {/* Safety Buffer */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Safety Headroom Buffer (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={settings.safety_buffer}
              onChange={(e) => setSettings({ ...settings, safety_buffer: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">Additional headroom provisioned above forecasted demand (15% recommended).</p>
          </div>

          {/* Cooldown Periods */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Scale-Down Cooldown (Time Steps)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.cooldown_periods}
              onChange={(e) => setSettings({ ...settings, cooldown_periods: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">Stabilization period to prevent rapid pod flapping / thrashing.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            Save Hyperparameter Changes
          </button>
        </div>
      </form>
    </div>
  );
}
