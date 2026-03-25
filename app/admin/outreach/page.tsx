'use client';

import { useEffect, useState } from 'react';
import { Mail, Plus, X, Eye, Edit2, Trash2, Check, Copy } from 'lucide-react';

interface Template {
  id: string;
  slug: string;
  category: string;
  variant: string | null;
  subject: string;
  body: string;
  variables: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ['general', 'follow_up', 'estimate_followup', 'review_request', 'seasonal', 'other'] as const;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const emptyForm = { slug: '', category: 'general', variant: '', subject: '', body: '', variables: '' };

export default function OutreachPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/templates');
    const data = await res.json();
    setTemplates(data.templates || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (t: Template) => {
    setEditingId(t.id);
    setForm({
      slug: t.slug,
      category: t.category,
      variant: t.variant || '',
      subject: t.subject,
      body: t.body,
      variables: t.variables.join(', '),
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug || !form.subject || !form.body) return;
    setSaving(true);
    const payload = {
      ...form,
      variables: form.variables.split(',').map(v => v.trim()).filter(Boolean),
    };
    if (editingId) {
      await fetch(`/api/admin/templates/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleActive = async (t: Template) => {
    await fetch(`/api/admin/templates/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !t.active }),
    });
    load();
  };

  const handlePreview = async (id: string) => {
    setPreviewLoading(true);
    const res = await fetch(`/api/admin/templates/${id}/preview`);
    const data = await res.json();
    setPreview({ subject: data.subject, body: data.body });
    setPreviewLoading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 rounded-xl">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Email Templates</h1>
            <p className="text-gray-400 text-sm mt-0.5">{templates.length} templates</p>
          </div>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{editingId ? 'Edit Template' : 'New Template'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Slug *</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required
                  placeholder="e.g. welcome_intro"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category *</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Variant</label>
                <input value={form.variant} onChange={e => setForm({ ...form, variant: e.target.value })}
                  placeholder="e.g. A, B"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Subject *</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Body (HTML) *</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required rows={8}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Variables (comma-separated)</label>
              <input value={form.variables} onChange={e => setForm({ ...form, variables: e.target.value })}
                placeholder="e.g. name, address, city"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                {saving ? 'Saving...' : editingId ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setPreview(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Template Preview</h3>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="mb-3">
              <span className="text-xs text-gray-400">Subject:</span>
              <p className="text-white text-sm mt-1">{preview.subject}</p>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <span className="text-xs text-gray-400">Body:</span>
              <div className="mt-2 bg-gray-900 rounded-lg p-4 text-sm text-gray-300"
                dangerouslySetInnerHTML={{ __html: preview.body }} />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Slug</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Variant</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Active</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Updated</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">No templates found.</td>
              </tr>
            ) : templates.map(t => (
              <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3 font-mono text-blue-400 text-xs">{t.slug}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">{t.category.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{t.variant || '—'}</td>
                <td className="px-4 py-3 text-gray-300 text-xs max-w-64 truncate">{t.subject}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(t)}
                    className={`w-8 h-5 rounded-full relative transition-colors ${t.active ? 'bg-blue-600' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      t.active ? 'left-3.5' : 'left-0.5'
                    }`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(t.updated_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePreview(t.id)} title="Preview"
                      className="p-1.5 hover:bg-gray-600 text-gray-400 hover:text-white rounded-lg transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openEdit(t)} title="Edit"
                      className="p-1.5 hover:bg-gray-600 text-gray-400 hover:text-white rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} title="Delete"
                      className="p-1.5 hover:bg-gray-600 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
