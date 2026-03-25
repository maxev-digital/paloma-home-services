'use client';

import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import {
  Search, ChevronDown, ChevronUp, ExternalLink, Star,
  Mail, Phone, Building2, MapPin, Filter, X, Check,
  ChevronLeft, ChevronRight, Megaphone, PhoneOff,
  Send, FileText, Plus, Trash2, Edit3, Eye, Loader2,
  CheckCircle2, XCircle, AlertTriangle, Copy,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Business {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  review_count: number;
  source: string;
  status: string;
  last_contacted_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Template {
  id: string;
  slug: string;
  category: string;
  variant: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  _count?: { outreach_history: number };
}

interface SendResult {
  id: string;
  name: string;
  email: string | null;
  status: string;
  error?: string;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const STATUSES = ['NEW', 'CONTACTED', 'NO_RESPONSE', 'INTERESTED', 'CONVERTED', 'DNC'] as const;
const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-gray-600 text-gray-200',
  CONTACTED: 'bg-blue-900 text-blue-300',
  NO_RESPONSE: 'bg-yellow-900 text-yellow-300',
  INTERESTED: 'bg-green-900 text-green-300',
  CONVERTED: 'bg-emerald-900 text-emerald-300',
  DNC: 'bg-red-900 text-red-300',
};

const DFW_CITIES = [
  'Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving', 'Garland',
  'Frisco', 'McKinney', 'Grand Prairie', 'Denton', 'Mesquite', 'Carrollton',
  'Richardson', 'Lewisville', 'Allen', 'Flower Mound', 'Mansfield', 'Euless',
  'Bedford', 'Grapevine', 'Cedar Hill', 'Wylie', 'Keller', 'Southlake',
  'Colleyville', 'Coppell', 'Prosper', 'Rowlett', 'DeSoto', 'Rockwall',
  'Burleson', 'Haltom City', 'The Colony', 'Little Elm', 'Sachse',
  'Duncanville', 'Waxahachie', 'Weatherford', 'Midlothian', 'Cleburne',
];

type TabId = 'directory' | 'campaign' | 'templates';

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function BusinessOutreachPage() {
  const [activeTab, setActiveTab] = useState<TabId>('directory');

  // ── Directory State ────────────────────────────────────────────────────
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [hasEmail, setHasEmail] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [stats, setStats] = useState({ total: 0, withEmail: 0, withPhone: 0, contacted: 0 });

  // ── Campaign State ─────────────────────────────────────────────────────
  const [campaignStep, setCampaignStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [editBeforeSend, setEditBeforeSend] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [mailbox, setMailbox] = useState(1);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResults, setSendResults] = useState<{ sent: number; failed: number; skipped: number; results: SendResult[] } | null>(null);

  // ── Templates State ────────────────────────────────────────────────────
  const [tmplList, setTmplList] = useState<Template[]>([]);
  const [tmplLoading, setTmplLoading] = useState(false);
  const [editingTmplId, setEditingTmplId] = useState<string | null>(null);
  const [tmplForm, setTmplForm] = useState({ slug: '', category: 'general', variant: 'default', subject: '', body: '', variables: '' as string, is_active: true });
  const [showNewTmpl, setShowNewTmpl] = useState(false);
  const [tmplSaving, setTmplSaving] = useState(false);

  /* ─── Directory: Fetch Businesses ──────────────────────────────────────── */

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    if (status) params.set('status', status);
    if (hasEmail) params.set('has_email', 'true');
    if (hasPhone) params.set('has_phone', 'true');

    try {
      const res = await fetch(`/api/admin/business-directory?${params}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      if (data.categories) setCategories(data.categories);
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, city, status, hasEmail, hasPhone]);

  useEffect(() => {
    (async () => {
      try {
        const [totalRes, emailRes, phoneRes, contactedRes] = await Promise.all([
          fetch('/api/admin/business-directory?limit=1'),
          fetch('/api/admin/business-directory?limit=1&has_email=true'),
          fetch('/api/admin/business-directory?limit=1&has_phone=true'),
          fetch('/api/admin/business-directory?limit=1&status=CONTACTED'),
        ]);
        const [t, e, p, c] = await Promise.all([
          totalRes.json(), emailRes.json(), phoneRes.json(), contactedRes.json(),
        ]);
        setStats({
          total: t.total || 0,
          withEmail: e.total || 0,
          withPhone: p.total || 0,
          contacted: c.total || 0,
        });
      } catch {}
    })();
  }, []);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ─── Directory: Selection ─────────────────────────────────────────────── */

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === businesses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(businesses.map(b => b.id)));
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/business-directory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === 'CONTACTED' ? { last_contacted_at: new Date().toISOString() } : {}),
        }),
      });
      setBusinesses(prev =>
        prev.map(b =>
          b.id === id
            ? { ...b, status: newStatus, ...(newStatus === 'CONTACTED' ? { last_contacted_at: new Date().toISOString() } : {}) }
            : b
        )
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const bulkAction = async (action: 'CONTACTED' | 'DNC') => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    await Promise.all(
      ids.map(id =>
        fetch(`/api/admin/business-directory/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: action,
            ...(action === 'CONTACTED' ? { last_contacted_at: new Date().toISOString() } : {}),
          }),
        })
      )
    );
    setSelected(new Set());
    fetchBusinesses();
  };

  /* ─── Campaign: Logic ──────────────────────────────────────────────────── */

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {}
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const selectedBusinessIds = Array.from(selected);
  const selectedWithEmail = businesses.filter(b => selected.has(b.id) && b.email).length;

  const handleSendCampaign = async () => {
    if (!selectedTemplateId || selectedBusinessIds.length === 0) return;
    setSending(true);
    setSendProgress(0);
    setSendResults(null);

    try {
      const res = await fetch('/api/admin/business-outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_ids: selectedBusinessIds,
          template_id: selectedTemplateId,
          mailbox,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setSendResults(data);
      setSendProgress(100);
      setCampaignStep(3);
      // Refresh directory data
      fetchBusinesses();
    } catch (err: any) {
      setSendResults({ sent: 0, failed: 0, skipped: 0, results: [{ id: '', name: 'Error', email: null, status: 'failed', error: err.message }] });
    } finally {
      setSending(false);
    }
  };

  /* ─── Templates: Logic ─────────────────────────────────────────────────── */

  const fetchTmplList = useCallback(async () => {
    setTmplLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      setTmplList(data.templates || []);
    } catch {} finally {
      setTmplLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') fetchTmplList();
  }, [activeTab, fetchTmplList]);

  const saveTmpl = async (isNew: boolean) => {
    setTmplSaving(true);
    try {
      const payload = {
        slug: tmplForm.slug,
        category: tmplForm.category,
        variant: tmplForm.variant,
        subject: tmplForm.subject,
        body: tmplForm.body,
        variables: tmplForm.variables ? tmplForm.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
        is_active: tmplForm.is_active,
      };

      if (isNew) {
        await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else if (editingTmplId) {
        await fetch(`/api/admin/templates/${editingTmplId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setShowNewTmpl(false);
      setEditingTmplId(null);
      setTmplForm({ slug: '', category: 'general', variant: 'default', subject: '', body: '', variables: '', is_active: true });
      fetchTmplList();
      fetchTemplates();
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setTmplSaving(false);
    }
  };

  const deleteTmpl = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      fetchTmplList();
      fetchTemplates();
    } catch {}
  };

  const startEditTmpl = (t: Template) => {
    setEditingTmplId(t.id);
    setTmplForm({
      slug: t.slug,
      category: t.category,
      variant: t.variant,
      subject: t.subject,
      body: t.body,
      variables: Array.isArray(t.variables) ? t.variables.join(', ') : '',
      is_active: t.is_active,
    });
    setShowNewTmpl(false);
  };

  /* ─── Helpers ──────────────────────────────────────────────────────────── */

  const renderStars = (rating: number | null) => {
    if (rating === null) return <span className="text-gray-600">--</span>;
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < full
                ? 'fill-yellow-400 text-yellow-400'
                : i === full && half
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-gray-600'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-400">{rating.toFixed(1)}</span>
      </span>
    );
  };

  const clearFilters = () => {
    setSearchInput(''); setSearch(''); setCategory(''); setCity('');
    setStatus(''); setHasEmail(false); setHasPhone(false); setPage(1);
  };

  const hasActiveFilters = search || category || city || status || hasEmail || hasPhone;

  const substitutePreview = (text: string) => {
    return text
      .replace(/\{\{\s*name\s*\}\}/g, 'ABC Plumbing')
      .replace(/\{\{\s*address\s*\}\}/g, '123 Main St')
      .replace(/\{\{\s*city\s*\}\}/g, 'Frisco')
      .replace(/\{\{\s*phone\s*\}\}/g, '(469) 555-1234')
      .replace(/\{\{\s*category\s*\}\}/g, 'Plumbing')
      .replace(/\{\{\s*website\s*\}\}/g, 'abcplumbing.com');
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">Business Outreach</h1>
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-600 text-white uppercase tracking-wider">
            Cold Outreach
          </span>
        </div>
        <p className="text-gray-400 text-sm">
          DFW business directory — {stats.total.toLocaleString()} businesses available for outreach
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        {([
          { id: 'directory' as TabId, label: 'Directory', icon: Building2 },
          { id: 'campaign' as TabId, label: `Send Campaign${selected.size > 0 ? ` (${selected.size})` : ''}`, icon: Send },
          { id: 'templates' as TabId, label: 'Templates', icon: FileText },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'campaign') { setCampaignStep(1); setSendResults(null); }
            }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  TAB 1: DIRECTORY                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'directory' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Businesses', value: stats.total, icon: Building2, color: 'blue' },
              { label: 'With Email', value: stats.withEmail, icon: Mail, color: 'blue' },
              { label: 'With Phone', value: stats.withPhone, icon: Phone, color: 'blue' },
              { label: 'Contacted', value: stats.contacted, icon: Megaphone, color: 'blue' },
            ].map(card => (
              <div key={card.label} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.label}</span>
                  <card.icon className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Filters</span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="ml-auto text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="col-span-2 md:col-span-1 lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search name, address, phone, email..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setPage(1); }}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={city}
                onChange={e => { setCity(e.target.value); setPage(1); }}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
              >
                <option value="">All Cities</option>
                {DFW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={status}
                onChange={e => { setStatus(e.target.value); setPage(1); }}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
              >
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setHasEmail(!hasEmail); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium border transition-colors ${
                    hasEmail ? 'bg-blue-700 border-blue-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
                <button
                  onClick={() => { setHasPhone(!hasPhone); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium border transition-colors ${
                    hasPhone ? 'bg-blue-700 border-blue-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> Phone
                </button>
              </div>
            </div>
          </div>

          {/* Floating Action Bar */}
          {selected.size > 0 && (
            <div className="sticky bottom-4 z-20 bg-blue-900/90 backdrop-blur border border-blue-700 rounded-lg px-5 py-3.5 mb-4 flex items-center gap-4 shadow-xl shadow-blue-900/30">
              <span className="text-sm text-blue-200 font-semibold">
                {selected.size} selected
              </span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => { setActiveTab('campaign'); setCampaignStep(1); setSendResults(null); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Send Email to {selected.size} selected
                </button>
                <button
                  onClick={() => bulkAction('CONTACTED')}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Mark Contacted
                </button>
                <button
                  onClick={() => bulkAction('DNC')}
                  className="px-3 py-2 bg-red-900 hover:bg-red-800 text-red-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <PhoneOff className="w-3.5 h-3.5" /> Mark DNC
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800/50">
                    <th className="px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={businesses.length > 0 && selected.size === businesses.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-600"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">City</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Website</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-12 text-center text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />Loading businesses...
                      </td>
                    </tr>
                  ) : businesses.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-12 text-center text-gray-500">
                        No businesses found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    businesses.map(biz => (
                      <Fragment key={biz.id}>
                        <tr
                          className={`border-b border-gray-700/50 hover:bg-gray-750 transition-colors ${
                            selected.has(biz.id) ? 'bg-blue-900/10' : ''
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={selected.has(biz.id)}
                              onChange={() => toggleSelect(biz.id)}
                              className="rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-600"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-medium text-white">{biz.name}</span>
                          </td>
                          <td className="px-3 py-2.5 text-gray-400">{biz.category || '--'}</td>
                          <td className="px-3 py-2.5 text-gray-400">{biz.city || '--'}</td>
                          <td className="px-3 py-2.5">
                            {biz.phone ? (
                              <a href={`tel:${biz.phone}`} className="text-blue-400 hover:text-blue-300">{biz.phone}</a>
                            ) : (
                              <span className="text-gray-600">--</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {biz.email ? (
                              <a href={`mailto:${biz.email}`} className="text-blue-400 hover:text-blue-300 truncate block max-w-[180px]">
                                {biz.email}
                              </a>
                            ) : (
                              <span className="text-gray-600">--</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {biz.website ? (
                              <a
                                href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[120px]">Link</span>
                              </a>
                            ) : (
                              <span className="text-gray-600">--</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">{renderStars(biz.rating)}</td>
                          <td className="px-3 py-2.5">
                            <select
                              value={biz.status}
                              onChange={e => updateStatus(biz.id, e.target.value)}
                              className={`text-xs font-medium rounded px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer ${
                                STATUS_COLORS[biz.status] || 'bg-gray-600 text-gray-200'
                              }`}
                            >
                              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => setExpandedRow(expandedRow === biz.id ? null : biz.id)}
                              className="text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              {expandedRow === biz.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {expandedRow === biz.id && (
                          <tr className="border-b border-gray-700/50 bg-gray-900/50">
                            <td colSpan={10} className="px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Address</p>
                                  <p className="text-gray-300">{biz.address || 'N/A'}</p>
                                  {biz.zip && <p className="text-gray-400 text-xs">{biz.city}, TX {biz.zip}</p>}
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reviews</p>
                                  <p className="text-gray-300">{biz.review_count} reviews</p>
                                  <p className="text-gray-400 text-xs">Source: {biz.source}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Contacted</p>
                                  <p className="text-gray-300">
                                    {biz.last_contacted_at ? new Date(biz.last_contacted_at).toLocaleDateString() : 'Never'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                                  <p className="text-gray-300">{biz.notes || 'No notes'}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Showing {((page - 1) * 50) + 1}--{Math.min(page * 50, total)} of {total.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded border border-gray-700 text-gray-400 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-300">Page {page} of {pages}</span>
                  <button
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page === pages}
                    className="p-1.5 rounded border border-gray-700 text-gray-400 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  TAB 2: SEND CAMPAIGN                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'campaign' && (
        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-2">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  campaignStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {sendResults && step === 3 ? <Check className="w-4 h-4" /> : step}
                </div>
                <span className={`text-sm font-medium ${campaignStep >= step ? 'text-white' : 'text-gray-500'}`}>
                  {step === 1 ? 'Review Selection' : step === 2 ? 'Choose Template' : 'Send & Results'}
                </span>
                {step < 3 && <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />}
              </div>
            ))}
          </div>

          {/* Step 1: Selected businesses summary */}
          {campaignStep >= 1 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Selected Businesses
              </h3>
              {selected.size === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                  <p className="text-gray-300 font-medium">No businesses selected</p>
                  <p className="text-gray-500 text-sm mt-1">Go to the Directory tab and select businesses first.</p>
                  <button
                    onClick={() => setActiveTab('directory')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Go to Directory
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Selected</p>
                    <p className="text-2xl font-bold text-white">{selected.size}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">With Email</p>
                    <p className="text-2xl font-bold text-blue-400">{selectedWithEmail}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Without Email (skipped)</p>
                    <p className="text-2xl font-bold text-yellow-400">{selected.size - selectedWithEmail}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mailbox</p>
                    <select
                      value={mailbox}
                      onChange={e => setMailbox(parseInt(e.target.value))}
                      className="mt-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white w-full"
                    >
                      {[1, 2, 3, 4].map(n => <option key={n} value={n}>Mailbox {n}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {selected.size > 0 && campaignStep === 1 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setCampaignStep(2)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    Next: Choose Template <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Template selector */}
          {campaignStep >= 2 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Email Template
              </h3>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1.5">Select Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={e => {
                    setSelectedTemplateId(e.target.value);
                    const t = templates.find(t => t.id === e.target.value);
                    if (t) { setEditSubject(t.subject); setEditBody(t.body); }
                  }}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Select a template --</option>
                  {templates.filter(t => t.is_active).map(t => (
                    <option key={t.id} value={t.id}>[{t.category}] {t.slug} — {t.subject}</option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <>
                  {/* Preview */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">Preview</span>
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editBeforeSend}
                          onChange={e => setEditBeforeSend(e.target.checked)}
                          className="rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-600"
                        />
                        Edit before sending
                      </label>
                    </div>

                    {editBeforeSend ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Subject</label>
                          <input
                            type="text"
                            value={editSubject}
                            onChange={e => setEditSubject(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Body (HTML)</label>
                          <textarea
                            value={editBody}
                            onChange={e => setEditBody(e.target.value)}
                            rows={10}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Variables: {'{{name}}'}, {'{{address}}'}, {'{{city}}'}, {'{{phone}}'}, {'{{category}}'}, {'{{website}}'}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Subject</p>
                        <p className="text-white font-medium mb-4">{substitutePreview(selectedTemplate.subject)}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Body</p>
                        <div
                          className="text-gray-300 text-sm leading-relaxed prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: substitutePreview(selectedTemplate.body) }}
                        />
                      </div>
                    )}
                  </div>

                  {campaignStep === 2 && (
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={() => setCampaignStep(1)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setCampaignStep(3)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        Next: Confirm & Send <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Confirm & Send */}
          {campaignStep >= 3 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" /> Confirm & Send
              </h3>

              {!sendResults ? (
                <>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 mb-5">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recipients</p>
                        <p className="text-xl font-bold text-white">{selectedWithEmail}</p>
                        <p className="text-xs text-gray-500">{selected.size - selectedWithEmail} will be skipped (no email)</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Template</p>
                        <p className="text-sm font-medium text-blue-400">{selectedTemplate?.slug || 'None'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedTemplate?.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mailbox</p>
                        <p className="text-sm font-medium text-white">Mailbox {mailbox}</p>
                      </div>
                    </div>
                  </div>

                  {sending ? (
                    <div className="text-center py-6">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                      <p className="text-white font-medium">Sending emails...</p>
                      <p className="text-gray-500 text-sm mt-1">This may take a moment for large batches.</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCampaignStep(2)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSendCampaign}
                        disabled={!selectedTemplateId || selectedWithEmail === 0}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
                      >
                        <Send className="w-4 h-4" /> Send Now to {selectedWithEmail} Businesses
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Results */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 text-center">
                      <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-400">{sendResults.sent}</p>
                      <p className="text-xs text-green-400/70 uppercase tracking-wider">Sent</p>
                    </div>
                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
                      <XCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-red-400">{sendResults.failed}</p>
                      <p className="text-xs text-red-400/70 uppercase tracking-wider">Failed</p>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 text-center">
                      <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-yellow-400">{sendResults.skipped}</p>
                      <p className="text-xs text-yellow-400/70 uppercase tracking-wider">Skipped</p>
                    </div>
                  </div>

                  {/* Individual results */}
                  {sendResults.results.length > 0 && (
                    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-gray-900">
                            <tr className="border-b border-gray-700">
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Business</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sendResults.results.map((r, i) => (
                              <tr key={i} className="border-b border-gray-800">
                                <td className="px-4 py-2 text-white">{r.name}</td>
                                <td className="px-4 py-2 text-gray-400">{r.email || '--'}</td>
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                                    r.status === 'sent' ? 'bg-green-900/50 text-green-400' :
                                    r.status === 'skipped' ? 'bg-yellow-900/50 text-yellow-400' :
                                    'bg-red-900/50 text-red-400'
                                  }`}>
                                    {r.status === 'sent' && <CheckCircle2 className="w-3 h-3" />}
                                    {r.status === 'skipped' && <AlertTriangle className="w-3 h-3" />}
                                    {r.status === 'failed' && <XCircle className="w-3 h-3" />}
                                    {r.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-gray-500 text-xs">{r.error || '--'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex justify-between">
                    <button
                      onClick={() => {
                        setSelected(new Set());
                        setSendResults(null);
                        setCampaignStep(1);
                        setActiveTab('directory');
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Back to Directory
                    </button>
                    <button
                      onClick={() => { setSelected(new Set()); setSendResults(null); setCampaignStep(1); }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      New Campaign
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  TAB 3: TEMPLATES                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Outreach Templates</h3>
            <button
              onClick={() => {
                setShowNewTmpl(true);
                setEditingTmplId(null);
                setTmplForm({ slug: '', category: 'general', variant: 'default', subject: '', body: '', variables: '', is_active: true });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Template
            </button>
          </div>

          {/* New / Edit Form */}
          {(showNewTmpl || editingTmplId) && (
            <div className="bg-gray-800 border border-blue-700 rounded-lg p-6">
              <h4 className="text-md font-semibold text-white mb-4">
                {editingTmplId ? 'Edit Template' : 'Create New Template'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Slug</label>
                  <input
                    value={tmplForm.slug}
                    onChange={e => setTmplForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="e.g. intro-email"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <input
                    value={tmplForm.category}
                    onChange={e => setTmplForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. general"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Variant</label>
                  <input
                    value={tmplForm.variant}
                    onChange={e => setTmplForm(f => ({ ...f, variant: e.target.value }))}
                    placeholder="e.g. default"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tmplForm.is_active}
                      onChange={e => setTmplForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-600"
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Subject</label>
                <input
                  value={tmplForm.subject}
                  onChange={e => setTmplForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Email subject line..."
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Body (HTML)</label>
                <textarea
                  value={tmplForm.body}
                  onChange={e => setTmplForm(f => ({ ...f, body: e.target.value }))}
                  rows={10}
                  placeholder="<p>Hello {{name}},</p>..."
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Variables (comma-separated)</label>
                <input
                  value={tmplForm.variables}
                  onChange={e => setTmplForm(f => ({ ...f, variables: e.target.value }))}
                  placeholder="name, address, city, phone, category, website"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => saveTmpl(!editingTmplId)}
                  disabled={tmplSaving || !tmplForm.slug || !tmplForm.subject || !tmplForm.body}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {tmplSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingTmplId ? 'Save Changes' : 'Create Template'}
                </button>
                <button
                  onClick={() => { setShowNewTmpl(false); setEditingTmplId(null); }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Template List */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Sends</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tmplLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />Loading templates...
                      </td>
                    </tr>
                  ) : tmplList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        No templates yet. Create one above.
                      </td>
                    </tr>
                  ) : (
                    tmplList.map(t => (
                      <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-white font-mono text-xs">{t.slug}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{t.category}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 max-w-[300px] truncate">{t.subject}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            t.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-500'
                          }`}>
                            {t.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{t._count?.outreach_history ?? 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEditTmpl(t)}
                              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTmpl(t.id)}
                              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
