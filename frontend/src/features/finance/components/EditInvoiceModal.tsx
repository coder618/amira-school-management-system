import React, { useState, useEffect } from 'react';
import { CreateInvoicePayload, FundCollectionName, Invoice, UserSummary } from '../types';
import { X, Receipt, DollarSign, Calendar, User, FileText, Tag, Loader2, AlertCircle } from 'lucide-react';

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, payload: Partial<CreateInvoicePayload>) => Promise<unknown>;
  invoice: Invoice | null;
  users: UserSummary[];
  fundCollections: FundCollectionName[];
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  users,
  fundCollections,
}) => {
  const [userId, setUserId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [collectionId, setCollectionId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) {
      setUserId(invoice.user_id || invoice.user?.id || '');
      setTitle(invoice.title || '');
      setAmount(invoice.amount ? Number(invoice.amount) : '');
      setCollectionId(invoice.fund_collection_name_id || '');
      setDueDate(invoice.due_date || '');
      setNotes(invoice.notes || '');
      setError(null);
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an invoice title or fee description.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid invoice amount greater than 0.');
      return;
    }
    if (Number(invoice.paid_amount) > Number(amount)) {
      setError(`Amount cannot be less than already paid amount (৳ ${invoice.paid_amount}).`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(invoice.id, {
        user_id: userId ? Number(userId) : invoice.user_id,
        title: title.trim(),
        amount: Number(amount),
        fund_collection_name_id: collectionId ? Number(collectionId) : undefined,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setError(ax.response?.data?.message || 'Failed to update invoice.');
      } else {
        setError('Network error while updating invoice.');
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
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Invoice #{invoice.invoice_no}</h3>
              <p className="text-xs text-slate-500">Update invoice details and due requirements</p>
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

          {/* User Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-600" />
              <span>Attached User</span>
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
            >
              <option value="">Select User / Student Account</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}) - {u.email}
                </option>
              ))}
            </select>
          </div>

          {/* Fee Collection Head Template */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-indigo-600" />
              <span>Collection Head (Optional)</span>
            </label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
            >
              <option value="">Custom Fee / None</option>
              {fundCollections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.interval} - ৳ {c.default_amount})
                </option>
              ))}
            </select>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
              <span>Invoice Title / Purpose</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. October 2026 Tuition Fee + Lab"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
            />
          </div>

          {/* Amount and Due Date Grid */}
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
                placeholder="2500"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all font-mono"
              />
              {Number(invoice.paid_amount) > 0 && (
                <p className="text-[11px] text-emerald-600 mt-1">Already collected: ৳ {invoice.paid_amount}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-600" />
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
              Special Instructions / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Eligible for 10% waiver if paid before due date"
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
