import React, { useState } from 'react';
import { CreateSchoolPayload, CreateSchoolResponse } from '../types';
import { isValidBdPhoneNumber } from '../../../shared/utils/validation';
import { APP_CONFIG } from '../../../app/config';
import { X, School, User, Lock, Mail, MapPin, Phone, Hash, Loader2, AlertCircle } from 'lucide-react';

interface RegisterSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSchoolPayload) => Promise<CreateSchoolResponse>;
  onSuccess: (data: CreateSchoolResponse) => void;
}

export const RegisterSchoolModal: React.FC<RegisterSchoolModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateSchoolPayload>({
    name: '',
    address: '',
    headmaster_email: '',
    headmaster_password: '',
    headmaster_name: '',
    board: 'Dhaka',
    eiin: '',
    phone: '',
    code: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate mandatory fields specified in requirements
    if (!formData.name.trim() || !formData.address.trim() || !formData.headmaster_email.trim() || !formData.headmaster_password.trim()) {
      setValidationError('School Name, Address, and Headmaster Email & Password are required.');
      return;
    }

    if (formData.phone && !isValidBdPhoneNumber(formData.phone)) {
      setValidationError('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).');
      return;
    }

    if (formData.headmaster_password.length < 6) {
      setValidationError('Headmaster password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSubmit(formData);
      onSuccess(res);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const msg = ax.response?.data?.message || 'Failed to onboard school.';
        setValidationError(msg);
      } else {
        setValidationError('Network error while communicating with tenant service.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <School className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Register & Onboard New School</h3>
              <p className="text-xs text-slate-500">Provisions isolated tenant & initial administrator credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {validationError && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Institutional Details */}
          <div>
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-2">
              1. School Institutional Profile
            </span>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  School Name *
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chittagong Collegiate School"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Campus Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ice Factory Road, Kotwali, Chittagong-4000"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Education Board
                  </label>
                  <select
                    value={formData.board}
                    onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-2 px-2.5 text-xs focus:border-indigo-600 focus:outline-hidden bg-white"
                  >
                    {APP_CONFIG.DEFAULT_BOARDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    EIIN (Optional)
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="104052"
                      value={formData.eiin || ''}
                      onChange={(e) => setFormData({ ...formData, eiin: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-2 text-xs font-mono focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Official Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="01711000000"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-2 text-xs font-mono focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Headmaster / Administrator Account Credentials */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-2">
              2. Initial Headmaster Administrator Account
            </span>
            <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Headmaster / Principal Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Principal Mohammad Ali"
                    value={formData.headmaster_name || ''}
                    onChange={(e) => setFormData({ ...formData, headmaster_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Headmaster Email (Login ID) *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="headmaster@school.edu.bd"
                      value={formData.headmaster_email}
                      onChange={(e) => setFormData({ ...formData, headmaster_email: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Initial Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={formData.headmaster_password}
                      onChange={(e) => setFormData({ ...formData, headmaster_password: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                This administrator account will be automatically granted the <strong>Admin</strong> role tied to this school's tenant partition.
              </p>
            </div>
          </div>

          {/* Action buttons */}
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
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Provision & Onboard School</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

