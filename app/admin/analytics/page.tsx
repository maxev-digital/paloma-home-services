'use client';

import { useEffect, useState } from 'react';
import {
  BarChart2, DollarSign, Users, Briefcase, TrendingUp,
  CheckCircle, FileText, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

interface KPI {
  label: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
}

interface WeeklyData {
  week: string;
  total: number;
  jobs: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  pct: number;
  color: string;
}

interface AnalyticsData {
  kpis: {
    revenue: number;
    revenue_change: number;
    jobs_completed: number;
    jobs_change: number;
    avg_job_value: number;
    avg_change: number;
    active_customers: number;
    customers_change: number;
    conversion_rate: number;
    conversion_change: number;
  };
  weekly: WeeklyData[];
  status_breakdown: StatusBreakdown[];
  conversion: {
    leads: number;
    estimates_sent: number;
    approved: number;
    jobs_completed: number;
    paid: number;
  };
}

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pct(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30d' | '90d' | '12m'>('30d');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const k = data?.kpis;

  const kpis: KPI[] = [
    { label: 'Revenue',         value: fmt(k?.revenue ?? 0),           change: k?.revenue_change ?? 0,     icon: DollarSign,  color: 'bg-emerald-600' },
    { label: 'Jobs Completed',  value: k?.jobs_completed ?? 0,         change: k?.jobs_change ?? 0,        icon: Briefcase,   color: 'bg-blue-600' },
    { label: 'Avg Job Value',   value: fmt(k?.avg_job_value ?? 0),     change: k?.avg_change ?? 0,         icon: TrendingUp,  color: 'bg-purple-600' },
    { label: 'Active Customers',value: k?.active_customers ?? 0,       change: k?.customers_change ?? 0,   icon: Users,       color: 'bg-blue-700' },
    { label: 'Conversion Rate', value: `${k?.conversion_rate ?? 0}%`,  change: k?.conversion_change ?? 0,  icon: CheckCircle, color: 'bg-green-600' },
  ];

  const weekly = data?.weekly || [];
  const maxTotal = Math.max(...weekly.map(w => w.total), 1);

  const statusBreakdown = data?.status_breakdown || [];
  const conv = data?.conversion || { leads: 0, estimates_sent: 0, approved: 0, jobs_completed: 0, paid: 0 };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 rounded-xl">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400 text-sm mt-0.5">Performance overview</p>
          </div>
        </div>
        <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {(['30d', '90d', '12m'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === p ? 'bg-blue-700 text-white' : 'text-gray-400 hover:text-white'
              }`}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '12 Months'}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {kpis.map(({ label, value, change, icon: Icon, color }) => (
            <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded ${color}`}><Icon className="w-3.5 h-3.5 text-white" /></div>
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {pct(change)}
                </span>
              </div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Weekly Revenue</h3>
          {weekly.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-12">No data available.</div>
          ) : (
            <div className="space-y-2">
              {weekly.map(w => (
                <div key={w.week} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-400 flex-shrink-0">{w.week}</div>
                  <div className="flex-1 h-6 bg-gray-700 rounded-lg overflow-hidden relative">
                    <div className="h-full bg-blue-600 rounded-lg transition-all"
                      style={{ width: `${(w.total / maxTotal) * 100}%` }} />
                  </div>
                  <div className="w-24 text-right text-xs font-mono text-white">{fmt(w.total)}</div>
                  <div className="w-12 text-right text-xs text-gray-400">{w.jobs} jobs</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Status Breakdown */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Job Status Breakdown</h3>
          {statusBreakdown.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-12">No data available.</div>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(s => (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{s.status}</span>
                    <span className="text-gray-400">{s.count} ({s.pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color || 'bg-blue-500'}`}
                      style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Conversion Funnel</h3>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Leads',          value: conv.leads,           icon: Users,       color: 'bg-blue-600' },
            { label: 'Estimates Sent',  value: conv.estimates_sent,  icon: FileText,    color: 'bg-blue-500' },
            { label: 'Approved',        value: conv.approved,        icon: CheckCircle, color: 'bg-purple-500' },
            { label: 'Completed',       value: conv.jobs_completed,  icon: Briefcase,   color: 'bg-green-500' },
            { label: 'Paid',            value: conv.paid,            icon: DollarSign,  color: 'bg-emerald-500' },
          ].map((step, i, arr) => {
            const rate = i > 0 && arr[i - 1].value > 0
              ? ((step.value / arr[i - 1].value) * 100).toFixed(0)
              : null;
            return (
              <div key={step.label} className="text-center">
                <div className={`mx-auto w-10 h-10 rounded-full ${step.color} flex items-center justify-center mb-2`}>
                  <step.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-lg font-bold text-white">{step.value}</div>
                <div className="text-xs text-gray-400">{step.label}</div>
                {rate && <div className="text-xs text-green-400 mt-1">{rate}%</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
