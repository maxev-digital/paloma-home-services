'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, FileText, User, MapPin, Clock, DollarSign,
  Download, ChevronDown, ChevronUp, Loader2, CheckCircle2,
  Send, PenLine, CreditCard, XCircle, Receipt,
} from 'lucide-react';

const STATUS_FLOW = ['DRAFT', 'SENT', 'APPROVED', 'DECLINED', 'INVOICED', 'PAID'] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-600 text-gray-200',
  SENT: 'bg-blue-600 text-blue-100',
  APPROVED: 'bg-green-600 text-green-100',
  DECLINED: 'bg-red-600 text-red-100',
  INVOICED: 'bg-yellow-600 text-yellow-100',
  PAID: 'bg-emerald-600 text-emerald-100',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  DRAFT: PenLine, SENT: Send, APPROVED: CheckCircle2,
  DECLINED: XCircle, INVOICED: Receipt, PAID: DollarSign,
};

const NEXT_STATUS: Record<string, string> = {
  DRAFT: 'SENT', SENT: 'APPROVED', APPROVED: 'INVOICED', INVOICED: 'PAID',
};

interface LineItem {
  id: string; label: string; category: string; unit: string;
  qty: number; rate: number; cost: number; line_total: number; line_cost: number;
}
interface ChangeOrder {
  id: string; note: string | null; created_at: string; new_total: number;
  items: { id: string; label: string; qty_before: number; qty_after: number; rate: number; total_before: number; total_after: number }[];
}
interface PaymentScheduleItem {
  id: string; sort_order: number; label: string; amount_type: string; amount_value: number; due_trigger: string;
}
interface ContractSignature {
  id: string; signer_name: string; signed_at: string;
}
interface JobCost {
  id: string; category: string; description: string; amount: number;
}
interface Invoice {
  id: string; invoice_no: string; amount_due: number; amount_paid: number; status: string;
}
interface Estimate {
  id: string; customer: { id: string; name: string; phone: string; email: string | null };
  address: string; total: number; cost_total: number; margin: number; margin_pct: number;
  status: Status; notes: string | null; created_at: string; sent_at: string | null; approved_at: string | null;
  line_items: LineItem[]; change_orders: ChangeOrder[];
  payment_schedule: PaymentScheduleItem[]; signature: ContractSignature | null;
  job_costs: JobCost[]; invoice: Invoice | null;
}

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number) => n.toFixed(1) + '%';

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [est, setEst] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [costsOpen, setCostsOpen] = useState(false);
  const [changeOrdersOpen, setChangeOrdersOpen] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/estimates/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setEst(data.estimate);
    } catch { setError('Failed to load estimate'); }
    setLoading(false);
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  const advanceStatus = async () => {
    if (!est) return;
    const next = NEXT_STATUS[est.status];
    if (!next) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/estimates/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setEst(prev => prev ? { ...prev, ...data.estimate } : prev);
    } catch { setError('Failed to update status'); }
    setUpdating(false);
  };

  const generateInvoice = async () => {
    if (!est) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/estimates/${id}/generate-invoice`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      await load();
    } catch { setError('Failed to generate invoice'); }
    setUpdating(false);
  };

  const downloadPdf = () => {
    window.open(`/api/admin/estimates/${id}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-7 w-64 bg-gray-700 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-4 h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!est) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-red-400">{error || 'Estimate not found'}</p>
        <button onClick={() => router.push('/admin/estimates')} className="mt-4 text-blue-400 hover:underline">Back to Estimates</button>
      </div>
    );
  }

  // Group line items by category
  const grouped = est.line_items.reduce<Record<string, LineItem[]>>((acc, li) => {
    (acc[li.category] = acc[li.category] || []).push(li);
    return acc;
  }, {});

  const totalCosts = est.job_costs.reduce((s, c) => s + c.amount, 0);
  const costsByCategory = est.job_costs.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + c.amount;
    return acc;
  }, {});

  const Icon = STATUS_ICONS[est.status] || FileText;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/estimates')}
            className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div className="p-2.5 bg-blue-700 rounded-xl">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Estimate Detail</h1>
            <p className="text-gray-400 text-sm">ID: {id.slice(0, 12)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadPdf}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors">
            <Download className="w-4 h-4" /> PDF
          </button>
          {est.status === 'APPROVED' && !est.invoice && (
            <button onClick={generateInvoice} disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              <Receipt className="w-4 h-4" /> Generate Invoice
            </button>
          )}
          {NEXT_STATUS[est.status] && (
            <button onClick={advanceStatus} disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              Mark as {NEXT_STATUS[est.status]}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Status Bar */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FLOW.filter(s => s !== 'DECLINED').map((s, i, arr) => {
            const reached = STATUS_FLOW.indexOf(est.status) >= STATUS_FLOW.indexOf(s);
            return (
              <div key={s} className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${reached ? STATUS_COLORS[s] : 'bg-gray-700 text-gray-500'}`}>
                  {s}
                </span>
                {i < arr.length - 1 && <div className={`w-8 h-0.5 ${reached ? 'bg-blue-600' : 'bg-gray-700'}`} />}
              </div>
            );
          })}
          {est.status === 'DECLINED' && (
            <span className="ml-4 px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-red-100">DECLINED</span>
          )}
        </div>
      </div>

      {/* Top row: Customer + Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <a href={`/admin/customers/${est.customer.id}`} className="text-white hover:text-blue-400 font-medium">{est.customer.name}</a>
            </div>
            <p className="text-sm text-gray-400 pl-6">{est.customer.phone}</p>
            {est.customer.email && <p className="text-sm text-gray-400 pl-6">{est.customer.email}</p>}
            <div className="flex items-center gap-2 pt-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-300">{est.address}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Created {new Date(est.created_at).toLocaleDateString()}</div>
            {est.sent_at && <div>Sent {new Date(est.sent_at).toLocaleDateString()}</div>}
            {est.approved_at && <div>Approved {new Date(est.approved_at).toLocaleDateString()}</div>}
          </div>
        </div>

        {/* Totals */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Estimate Totals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total (Revenue)</p>
              <p className="text-xl font-bold text-white">{fmt(est.total)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Cost Total</p>
              <p className="text-xl font-bold text-gray-300">{fmt(est.cost_total)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Margin</p>
              <p className="text-xl font-bold text-green-400">{fmt(est.margin)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Margin %</p>
              <p className="text-xl font-bold text-green-400">{pct(est.margin_pct)}</p>
            </div>
          </div>
          {est.notes && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-300">{est.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                <th className="text-left px-5 py-3">Item</th>
                <th className="text-left px-3 py-3">Unit</th>
                <th className="text-right px-3 py-3">Qty</th>
                <th className="text-right px-3 py-3">Rate</th>
                <th className="text-right px-3 py-3">Cost</th>
                <th className="text-right px-3 py-3">Line Total</th>
                <th className="text-right px-5 py-3">Line Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([cat, items]) => (
                <Fragment key={cat}>
                  <tr className="bg-gray-750">
                    <td colSpan={7} className="px-5 py-2 text-xs font-bold text-blue-400 uppercase tracking-wider bg-gray-900/40">
                      {cat}
                    </td>
                  </tr>
                  {items.map(li => (
                    <tr key={li.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="px-5 py-2.5 text-white">{li.label}</td>
                      <td className="px-3 py-2.5 text-gray-400">{li.unit}</td>
                      <td className="px-3 py-2.5 text-gray-300 text-right">{li.qty}</td>
                      <td className="px-3 py-2.5 text-gray-300 text-right">{fmt(li.rate)}</td>
                      <td className="px-3 py-2.5 text-gray-400 text-right">{fmt(li.cost)}</td>
                      <td className="px-3 py-2.5 text-white text-right font-medium">{fmt(li.line_total)}</td>
                      <td className="px-5 py-2.5 text-gray-400 text-right">{fmt(li.line_cost)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-600 font-semibold">
                <td colSpan={5} className="px-5 py-3 text-right text-gray-400">Totals</td>
                <td className="px-3 py-3 text-right text-white">{fmt(est.total)}</td>
                <td className="px-5 py-3 text-right text-gray-300">{fmt(est.cost_total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Change Orders */}
      {est.change_orders.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <button onClick={() => setChangeOrdersOpen(!changeOrdersOpen)}
            className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Change Orders ({est.change_orders.length})
            </h2>
            {changeOrdersOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {changeOrdersOpen && (
            <div className="p-5 space-y-4">
              {est.change_orders.map(co => (
                <div key={co.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{new Date(co.created_at).toLocaleDateString()}</span>
                    <span className="text-sm font-semibold text-white">New Total: {fmt(co.new_total)}</span>
                  </div>
                  {co.note && <p className="text-sm text-gray-300 mb-3">{co.note}</p>}
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left pb-1">Item</th>
                        <th className="text-right pb-1">Before</th>
                        <th className="text-right pb-1">After</th>
                        <th className="text-right pb-1">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {co.items.map(it => (
                        <tr key={it.id} className="text-gray-300">
                          <td className="py-1">{it.label}</td>
                          <td className="text-right">{it.qty_before} @ {fmt(it.rate)} = {fmt(it.total_before)}</td>
                          <td className="text-right">{it.qty_after} @ {fmt(it.rate)} = {fmt(it.total_after)}</td>
                          <td className={`text-right font-medium ${it.total_after - it.total_before >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {it.total_after - it.total_before >= 0 ? '+' : ''}{fmt(it.total_after - it.total_before)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Schedule */}
      {est.payment_schedule && est.payment_schedule.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Payment Schedule</h2>
          </div>
          <div className="p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
                  <th className="text-left pb-2">#</th>
                  <th className="text-left pb-2">Milestone</th>
                  <th className="text-left pb-2">Type</th>
                  <th className="text-right pb-2">Amount</th>
                  <th className="text-left pb-2">Trigger</th>
                </tr>
              </thead>
              <tbody>
                {est.payment_schedule.sort((a, b) => a.sort_order - b.sort_order).map((ps, i) => (
                  <tr key={ps.id} className="border-b border-gray-700/50 text-gray-300">
                    <td className="py-2">{i + 1}</td>
                    <td className="py-2 text-white">{ps.label}</td>
                    <td className="py-2 text-gray-400">{ps.amount_type}</td>
                    <td className="py-2 text-right">{ps.amount_type === 'PERCENT' ? `${ps.amount_value}%` : fmt(ps.amount_value)}</td>
                    <td className="py-2 text-gray-400">{ps.due_trigger || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contract Signature */}
      {est.signature && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Contract Signature</h2>
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-white font-medium">Signed by {est.signature.signer_name}</p>
              <p className="text-xs text-gray-500">{new Date(est.signature.signed_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice */}
      {est.invoice && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Invoice</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Invoice #</p>
              <p className="text-white font-medium">{est.invoice.invoice_no}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Amount Due</p>
              <p className="text-white">{fmt(est.invoice.amount_due)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Amount Paid</p>
              <p className="text-white">{fmt(est.invoice.amount_paid)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Status</p>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                est.invoice.status === 'PAID' ? 'bg-green-600 text-green-100' :
                est.invoice.status === 'PARTIAL' ? 'bg-yellow-600 text-yellow-100' :
                'bg-gray-600 text-gray-200'
              }`}>{est.invoice.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* P&L / Costs */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <button onClick={() => setCostsOpen(!costsOpen)}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            P&L / Job Costs ({est.job_costs.length})
          </h2>
          {costsOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {costsOpen && (
          <div className="p-5">
            {est.job_costs.length === 0 ? (
              <p className="text-sm text-gray-500">No costs recorded yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-lg font-bold text-white">{fmt(est.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Costs</p>
                    <p className="text-lg font-bold text-red-400">{fmt(totalCosts)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gross Profit</p>
                    <p className="text-lg font-bold text-green-400">{fmt(est.total - totalCosts)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Margin</p>
                    <p className="text-lg font-bold text-green-400">{est.total > 0 ? pct(((est.total - totalCosts) / est.total) * 100) : '0.0%'}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">By Category</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(costsByCategory).map(([cat, amt]) => (
                      <div key={cat} className="bg-gray-900/50 rounded px-3 py-1.5 text-xs">
                        <span className="text-gray-400">{cat}:</span> <span className="text-white font-medium">{fmt(amt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
                      <th className="text-left pb-2">Category</th>
                      <th className="text-left pb-2">Description</th>
                      <th className="text-right pb-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {est.job_costs.map(jc => (
                      <tr key={jc.id} className="border-b border-gray-700/50 text-gray-300">
                        <td className="py-2 text-gray-400">{jc.category}</td>
                        <td className="py-2 text-white">{jc.description}</td>
                        <td className="py-2 text-right">{fmt(jc.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

