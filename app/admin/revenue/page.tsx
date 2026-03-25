'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign, TrendingUp, Briefcase, CheckCircle,
  ArrowUpRight, CreditCard,
} from 'lucide-react';

interface RevenueData {
  kpis: {
    total_revenue: number;
    total_cost: number;
    gross_margin: number;
    margin_pct: number;
    collected: number;
    outstanding: number;
    avg_job_value: number;
    jobs_count: number;
  };
  by_status: {
    status: string;
    count: number;
    total: number;
    cost_total: number;
    margin: number;
  }[];
  recent_paid: {
    id: string;
    address: string;
    total: number;
    cost_total: number;
    margin: number;
    paid_date: string;
    customer: { name: string };
  }[];
}

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtShort(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'mtd' | 'qtd' | 'ytd' | 'all'>('ytd');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/revenue?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const k = data?.kpis;
  const byStatus = data?.by_status || [];
  const recentPaid = data?.recent_paid || [];

  const cards = [
    { label: 'Total Revenue',   value: fmt(k?.total_revenue ?? 0),  icon: DollarSign,  color: 'bg-blue-600' },
    { label: 'Total Cost',      value: fmt(k?.total_cost ?? 0),     icon: TrendingUp,  color: 'bg-gray-600' },
    { label: 'Gross Margin',    value: fmt(k?.gross_margin ?? 0),   sub: `${(k?.margin_pct ?? 0).toFixed(1)}%`, icon: ArrowUpRight, color: 'bg-emerald-600' },
    { label: 'Collected',       value: fmt(k?.collected ?? 0),      icon: CheckCircle, color: 'bg-green-600' },
    { label: 'Outstanding',     value: fmt(k?.outstanding ?? 0),    icon: CreditCard,  color: 'bg-yellow-600' },
    { label: 'Avg Job Value',   value: fmt(k?.avg_job_value ?? 0),  icon: Briefcase,   color: 'bg-blue-700' },
  ];

  const maxRevenue = Math.max(...byStatus.map(s => s.total), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 rounded-xl">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Revenue</h1>
            <p className="text-gray-400 text-sm mt-0.5">{k?.jobs_count ?? 0} jobs in period</p>
          </div>
        </div>
        <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {(['mtd', 'qtd', 'ytd', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${
                period === p ? 'bg-blue-700 text-white' : 'text-gray-400 hover:text-white'
              }`}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map(({ label, value, icon: Icon, color, ...rest }) => (
            <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{label}</span>
                <div className={`p-1.5 rounded ${color}`}><Icon className="w-3.5 h-3.5 text-white" /></div>
              </div>
              <div className="text-xl font-bold text-white">{value}</div>
              {'sub' in rest && rest.sub && <div className="text-xs text-green-400 mt-0.5">{rest.sub}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue vs Cost by Status */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Revenue vs Cost by Status</h3>
          {byStatus.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-12">No data available.</div>
          ) : (
            <div className="space-y-3">
              {byStatus.map(s => {
                const costPct = s.total > 0 ? (s.cost_total / s.total) * 100 : 0;
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 font-medium">{s.status}</span>
                      <span className="text-gray-400">{s.count} jobs &middot; {fmtShort(s.total)}</span>
                    </div>
                    <div className="h-5 bg-gray-700 rounded-lg overflow-hidden relative flex">
                      <div className="h-full bg-blue-600 transition-all" style={{ width: `${100}%` }} />
                      <div className="h-full bg-orange-500/60 absolute top-0 left-0 transition-all"
                        style={{ width: `${costPct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs mt-0.5">
                      <span className="text-blue-400">Rev: {fmtShort(s.total)}</span>
                      <span className="text-orange-400">Cost: {fmtShort(s.cost_total)}</span>
                      <span className="text-green-400">Margin: {fmtShort(s.margin)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex gap-4 mt-4 pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-blue-600" />
              <span className="text-gray-400">Revenue</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-orange-500/60" />
              <span className="text-gray-400">Cost</span>
            </div>
          </div>
        </div>

        {/* Revenue vs Cost Summary */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Margin Overview</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-300">Total Revenue</span>
                <span className="text-sm font-bold text-white">{fmt(k?.total_revenue ?? 0)}</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-300">Total Cost</span>
                <span className="text-sm font-bold text-white">{fmt(k?.total_cost ?? 0)}</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${k && k.total_revenue > 0 ? (k.total_cost / k.total_revenue) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-300">Gross Margin</span>
                <span className="text-sm font-bold text-emerald-400">{fmt(k?.gross_margin ?? 0)}</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${k?.margin_pct ?? 0}%` }} />
              </div>
              <div className="text-right text-xs text-emerald-400 mt-0.5">{(k?.margin_pct ?? 0).toFixed(1)}% margin</div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-700">
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-400">{fmt(k?.collected ?? 0)}</div>
                <div className="text-xs text-gray-400">Collected</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-yellow-400">{fmt(k?.outstanding ?? 0)}</div>
                <div className="text-xs text-gray-400">Outstanding</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Paid Jobs */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h3 className="text-sm font-bold text-white">Recent Paid Jobs</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Revenue</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Cost</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Margin</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : recentPaid.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No paid jobs yet.</td></tr>
            ) : recentPaid.map(job => (
              <tr key={job.id} onClick={() => window.location.href = `/admin/jobs/${job.id}`}
                className="border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-white">{job.customer.name}</td>
                <td className="px-4 py-3 text-gray-300 text-xs max-w-48 truncate">{job.address}</td>
                <td className="px-4 py-3 text-right text-white font-mono font-semibold">{fmt(job.total)}</td>
                <td className="px-4 py-3 text-right text-gray-300 font-mono">{fmt(job.cost_total)}</td>
                <td className="px-4 py-3 text-right text-green-400 font-mono font-semibold">{fmt(job.margin)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(job.paid_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
