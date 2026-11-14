import React, { useState, useEffect } from 'react';
import { FundCollectionName, CreatePaymentPayload, PaymentMethod, PaymentStatus } from '../types';
import { Student } from '../../academic/types';
import { X, Loader2, CreditCard, AlertCircle } from 'lucide-react';

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePaymentPayload) => Promise<any>;
  students: Student[];
  fundCollections: FundCollectionName[];
}

export const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  students,
  fundCollections,
}) => {
  const [studentId, setStudentId] = useState<number>(students[0]?.id || 1);
  const [collectionId, setCollectionId] = useState<number>(fundCollections[0]?.id || 1);
  const [amount, setAmount] = useState<number>(fundCollections[0]?.default_amount ? Number(fundCollections[0].default_amount) : 2500);
  const [paidAmount, setPaidAmount] = useState<number>(fundCollections[0]?.default_amount ? Number(fundCollections[0].default_amount) : 2500);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync default amount when collection head changes
  useEffect(() => {
    const selected = fundCollections.find((c) => c.id === collectionId);
    if (selected && Number(selected.default_amount) > 0) {
      setAmount(Number(selected.default_amount));
      setPaidAmount(Number(selected.default_amount));
    }
  }, [collectionId, fundCollections]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Total bill amount must be greater than zero.');
      return;
    }

    if (paidAmount < 0 || paidAmount > amount) {
      setError('Paid amount cannot be negative or exceed the total amount.');
      return;
    }

    if ((paymentMethod === 'bKash' || paymentMethod === 'Nagad' || paymentMethod === 'Rocket') && paidAmount > 0 && !transactionId.trim()) {
      setError(`Please provide Transaction ID (TrxID) for ${paymentMethod} payment verification.`);
      return;
    }

    setSubmitting(true);
    try {
      let status: PaymentStatus = 'paid';
      if (paidAmount === 0) {
        status = 'due';
      } else if (paidAmount < amount) {
        status = 'partially_paid';
      }

      await onSubmit({
        student_id: studentId,
        fund_collection_name_id: collectionId,
        amount,
        paid_amount: paidAmount,
        status,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim() || undefined,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Failed to record student payment.');
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
              Record Student Payment / Bill
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Linked to institutional Fund Collection Name
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

          {/* Student Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Student <span className="text-rose-500">*</span>
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              required
            >
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.first_name} {stu.last_name} (Roll: {stu.roll_number || 'N/A'}) - {stu.student_id}
                </option>
              ))}
            </select>
          </div>

          {/* FundCollectionName Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fund Collection Name <span className="text-rose-500">*</span>
            </label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              required
            >
              {fundCollections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.interval})
                </option>
              ))}
            </select>
          </div>

          {/* Amount and Paid Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Amount (BDT) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 font-semibold focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Paid Now
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 font-semibold focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quick Pay Buttons */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Quick set:</span>
            <button
              type="button"
              onClick={() => setPaidAmount(amount)}
              className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
            >
              Full (Paid)
            </button>
            <button
              type="button"
              onClick={() => setPaidAmount(Math.round(amount / 2))}
              className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 hover:bg-amber-100 cursor-pointer"
            >
              50% (Partial)
            </button>
            <button
              type="button"
              onClick={() => setPaidAmount(0)}
              className="rounded-md bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
            >
              0 (Due Bill)
            </button>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
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
                <option value="Bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                TrxID / Reference
              </label>
              <input
                type="text"
                placeholder="e.g. 9X82LA71"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Paid at counter by guardian"
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              <span>Save & Generate Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

