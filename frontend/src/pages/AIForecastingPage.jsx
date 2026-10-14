import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  Cpu,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import KpiCard from '../components/KpiCard';
import { api } from '../services/api';

const HORIZONS = [
  { label: 'Next 1 Hour', value: 1 },
  { label: 'Next 6 Hours', value: 6 },
  { label: 'Next 12 Hours', value: 12 },
  { label: 'Next 24 Hours', value: 24 },
];

export default function AIForecastingPage() {
  const [horizon, setHorizon] = useState(24);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainParams, setTrainParams] = useState({ n_estimators: 100, max_depth: 15 });
  const [trainMsg, setTrainMsg] = useState(null);

  const fetchForecast = async (h = horizon) => {
    try {
      setLoading(true);
      const res = await api.getForecast(h);
      setForecastData(res);
    } catch (err) {
      console.error('Failed to load forecast', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(horizon);
  }, [horizon]);

  const handleRetrain = async () => {
    try {
      setTraining(true);
      setTrainMsg(null);
      const res = await api.trainModel(trainParams);
      setTrainMsg({
        type: 'success',
        text: `Model retrained successfully. MAE: ${res.results.primary_model.mae} req/s, MAPE: ${res.results.primary_model.mape}%.`
      });
      await fetchForecast(horizon);
    } catch (e) {
      setTrainMsg({ type: 'error', text: e.message });
    } finally {
      setTraining(false);
    }
  };

  const chartData = forecastData?.forecasts || [];
  const peakRequests = forecastData?.peak_demand_requests || 0;
  const peakHour = forecastData?.peak_demand_hour || 'T+0h';
  const avgForecast = forecastData?.average_forecasted_requests || 0;
  const overloadWarnings = forecastData?.overload_warnings_count || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 card-shadow">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">AI Workload Demand Forecasting</h1>
            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-200">
              Supervised Regression
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Autoregressive multi-step forecasting with Random Forest Regressor and empirical prediction interval error bounds.
          </p>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {HORIZONS.map((h) => (
            <button
              key={h.value}
              onClick={() => setHorizon(h.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                horizon === h.value
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {trainMsg && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 text-xs font-medium ${trainMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <CheckCircle className="h-4 w-4" />
          <span>{trainMsg.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Predicted Peak Demand"
          value={peakRequests}
          unit="req/sec"
          subtitle={`Anticipated at ${peakHour}`}
          icon={TrendingUp}
          color="indigo"
          badge={{ text: "Peak Forecast", color: "bg-indigo-100 text-indigo-800" }}
        />
        <KpiCard
          title="Avg Projected Load"
          value={avgForecast}
          unit="req/sec"
          subtitle={`Across next ${horizon} hours`}
          icon={Clock}
          color="blue"
        />
        <KpiCard
          title="Recommended Peak Replicas"
          value={Math.max(2, Math.ceil(peakRequests / (250 * 0.70)))}
          unit="Replicas"
          subtitle="Proactive capacity readiness"
          icon={Cpu}
          color="teal"
        />
        <KpiCard
          title="Overload Risk Status"
          value={overloadWarnings > 0 ? `${overloadWarnings} Risks` : 'Nominal'}
          unit=""
          subtitle="CPU saturation &gt; 80%"
          icon={AlertTriangle}
          color={overloadWarnings > 0 ? 'rose' : 'emerald'}
          warning={overloadWarnings > 0}
          badge={{
            text: overloadWarnings > 0 ? 'Alert Active' : 'Stable',
            color: overloadWarnings > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
          }}
        />
      </div>

      {/* Main Forecast Chart with Confidence Band */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Future Workload Trajectory & 90% Empirical Prediction Interval
            </h2>
            <p className="text-xs text-slate-500">
              Shaded interval represents empirical error percentiles calculated from held-out validation residuals
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <span>Autoregressive Horizon: {horizon}h</span>
          </div>
        </div>

        <div className="w-full" style={{ minHeight: '320px', height: '320px' }}>
          <ResponsiveContainer width="100%" height={320} minHeight={320} minWidth={0}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="step" tickFormatter={(s) => `T+${s}h`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'Requests / sec', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(val, name) => [`${val} req/s`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="upper_bound" stroke="#93c5fd" fill="#dbeafe" fillOpacity={0.4} strokeDasharray="3 3" name="95th Percentile Bound" />
              <Area type="monotone" dataKey="lower_bound" stroke="#93c5fd" fill="#ffffff" fillOpacity={1} strokeDasharray="3 3" name="5th Percentile Bound" />
              <Line type="monotone" dataKey="predicted_requests" stroke="#2563eb" strokeWidth={3} dot={{ r: 3, fill: '#2563eb' }} name="Predicted Requests (req/s)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Proactive Autoscaling Capacity & Resource Utilization Plan */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Proactive Replica Provisioning Plan & Estimated CPU Load Forecast
            </h2>
            <p className="text-xs text-slate-500">
              Translating future workload predictions into ahead-of-time instance allocations and projected CPU utilization.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Safe Capacity: 250 req/rep
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Target CPU: 70%
            </span>
          </div>
        </div>

        <div className="w-full" style={{ minHeight: '260px', height: '260px' }}>
          <ResponsiveContainer width="100%" height={260} minHeight={260} minWidth={0}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="step" tickFormatter={(s) => `T+${s}h`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'Replicas', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'Est. CPU %', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(val, name) => [name.includes('CPU') ? `${val}%` : `${val} instances`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <ReferenceLine yAxisId="right" y={70} stroke="#10b981" strokeDasharray="3 3" label={{ value: '70% Target', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine yAxisId="right" y={80} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '80% Saturation', fill: '#f43f5e', fontSize: 10, position: 'insideBottomRight' }} />
              <Bar yAxisId="left" dataKey="recommended_replicas" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Recommended Replicas" />
              <Line yAxisId="right" type="monotone" dataKey="estimated_cpu_percent" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} name="Estimated CPU Utilization (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Retraining Hyperparameter Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <div className="flex items-center space-x-2">
          <Sliders className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Model Fine-Tuning & Retraining Pipeline</h2>
        </div>
        <p className="text-xs text-slate-500">
          Enables faculty evaluators to re-fit the Random Forest Regressor and examine how tree depth and estimator counts affect generalization error.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Random Forest Estimators</label>
            <input
              type="number"
              min="20"
              max="300"
              step="10"
              value={trainParams.n_estimators}
              onChange={(e) => setTrainParams({ ...trainParams, n_estimators: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Maximum Tree Depth</label>
            <input
              type="number"
              min="4"
              max="30"
              value={trainParams.max_depth}
              onChange={(e) => setTrainParams({ ...trainParams, max_depth: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRetrain}
              disabled={training}
              className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${training ? 'animate-spin' : ''}`} />
              <span>{training ? 'Training Ensemble...' : 'Retrain Random Forest'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
