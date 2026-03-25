'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp, Search, DollarSign, ArrowUpDown, ChevronUp, ChevronDown,
  Download, Filter,
} from 'lucide-react';

interface JobPL {
  id: string;
  address: string;
  service_type: string | null;
  status: string;
  total: number;
  cost_total: number;
  gross_profit: number;
  margin_pct: number;
  collected: number;
  customer: { name: string };
  completed_date: string | null;
}

interface AccountingData {
  jobs: JobPL[];
  summary: {
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    avg_margin: number;
    total_collected: number;
  };
}

type SortField = 'customer' | 'total' | 'cost_total' | 'gross_profit' | 'margin_pct' | 'collected' | 'service_type';
type SortDir = 'asc' | 'desc';

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AccountingPage() {
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    fetch(`/api/admin/accounting?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, statusFilter]);

  const jobs = data?.jobs || [];
  const summary = data?.summary;

  const sorted = [...jobs].sort((a, b) => {
    let av: string | number, bv: string | number;
    switch (sortField) {
      case 'customer': av = a.customer.name; bv = b.customer.name; break;
      case 'service_type': av = a.service_type || ''; bv = b.service_type || ''; break;
      default: av = a[sortField]; bv = b[sortField]; break;
    }
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-600" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />;
  }

  const statuses = ['ALL', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETE', 'INVOICED', 'PAID'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 rounded-xl">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Job P&amp;L</h1>
            <p className="text-gray-400 text-sm mt-0.5">Profitability by job</p>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Revenue',  value: fmt(summary.total_revenue),  color: 'bg-blue-600' },
            { label: 'Total Cost',     value: fmt(summary.total_cost),     color: 'bg-gray-600' },
            { label: 'Gross Profit',   value: fmt(summary.total_profit),   color: 'bg-emerald-600' },
            { label: 'Avg Margin',     value: `${summary.avg_margin.toFixed(1)}%`, color: 'bg-green-600' },
            { label: 'Collected',      value: fmt(summary.total_collected), color: 'bg-blue-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-lg font-bold text-white">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, address..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === s ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
              }`}>{s === 'ALL' ? 'All' : s.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => toggleSort('customer')}>
                <span className="flex items-center gap-1">Customer <SortIcon field="customer" /></span>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => toggleSort('service_type')}>
                <span className="flex items-center gap-1">Service <SortIcon field="service_type" /></span>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none"
                onClick={() => toggleSort('total')}>
                <span className="flex items-center justify-end gap-1">Revenue <SortIcon field="total" /></span>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none"
                onClick={() => toggleSort('cost_total')}>
                <span className="flex items-center justify-end gap-1">Cost <SortIcon field="cost_total" /></span>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none"
                onClick={() => toggleSort('gross_profit')}>
                <span className="flex items-center justify-end gap-1">Gross Profit <SortIcon field="gross_profit" /></span>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none"
                onClick={() => toggleSort('margin_pct')}>
                <span className="flex items-center justify-end gap-1">Margin <SortIcon field="margin_pct" /></span>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none"
                onClick={() => toggleSort('collected')}>
                <span className="flex items-center justify-end gap-1">Collected <SortIcon field="collected" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {[...Array(9)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">No jobs found.</td></tr>
            ) : sorted.map(job => (
              <tr key={job.id} onClick={() => window.location.href = `/admin/jobs/${job.id}`}
                className="border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-white">{job.customer.name}</td>
                <td className="px-4 py-3 text-gray-300 text-xs max-w-40 truncate">{job.address}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{job.service_type || '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-700 text-gray-300">{job.status}</span>
                </td>
                <td className="px-4 py-3 text-right text-white font-mono font-semibold">{fmt(job.total)}</td>
                <td className="px-4 py-3 text-right text-gray-300 font-mono">{fmt(job.cost_total)}</td>
                <td className="px-4 py-3 text-right text-green-400 font-mono font-semibold">{fmt(job.gross_profit)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-mono font-semibold ${job.margin_pct >= 30 ? 'text-green-400' : job.margin_pct >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {job.margin_pct.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-300 font-mono">{fmt(job.collected)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
