import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Zap,
  Activity,
  Server,
  Cpu,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import KpiCard from '../components/KpiCard';
import { api } from '../services/api';

export default function AutoscalingSimulatorPage() {
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused'
  const [currentStep, setCurrentStep] = useState(0);
  const [history, setHistory] = useState([]);
  const [speed, setSpeed] = useState(1);
  const [trafficMultiplier, setTrafficMultiplier] = useState(1.0);
  const [spikeInjected, setSpikeInjected] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const timerRef = useRef(null);

  // Polling simulation ticks
  const fetchStatusAndHistory = async () => {
    try {
      const [statRes, histRes] = await Promise.all([
        api.getSimulationStatus().catch(() => null),
        api.getSimulationHistory(40).catch(() => ({ history: [] }))
      ]);
      if (statRes) {
        setStatus(statRes.status);
        setCurrentStep(statRes.current_step);
      }
      if (histRes?.history) {
        setHistory(histRes.history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatusAndHistory();
  }, []);

  // Simulation timer loop
  useEffect(() => {
    if (status === 'running') {
      const intervalMs = Math.max(300, 1200 / speed);
      timerRef.current = setInterval(async () => {
        try {
          const res = await api.stepSimulation(1);
          if (res?.latest_step) {
            setHistory(prev => [...prev.slice(-39), res.latest_step]);
            setCurrentStep(res.status?.current_step || 0);
          }
        } catch (e) {
          console.error(e);
        }
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, speed]);

  const handleStart = async () => {
    await api.startSimulation({ speed, traffic_multiplier: trafficMultiplier });
    setStatus('running');
    await fetchStatusAndHistory();
  };

  const handlePause = async () => {
    await api.pauseSimulation();
    setStatus('paused');
  };

  const handleResume = async () => {
    await api.resumeSimulation();
    setStatus('running');
  };

  const handleStep = async (count = 1) => {
    const res = await api.stepSimulation(count);
    await fetchStatusAndHistory();
  };

  const handleReset = async () => {
    await api.resetSimulation(42);
    setStatus('idle');
    setSpikeInjected(false);
    await fetchStatusAndHistory();
  };

  const handleInjectSpike = async () => {
    await api.injectSpike(2.5, 5);
    setSpikeInjected(true);
    setTimeout(() => setSpikeInjected(false), 6000);
    await fetchStatusAndHistory();
  };

  const latest = history[history.length - 1] || {};

  return (
    <div className="space-y-6">
      {/* Control Console */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Live Autoscaling Simulator</h1>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                status === 'running'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : status === 'paused'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                State: {status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Step-by-step interactive engine comparing predictive proactively-scaled instances vs reactive threshold response.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center space-x-2">
            {status !== 'running' ? (
              <button
                onClick={status === 'paused' ? handleResume : handleStart}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <Play className="h-4 w-4" />
                <span>{status === 'paused' ? 'Resume' : 'Start Simulation'}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={() => handleStep(1)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              title="Advance single tick"
            >
              <FastForward className="h-4 w-4" />
              <span>Step 1h</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              title="Reset to step 0"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Dynamic Controls Bar: Speed, Intensity & Spike Injection */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Simulation Speed */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Playback Speed:</span>
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    speed === s ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Traffic Intensity */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Traffic Load:</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={trafficMultiplier}
              onChange={(e) => setTrafficMultiplier(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <span className="text-xs font-bold text-slate-700 w-10">{trafficMultiplier}x</span>
          </div>

          {/* Spike Injection Button */}
          <div>
            <button
              onClick={handleInjectSpike}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                spikeInjected
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white'
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>{spikeInjected ? '🚨 2.5x Spike Active!' : '⚡ Inject 2.5x Traffic Spike'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live State KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Current Step Workload"
          value={latest.request_count || 0}
          unit="req/s"
          subtitle={`Simulation Hour: T+${currentStep}h`}
          icon={Activity}
          color="blue"
        />
        <KpiCard
          title="Predictive (AI) Replicas"
          value={latest.predictive_replicas || 2}
          unit="Replicas"
          subtitle={`CPU: ${latest.predictive_cpu || 0}% | Latency: ${latest.predictive_latency || 0}ms`}
          icon={Server}
          color="teal"
          badge={{ text: "Warm & Ready", color: "bg-teal-100 text-teal-800" }}
        />
        <KpiCard
          title="Reactive (HPA) Replicas"
          value={latest.reactive_replicas || 2}
          unit="Replicas"
          subtitle={`CPU: ${latest.reactive_cpu || 0}% | Latency: ${latest.reactive_latency || 0}ms`}
          icon={Cpu}
          color={latest.reactive_cpu > 85 ? 'rose' : 'amber'}
          warning={latest.reactive_cpu > 85}
          badge={{
            text: latest.reactive_cpu > 85 ? "Overloaded" : "Threshold",
            color: latest.reactive_cpu > 85 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
          }}
        />
        <KpiCard
          title="Latency Delta"
          value={Math.round((latest.reactive_latency || 30) - (latest.predictive_latency || 25))}
          unit="ms Saved"
          subtitle="Proactive provision advantage"
          icon={Clock}
          color="indigo"
          badge={{ text: "Zero Lag", color: "bg-indigo-100 text-indigo-800" }}
        />
      </div>

      {/* Live Scrolling Recharts Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Dual-Strategy Telemetry Window</h2>
            <p className="text-xs text-slate-500">Real-time comparison of instance allocations during traffic shifts</p>
          </div>
          <span className="text-xs text-slate-400">Displaying rolling window of {history.length} ticks</span>
        </div>

        <div className="w-full" style={{ minHeight: '288px', height: '288px' }}>
          <ResponsiveContainer width="100%" height={288} minHeight={288} minWidth={0}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="step" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(s) => `T+${s}`} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'Requests/s', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 16]} tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'Instances', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="request_count" stroke="#94a3b8" strokeWidth={2} dot={false} name="Incoming Traffic" />
              <Line yAxisId="right" type="stepAfter" dataKey="predictive_replicas" stroke="#2563eb" strokeWidth={3} dot={{ r: 2 }} name="Predictive Replicas" />
              <Line yAxisId="right" type="stepAfter" dataKey="reactive_replicas" stroke="#f97316" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} name="Reactive Replicas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Resource Utilization & Latency Tracking */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Resource Utilization & Latency Telemetry</h2>
            <p className="text-xs text-slate-500">
              Real-time monitoring of CPU saturation and queueing latency response during traffic surges and spike injections.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              CPU Target: 70%
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
              SLA Limit: 100ms
            </span>
          </div>
        </div>

        <div className="w-full" style={{ minHeight: '260px', height: '260px' }}>
          <ResponsiveContainer width="100%" height={260} minHeight={260} minWidth={0}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="step" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(s) => `T+${s}`} />
              <YAxis yAxisId="left" domain={[0, 105]} tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'CPU %', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'Latency (ms)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <ReferenceLine yAxisId="left" y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '80% Saturation', fill: '#ef4444', fontSize: 9, position: 'insideTopLeft' }} />
              <ReferenceLine yAxisId="right" y={100} stroke="#dc2626" strokeDasharray="4 4" label={{ value: '100ms SLA', fill: '#dc2626', fontSize: 9, position: 'insideTopRight' }} />
              <Line yAxisId="left" type="monotone" dataKey="predictive_cpu" stroke="#0d9488" strokeWidth={2.5} dot={false} name="Predictive CPU %" />
              <Line yAxisId="left" type="monotone" dataKey="reactive_cpu" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Reactive CPU %" />
              <Line yAxisId="right" type="monotone" dataKey="predictive_latency" stroke="#3b82f6" strokeWidth={2} dot={false} name="Predictive Latency (ms)" />
              <Line yAxisId="right" type="monotone" dataKey="reactive_latency" stroke="#f97316" strokeWidth={1.8} strokeDasharray="4 4" dot={false} name="Reactive Latency (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decision Engine Rationale Log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-3">
        <h2 className="text-base font-bold text-slate-900">Current Tick Scaling Explanations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              <span className="text-xs font-bold text-blue-900">Predictive Action: {latest.predictive_action || 'MAINTAIN'}</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              {latest.predictive_reason || 'Proactively scaled to accommodate anticipated future workload.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-100 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-orange-600"></span>
              <span className="text-xs font-bold text-orange-900">Reactive Action: {latest.reactive_action || 'MAINTAIN'}</span>
            </div>
            <p className="text-xs text-orange-800 leading-relaxed">
              {latest.reactive_reason || 'Reacting to current observed CPU utilization threshold.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
