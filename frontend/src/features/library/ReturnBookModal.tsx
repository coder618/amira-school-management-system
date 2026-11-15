import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, RotateCcw, DollarSign, BookOpen, User } from 'lucide-react';
import { BookIssueItem } from '../../types';
import { libraryApi } from '../../services/api';

interface ReturnBookModalProps {
  issue: BookIssueItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnBookModal: React.FC<ReturnBookModalProps> = ({
  issue,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'returned' | 'lost'>('returned');
  const [fineAmount, setFineAmount] = useState<number>(0);
  const [fineStatus, setFineStatus] = useState<'unpaid' | 'paid' | 'waived'>('unpaid');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (issue) {
      setReturnDate(new Date().toISOString().split('T')[0]);
      setStatus('returned');
      setNotes('');
      setError(null);

      // Auto compute fine if overdue (e.g. 10 BDT per overdue day)
      const daysOverdue = issue.days_overdue || 0;
      if (daysOverdue > 0) {
        const estimatedFine = daysOverdue * 10;
        setFineAmount(estimatedFine);
        setFineStatus('paid');
        setNotes(`Book returned ${daysOverdue} day(s) overdue. Calculated fine: ${estimatedFine} BDT.`);
      } else {
        setFineAmount(0);
        setFineStatus('unpaid');
      }
    }
  }, [issue]);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await libraryApi.returnBook(issue.id, {
        return_date: returnDate,
        status,
        fine_amount: fineAmount,
        fine_status: fineAmount > 0 ? fineStatus : 'unpaid',
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to process book return. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const studentName = issue.student
    ? `${issue.student.first_name} ${issue.student.last_name}`
    : 'Unknown Student';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Return Book from Student</h3>
              <p className="text-xs text-slate-500">Acknowledge return & update book inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500 mt-0.5" />
              <div>
                <span className="text-slate-400 block">Book Title</span>
                <span className="font-semibold text-slate-800 line-clamp-1">{issue.book?.title}</span>
                <span className="text-[11px] text-slate-500">{issue.book?.author}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-emerald-500 mt-0.5" />
              <div>
                <span className="text-slate-400 block">Student</span>
                <span className="font-semibold text-slate-800">{studentName}</span>
                <span className="text-[11px] text-slate-500">
                  ID: {issue.student?.student_id || 'N/A'} {issue.student?.class_level ? `• ${issue.student.class_level.name}` : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-400">Issue Date:</span>{' '}
              <span className="font-medium text-slate-700">{issue.issue_date}</span>
            </div>
            <div>
              <span className="text-slate-400">Due Date:</span>{' '}
              <span className="font-medium text-slate-700">{issue.due_date}</span>
            </div>
            <div>
              {issue.is_overdue ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
                  <AlertTriangle className="h-3 w-3" /> {issue.days_overdue} days overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                  <CheckCircle className="h-3 w-3" /> On Time
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Return Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Return Condition / Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'returned' | 'lost')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="returned">Returned (Restores Stock)</option>
                <option value="lost">Marked Lost (No Stock Added)</option>
              </select>
            </div>
          </div>

          {/* Fine Management */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-indigo-600" /> Fine / Late Fee (BDT)
              </span>
              {issue.is_overdue && (
                <span className="text-[11px] text-amber-600 font-medium">
                  Suggested @ 10৳/day: {(issue.days_overdue || 0) * 10} ৳
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Amount (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Fine Status</label>
                <select
                  value={fineStatus}
                  onChange={(e) => setFineStatus(e.target.value as 'unpaid' | 'paid' | 'waived')}
                  disabled={fineAmount <= 0}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="paid">Paid & Cleared</option>
                  <option value="unpaid">Unpaid (Due)</option>
                  <option value="waived">Waived / Excused</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks / Condition Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Good condition, returned intact, spine slightly damaged..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>Processing Return...</>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> Confirm Return
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
