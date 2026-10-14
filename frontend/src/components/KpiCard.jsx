import React from 'react';

export default function KpiCard({ title, value, unit, subtitle, icon: Icon, color = 'blue', badge, warning }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-100',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    }
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200 card-shadow card-shadow-hover relative overflow-hidden ${warning ? 'ring-2 ring-rose-400' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${c.bg} ${c.text} ${c.border} border`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline space-x-1.5">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
        {unit && <span className="text-xs sm:text-sm font-medium text-slate-500">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500">{subtitle}</span>}
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.color || 'bg-slate-100 text-slate-700'}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
