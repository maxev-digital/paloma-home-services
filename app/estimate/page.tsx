'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';

/* ── Types ──────────────────────────────────────────────────────────────────── */
interface LineItem {
  id: string;
  label: string;
  unit: string;
  rate: number;
  category: string;
}

interface SelectedItem {
  item: LineItem;
  qty: number;
}

/* ── Constants ──────────────────────────────────────────────────────────────── */
const STEPS = ['Property & Photos', 'Select Services', 'Contact Info', 'Review & Submit'];

const LOT_SIZES = [
  { value: 'small', label: 'Small (under 5,000 sqft)' },
  { value: 'medium', label: 'Medium (5,000 – 10,000 sqft)' },
  { value: 'large', label: 'Large (10,000 – 20,000 sqft)' },
  { value: 'xl', label: 'XL (20,000+ sqft)' },
];

const PROPERTY_TYPES = ['House', 'Townhouse', 'Condo', 'Commercial'];

const URGENCY_OPTIONS = [
  { value: 'asap', label: 'ASAP' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'just_pricing', label: 'Just Getting Prices' },
  { value: 'flexible', label: 'Flexible' },
];

const REFERRAL_SOURCES = [
  'Google',
  'Facebook',
  'Neighbor/Referral',
  'Nextdoor',
  'Yard Sign',
  'Repeat Customer',
  'Other',
];

const MAX_PHOTOS = 5;

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function fmtRate(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function fmtTotal(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function stepForUnit(unit: string): number {
  const u = unit.toUpperCase();
  if (u === 'SQFT' || u === 'LF' || u === 'HR') return 0.1;
  return 1;
}

function mapEmbedUrl(address: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=k&z=18&output=embed`;
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════════════════════════ */
export default function EstimatePage() {
  const [step, setStep] = useState(0);

  /* ── Step 0: Property & Photos ─────────────────────────────────────────── */
  const [address, setAddress] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [lotSize, setLotSize] = useState('');
  const [stories, setStories] = useState('1');
  const [propertyType, setPropertyType] = useState('House');
  const [photos, setPhotos] = useState<{ file: File; dataUrl: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [urgency, setUrgency] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /* ── Step 1: Services ──────────────────────────────────────────────────── */
  const [categories, setCategories] = useState<Record<string, LineItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Step 2: Contact ───────────────────────────────────────────────────── */
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [referralSource, setReferralSource] = useState('');

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  /* ── Fetch line items ──────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/line-items');
        const data = await res.json();
        setCategories(data.categories || {});
        setExpandedCats(new Set(Object.keys(data.categories || {})));
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Derived data ──────────────────────────────────────────────────────── */
  const allItems = useMemo(() => Object.values(categories).flat(), [categories]);

  const selectedItems: SelectedItem[] = useMemo(() => {
    return Object.entries(selections)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = allItems.find(i => i.id === id);
        return item ? { item, qty } : null;
      })
      .filter(Boolean) as SelectedItem[];
  }, [selections, allItems]);

  const grandTotal = useMemo(
    () => selectedItems.reduce((sum, s) => sum + s.item.rate * s.qty, 0),
    [selectedItems],
  );

  const selectedByCategory = useMemo(() => {
    const grouped: Record<string, SelectedItem[]> = {};
    for (const s of selectedItems) {
      if (!grouped[s.item.category]) grouped[s.item.category] = [];
      grouped[s.item.category].push(s);
    }
    return grouped;
  }, [selectedItems]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    const result: Record<string, LineItem[]> = {};
    for (const [cat, items] of Object.entries(categories)) {
      const filtered = items.filter(
        i => i.label.toLowerCase().includes(q) || cat.toLowerCase().includes(q),
      );
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [categories, searchQuery]);

  /* ── Qty helpers ───────────────────────────────────────────────────────── */
  function setQty(id: string, qty: number) {
    setSelections(prev => ({ ...prev, [id]: Math.max(0, Math.round(qty * 10) / 10) }));
  }

  function toggleCat(cat: string) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  /* ── Address map trigger ───────────────────────────────────────────────── */
  const handleAddressBlur = useCallback(() => {
    if (address.trim().length > 5) {
      setShowMap(true);
    }
  }, [address]);

  /* ── Photo upload ──────────────────────────────────────────────────────── */
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const remaining = MAX_PHOTOS - photos.length;
      const toProcess = Array.from(files).slice(0, remaining);

      toProcess.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
          setPhotos(prev => {
            if (prev.length >= MAX_PHOTOS) return prev;
            return [...prev, { file, dataUrl: reader.result as string }];
          });
        };
        reader.readAsDataURL(file);
      });
    },
    [photos.length],
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  /* ── Validation ────────────────────────────────────────────────────────── */
  const canNext0 = address.trim().length > 0 && lotSize !== '' && urgency !== '';
  const canNext1 = selectedItems.length > 0;
  const canNext2 = name.trim().length > 0 && phone.trim().length > 0;

  /* ── Navigate ──────────────────────────────────────────────────────────── */
  function goTo(s: number) {
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── Submit ────────────────────────────────────────────────────────────── */
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        contact: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          referralSource: referralSource || null,
        },
        project: {
          address: address.trim(),
          lotSize,
          stories: parseInt(stories),
          propertyType,
          urgency,
          notes: notes.trim() || null,
        },
        photos: photos.map(p => p.dataUrl),
        lineItems: selectedItems.map(s => ({
          id: s.item.id,
          label: s.item.label,
          category: s.item.category,
          unit: s.item.unit,
          qty: s.qty,
          rate: s.item.rate,
          lineTotal: s.item.rate * s.qty,
        })),
        totals: { total: grandTotal },
      };
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════════════════════ */

  /* ── Success Screen ────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-16">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25" />
            <div className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                  className="animate-[draw_0.5s_ease-in-out_0.3s_both]"
                  style={{
                    strokeDasharray: 30,
                    strokeDashoffset: 30,
                    animation: 'draw 0.5s ease-in-out 0.3s forwards',
                  }}
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Estimate Request Submitted!</h2>
          <p className="text-gray-600 mb-2">Thank you, {name}.</p>
          <p className="text-gray-500 mb-8">
            We&apos;ll review your request and contact you within 24 hours to discuss your project.
          </p>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
            <p className="text-sm text-gray-500 mb-1">Estimated Total</p>
            <p className="text-4xl font-bold text-blue-600">{fmtTotal(grandTotal)}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              Questions? Call us anytime at{' '}
              <a href="tel:9402418244" className="font-bold hover:underline">
                (940) 241-8244
              </a>
            </p>
          </div>
          <style>{`
            @keyframes draw {
              to { stroke-dashoffset: 0; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Progress Bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      if (i < step) goTo(i);
                    }}
                    disabled={i > step}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      i < step
                        ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                        : i === step
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {i < step ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </button>
                  <span
                    className={`text-xs mt-1.5 hidden sm:block font-medium transition-colors ${
                      i <= step ? 'text-blue-700' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-1 mx-3 rounded-full overflow-hidden bg-gray-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                      style={{ width: i < step ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        {/* ════════════════════════════════════════════════════════════════════
           Step 0: Property & Photos
           ════════════════════════════════════════════════════════════════════ */}
        {step === 0 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Property &amp; Photos</h1>
              <p className="text-gray-500 mt-2">Tell us about your property and what you need done.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left column: Address & Map */}
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                  <h2 className="text-lg font-semibold text-gray-900">Property Address</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        value={address}
                        onChange={e => {
                          setAddress(e.target.value);
                          setShowMap(false);
                        }}
                        onBlur={handleAddressBlur}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddressBlur();
                        }}
                        placeholder="123 Main St, Little Elm, TX 75068"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Press Enter or click away to load map preview
                    </p>
                  </div>

                  {/* Map embed */}
                  {showMap && address.trim().length > 5 && (
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <iframe
                        title="Property Map"
                        src={mapEmbedUrl(address)}
                        width="100%"
                        height="220"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>

                {/* Photo Upload */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
                  <p className="text-sm text-gray-500">
                    Upload photos of the areas you&apos;d like serviced (up to {MAX_PHOTOS}).
                  </p>

                  <div
                    onDrop={handleFileDrop}
                    onDragOver={e => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      dragOver
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    } ${photos.length >= MAX_PHOTOS ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <svg
                      className="w-10 h-10 text-gray-400 mx-auto mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-700">
                      Drag &amp; drop photos here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => {
                        if (e.target.files) processFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {photos.map((photo, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={photo.dataUrl}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column: Property Details */}
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                  <h2 className="text-lg font-semibold text-gray-900">Property Details</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approximate Lot Size <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={lotSize}
                      onChange={e => setLotSize(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select lot size...</option>
                      {LOT_SIZES.map(s => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Stories</label>
                    <div className="flex gap-3">
                      {['1', '2', '3'].map(s => (
                        <button
                          key={s}
                          onClick={() => setStories(s)}
                          className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                            stories === s
                              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {s} {parseInt(s) === 1 ? 'Story' : 'Stories'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {PROPERTY_TYPES.map(t => (
                        <button
                          key={t}
                          onClick={() => setPropertyType(t)}
                          className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                            propertyType === t
                              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                  <h2 className="text-lg font-semibold text-gray-900">Project Notes</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Describe what you need done
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Tell us about your project, any access requirements, or special requests..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When do you need this done? <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {URGENCY_OPTIONS.map(opt => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => setUrgency(opt.value)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all w-full text-left ${
                            urgency === opt.value
                              ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              urgency === opt.value ? 'border-blue-600' : 'border-gray-300'
                            }`}
                          >
                            {urgency === opt.value && (
                              <div className="w-2 h-2 rounded-full bg-blue-600" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next button */}
            <div className="flex justify-end mt-8">
              <button
                onClick={() => goTo(1)}
                disabled={!canNext0}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Next: Select Services
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
           Step 1: Select Services
           ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Select Services</h1>
              <p className="text-gray-500 mt-2">Choose the services and quantities for your estimate.</p>
            </div>

            {/* Search */}
            <div className="mb-5">
              <div className="relative max-w-md mx-auto">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search services..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-4" />
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(filteredCategories).map(([cat, items]) => {
                  const isOpen = expandedCats.has(cat);
                  const catCount = items.filter(i => (selections[i.id] || 0) > 0).length;
                  return (
                    <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <button
                        onClick={() => toggleCat(cat)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-gray-900 capitalize">{cat}</span>
                          {catCount > 0 && (
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                              {catCount} selected
                            </span>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-100">
                          {items.map((item, idx) => {
                            const qty = selections[item.id] || 0;
                            const unitStep = stepForUnit(item.unit);
                            return (
                              <div
                                key={item.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 gap-3 transition-colors ${
                                  idx > 0 ? 'border-t border-gray-50' : ''
                                } ${qty > 0 ? 'bg-blue-50/60' : ''}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                  <p className="text-xs text-gray-500">
                                    {fmtRate(item.rate)}{' '}
                                    <span className="text-gray-400">/ {item.unit}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {qty > 0 && (
                                    <span className="text-sm font-semibold text-blue-700 mr-2 w-20 text-right">
                                      {fmtTotal(item.rate * qty)}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setQty(item.id, qty - unitStep)}
                                    disabled={qty === 0}
                                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                                    </svg>
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    step={unitStep}
                                    value={qty || ''}
                                    placeholder="0"
                                    onChange={e => setQty(item.id, parseFloat(e.target.value) || 0)}
                                    className="w-16 text-center border border-gray-300 rounded-lg py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <button
                                    onClick={() => setQty(item.id, qty + unitStep)}
                                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {Object.keys(filteredCategories).length === 0 && searchQuery && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-sm">No services match &quot;{searchQuery}&quot;</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-blue-600 hover:underline text-sm mt-2"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sticky running total bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
              <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => goTo(0)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    Back
                  </button>
                  <div>
                    <p className="text-sm text-gray-500">
                      {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{fmtTotal(grandTotal)}</p>
                  </div>
                </div>
                <button
                  onClick={() => goTo(2)}
                  disabled={!canNext1}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  Next: Contact Info
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
           Step 2: Contact Information
           ════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Contact Information</h1>
              <p className="text-gray-500 mt-2">How can we reach you about your estimate?</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(940) 555-1234"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">We&apos;ll email you a detailed estimate.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How did you hear about us?
                </label>
                <select
                  value={referralSource}
                  onChange={e => setReferralSource(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select one...</option>
                  {REFERRAL_SOURCES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => goTo(1)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => goTo(3)}
                disabled={!canNext2}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Review Estimate
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
           Step 3: Review & Submit
           ════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Review &amp; Submit</h1>
              <p className="text-gray-500 mt-2">Please review everything before submitting your estimate request.</p>
            </div>

            {/* Property section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Property</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Address</p>
                    <p className="text-sm font-medium text-gray-900">{address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Property Type</p>
                    <p className="text-sm font-medium text-gray-900">{propertyType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Lot Size</p>
                    <p className="text-sm font-medium text-gray-900">
                      {LOT_SIZES.find(l => l.value === lotSize)?.label || lotSize}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Stories</p>
                    <p className="text-sm font-medium text-gray-900">{stories}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Urgency</p>
                    <p className="text-sm font-medium text-gray-900">
                      {URGENCY_OPTIONS.find(u => u.value === urgency)?.label || urgency}
                    </p>
                  </div>
                </div>

                {/* Map thumbnail */}
                {address.trim().length > 5 && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                    <iframe
                      title="Property Map"
                      src={mapEmbedUrl(address)}
                      width="100%"
                      height="160"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}

                {/* Photos */}
                {photos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 mb-2">Photos ({photos.length})</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo.dataUrl}
                          alt={`Photo ${idx + 1}`}
                          className="w-20 h-20 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {notes && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                    <p className="text-sm text-gray-700">{notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Line items section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Selected Services</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {Object.entries(selectedByCategory).map(([cat, items]) => (
                  <div key={cat} className="px-6 py-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 capitalize">
                      {cat}
                    </h4>
                    <div className="space-y-2">
                      {items.map(s => (
                        <div key={s.item.id} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-900">{s.item.label}</span>
                            <span className="text-gray-400 ml-2 text-xs">
                              {s.qty} {s.item.unit} &times; {fmtRate(s.item.rate)}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900 ml-4">{fmtTotal(s.item.rate * s.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand total */}
              <div className="border-t-2 border-blue-100 px-6 py-5 flex items-center justify-between bg-blue-50">
                <span className="text-lg font-bold text-gray-900">Estimated Total</span>
                <span className="text-3xl font-bold text-blue-600">{fmtTotal(grandTotal)}</span>
              </div>
            </div>

            {/* Contact section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Contact</h3>
              </div>
              <div className="px-6 py-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Name</p>
                  <p className="text-sm font-medium text-gray-900">{name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{phone}</p>
                </div>
                {email && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <p className="text-sm font-medium text-gray-900">{email}</p>
                  </div>
                )}
                {referralSource && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">How they found us</p>
                    <p className="text-sm font-medium text-gray-900">{referralSource}</p>
                  </div>
                )}
              </div>
            </div>

            {submitError && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                {submitError}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => goTo(2)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 shadow-sm flex items-center gap-2 text-lg"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Estimate Request'
                )}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              This estimate is for planning purposes. Final pricing may vary based on an on-site assessment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
