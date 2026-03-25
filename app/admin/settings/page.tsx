'use client';

import { useEffect, useState } from 'react';
import {
  Settings, Save, Building2, Globe, Bell, User,
  Server, ExternalLink, CheckCircle, Phone, Mail,
} from 'lucide-react';

interface SettingsData {
  business: {
    name: string;
    phone: string;
    email: string;
    website: string;
    address: string;
  };
  google_review_link: string;
  notifications: {
    new_lead: boolean;
    estimate_approved: boolean;
    job_completed: boolean;
    payment_received: boolean;
    review_submitted: boolean;
  };
  admin: {
    email: string;
    name: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    business: {
      name: 'Paloma Home Services',
      phone: '940-241-8244',
      email: 'info@palomahomeservices.com',
      website: 'palomahomeservices.com',
      address: '',
    },
    google_review_link: '',
    notifications: {
      new_lead: true,
      estimate_approved: true,
      job_completed: true,
      payment_received: true,
      review_submitted: true,
    },
    admin: {
      email: 'info@palomahomeservices.com',
      name: 'Admin',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d && d.business) setSettings(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateBusiness = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, business: { ...prev.business, [field]: value } }));
  };

  const toggleNotification = (field: string) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: !prev.notifications[field as keyof typeof prev.notifications] },
    }));
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-6 animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 rounded-xl">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 text-sm mt-0.5">Manage your admin panel configuration</p>
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Business Information */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Business Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Business Name</label>
              <input value={settings.business.name} onChange={e => updateBusiness('name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input value={settings.business.phone} onChange={e => updateBusiness('phone', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input value={settings.business.email} onChange={e => updateBusiness('email', e.target.value)} type="email"
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input value={settings.business.website} onChange={e => updateBusiness('website', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Address</label>
              <input value={settings.business.address} onChange={e => updateBusiness('address', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* Google Review Link */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Google Review Link</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Paste your Google Business review link here. This will be sent to customers when requesting reviews.
          </p>
          <input value={settings.google_review_link}
            onChange={e => setSettings(prev => ({ ...prev, google_review_link: e.target.value }))}
            placeholder="https://g.page/r/..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>

        {/* Notifications */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Notifications</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">Choose which events trigger email notifications.</p>
          <div className="space-y-3">
            {[
              { key: 'new_lead',          label: 'New lead received',       desc: 'When a new lead is added to the system' },
              { key: 'estimate_approved',  label: 'Estimate approved',       desc: 'When a customer approves an estimate' },
              { key: 'job_completed',      label: 'Job completed',           desc: 'When a job is marked as complete' },
              { key: 'payment_received',   label: 'Payment received',        desc: 'When a payment is recorded' },
              { key: 'review_submitted',   label: 'Review submitted',        desc: 'When a customer leaves a Google review' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-white font-medium">{label}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
                <button onClick={() => toggleNotification(key)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    settings.notifications[key as keyof typeof settings.notifications] ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.notifications[key as keyof typeof settings.notifications] ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Account */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Admin Account</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name</label>
              <input value={settings.admin.name}
                onChange={e => setSettings(prev => ({ ...prev, admin: { ...prev.admin, name: e.target.value } }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input value={settings.admin.email}
                onChange={e => setSettings(prev => ({ ...prev, admin: { ...prev.admin, email: e.target.value } }))}
                type="email"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">System Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Application',   value: 'Paloma Home Services Admin' },
              { label: 'Domain',        value: 'admin.palomahomeservices.com' },
              { label: 'Port',          value: '3021' },
              { label: 'PM2 Process',   value: 'paloma-admin' },
              { label: 'Framework',     value: 'Next.js' },
              { label: 'Database',      value: 'PostgreSQL (Prisma)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-700/50">
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-mono text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
