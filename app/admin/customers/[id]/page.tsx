'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Phone, Mail, MapPin, Save, Loader2, FileText,
  Briefcase, ClipboardList, Clock, Plus, Upload, Trash2, StickyNote, MessageCircle,
} from 'lucide-react';

interface Customer {
  id: string; name: string; phone: string; email: string | null; address: string | null;
  notes: string | null; created_at: string;
  estimates: { id: string; status: string; total: number; address: string; created_at: string }[];
  jobs: { id: string; status: string; service_type: string | null; address: string; scheduled_date: string | null; created_at: string }[];
  inspection_reports: { id: string; address: string; status: string; inspection_date: string | null; created_at: string; _count: { items: number } }[];
}

interface Activity {
  id: string; type: string; note: string | null; created_by: string | null; created_at: string;
}

interface Document {
  id: string; display_name: string; filename: string; doc_type: string; size_bytes: number; uploaded_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-600', SENT: 'bg-blue-600', APPROVED: 'bg-green-600', DECLINED: 'bg-red-600',
  INVOICED: 'bg-yellow-600', PAID: 'bg-emerald-600',
  LEAD: 'bg-gray-600', ESTIMATE_SENT: 'bg-blue-600', SCHEDULED: 'bg-purple-600',
  IN_PROGRESS: 'bg-yellow-600', COMPLETE: 'bg-emerald-600',
};

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [docs, setDocs] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setCustomer(data.customer);
      setForm({
        name: data.customer.name || '',
        phone: data.customer.phone || '',
        email: data.customer.email || '',
        address: data.customer.address || '',
        notes: data.customer.notes || '',
      });
    } catch { setError('Failed to load customer'); }
    setLoading(false);
  }, [id]);

  const loadActivities = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch {}
    setLoadingActivity(false);
  }, [id]);

  const loadDocs = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch {}
    setLoadingDocs(false);
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCustomer();
      loadActivities();
      loadDocs();
    }
  }, [id, loadCustomer, loadActivities, loadDocs]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCustomer(prev => prev ? { ...prev, ...data.customer } : prev);
      setSuccess('Customer updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to update customer'); }
    setSaving(false);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/activity`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'NOTE', note: newNote }),
      });
      if (res.ok) {
        setNewNote('');
        await loadActivities();
      }
    } catch {}
    setAddingNote(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('display_name', file.name);
      const res = await fetch(`/api/admin/customers/${id}/documents`, { method: 'POST', body: formData });
      if (res.ok) await loadDocs();
    } catch {}
    setUploading(false);
    e.target.value = '';
  };

  const deleteDoc = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await fetch(`/api/admin/customers/${id}/documents/${docId}`, { method: 'DELETE' });
      await loadDocs();
    } catch {}
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-7 w-48 bg-gray-700 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-4 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-red-400">{error || 'Customer not found'}</p>
        <button onClick={() => router.push('/admin/customers')} className="mt-4 text-blue-400 hover:underline">Back to Customers</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/customers')}
          className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="p-2.5 bg-blue-700 rounded-xl">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
          <p className="text-gray-400 text-sm">Customer since {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">{error}</div>}
      {success && <div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-3 text-green-300 text-sm">{success}</div>}

      {/* Customer Info Form */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5"><User className="w-3 h-3" /> Full Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5"><Phone className="w-3 h-3" /> Phone *</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5"><Mail className="w-3 h-3" /> Email</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5"><MapPin className="w-3 h-3" /> Address</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5"><StickyNote className="w-3 h-3" /> Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Estimates List */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Estimates ({customer.estimates.length})</h2>
        </div>
        {customer.estimates.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No estimates yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                  <th className="text-left px-5 py-3">Address</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-right px-3 py-3">Total</th>
                  <th className="text-right px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {customer.estimates.map(est => (
                  <tr key={est.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer" onClick={() => router.push(`/admin/estimates/${est.id}`)}>
                    <td className="px-5 py-2.5 text-white">{est.address}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${STATUS_COLORS[est.status] || 'bg-gray-600'}`}>{est.status}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-white font-medium">{fmt(est.total)}</td>
                    <td className="px-5 py-2.5 text-right text-gray-400">{new Date(est.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Jobs ({customer.jobs.length})</h2>
        </div>
        {customer.jobs.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No jobs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                  <th className="text-left px-5 py-3">Address</th>
                  <th className="text-left px-3 py-3">Service Type</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-right px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {customer.jobs.map(job => (
                  <tr key={job.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer" onClick={() => router.push(`/admin/jobs/${job.id}`)}>
                    <td className="px-5 py-2.5 text-white">{job.address}</td>
                    <td className="px-3 py-2.5 text-gray-300">{job.service_type || '-'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${STATUS_COLORS[job.status] || 'bg-gray-600'}`}>{job.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-gray-400">{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : new Date(job.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Reports */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Inspection Reports ({customer.inspection_reports.length})</h2>
        </div>
        {customer.inspection_reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No inspection reports.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                  <th className="text-left px-5 py-3">Address</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-right px-3 py-3">Damaged Items</th>
                  <th className="text-right px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {customer.inspection_reports.map(rpt => (
                  <tr key={rpt.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer" onClick={() => router.push(`/admin/inspections/${rpt.id}`)}>
                    <td className="px-5 py-2.5 text-white">{rpt.address}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${rpt.status === 'COMPLETE' ? 'bg-green-600' : 'bg-gray-600'}`}>{rpt.status}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-300">{rpt._count.items}</td>
                    <td className="px-5 py-2.5 text-right text-gray-400">{rpt.inspection_date ? new Date(rpt.inspection_date).toLocaleDateString() : new Date(rpt.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Activity Log</h2>
        </div>
        <div className="p-5">
          {/* Add Note */}
          <div className="flex gap-2 mb-4">
            <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..."
              onKeyDown={e => { if (e.key === 'Enter') addNote(); }}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            <button onClick={addNote} disabled={addingNote || !newNote.trim()}
              className="flex items-center gap-1 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
          {loadingActivity ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : activities.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activities.map(act => (
                <div key={act.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5">
                    <MessageCircle className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-400">{act.type}</span>
                      <span className="text-xs text-gray-500">{new Date(act.created_at).toLocaleString()}</span>
                      {act.created_by && <span className="text-xs text-gray-600">by {act.created_by}</span>}
                    </div>
                    {act.note && <p className="text-gray-300 mt-0.5">{act.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Documents ({docs.length})</h2>
          </div>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        {loadingDocs ? (
          <div className="p-6 text-gray-500 text-sm">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No documents uploaded.</div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {docs.map(doc => (
              <div key={doc.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-700/30">
                <div>
                  <p className="text-sm text-white">{doc.display_name}</p>
                  <p className="text-xs text-gray-500">{doc.doc_type} &middot; {(doc.size_bytes / 1024).toFixed(0)} KB &middot; {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => deleteDoc(doc.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
