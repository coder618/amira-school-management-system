import React, { useState } from 'react';
import { Payment, PaymentMethod, SettlePaymentPayload } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import { X, Loader2, CreditCard, AlertCircle } from 'lucide-react';

interface SettlePaymentModalProps {
  payment: Payment | null;
  onClose: () => void;
  onSubmit: (paymentId: number, payload: SettlePaymentPayload) => Promise<any>;
}

export const SettlePaymentModal: React.FC<SettlePaymentModalProps> = ({
  payment,
  onClose,
  onSubmit,
}) => {
  const [paymentAmount, setPaymentAmount] = useState<number>(payment ? Number(payment.due_amount) : 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const due = Number(payment.due_amount);
    if (paymentAmount <= 0 || paymentAmount > due) {
      setError(`Amount must be between ৳1.00 and remaining due ${formatBdtCurrency(due)}`);
      return;
    }

    if ((paymentMethod === 'bKash' || paymentMethod === 'Nagad' || paymentMethod === 'Rocket') && !transactionId.trim()) {
      setError(`Please provide Transaction ID (TrxID) for ${paymentMethod} payment verification.`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(payment.id, {
        payment_amount: paymentAmount,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Failed to settle due payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              Settle Due Balance / Installment
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Receipt No: <strong className="font-mono text-slate-700">{payment.receipt_no}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Balance Summary Box */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Student:</span>
              <strong className="text-slate-900">
                {payment.student ? `${payment.student.first_name} ${payment.student.last_name}` : 'Student'}
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Collection Head:</span>
              <strong className="text-slate-900">{payment.fund_collection_name?.name || 'School Fee'}</strong>
            </div>
            <div className="flex justify-between text-slate-600 border-t border-slate-200/80 pt-2">
              <span>Total Billed:</span>
              <span>{formatBdtCurrency(Number(payment.amount))}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Already Paid:</span>
              <span className="text-emerald-600 font-semibold">{formatBdtCurrency(Number(payment.paid_amount))}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200/80 pt-2">
              <span>Outstanding Due:</span>
              <span className="text-sm font-extrabold">{formatBdtCurrency(Number(payment.due_amount))}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (BDT) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={Number(payment.due_amount)}
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 font-bold focus:border-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="Cash">Cash (Counter)</option>
              <option value="bKash">bKash (MFS)</option>
              <option value="Nagad">Nagad (MFS)</option>
              <option value="Rocket">Rocket (MFS)</option>
              <option value="Bank">Bank Deposit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction ID / Slip Reference
            </label>
            <input
              type="text"
              placeholder="e.g. 9X82LA71"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. Settle remaining tuition fee"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              <span>Confirm & Settle Due</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

