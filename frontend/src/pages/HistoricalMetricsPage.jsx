import React, { useState, useEffect } from 'react';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { api } from '../services/api';

export default function HistoricalMetricsPage() {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [metricView, setMetricView] = useState('traffic'); // 'traffic', 'resources', 'replicas'
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPage = async (p = page, pp = perPage) => {
    try {
      setLoading(true);
      const res = await api.getHistory(p, pp);
      setData(res.data || []);
      setTotalPages(res.total_pages || 1);
      setTotalRecords(res.total_records || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const res = await api.getHistory(1, 72);
      if (res?.data) {
        setChartData(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPage(page, perPage);
  }, [page, perPage]);

  useEffect(() => {
    loadChartData();
  }, []);

  const filteredData = data.filter((item) => {
    if (!search) return true;
    return (
      item.timestamp?.toLowerCase().includes(search.toLowerCase()) ||
      String(item.request_count).includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 card-shadow">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Historical Telemetry Logs</h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              {totalRecords} Total Hourly Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Raw observational database records containing coupled metrics: workload, server CPU, RAM, latency, and replica allocations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/api/data/export"
            download="workload_telemetry.csv"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Full CSV</span>
          </a>
        </div>
      </div>

      {/* Historical Workload Trends & Coupled Telemetry Graph */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Historical Workload Trends & Coupled Telemetry Window
            </h2>
            <p className="text-xs text-slate-500">
              Continuous 72-hour historical trajectory demonstrating traffic peaks, diurnal cycles, and physical infrastructure response.
            </p>
          </div>

          {/* Metric View Controls */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setMetricView('traffic')}
              className={`px-3 py-1.5 rounded-lg transition ${
                metricView === 'traffic'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Traffic & Latency
            </button>
            <button
              onClick={() => setMetricView('resources')}
              className={`px-3 py-1.5 rounded-lg transition ${
                metricView === 'resources'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CPU & Memory Util
            </button>
            <button
              onClick={() => setMetricView('replicas')}
              className={`px-3 py-1.5 rounded-lg transition ${
                metricView === 'replicas'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Traffic & Replicas
            </button>
          </div>
        </div>

        <div className="w-full" style={{ minHeight: '288px', height: '288px' }}>
          <ResponsiveContainer width="100%" height={288} minHeight={288} minWidth={0}>
            {metricView === 'traffic' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="histReqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => (t ? t.slice(11, 16) || t.slice(5, 10) : '')}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Requests / sec', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Latency (ms)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="request_count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#histReqGrad)"
                  name="Requests (req/s)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="response_time"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                  name="Response Time (ms)"
                />
              </AreaChart>
            ) : metricView === 'resources' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => (t ? t.slice(11, 16) || t.slice(5, 10) : '')}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  domain={[0, 105]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Utilization (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val, name) => [`${val}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '80% Saturation', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
                <Line
                  type="monotone"
                  dataKey="cpu_utilization"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={false}
                  name="CPU Utilization (%)"
                />
                <Line
                  type="monotone"
                  dataKey="memory_utilization"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="Memory Utilization (%)"
                />
              </LineChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => (t ? t.slice(11, 16) || t.slice(5, 10) : '')}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Requests / sec', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 16]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Replicas', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="request_count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name="Requests (req/s)"
                />
                <Line
                  yAxisId="right"
                  type="stepAfter"
                  dataKey="replica_count"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  name="Provisioned Replicas"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 card-shadow flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search timestamp or requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end text-xs text-slate-500">
          <span>Rows per page:</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Paginated Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Requests (req/s)</th>
                <th className="py-3 px-4">CPU (%)</th>
                <th className="py-3 px-4">Memory (%)</th>
                <th className="py-3 px-4">Latency (ms)</th>
                <th className="py-3 px-4">Error Rate (%)</th>
                <th className="py-3 px-4">Active Users</th>
                <th className="py-3 px-4">Throughput (MB/s)</th>
                <th className="py-3 px-4">Replicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                    {row.timestamp}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {row.request_count}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                      row.cpu_utilization > 80 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {row.cpu_utilization}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {row.memory_utilization}%
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={row.response_time > 100 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                      {row.response_time} ms
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {row.error_rate ? `${row.error_rate}%` : '0.00%'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {row.active_users || 0}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {row.network_throughput || 0}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-blue-700">
                    {row.replica_count || 2}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No telemetry records matched the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-3 px-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
