'use client';

import { useEffect, useState } from 'react';
import {
  Star, Send, CheckCircle, Clock, ExternalLink,
  Phone, MapPin, MessageSquare,
} from 'lucide-react';

interface PendingJob {
  id: string;
  address: string;
  completed_date: string;
  customer: { id: string; name: string; phone: string; email: string | null };
}

interface SentReview {
  id: string;
  job_id: string;
  address: string;
  sent_at: string;
  status: 'SENT' | 'CLICKED' | 'REVIEWED';
  customer: { name: string; phone: string };
}

interface ReviewsData {
  pending: PendingJob[];
  sent: SentReview[];
  stats: {
    total_sent: number;
    clicked: number;
    reviewed: number;
    click_rate: number;
    review_rate: number;
  };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_STYLES: Record<string, string> = {
  SENT:     'bg-blue-900 text-blue-300',
  CLICKED:  'bg-yellow-900 text-yellow-300',
  REVIEWED: 'bg-green-900 text-green-300',
};

export default function ReviewsPage() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/reviews');
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendReviewRequest = async (jobId: string) => {
    setSending(jobId);
    await fetch('/api/admin/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    });
    setSending(null);
    load();
  };

  const pending = data?.pending || [];
  const sent = data?.sent || [];
  const stats = data?.stats || { total_sent: 0, clicked: 0, reviewed: 0, click_rate: 0, review_rate: 0 };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-700 rounded-xl">
          <Star className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Review Requests</h1>
          <p className="text-gray-400 text-sm mt-0.5">Request Google reviews from completed jobs</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Sent',   value: stats.total_sent, icon: Send,        color: 'bg-blue-600' },
          { label: 'Clicked',      value: stats.clicked,    icon: ExternalLink, color: 'bg-yellow-600' },
          { label: 'Reviewed',     value: stats.reviewed,   icon: Star,        color: 'bg-green-600' },
          { label: 'Click Rate',   value: `${stats.click_rate.toFixed(0)}%`, icon: CheckCircle, color: 'bg-blue-700' },
          { label: 'Review Rate',  value: `${stats.review_rate.toFixed(0)}%`, icon: MessageSquare, color: 'bg-emerald-600' },
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

      {/* Pending Jobs - Ready for Review Request */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Ready for Review Request ({pending.length})
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">All completed jobs have been sent review requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(job => (
              <div key={job.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-white">{job.customer.name}</span>
                      <span className="text-xs text-gray-500">Completed {fmtDate(job.completed_date)}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{job.customer.phone}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.address}</span>
                    </div>
                  </div>
                  <button onClick={() => sendReviewRequest(job.id)}
                    disabled={sending === job.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" />
                    {sending === job.id ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Review Requests Table */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Sent Requests ({sent.length})
        </h2>
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sent</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-700/50">
                    {[...Array(4)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : sent.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">No review requests sent yet.</td></tr>
              ) : sent.map(r => (
                <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{r.customer.name}</div>
                    <div className="text-gray-400 text-xs">{r.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs max-w-48 truncate">{r.address}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[r.status] || 'bg-gray-700 text-gray-300'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(r.sent_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
