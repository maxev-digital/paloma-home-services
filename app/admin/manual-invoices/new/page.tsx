'use client';

import { useState } from 'react';
import { BookOpen, Plus, Trash2, ArrowLeft } from 'lucide-react';

interface LineItem {
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
}

const UNITS = ['ea', 'hr', 'sq ft', 'ln ft', 'job', 'day'] as const;

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

const emptyLine: LineItem = { description: '', qty: 1, unit: 'ea', unit_price: 0 };

export default function NewManualInvoicePage() {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const addLine = () => {
    setLines(prev => [...prev, { ...emptyLine }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const lineAmount = (l: LineItem) => l.qty * l.unit_price;
  const totalAmount = lines.reduce((sum, l) => sum + lineAmount(l), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) { setError('Customer name is required.'); return; }
    if (lines.every(l => !l.description)) { setError('At least one line item is required.'); return; }
    setError('');
    setSaving(true);

    const res = await fetch('/api/admin/manual-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        customer_address: customerAddress,
        property_address: propertyAddress,
        notes,
        payment_terms: paymentTerms,
        due_date: dueDate || null,
        line_items: lines.filter(l => l.description),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      window.location.href = `/admin/manual-invoices/${data.id}`;
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to create invoice.');
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/manual-invoices"
          className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div className="p-2.5 bg-blue-700 rounded-xl">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">New Manual Invoice</h1>
          <p className="text-gray-400 text-sm mt-0.5">Create a custom invoice</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Customer Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Customer Name *</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Phone</label>
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} type="email"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Customer Address</label>
              <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* Property Address */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Property Address</h3>
          <input value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)}
            placeholder="Service location (if different from customer address)"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
        </div>

        {/* Line Items */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Line Items</h3>
            <button type="button" onClick={addLine}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700/30 hover:bg-blue-700/50 text-blue-400 text-xs font-semibold rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Line
            </button>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-1 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5">
                  <input value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="col-span-1">
                  <input type="number" value={line.qty} onChange={e => updateLine(idx, 'qty', parseFloat(e.target.value) || 0)}
                    min={0} step="0.01"
                    className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white text-center focus:outline-none focus:border-blue-500" />
                </div>
                <div className="col-span-2">
                  <select value={line.unit} onChange={e => updateLine(idx, 'unit', e.target.value)}
                    className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" value={line.unit_price} onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    min={0} step="0.01"
                    className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white text-right focus:outline-none focus:border-blue-500" />
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-sm font-semibold text-white">{fmtMoney(lineAmount(line))}</span>
                </div>
                <div className="col-span-1 text-center">
                  <button type="button" onClick={() => removeLine(idx)} disabled={lines.length <= 1}
                    className="p-1.5 text-gray-500 hover:text-red-400 disabled:opacity-30 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-700">
            <div className="text-right">
              <span className="text-sm text-gray-400 mr-4">Total:</span>
              <span className="text-xl font-bold text-white">{fmtMoney(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Notes & Terms</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Payment Terms</label>
              <input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Additional notes visible on the invoice..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <a href="/admin/manual-invoices"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg transition-colors">
            Cancel
          </a>
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
