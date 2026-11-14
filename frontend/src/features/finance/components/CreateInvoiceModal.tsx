import React, { useState } from 'react';
import { CreateInvoicePayload, FundCollectionName, UserSummary } from '../types';
import { X, Receipt, DollarSign, Calendar, User, FileText, Tag, Loader2 } from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateInvoicePayload) => Promise<unknown>;
  users: UserSummary[];
  fundCollections: FundCollectionName[];
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
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

  if (!isOpen) return null;

  const handleCollectionSelect = (idStr: string) => {
    if (!idStr) {
      setCollectionId('');
      return;
    }
    const id = Number(idStr);
    setCollectionId(id);
    const selected = fundCollections.find((c) => c.id === id);
    if (selected) {
      if (!title) setTitle(selected.name);
      if (!amount && selected.default_amount) setAmount(Number(selected.default_amount));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('Please select a user to attach this invoice to.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide an invoice title or fee description.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid invoice amount greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        user_id: Number(userId),
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
        setError(ax.response?.data?.message || 'Failed to create invoice.');
      } else {
        setError('Network error while generating invoice.');
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
              <h3 className="text-base font-bold text-slate-900">Create User Invoice</h3>
              <p className="text-xs text-slate-500">Issue a new payable invoice attached to a specific user</p>
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
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          {/* User selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              Attached User <span className="text-rose-500">*</span>
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              <option value="">Select User (Student, Parent, Teacher, Staff)...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — [{u.role}]
                </option>
              ))}
            </select>
          </div>

          {/* Optional Collection Head */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              Fee Collection Head (Optional)
            </label>
            <select
              value={collectionId}
              onChange={(e) => handleCollectionSelect(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              <option value="">Custom Title / No Collection Category</option>
              {fundCollections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.interval}) — {col.default_amount} BDT
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Invoice Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Tuition Fee - November 2026"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Total Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                Amount (BDT) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="2500.00"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Remarks & Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions or bank details for payment..."
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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Issue Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
