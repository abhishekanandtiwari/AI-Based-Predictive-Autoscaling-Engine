import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingDown,
  Download,
  Calendar,
  Layers,
  Percent,
  Sliders,
  CheckCircle2,
  HelpCircle,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import KpiCard from '../components/KpiCard';
import { api } from '../services/api';

export default function CostOptimizationPage() {
  const [params, setParams] = useState({
    cost_per_replica_hour: 0.05,
    duration_hours: 72,
    predictive_replica_hours: 276.0,
    reactive_replica_hours: 348.0,
    peak_replicas: 10,
  });

  const [projections, setProjections] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateCost = async () => {
    try {
      setLoading(true);
      const res = await api.calculateCost(params);
      setProjections(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateCost();
  }, [params.cost_per_replica_hour, params.duration_hours]);

  const monthly = projections?.monthly_30d || {};
  const chartData = projections?.cost_breakdown_chart || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 card-shadow">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Infrastructure Cost Optimization</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Cloud Financial FinOps
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quantifying infrastructure dollar savings: AI Predictive Autoscaling vs. Reactive HPA vs. Static Peak Allocation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={`/api/cost/export?predictive_replica_hours=${params.predictive_replica_hours}&reactive_replica_hours=${params.reactive_replica_hours}&peak_replicas=${params.peak_replicas}&duration_hours=${params.duration_hours}&cost_per_replica_hour=${params.cost_per_replica_hour}`}
            download="cost_optimization_report.csv"
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Cost CSV</span>
          </a>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Predictive Monthly Cost"
          value={`$${monthly.predictive || 0}`}
          unit="/ month"
          subtitle="Proactive capacity matching"
          icon={DollarSign}
          color="teal"
          badge={{ text: "Optimal", color: "bg-teal-100 text-teal-800" }}
        />
        <KpiCard
          title="Reactive Monthly Cost"
          value={`$${monthly.reactive || 0}`}
          unit="/ month"
          subtitle="HPA threshold baseline"
          icon={DollarSign}
          color="amber"
        />
        <KpiCard
          title="Static Peak Cost"
          value={`$${monthly.static_peak || 0}`}
          unit="/ month"
          subtitle="24/7 Over-provisioned"
          icon={DollarSign}
          color="rose"
        />
        <KpiCard
          title="Net Monthly Savings"
          value={`$${monthly.savings_vs_reactive_usd || 0}`}
          unit={`(${monthly.savings_vs_reactive_pct || 0}%)`}
          subtitle="Direct cloud budget reduction"
          icon={TrendingDown}
          color="emerald"
          badge={{ text: "Direct ROI", color: "bg-emerald-100 text-emerald-800" }}
        />
      </div>

      {/* Tunable FinOps Parameters Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <div className="flex items-center space-x-2">
          <Sliders className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Configurable Cloud Cost Assumptions</h2>
        </div>
        <p className="text-xs text-slate-500">
          Modify the unit instance cost and workload duration to observe impact on hourly, daily, and monthly cloud expenditures.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Cost Per Replica Hour ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="2.0"
              value={params.cost_per_replica_hour}
              onChange={(e) => setParams({ ...params, cost_per_replica_hour: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400">e.g. AWS t4g.small / GCP e2-small</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Evaluation Duration (Hours)
            </label>
            <input
              type="number"
              min="12"
              max="720"
              value={params.duration_hours}
              onChange={(e) => setParams({ ...params, duration_hours: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400">Default: 72 hours (3 days)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Peak Replica Ceiling
            </label>
            <input
              type="number"
              min="2"
              max="50"
              value={params.peak_replicas}
              onChange={(e) => setParams({ ...params, peak_replicas: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400">For static over-provision comparison</span>
          </div>
        </div>
      </div>

      {/* Monthly Expenditure Comparison Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">30-Day Monthly Cost Comparison Across Strategies</h2>
          <p className="text-xs text-slate-500">
            Comparing monthly cloud invoice between Predictive Autoscaling, Reactive Autoscaling, and Static Peak Provisioning.
          </p>
        </div>

        <div className="w-full" style={{ minHeight: '260px', height: '260px' }}>
          <ResponsiveContainer width="100%" height={260} minHeight={260} minWidth={0}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="strategy" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Cost ($ / Month)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} formatter={(v) => [`$${v}`, 'Monthly Cost']} />
              <Bar dataKey="monthly_cost" fill="#2563eb" radius={[8, 8, 0, 0]} name="Projected 30-Day Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Cost Projections Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-3">
        <h2 className="text-base font-bold text-slate-900">Granular Financial Projection Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Cost Horizon</th>
                <th className="py-3 px-4">Predictive (AI)</th>
                <th className="py-3 px-4">Reactive (HPA)</th>
                <th className="py-3 px-4">Static Peak</th>
                <th className="py-3 px-4">Savings vs Reactive ($)</th>
                <th className="py-3 px-4">Savings vs Static (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">Hourly Rate</td>
                <td className="py-3 px-4 font-bold text-teal-600">${projections?.hourly?.predictive}</td>
                <td className="py-3 px-4 text-slate-700">${projections?.hourly?.reactive}</td>
                <td className="py-3 px-4 text-slate-700">${projections?.hourly?.static_peak}</td>
                <td className="py-3 px-4 font-bold text-emerald-600">
                  ${Math.round(((projections?.hourly?.reactive || 0) - (projections?.hourly?.predictive || 0)) * 1000) / 1000} / hr
                </td>
                <td className="py-3 px-4 font-bold text-emerald-600">{monthly.savings_vs_static_pct}%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">Daily Projection (24h)</td>
                <td className="py-3 px-4 font-bold text-teal-600">${projections?.daily?.predictive}</td>
                <td className="py-3 px-4 text-slate-700">${projections?.daily?.reactive}</td>
                <td className="py-3 px-4 text-slate-700">${projections?.daily?.static_peak}</td>
                <td className="py-3 px-4 font-bold text-emerald-600">
                  ${Math.round(((projections?.daily?.reactive || 0) - (projections?.daily?.predictive || 0)) * 100) / 100} / day
                </td>
                <td className="py-3 px-4 font-bold text-emerald-600">{monthly.savings_vs_static_pct}%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">Monthly Projection (720h)</td>
                <td className="py-3 px-4 font-bold text-teal-600">${monthly.predictive}</td>
                <td className="py-3 px-4 text-slate-700">${monthly.reactive}</td>
                <td className="py-3 px-4 text-slate-700">${monthly.static_peak}</td>
                <td className="py-3 px-4 font-bold text-emerald-600">${monthly.savings_vs_reactive_usd} / mo</td>
                <td className="py-3 px-4 font-bold text-emerald-600">{monthly.savings_vs_static_pct}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
