import React, { useState, useEffect } from 'react';
import { Holiday, HolidayPayload } from '../types';
import { X, Calendar, CalendarDays, Loader2, Sparkles, Tag, FileText } from 'lucide-react';

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: HolidayPayload, id?: number) => Promise<void>;
  holiday?: Holiday | null;
  defaultDate?: string;
}

const HOLIDAY_TYPES = [
  { value: 'National', label: 'National Holiday', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Religious', label: 'Religious Holiday', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'Academic', label: 'Academic Recess', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Cultural', label: 'Cultural / Festival', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Weekly Off', label: 'Weekly Off', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { value: 'Custom', label: 'Custom School Holiday', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'General', label: 'General Holiday', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const HolidayModal: React.FC<HolidayModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  holiday,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('General');
  const [description, setDescription] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (holiday) {
      setTitle(holiday.title);
      setDate(holiday.date ? holiday.date.split('T')[0] : '');
      if (holiday.end_date) {
        setIsRange(true);
        setEndDate(holiday.end_date.split('T')[0]);
      } else {
        setIsRange(false);
        setEndDate('');
      }
      setType(holiday.type || 'General');
      setDescription(holiday.description || '');
      setIsHalfDay(Boolean(holiday.is_half_day));
    } else {
      const todayStr = defaultDate || new Date().toISOString().split('T')[0];
      setTitle('');
      setDate(todayStr);
      setIsRange(false);
      setEndDate('');
      setType('General');
      setDescription('');
      setIsHalfDay(false);
    }
    setError(null);
  }, [holiday, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the holiday.');
      return;
    }
    if (!date) {
      setError('Please pick a start date.');
      return;
    }
    if (isRange && endDate && endDate < date) {
      setError('End date must be on or after the start date.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit(
        {
          title: title.trim(),
          date,
          end_date: isRange && endDate ? endDate : null,
          type,
          description: description.trim() || null,
          is_half_day: isHalfDay,
        },
        holiday?.id
      );
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save holiday.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {holiday ? 'Edit Holiday' : 'Add New Holiday'}
              </h3>
              <p className="text-xs text-slate-500">
                Mark institutional holiday dates on the school calendar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Holiday Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Independence Day, Eid-ul-Fitr, Winter Vacation"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-slate-800"
              />
              <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Date Picker & Range Switch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Holiday Date <span className="text-rose-500">*</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-indigo-600 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRange}
                  onChange={(e) => setIsRange(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Multi-day Vacation / Date Range</span>
              </label>
            </div>

            <div className={`grid ${isRange ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {isRange ? 'Start Date' : 'Date'}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {isRange && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    End Date (Inclusive)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={date}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Holiday Type & Half-day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category / Type
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                >
                  {HOLIDAY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="pt-4 sm:pt-6">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isHalfDay}
                  onChange={(e) => setIsHalfDay(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Half-Day Holiday (Only afternoon)</span>
              </label>
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional notes about the holiday, notices, or government gazette..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-slate-800 resize-none"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-3.5 h-3.5" />}
              <span>{holiday ? 'Update Holiday' : 'Save Holiday'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
