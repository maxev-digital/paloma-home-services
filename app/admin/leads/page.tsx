'use client';

import { useEffect, useState } from 'react';
import {
  UserPlus, Phone, Mail, MapPin, Eye, DollarSign,
  FileText, Send, TrendingUp, Search,
} from 'lucide-react';

interface Lead {
  id: string;
  address: string;
  total: number;
  cost_total: number;
  margin: number;
  margin_pct: number;
  status: 'DRAFT' | 'SENT';
  created_at: string;
  customer: { id: string; name: string; phone: string; email: string | null };
}

interface LeadsData {
  leads: Lead[];
  summary: {
    total_leads: number;
    draft_count: number;
    sent_count: number;
    pipeline_value: number;
  };
}

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeadsPage() {
  const [data, setData] = useState<LeadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/leads?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const leads = data?.leads || [];
  const summary = data?.summary || { total_leads: 0, draft_count: 0, sent_count: 0, pipeline_value: 0 };
  const draftLeads = leads.filter(l => l.status === 'DRAFT');
  const sentLeads = leads.filter(l => l.status === 'SENT');

  const cards = [
    { label: 'Total Leads',    value: summary.total_leads,          icon: UserPlus,    color: 'bg-blue-600' },
    { label: 'New (Draft)',     value: summary.draft_count,          icon: FileText,    color: 'bg-gray-600' },
    { label: 'Sent / Pending',  value: summary.sent_count,           icon: Send,        color: 'bg-blue-700' },
    { label: 'Pipeline Value',  value: fmt(summary.pipeline_value),  icon: DollarSign,  color: 'bg-emerald-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-700 rounded-xl">
          <UserPlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 text-sm mt-0.5">Unconverted estimates (Draft &amp; Sent)</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{label}</span>
              <div className={`p-1.5 rounded ${color}`}><Icon className="w-3.5 h-3.5 text-white" /></div>
            </div>
            <div className="text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, address..."
          className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
      </div>

      {/* Draft Leads Section */}
      {loading ? (
        <div className="space-y-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          {draftLeads.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Draft Leads ({draftLeads.length})
              </h2>
              <div className="space-y-3">
                {draftLeads.map(lead => (
                  <div key={lead.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="font-semibold text-white">{lead.customer.name}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-700 text-gray-300">DRAFT</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.customer.phone}</span>
                          {lead.customer.email && (
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.customer.email}</span>
                          )}
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.address}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-white font-mono">{fmt(lead.total)}</div>
                          <div className="text-xs text-gray-500">Total value</div>
                        </div>
                        <div className="flex gap-2">
                          <a href={`tel:${lead.customer.phone}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors">
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                          <a href={`/admin/estimates/${lead.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors">
                            <Eye className="w-3.5 h-3.5" /> View
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sent Leads Table */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Sent / Pending ({sentLeads.length})
            </h2>
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Margin</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sent</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sentLeads.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No sent leads.</td></tr>
                  ) : sentLeads.map(lead => (
                    <tr key={lead.id} onClick={() => window.location.href = `/admin/estimates/${lead.id}`}
                      className="border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{lead.customer.name}</div>
                        <div className="text-gray-400 text-xs">{lead.customer.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs max-w-48 truncate">{lead.address}</td>
                      <td className="px-4 py-3 text-right text-white font-mono font-semibold">{fmt(lead.total)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-green-400 font-mono font-semibold">{fmt(lead.margin)}</div>
                        <div className="text-green-600 text-xs">{lead.margin_pct.toFixed(1)}%</div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(lead.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <a href={`tel:${lead.customer.phone}`}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs transition-colors">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                          <a href={`/admin/estimates/${lead.id}`}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors">
                            <Eye className="w-3 h-3" /> View
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
