'use client';

import { useEffect, useState } from 'react';
import { Send, Search, ChevronRight, ChevronLeft, Check, AlertCircle, Users, Mail } from 'lucide-react';

interface Prospect {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  status: string;
}

interface Template {
  id: string;
  slug: string;
  subject: string;
  category: string;
}

interface SendResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

const STATUSES = ['NEW', 'CONTACTED', 'NO_RESPONSE', 'INTERESTED', 'CONVERTED', 'DNC'] as const;

const DFW_CITIES = [
  'Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving', 'Garland', 'Frisco',
  'McKinney', 'Grand Prairie', 'Denton', 'Mesquite', 'Carrollton', 'Lewisville',
  'Allen', 'Flower Mound', 'Mansfield', 'Rowlett', 'Cedar Hill', 'Wylie',
  'Burleson', 'Keller', 'Southlake', 'Grapevine', 'Colleyville', 'Coppell',
  'Prosper', 'Little Elm', 'Celina', 'Anna', 'Forney', 'Rockwall', 'Midlothian',
];

export default function CampaignSenderPage() {
  const [step, setStep] = useState(1);

  // Step 1 - select prospects
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [prospectSearch, setProspectSearch] = useState('');
  const [prospectStatus, setProspectStatus] = useState('');
  const [prospectCity, setProspectCity] = useState('');

  // Step 2 - select template
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Step 3 - preview
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Step 4 - send
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const loadProspects = async () => {
    setLoadingProspects(true);
    const params = new URLSearchParams();
    if (prospectSearch) params.set('search', prospectSearch);
    if (prospectStatus) params.set('status', prospectStatus);
    if (prospectCity) params.set('city', prospectCity);
    params.set('has_email', 'true');
    const res = await fetch(`/api/admin/prospects?${params}`);
    const data = await res.json();
    setProspects(data.prospects || []);
    setLoadingProspects(false);
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    const res = await fetch('/api/admin/templates?active=true');
    const data = await res.json();
    setTemplates(data.templates || []);
    setLoadingTemplates(false);
  };

  const loadPreview = async () => {
    if (!selectedTemplate || selectedIds.size === 0) return;
    setLoadingPreview(true);
    const sampleId = Array.from(selectedIds)[0];
    const res = await fetch(`/api/admin/templates/${selectedTemplate}/preview?prospect_id=${sampleId}`);
    const data = await res.json();
    setPreviewSubject(data.subject || '');
    setPreviewHtml(data.body || '');
    setLoadingPreview(false);
  };

  useEffect(() => { loadProspects(); }, [prospectSearch, prospectStatus, prospectCity]);

  useEffect(() => {
    if (step === 2) loadTemplates();
    if (step === 3) loadPreview();
  }, [step]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === prospects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prospects.map(p => p.id)));
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate || selectedIds.size === 0) return;
    setSending(true);
    const res = await fetch('/api/admin/outreach/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: selectedTemplate,
        prospect_ids: Array.from(selectedIds),
      }),
    });
    const data = await res.json();
    setResult(data);
    setSending(false);
  };

  const selectedCount = selectedIds.size;
  const canNext = step === 1 ? selectedCount > 0 : step === 2 ? !!selectedTemplate : step === 3;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-700 rounded-xl">
          <Send className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Campaign Sender</h1>
          <p className="text-gray-400 text-sm mt-0.5">Send bulk email campaigns to prospects</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: 'Select Prospects' },
          { n: 2, label: 'Choose Template' },
          { n: 3, label: 'Preview' },
          { n: 4, label: 'Send' },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && <div className={`w-8 h-px ${step >= n ? 'bg-blue-600' : 'bg-gray-700'}`} />}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
              step === n ? 'bg-blue-700 text-white' :
              step > n ? 'bg-blue-700/20 text-blue-400' :
              'bg-gray-800 text-gray-500'
            }`}>
              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                step > n ? 'bg-blue-600 text-white' : ''
              }`}>
                {step > n ? <Check className="w-3 h-3" /> : n}
              </span>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: Select Prospects */}
      {step === 1 && (
        <div>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={prospectSearch} onChange={e => setProspectSearch(e.target.value)}
                placeholder="Search prospects..."
                className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
            </div>
            <select value={prospectStatus} onChange={e => setProspectStatus(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select value={prospectCity} onChange={e => setProspectCity(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="">All Cities</option>
              {DFW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedIds.size === prospects.length && prospects.length > 0}
                      onChange={toggleAll}
                      className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">City</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingProspects ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-700/50">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : prospects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">No prospects with email found.</td>
                  </tr>
                ) : prospects.map(p => (
                  <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => toggleSelect(p.id)}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(p.id)} readOnly
                        className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-700 text-gray-300">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              <Users className="w-4 h-4 inline mr-1" />{selectedCount} prospect{selectedCount !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Choose Template */}
      {step === 2 && (
        <div className="space-y-3">
          {loadingTemplates ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="h-5 bg-gray-700 rounded animate-pulse w-1/3 mb-2" />
                <div className="h-4 bg-gray-700 rounded animate-pulse w-2/3" />
              </div>
            ))
          ) : templates.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
              <p className="text-gray-500">No active templates. Create one in Email Templates first.</p>
            </div>
          ) : templates.map(t => (
            <div key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`bg-gray-800 border rounded-xl p-4 cursor-pointer transition-colors ${
                selectedTemplate === t.id ? 'border-blue-500 bg-blue-700/10' : 'border-gray-700 hover:border-gray-600'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-white text-sm">{t.slug}</span>
                    <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">{t.category}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{t.subject}</p>
                </div>
                {selectedTemplate === t.id && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Campaign Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Recipients:</span>
                <span className="text-white ml-2">{selectedCount} prospects</span>
              </div>
              <div>
                <span className="text-gray-500">Template:</span>
                <span className="text-white ml-2">{templates.find(t => t.id === selectedTemplate)?.slug}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Email Preview (sample)</h3>
            {loadingPreview ? (
              <div className="space-y-3">
                <div className="h-5 bg-gray-700 rounded animate-pulse w-1/2" />
                <div className="h-32 bg-gray-700 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <span className="text-xs text-gray-500">Subject:</span>
                  <p className="text-white text-sm mt-1">{previewSubject}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300"
                  dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Send & Results */}
      {step === 4 && (
        <div>
          {!result && !sending && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
              <Send className="w-10 h-10 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Ready to Send</h3>
              <p className="text-gray-400 text-sm mb-6">
                This will send emails to <strong className="text-white">{selectedCount}</strong> prospects using the selected template.
              </p>
              <button onClick={handleSend}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                Send Campaign
              </button>
            </div>
          )}

          {sending && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Sending...</h3>
              <p className="text-gray-400 text-sm">Please wait while emails are being sent.</p>
            </div>
          )}

          {result && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
              <div className="text-center mb-6">
                {result.failed === 0 ? (
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-yellow-400" />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white">Campaign Complete</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{result.total}</p>
                  <p className="text-gray-400 text-xs mt-1">Total</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.sent}</p>
                  <p className="text-gray-400 text-xs mt-1">Sent</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.failed}</p>
                  <p className="text-gray-400 text-xs mt-1">Failed</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Errors</h4>
                  <ul className="text-xs text-red-300 space-y-1">
                    {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      {step < 4 || (!result && !sending) ? (
        <div className="flex justify-between mt-6">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg transition-colors disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < 4 && (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-30">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
