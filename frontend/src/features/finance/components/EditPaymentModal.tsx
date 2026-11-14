import React, { useState, useEffect } from 'react';
import { CreatePaymentPayload, FundCollectionName, Payment, PaymentMethod } from '../types';
import { X, CreditCard, DollarSign, Calendar, Tag, Loader2, AlertCircle } from 'lucide-react';

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, payload: Partial<CreatePaymentPayload>) => Promise<unknown>;
  payment: Payment | null;
  fundCollections: FundCollectionName[];
}

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  payment,
  fundCollections,
}) => {
  const [collectionId, setCollectionId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (payment) {
      setCollectionId(payment.fund_collection_name_id || '');
      setAmount(Number(payment.amount) || '');
      setPaidAmount(Number(payment.paid_amount) || 0);
      setPaymentMethod((payment.payment_method as PaymentMethod) || 'Cash');
      setTransactionId(payment.transaction_id || '');
      setPaymentDate(payment.payment_date || '');
      setDueDate(payment.due_date || '');
      setNotes(payment.notes || '');
      setError(null);
    }
  }, [payment, isOpen]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please provide a valid bill amount greater than 0.');
      return;
    }
    if (Number(paidAmount) < 0 || Number(paidAmount) > Number(amount)) {
      setError('Paid amount cannot be negative or exceed the total amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(payment.id, {
        fund_collection_name_id: collectionId ? Number(collectionId) : undefined,
        amount: Number(amount),
        paid_amount: Number(paidAmount),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || undefined,
        payment_date: paymentDate || undefined,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setError(ax.response?.data?.message || 'Failed to update payment record.');
      } else {
        setError('Network error while updating payment.');
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Payment #{payment.receipt_no}</h3>
              <p className="text-xs text-slate-500">Update payment details and transaction records</p>
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
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Fee Collection Head */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-indigo-600" />
              <span>Collection Category</span>
            </label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
            >
              <option value="">Select Fee Head</option>
              {fundCollections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.interval} - ৳ {c.default_amount})
                </option>
              ))}
            </select>
          </div>

          {/* Amount and Paid Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-indigo-600" />
                <span>Total Amount (BDT ৳)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <span>Paid Amount (BDT ৳)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all font-mono"
              />
            </div>
          </div>

          {/* Method and Transaction ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
              >
                <option value="Cash">Cash Counter</option>
                <option value="bKash">bKash Mobile</option>
                <option value="Nagad">Nagad Mobile</option>
                <option value="Rocket">Rocket</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Upay">Upay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                TrxID / Reference #
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. TR-9988112"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all font-mono"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                <span>Payment Date</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-rose-500" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes / Receipt Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared 1st installment"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
