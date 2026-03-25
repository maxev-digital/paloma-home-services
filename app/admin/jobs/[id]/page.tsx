'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Briefcase, User, MapPin, Clock, Wrench, Users,
  Calendar, CheckCircle2, Loader2, X, ChevronRight, Star, Edit3, Save, Camera,
} from 'lucide-react';

const JOB_STATUSES = ['LEAD', 'ESTIMATE_SENT', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETE', 'INVOICED', 'PAID'] as const;
type JobStatus = (typeof JOB_STATUSES)[number];

const STATUS_COLORS: Record<string, string> = {
  LEAD: 'bg-gray-600', ESTIMATE_SENT: 'bg-blue-600', APPROVED: 'bg-green-600',
  SCHEDULED: 'bg-purple-600', IN_PROGRESS: 'bg-yellow-600', COMPLETE: 'bg-emerald-600',
  INVOICED: 'bg-orange-600', PAID: 'bg-teal-600',
};

interface Job {
  id: string;
  customer: { id: string; name: string; phone: string; email: string | null; address: string | null };
  address: string; service_type: string | null; status: JobStatus; notes: string | null;
  crew_name: string | null; scheduled_date: string | null; completed_date: string | null;
  created_at: string; updated_at: string;
  photos: { id: string; url: string; type: string; caption: string | null; created_at: string }[];
  review_request: { id: string; sent_via: string; sent_at: string; opened_at: string | null; clicked_at: string | null; reviewed_at: string | null } | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ service_type: '', crew_name: '', scheduled_date: '', completed_date: '', notes: '' });
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [sendingReview, setSendingReview] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/jobs/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setJob(data.job);
      setForm({
        service_type: data.job.service_type || '',
        crew_name: data.job.crew_name || '',
        scheduled_date: data.job.scheduled_date ? data.job.scheduled_date.slice(0, 10) : '',
        completed_date: data.job.completed_date ? data.job.completed_date.slice(0, 10) : '',
        notes: data.job.notes || '',
      });
    } catch { setError('Failed to load job'); }
    setLoading(false);
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  const advanceStatus = async () => {
    if (!job) return;
    const idx = JOB_STATUSES.indexOf(job.status);
    if (idx >= JOB_STATUSES.length - 1) return;
    const next = JOB_STATUSES[idx + 1];
    setUpdating(true);
    try {
      const body: any = { status: next };
      if (next === 'COMPLETE') body.completed_date = new Date().toISOString();
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      await load();
    } catch { setError('Failed to update status'); }
    setUpdating(false);
  };

  const saveEdits = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: form.service_type || null,
          crew_name: form.crew_name || null,
          scheduled_date: form.scheduled_date || null,
          completed_date: form.completed_date || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      await load();
      setEditMode(false);
    } catch { setError('Failed to save changes'); }
    setUpdating(false);
  };

  const sendReviewRequest = async () => {
    setSendingReview(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: id }),
      });
      if (!res.ok) throw new Error('Failed');
      await load();
    } catch { setError('Failed to send review request'); }
    setSendingReview(false);
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

  if (!job) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-red-400">{error || 'Job not found'}</p>
        <button onClick={() => router.push('/admin/jobs')} className="mt-4 text-blue-400 hover:underline">Back to Jobs</button>
      </div>
    );
  }

  const statusIdx = JOB_STATUSES.indexOf(job.status);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/jobs')}
            className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div className="p-2.5 bg-blue-700 rounded-xl">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Job Detail</h1>
            <p className="text-gray-400 text-sm">{job.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode && (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors">
              <Edit3 className="w-4 h-4" /> Edit
            </button>
          )}
          {statusIdx < JOB_STATUSES.length - 1 && (
            <button onClick={advanceStatus} disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Advance to {JOB_STATUSES[statusIdx + 1]}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Status Progress Bar */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {JOB_STATUSES.map((s, i) => {
            const reached = statusIdx >= i;
            const current = statusIdx === i;
            return (
              <div key={s} className="flex items-center gap-1 flex-shrink-0">
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                  current ? `${STATUS_COLORS[s]} text-white ring-2 ring-white/20` :
                  reached ? `${STATUS_COLORS[s]} text-white/80` : 'bg-gray-700 text-gray-500'
                }`}>{s.replace('_', ' ')}</div>
                {i < JOB_STATUSES.length - 1 && (
                  <div className={`w-4 h-0.5 ${reached && i < statusIdx ? 'bg-blue-500' : 'bg-gray-700'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <a href={`/admin/customers/${job.customer.id}`} className="text-white hover:text-blue-400 font-medium">{job.customer.name}</a>
            </div>
            <p className="text-sm text-gray-400 pl-6">{job.customer.phone}</p>
            {job.customer.email && <p className="text-sm text-gray-400 pl-6">{job.customer.email}</p>}
            <div className="flex items-center gap-2 pt-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-300">{job.address}</span>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Job Details</h2>
            {editMode && (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditMode(false)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
                <button onClick={saveEdits} disabled={updating}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                  {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                </button>
              </div>
            )}
          </div>
          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Service Type</label>
                <input value={form.service_type} onChange={e => setForm({ ...form, service_type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Crew</label>
                <input value={form.crew_name} onChange={e => setForm({ ...form, crew_name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Scheduled Date</label>
                  <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Completed Date</label>
                  <input type="date" value={form.completed_date} onChange={e => setForm({ ...form, completed_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">Service Type:</span>
                <span className="text-white">{job.service_type || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">Crew:</span>
                <span className="text-white">{job.crew_name || 'Not assigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">Scheduled:</span>
                <span className="text-white">{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'Not scheduled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">Completed:</span>
                <span className="text-white">{job.completed_date ? new Date(job.completed_date).toLocaleDateString() : 'Not completed'}</span>
              </div>
              {job.notes && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-gray-400 text-xs mb-1">Notes</p>
                  <p className="text-gray-300">{job.notes}</p>
                </div>
              )}
              <div className="pt-2 border-t border-gray-700 text-xs text-gray-500">
                <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Created {new Date(job.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photos Grid */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
          <Camera className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Photos ({job.photos.length})</h2>
        </div>
        {job.photos.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No photos uploaded yet.</div>
        ) : (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {job.photos.map(photo => (
              <div key={photo.id} className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors"
                onClick={() => setLightbox(photo.url)}>
                <img src={photo.url} alt={photo.caption || 'Job photo'} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div>
                    <span className="text-xs text-white/80 bg-black/50 rounded px-1.5 py-0.5">{photo.type}</span>
                    {photo.caption && <p className="text-xs text-white mt-1">{photo.caption}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700">
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={lightbox} alt="Full size" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Review Request */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Review Request</h2>
        </div>
        {job.review_request ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Sent via:</span>
              <span className="text-white">{job.review_request.sent_via}</span>
              <span className="text-gray-500">on {new Date(job.review_request.sent_at).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-4 text-xs">
              <span className={job.review_request.opened_at ? 'text-green-400' : 'text-gray-500'}>
                Opened: {job.review_request.opened_at ? new Date(job.review_request.opened_at).toLocaleDateString() : 'No'}
              </span>
              <span className={job.review_request.clicked_at ? 'text-green-400' : 'text-gray-500'}>
                Clicked: {job.review_request.clicked_at ? new Date(job.review_request.clicked_at).toLocaleDateString() : 'No'}
              </span>
              <span className={job.review_request.reviewed_at ? 'text-green-400' : 'text-gray-500'}>
                Reviewed: {job.review_request.reviewed_at ? new Date(job.review_request.reviewed_at).toLocaleDateString() : 'No'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">No review request sent yet.</p>
            {job.status === 'COMPLETE' && (
              <button onClick={sendReviewRequest} disabled={sendingReview}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                {sendingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Send Review Request
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
