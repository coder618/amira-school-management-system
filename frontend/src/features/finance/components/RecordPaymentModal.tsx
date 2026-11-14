import React, { useState } from 'react';
import { Invoice, PaymentMethod, RecordPaymentPayload } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import { X, Loader2, CreditCard, AlertCircle } from 'lucide-react';

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSubmit: (payload: RecordPaymentPayload) => Promise<any>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<number>(invoice ? Number(invoice.due_amount) : 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0 || amount > Number(invoice.due_amount)) {
      setError(`Amount must be between ৳1.00 and remaining due ${formatBdtCurrency(Number(invoice.due_amount))}`);
      return;
    }

    if ((paymentMethod === 'bKash' || paymentMethod === 'Nagad') && !transactionId.trim()) {
      setError(`Please provide the ${paymentMethod} Transaction ID (TrxID) for verification.`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        invoice_id: invoice.id,
        amount,
        payment_method: paymentMethod,
        transaction_id: transactionId || undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setError(ax.response?.data?.message || 'Failed to record payment.');
      } else {
        setError('Network error processing payment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              Collect Fee Payment
            </h3>
            <p className="text-xs text-slate-500 font-mono">{invoice.invoice_number}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Student:</span>
              <span className="font-semibold text-slate-900">
                {invoice.student?.first_name} {invoice.student?.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bill Title:</span>
              <span className="font-medium text-slate-800">{invoice.title}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-slate-900">
              <span>Remaining Due:</span>
              <span className="text-rose-600">{formatBdtCurrency(Number(invoice.due_amount))}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Payment Amount (BDT ৳) *
            </label>
            <input
              type="number"
              step="0.01"
              max={Number(invoice.due_amount)}
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-bold focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Payment Method *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['bKash', 'Nagad', 'Cash', 'Bank'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {(paymentMethod === 'bKash' || paymentMethod === 'Nagad' || paymentMethod === 'Bank') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {paymentMethod} Transaction ID (TrxID) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9X82LA71"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Receipt Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cash received by counter 1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Confirm & Print Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

