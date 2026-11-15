import React, { useState, useEffect } from 'react';
import { AssignCardPayload } from '../types';
import { academicApi } from '../../academic/api';
import { Student } from '../../academic/types';
import { hrApi } from '../../hr/api';
import { Teacher } from '../../hr/types';
import { X, UserCheck, Search, Loader2, Check, CreditCard } from 'lucide-react';

interface DeviceAssignCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCardRfid?: string;
  onAssign: (payload: AssignCardPayload) => Promise<void>;
}

export const DeviceAssignCardModal: React.FC<DeviceAssignCardModalProps> = ({
  isOpen,
  onClose,
  initialCardRfid,
  onAssign,
}) => {
  const [targetType, setTargetType] = useState<'student' | 'teacher'>('student');
  const [cardRfid, setCardRfid] = useState('');
  const [biometricId, setBiometricId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCardRfid(initialCardRfid || '');
      setBiometricId('');
      setSelectedTargetId(null);
      setSearchQuery('');
      setFeedback(null);
      loadTargets();
    }
  }, [isOpen, initialCardRfid, targetType]);

  const loadTargets = async () => {
    setLoading(true);
    try {
      if (targetType === 'student') {
        const data = await academicApi.getStudents();
        setStudents(data);
      } else {
        const data = await hrApi.getTeachers();
        setTeachers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.student_id.toLowerCase().includes(q) ||
      s.first_name.toLowerCase().includes(q) ||
      s.phone_number?.includes(q)
    );
  }).slice(0, 15);

  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.user?.name?.toLowerCase().includes(q) ||
      t.employee_id.toLowerCase().includes(q) ||
      t.designation.toLowerCase().includes(q)
    );
  }).slice(0, 15);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) {
      setFeedback({ type: 'error', message: `Please select a ${targetType} to bind.` });
      return;
    }
    if (!cardRfid.trim() && !biometricId.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a Card RFID or Biometric ID.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await onAssign({
        target_type: targetType,
        target_id: selectedTargetId,
        card_rfid: cardRfid.trim() || undefined,
        biometric_id: biometricId.trim() || undefined,
      });
      setFeedback({
        type: 'success',
        message: `Successfully mapped external device ID to ${targetType}!`,
      });
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to assign card ID.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Assign Device RFID / Biometric ID
              </h3>
              <p className="text-xs text-slate-500">
                Link scanned external credentials to a student or teacher profile
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {feedback && (
            <div
              className={`p-3 text-xs rounded-xl font-medium border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Target Type Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setTargetType('student');
                setSelectedTargetId(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                targetType === 'student'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assign to Student
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetType('teacher');
                setSelectedTargetId(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                targetType === 'teacher'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assign to Teacher / Staff
            </button>
          </div>

          {/* Scanned Card & Biometric IDs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Card RFID UID
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. RFID-998877"
                  value={cardRfid}
                  onChange={(e) => setCardRfid(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                />
                <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biometric Terminal ID
              </label>
              <input
                type="text"
                placeholder="e.g. BIO-102"
                value={biometricId}
                onChange={(e) => setBiometricId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Search and Select Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select {targetType === 'student' ? 'Student' : 'Faculty Member'}
            </label>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder={`Search ${targetType} by name, roll, ID...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>

            {loading ? (
              <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Loading directory...</span>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                {targetType === 'student' &&
                  filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedTargetId(s.id)}
                      className={`w-full text-left p-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedTargetId === s.id
                          ? 'bg-indigo-50/80 font-semibold text-indigo-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {s.full_name || `${s.first_name} ${s.last_name || ''}`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {s.student_id} • Roll {s.roll_number} • Class {s.class_level?.name || 'N/A'}
                        </div>
                      </div>
                      {selectedTargetId === s.id && <Check className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}

                {targetType === 'teacher' &&
                  filteredTeachers.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTargetId(t.id)}
                      className={`w-full text-left p-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedTargetId === t.id
                          ? 'bg-indigo-50/80 font-semibold text-indigo-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{t.user?.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {t.employee_id} • {t.designation}
                        </div>
                      </div>
                      {selectedTargetId === t.id && <Check className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}

                {((targetType === 'student' && filteredStudents.length === 0) ||
                  (targetType === 'teacher' && filteredTeachers.length === 0)) && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching records found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedTargetId}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save & Bind ID</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
