import React, { useState, useEffect } from 'react';
import { FundCollectionName, CreateFundCollectionNamePayload, CollectionInterval } from '../types';
import { X, Loader2, Layers, AlertCircle } from 'lucide-react';

interface FundCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateFundCollectionNamePayload) => Promise<any>;
  collectionToEdit?: FundCollectionName | null;
}

export const FundCollectionModal: React.FC<FundCollectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  collectionToEdit,
}) => {
  const [name, setName] = useState('');
  const [interval, setInterval] = useState<CollectionInterval>('Monthly');
  const [defaultAmount, setDefaultAmount] = useState<number>(2000);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (collectionToEdit) {
      setName(collectionToEdit.name);
      setInterval(collectionToEdit.interval);
      setDefaultAmount(Number(collectionToEdit.default_amount || 0));
      setDescription(collectionToEdit.description || '');
      setIsActive(collectionToEdit.is_active);
    } else {
      setName('');
      setInterval('Monthly');
      setDefaultAmount(2000);
      setDescription('');
      setIsActive(true);
    }
  }, [collectionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Collection name is required.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        interval,
        default_amount: defaultAmount,
        description: description.trim() || undefined,
        is_active: isActive,
      });
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Failed to save fund collection name.');
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
              <Layers className="h-5 w-5 text-indigo-600" />
              {collectionToEdit ? 'Edit Fund Collection Head' : 'Add New Fund Collection Head'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              School fee category with customized billing frequency
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Collection Head Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly Tuition Fee, Library Fee, Admission Fee"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Collection Interval / Frequency <span className="text-rose-500">*</span>
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value as CollectionInterval)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 font-semibold focus:border-indigo-500 focus:outline-hidden"
              required
            >
              <option value="Monthly">Monthly Interval</option>
              <option value="Quarterly">Quarterly (3 Months Interval)</option>
              <option value="6 Months">6 Months (Half-Yearly Interval)</option>
              <option value="Yearly">Yearly (Annual Interval)</option>
              <option value="One-Time">One-Time Fee (Admission / Session)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Standard Amount (BDT)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 2500"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 font-semibold focus:border-indigo-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Suggested amount when generating student bills under this head.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of this collection head..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active_toggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_active_toggle" className="text-xs font-medium text-slate-700">
              Active for current school term billing
            </label>
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
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
              <span>{collectionToEdit ? 'Save Changes' : 'Create Collection Head'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

