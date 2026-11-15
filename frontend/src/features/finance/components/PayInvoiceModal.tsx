import React, { useState } from 'react';
import { Invoice, PayInvoicePayload } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import { X, CreditCard, DollarSign, Hash, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoiceId: number, payload: PayInvoicePayload) => Promise<unknown>;
  invoice: Invoice | null;
}

const PAYMENT_GATEWAYS = [
  { name: 'bKash', color: 'from-pink-500 to-rose-600', textColor: 'text-pink-600', bg: 'bg-pink-50 border-pink-200' },
  { name: 'Nagad', color: 'from-orange-500 to-amber-600', textColor: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { name: 'Rocket', color: 'from-purple-500 to-indigo-600', textColor: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  { name: 'Bank', color: 'from-blue-500 to-cyan-600', textColor: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  { name: 'Cash', color: 'from-emerald-500 to-teal-600', textColor: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { name: 'Upay', color: 'from-amber-500 to-yellow-600', textColor: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
];

export const PayInvoiceModal: React.FC<PayInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoice,
}) => {
  if (!isOpen || !invoice) return null;

  const currentDue = Number(invoice.due_amount);

  const [paymentMethod, setPaymentMethod] = useState<string>('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [payAmount, setPayAmount] = useState<number | ''>(currentDue);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enteredAmount = Number(payAmount) || 0;
  const isFullPayment = enteredAmount >= currentDue;
  const remainingAfterPayment = Math.max(0, currentDue - enteredAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredAmount || enteredAmount <= 0) {
      setError('Please enter a payment amount greater than 0.');
      return;
    }
    if (enteredAmount > currentDue) {
      setError(`Payment amount cannot exceed outstanding due of ${formatBdtCurrency(currentDue)}.`);
      return;
    }
    if (!paymentMethod.trim()) {
      setError('Please specify a payment system name (e.g. bKash, Nagad, Bank).');
      return;
    }
    if (!transactionId.trim()) {
      setError('A transaction ID is required for verification.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(invoice.id, {
        amount: enteredAmount,
        payment_method: paymentMethod.trim(),
        transaction_id: transactionId.trim(),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setError(ax.response?.data?.message || 'Payment processing failed.');
      } else {
        setError('Network error processing payment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pay Invoice #{invoice.invoice_no}</h3>
              <p className="text-xs text-slate-500">Record partial or full payment via transaction gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Assigned User:</span>
              <span className="font-semibold text-slate-900">{invoice.user?.name || 'Attached User'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Fee Title:</span>
              <span className="font-semibold text-slate-900">{invoice.title}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <p className="text-xs font-bold text-slate-700 font-mono">{formatBdtCurrency(Number(invoice.amount))}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Paid So Far</span>
                <p className="text-xs font-bold text-emerald-600 font-mono">{formatBdtCurrency(Number(invoice.paid_amount))}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Remaining Due</span>
                <p className="text-xs font-bold text-rose-600 font-mono">{formatBdtCurrency(currentDue)}</p>
              </div>
            </div>
          </div>

          {/* Payment System Gateway Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Payment System Name <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_GATEWAYS.map((gw) => {
                const isSelected = paymentMethod.toLowerCase() === gw.name.toLowerCase();
                return (
                  <button
                    key={gw.name}
                    type="button"
                    onClick={() => setPaymentMethod(gw.name)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {gw.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-slate-400" />
              Transaction ID / TrxID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. BK89127391 or Bank Deposit Slip #"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
            />
          </div>

          {/* Payment Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                Amount to Pay (BDT) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPayAmount(currentDue)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                Pay Full Due ({formatBdtCurrency(currentDue)})
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={currentDue}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
            />
          </div>

          {/* Dynamic Status Preview & Payment Module Note */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              isFullPayment
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                : 'bg-amber-50/60 border-amber-200 text-amber-800'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                {isFullPayment
                  ? 'Full Settlement: Invoice will be marked as "Paid".'
                  : `Partial Payment: Remaining due will be ${formatBdtCurrency(remainingAfterPayment)} (Status: "Partially Paid").`}
              </p>
              <p className="text-[11px] opacity-90">
                A verified receipt and transaction slip will automatically be created in <strong>Payment Records</strong>.
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via bKash personal account"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Confirm & Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
