'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Search, Plus, DollarSign } from 'lucide-react';

interface ManualInvoice {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_email: string | null;
  amount: number;
  status: string;
  created_at: string;
  due_date: string | null;
  paid_at: string | null;
}

const STATUSES = ['UNPAID', 'PARTIAL', 'PAID', 'VOID'] as const;

const STATUS_COLORS: Record<string, string> = {
  UNPAID:  'bg-yellow-500/20 text-yellow-400',
  PARTIAL: 'bg-blue-500/20 text-blue-400',
  PAID:    'bg-green-500/20 text-green-400',
  VOID:    'bg-gray-500/20 text-gray-400',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function ManualInvoicesPage() {
  const [invoices, setInvoices] = useState<ManualInvoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/admin/manual-invoices?${params}`);
    const data = await res.json();
    setInvoices(data.invoices || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 rounded-xl">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manual Invoices</h1>
            <p className="text-gray-400 text-sm mt-0.5">{total} total invoices</p>
          </div>
        </div>
        <a href="/admin/manual-invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Invoice
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by invoice number, customer name..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoice #</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Amount</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">No invoices found.</td>
              </tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} onClick={() => window.location.href = `/admin/manual-invoices/${inv.id}`}
                className="border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-mono text-blue-400 text-xs font-semibold">{inv.invoice_no}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{inv.customer_name}</div>
                  {inv.customer_email && <div className="text-gray-500 text-xs">{inv.customer_email}</div>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-semibold text-white">{fmtMoney(inv.amount)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[inv.status] || 'bg-gray-600 text-gray-300'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(inv.created_at)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{inv.due_date ? fmtDate(inv.due_date) : '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{inv.paid_at ? fmtDate(inv.paid_at) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
