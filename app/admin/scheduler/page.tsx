'use client';

import { useEffect, useState } from 'react';
import { Calendar, Play, Pause, RefreshCw, Settings, Clock, Users, Mail } from 'lucide-react';

interface SchedulerConfig {
  enabled: boolean;
  daily_cap: number;
  cooldown_days: number;
  default_template_id: string | null;
  default_template_slug: string | null;
}

interface RunHistoryEntry {
  id: string;
  started_at: string;
  finished_at: string | null;
  sent: number;
  failed: number;
  skipped: number;
  status: string;
}

interface QueueInfo {
  depth: number;
  next_eligible: number;
}

interface TemplateOption {
  id: string;
  slug: string;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function SchedulerPage() {
  const [config, setConfig] = useState<SchedulerConfig | null>(null);
  const [history, setHistory] = useState<RunHistoryEntry[]>([]);
  const [queue, setQueue] = useState<QueueInfo | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dailyCap, setDailyCap] = useState(50);
  const [cooldownDays, setCooldownDays] = useState(7);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/outreach/scheduler');
    const data = await res.json();
    setConfig(data.config || null);
    setHistory(data.history || []);
    setQueue(data.queue || null);
    if (data.config) {
      setDailyCap(data.config.daily_cap);
      setCooldownDays(data.config.cooldown_days);
      setSelectedTemplate(data.config.default_template_id || '');
    }
    // load template options
    const tRes = await fetch('/api/admin/templates?active=true');
    const tData = await tRes.json();
    setTemplates(tData.templates || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleEnabled = async () => {
    if (!config) return;
    setSaving(true);
    await fetch('/api/admin/outreach/scheduler', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !config.enabled }),
    });
    setSaving(false);
    load();
  };

  const saveSettings = async () => {
    setSaving(true);
    await fetch('/api/admin/outreach/scheduler', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        daily_cap: dailyCap,
        cooldown_days: cooldownDays,
        default_template_id: selectedTemplate || null,
      }),
    });
    setSaving(false);
    load();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-700 rounded-xl">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Automation</h1>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="h-6 bg-gray-700 rounded animate-pulse w-1/4 mb-3" />
              <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-700 rounded-xl">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Outreach Automation</h1>
          <p className="text-gray-400 text-sm mt-0.5">Automated email scheduling and queue management</p>
        </div>
      </div>

      {/* Toggle + Queue Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400">Scheduler Status</h3>
            <button onClick={toggleEnabled} disabled={saving}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                config?.enabled
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}>
              {config?.enabled ? <><Pause className="w-4 h-4" /> Running</> : <><Play className="w-4 h-4" /> Paused</>}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {config?.enabled ? 'The scheduler is active and processing the queue.' : 'The scheduler is paused. No emails will be sent automatically.'}
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-400">Queue Depth</h3>
          </div>
          <p className="text-3xl font-bold text-white">{queue?.depth ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">prospects awaiting outreach</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-400">Next Eligible</h3>
          </div>
          <p className="text-3xl font-bold text-white">{queue?.next_eligible ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">ready to send today</p>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-white">Scheduler Settings</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Daily Cap</label>
            <input type="number" value={dailyCap} onChange={e => setDailyCap(parseInt(e.target.value) || 0)} min={1} max={500}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            <p className="text-xs text-gray-500 mt-1">Max emails per cron run</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Cooldown Days</label>
            <input type="number" value={cooldownDays} onChange={e => setCooldownDays(parseInt(e.target.value) || 0)} min={1} max={90}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            <p className="text-xs text-gray-500 mt-1">Days between emails to same prospect</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Default Template</label>
            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="">None</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.slug}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Template used for automated sends</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={saveSettings} disabled={saving}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Cron Instructions */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-white">Cron Endpoint</h3>
        </div>
        <p className="text-sm text-gray-400 mb-3">
          Set up a cron job to call this endpoint on your desired schedule. The scheduler will process the queue each time it is triggered.
        </p>
        <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-blue-400 border border-gray-700">
          POST https://admin.palomahomeservices.com/api/admin/outreach/cron
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Include your <code className="text-gray-400 bg-gray-900 px-1 rounded">Authorization: Bearer &lt;CRON_SECRET&gt;</code> header.
          Recommended frequency: once daily at 9 AM CT.
        </p>
      </div>

      {/* Run History */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="font-semibold text-white">Run History</h3>
          <button onClick={load} className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Sent</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Failed</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Skipped</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No runs yet.</td>
              </tr>
            ) : history.map(r => (
              <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3 text-gray-300 text-xs">{fmtDate(r.started_at)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fmtTime(r.started_at)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-green-400 font-semibold">{r.sent}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${r.failed > 0 ? 'text-red-400' : 'text-gray-500'}`}>{r.failed}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-gray-400">{r.skipped}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    r.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    r.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                    r.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-600/30 text-gray-400'
                  }`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
