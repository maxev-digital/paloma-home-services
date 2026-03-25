'use client';

import { useEffect, useState, useRef } from 'react';
import {
  MapPin, Search, Plus, ChevronDown, ChevronRight, Upload, Mail,
  Phone, User, X, Clock, ArrowUpCircle,
} from 'lucide-react';

interface OutreachEntry {
  id: string;
  type: string;
  subject: string | null;
  sent_at: string;
  status: string;
}

interface Prospect {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  outreach_history?: OutreachEntry[];
}

const STATUSES = ['NEW', 'CONTACTED', 'NO_RESPONSE', 'INTERESTED', 'CONVERTED', 'DNC'] as const;
const SOURCES = ['Referral', 'Web Form', 'Door Knock', 'Social Media', 'Other'] as const;

const DFW_CITIES = [
  'Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving', 'Garland', 'Frisco',
  'McKinney', 'Grand Prairie', 'Denton', 'Mesquite', 'Carrollton', 'Lewisville',
  'Allen', 'Flower Mound', 'Mansfield', 'Rowlett', 'Cedar Hill', 'Wylie',
  'Burleson', 'Keller', 'Southlake', 'Grapevine', 'Colleyville', 'Coppell',
  'Prosper', 'Little Elm', 'Celina', 'Anna', 'Forney', 'Rockwall', 'Midlothian',
  'Waxahachie', 'Weatherford', 'Azle', 'Saginaw', 'Hurst', 'Euless', 'Bedford',
  'North Richland Hills', 'Richland Hills', 'Benbrook', 'Crowley', 'The Colony',
  'Murphy', 'Sachse', 'Lancaster', 'DeSoto', 'Duncanville', 'Red Oak',
];

const STATUS_COLORS: Record<string, string> = {
  NEW:         'bg-blue-500/20 text-blue-400',
  CONTACTED:   'bg-yellow-500/20 text-yellow-400',
  NO_RESPONSE: 'bg-gray-500/20 text-gray-400',
  INTERESTED:  'bg-green-500/20 text-green-400',
  CONVERTED:   'bg-emerald-500/20 text-emerald-300',
  DNC:         'bg-red-500/20 text-red-400',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const emptyForm = { name: '', address: '', city: '', zip: '', phone: '', email: '', source: '', notes: '' };

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (cityFilter) params.set('city', cityFilter);
    const res = await fetch(`/api/admin/prospects?${params}`);
    const data = await res.json();
    setProspects(data.prospects || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter, cityFilter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    await fetch('/api/admin/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowAdd(false);
    setForm(emptyForm);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const sendEmail = async (id: string) => {
    await fetch(`/api/admin/prospects/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_email' }),
    });
    load();
  };

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    const res = await fetch(`/api/admin/prospects/${id}`);
    const data = await res.json();
    setProspects(prev => prev.map(p => p.id === id ? { ...p, outreach_history: data.outreach_history || [] } : p));
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    await fetch('/api/admin/prospects/import', { method: 'POST', body: formData });
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 rounded-xl">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Prospects</h1>
            <p className="text-gray-400 text-sm mt-0.5">{total} total prospects</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            <Upload className="w-4 h-4" /> {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Prospect
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">New Prospect</h3>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Full Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Address</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">City</label>
              <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">Select city...</option>
                {DFW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Zip</label>
              <input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Source</label>
              <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">Select source...</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Prospect'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, address, phone, email..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="">All Cities</option>
          {DFW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="w-8 px-4 py-3"></th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">City</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Added</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : prospects.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">No prospects found.</td>
              </tr>
            ) : prospects.map(p => (
              <>
                <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleExpand(p.id)} className="text-gray-400 hover:text-white">
                      {expanded === p.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3">
                    {p.phone && (
                      <div className="flex items-center gap-1.5 text-gray-300 text-xs mb-1">
                        <Phone className="w-3 h-3 text-gray-500" />{p.phone}
                      </div>
                    )}
                    {p.email && (
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <Mail className="w-3 h-3 text-gray-500" />{p.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.city || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.source || '—'}</td>
                  <td className="px-4 py-3">
                    <select value={p.status} onChange={e => updateStatus(p.id, e.target.value)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[p.status] || 'bg-gray-600 text-gray-300'}`}>
                      {STATUSES.map(s => <option key={s} value={s} className="bg-gray-800 text-white">{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => sendEmail(p.id)} title="Send email"
                      className="p-1.5 bg-blue-700/30 hover:bg-blue-700/60 text-blue-400 rounded-lg transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
                {expanded === p.id && (
                  <tr key={`${p.id}-detail`} className="border-b border-gray-700/50 bg-gray-900/50">
                    <td colSpan={8} className="px-8 py-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="text-gray-300"><span className="text-gray-500">Address:</span> {p.address || '—'}</div>
                            <div className="text-gray-300"><span className="text-gray-500">Zip:</span> {p.zip || '—'}</div>
                            <div className="text-gray-300"><span className="text-gray-500">Notes:</span> {p.notes || '—'}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Outreach History</h4>
                          {!p.outreach_history || p.outreach_history.length === 0 ? (
                            <p className="text-gray-500 text-sm">No outreach yet.</p>
                          ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {p.outreach_history.map(o => (
                                <div key={o.id} className="flex items-center gap-3 text-xs">
                                  <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                  <span className="text-gray-400">{fmtDate(o.sent_at)}</span>
                                  <span className="text-gray-300">{o.subject || o.type}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    o.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                                    o.status === 'opened' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-gray-600/30 text-gray-400'
                                  }`}>{o.status}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
