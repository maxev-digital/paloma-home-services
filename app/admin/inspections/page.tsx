'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Search, Plus, User, MapPin, Calendar } from 'lucide-react';

interface Inspection {
  id: string;
  address: string;
  customer_name: string | null;
  customer_phone: string | null;
  inspector: string | null;
  scheduled_date: string | null;
  status: string;
  created_at: string;
  notes: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:    'bg-yellow-500/20 text-yellow-400',
  COMPLETE: 'bg-green-500/20 text-green-400',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/admin/inspections?${params}`);
    const data = await res.json();
    setInspections(data.inspections || []);
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
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Inspections</h1>
            <p className="text-gray-400 text-sm mt-0.5">{total} total inspections</p>
          </div>
        </div>
        <a href="/admin/inspections/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Inspection
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by address, customer, inspector..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="COMPLETE">Complete</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Inspector</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Scheduled Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : inspections.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No inspections found.</td>
              </tr>
            ) : inspections.map(insp => (
              <tr key={insp.id} onClick={() => window.location.href = `/admin/inspections/${insp.id}`}
                className="border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-white">{insp.address}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-300">{insp.customer_name || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{insp.inspector || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-300 text-xs">{insp.scheduled_date ? fmtDate(insp.scheduled_date) : '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[insp.status] || 'bg-gray-600 text-gray-300'}`}>
                    {insp.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(insp.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
