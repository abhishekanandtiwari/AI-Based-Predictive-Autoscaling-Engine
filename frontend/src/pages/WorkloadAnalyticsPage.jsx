import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Upload,
  Download,
  RefreshCw,
  Database,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../services/api';

export default function WorkloadAnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [genDays, setGenDays] = useState(60);
  const [genSeed, setGenSeed] = useState(42);
  const [statusMsg, setStatusMsg] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, histRes] = await Promise.all([
        api.getSummary().catch(() => null),
        api.getHistory(1, 100).catch(() => ({ data: [] }))
      ]);
      if (sumRes) setSummary(sumRes);
      if (histRes?.data) setHistory(histRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setStatusMsg(null);
      const res = await api.generateData(genDays, genSeed);
      setStatusMsg({ type: 'success', text: res.message });
      await loadData();
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      setStatusMsg(null);
      const res = await api.uploadDataCSV(file);
      setStatusMsg({ type: 'success', text: res.message });
      await loadData();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Aggregated Hourly Heatmap Profile (0 to 23h)
  const hourlyProfile = Array.from({ length: 24 }, (_, h) => {
    const subset = history.filter(item => item.hour_of_day === h || new Date(item.timestamp).getHours() === h);
    const avgReq = subset.length > 0 ? subset.reduce((acc, x) => acc + x.request_count, 0) / subset.length : 200;
    const avgCpu = subset.length > 0 ? subset.reduce((acc, x) => acc + x.cpu_utilization, 0) / subset.length : 50;
    return {
      hour: `${h}:00`,
      avg_requests: Math.round(avgReq),
      avg_cpu: Math.round(avgCpu),
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 card-shadow">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Workload Telemetry Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Diurnal patterns, weekly seasonality, spike injections, and coupled server metric correlations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/api/data/export"
            download="workload_telemetry.csv"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV</span>
          </a>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 text-xs font-medium ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Dataset Generation & Upload Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Synthetic Generator Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Synthetic Multi-Seasonal Data Generator</h2>
          </div>
          <p className="text-xs text-slate-500">
            Generates realistic cloud application workload containing daily sinusoidal cycles (peak at 14:00, trough at 04:00),
            weekend dampening, organic growth trend, stochastic noise, and coupled server physics.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Time Horizon (Days)</label>
              <input
                type="number"
                min="7"
                max="180"
                value={genDays}
                onChange={(e) => setGenDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Total hours: {genDays * 24}</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Random Seed</label>
              <input
                type="number"
                value={genSeed}
                onChange={(e) => setGenSeed(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Ensures repeatable experiments</span>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'Generating...' : 'Regenerate Telemetry'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom CSV Upload Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
          <div className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Upload Custom Metrics CSV</h2>
          </div>
          <p className="text-xs text-slate-500">
            Upload your own cloud telemetry. Required columns: <code className="text-[11px] bg-slate-100 p-0.5 rounded">timestamp</code> and <code className="text-[11px] bg-slate-100 p-0.5 rounded">request_count</code>.
          </p>

          <div className="pt-2">
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/30">
              <Upload className="h-6 w-6 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700">Choose CSV File</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Click to browse local files</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main Charts: Workload Sequence + Coupled Physical Metrics */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Workload Request Rate & Physical Response Latency</h2>
          <p className="text-xs text-slate-500">Notice non-linear queueing latency surging exponentially when traffic approaches saturation</p>
        </div>

        <div className="w-full" style={{ minHeight: '288px', height: '288px' }}>
          <ResponsiveContainer width="100%" height={288} minHeight={288} minWidth={0}>
            <AreaChart data={history.slice(0, 100)}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="timestamp" tickFormatter={(t) => t ? t.slice(11, 16) : ''} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'Requests / sec', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'Latency (ms)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area yAxisId="left" type="monotone" dataKey="request_count" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#reqGrad)" name="Incoming Requests (req/s)" />
              <Line yAxisId="right" type="monotone" dataKey="response_time" stroke="#f43f5e" strokeWidth={2} dot={false} name="Response Time (ms)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Diurnal Pattern Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Diurnal Cycle: Average Traffic Across 24-Hour Day</h2>
          <p className="text-xs text-slate-500">Aggregated across all days demonstrating consistent peak and trough hours</p>
        </div>

        <div className="w-full" style={{ minHeight: '260px', height: '260px' }}>
          <ResponsiveContainer width="100%" height={260} minHeight={260} minWidth={0}>
            <BarChart data={hourlyProfile}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="avg_requests" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Avg Requests/sec" />
              <Bar dataKey="avg_cpu" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Avg CPU %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
