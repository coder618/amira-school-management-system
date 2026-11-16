import React, { useState } from 'react';
import { X, MessageSquare, Loader2, Sparkles, Tag, Calendar, FileText } from 'lucide-react';

interface AddTeacherNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; category: string; note: string; date: string }) => Promise<void>;
  studentName: string;
}

const CATEGORIES = [
  { value: 'Academic', label: 'Academic Performance' },
  { value: 'Behavioral', label: 'Classroom Conduct & Discipline' },
  { value: 'Achievement', label: 'Extracurricular & Achievement' },
  { value: 'Attendance', label: 'Attendance & Punctuality' },
  { value: 'Health', label: 'Health & Wellbeing' },
  { value: 'General', label: 'General Note' },
];

export const AddTeacherNoteModal: React.FC<AddTeacherNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  studentName,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the note.');
      return;
    }
    if (!note.trim()) {
      setError('Please write note contents.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        note: note.trim(),
        date,
      });
      setTitle('');
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save teacher note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Teacher Note</h3>
              <p className="text-xs text-slate-500">Record observations for {studentName}</p>
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
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Note Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mid-term evaluation, Math progress, Assembly speech"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
              />
              <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Note content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Teacher's Remarks / Observations <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                required
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Provide detailed feedback on student behavior, progress, or areas for improvement..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-800 resize-none"
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
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>Save Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
