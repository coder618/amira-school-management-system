import React, { useState } from 'react';
import { TeacherPayload } from '../types';
import { isValidBdPhoneNumber } from '../../../shared/utils/validation';
import { X, Loader2, AlertCircle } from 'lucide-react';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: TeacherPayload) => Promise<any>;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<TeacherPayload>({
    name: '',
    email: '',
    employee_id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
    designation: 'Assistant Teacher',
    department: 'Science',
    qualification: 'M.Sc, B.Ed',
    phone_number: '017',
    joining_date: new Date().toISOString().split('T')[0],
    password: 'password123',
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (formData.phone_number && !isValidBdPhoneNumber(formData.phone_number)) {
      setValidationError('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setValidationError(ax.response?.data?.message || 'Failed to save faculty record.');
      } else {
        setValidationError('Network error while recruiting faculty.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recruit Faculty Member</h3>
            <p className="text-xs text-slate-500">Create teacher profile & authenticated user credentials</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Anwar Hossain"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="teacher@school.edu.bd"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mobile (BD 11-digit)
              </label>
              <input
                type="text"
                maxLength={11}
                placeholder="01712345678"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Designation *
              </label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
              >
                <option value="Headmaster">Headmaster / Principal</option>
                <option value="Assistant Headmaster">Assistant Headmaster</option>
                <option value="Senior Teacher">Senior Teacher</option>
                <option value="Assistant Teacher">Assistant Teacher</option>
                <option value="Junior Teacher">Junior Teacher</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
              >
                <option value="Science">Science</option>
                <option value="Humanities">Humanities</option>
                <option value="Commerce">Commerce</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Language">Language & Literature</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Academic Qualification
            </label>
            <input
              type="text"
              placeholder="e.g. M.Sc in Physics (DU), B.Ed (1st Class)"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Save Teacher Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

