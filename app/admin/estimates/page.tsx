'use client';

import { useEffect, useState } from 'react';
import { FileText, Search, Plus, TrendingUp, DollarSign, CheckCircle, Trash2 } from 'lucide-react';

type EstimateStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'DECLINED' | 'INVOICED' | 'PAID';

interface Estimate {
  id: string;
  address: string;
  total: number;
  cost_total: number;
  margin: number;
  margin_pct: number;
  status: EstimateStatus;
  created_at: string;
  customer: { id: string; name: string; phone: string; email: string | null };
}

const STATUS_STYLES: Record<EstimateStatus, string> = {
  DRAFT:    'bg-gray-700 text-gray-300',
  SENT:     'bg-blue-900 text-blue-300',
  APPROVED: 'bg-green-900 text-green-300',
  DECLINED: 'bg-red-900 text-red-300',
  INVOICED: 'bg-yellow-900 text-yellow-300',
  PAID:     'bg-emerald-900 text-emerald-300',
};

const ALL_STATUSES: EstimateStatus[] = ['DRAFT', 'SENT', 'APPROVED', 'DECLINED', 'INVOICED', 'PAID'];

function fmt(n: number) { return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

export default function EstimatesPage() {
  const [estimates, setEstimates]   = useState<Estimate[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    const res = await fetch(`/api/admin/estimates?${params}`);
    const data = await res.json();
    setEstimates(data.estimates || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  function toggleSelect(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleAll() {
    setSelected(estimates.length > 0 && selected.size === estimates.length ? new Set() : new Set(estimates.map(e => e.id)));
  }

  async function bulkDelete() {
    if (!confirm(`Permanently delete ${selected.size} estimate(s)?`)) return;
    setBulkDeleting(true);
    await Promise.all([...selected].map(id => fetch(`/api/admin/estimates/${id}`, { method: 'DELETE' })));
    setEstimates(prev => prev.filter(e => !selected.has(e.id)));
    setTotal(prev => prev - selected.size);
    setSelected(new Set());
    setBulkDeleting(false);
  }

  async function deleteEstimate(ev: React.MouseEvent, est: Estimate) {
    ev.stopPropagation();
    if (!confirm(`Delete estimate for ${est.customer.name}?`)) return;
    setDeletingId(est.id);
    const res = await fetch(`/api/admin/estimates/${est.id}`, { method: 'DELETE' });
    if (res.ok) { setEstimates(prev => prev.filter(x => x.id !== est.id)); setTotal(prev => prev - 1); }
    setDeletingId(null);
  }

  const grandTotal = estimates.reduce((s, e) => s + e.total, 0);
  const grandCost  = estimates.reduce((s, e) => s + e.cost_total, 0);
  const avgMargin  = grandTotal > 0 ? (((grandTotal - grandCost) / grandTotal) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Estimates</h1>
          <p className="text-gray-400 text-sm mt-1">{total} total estimates</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Estimates', value: total,                icon: FileText,    color: 'bg-blue-600' },
          { label: 'Total Value',     value: fmt(grandTotal),      icon: DollarSign,  color: 'bg-purple-600' },
          { label: 'Total Cost',      value: fmt(grandCost),       icon: TrendingUp,  color: 'bg-blue-700' },
          { label: 'Avg Margin',      value: `${avgMargin.toFixed(1)}%`, icon: CheckCircle, color: 'bg-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{label}</span>
              <div className={`p-1.5 rounded ${color}`}><Icon className="w-3.5 h-3.5 text-white" /></div>
            </div>
            <div className="text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search address, customer..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', ...ALL_STATUSES].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === s ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-4 mb-3 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl">
          <span className="text-sm text-gray-300 font-medium">{selected.size} selected</span>
          <button onClick={bulkDelete} disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" />{bulkDeleting ? 'Deleting…' : `Delete ${selected.size}`}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-300">Clear</button>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="pl-4 pr-2 py-3 w-8">
                <input type="checkbox" checked={estimates.length > 0 && selected.size === estimates.length}
                  ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < estimates.length; }}
                  onChange={toggleAll} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 cursor-pointer" />
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Total</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Cost</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Margin</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {[...Array(9)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : estimates.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">No estimates found.</td></tr>
            ) : estimates.map((est) => (
              <tr key={est.id} onClick={() => window.location.href = `/admin/estimates/${est.id}`}
                className={`border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors ${selected.has(est.id) ? 'bg-gray-700/40' : ''}`}>
                <td className="pl-4 pr-2 py-3" onClick={ev => ev.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(est.id)} onChange={() => toggleSelect(est.id)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 cursor-pointer" />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{est.customer.name}</div>
                  <div className="text-gray-400 text-xs">{est.customer.phone}</div>
                </td>
                <td className="px-4 py-3 text-gray-300 max-w-48 truncate">{est.address}</td>
                <td className="px-4 py-3 text-right text-white font-mono font-semibold">{fmt(est.total)}</td>
                <td className="px-4 py-3 text-right text-gray-300 font-mono">{fmt(est.cost_total)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="text-green-400 font-mono font-semibold">{fmt(est.margin)}</div>
                  <div className="text-green-600 text-xs">{est.margin_pct.toFixed(1)}%</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[est.status]}`}>{est.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(est.created_at)}</td>
                <td className="px-2 py-3">
                  <button onClick={ev => deleteEstimate(ev, est)} disabled={deletingId === est.id}
                    className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-950 transition-colors disabled:opacity-40">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
