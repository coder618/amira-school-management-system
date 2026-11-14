import React, { useState, useEffect } from 'react';
import { Student, ClassLevel, ClassLevelPayload, Section, Shift } from '../types';
import { isValidBdPhoneNumber } from '../../../shared/utils/validation';
import { ClassManagementModal } from './ClassManagementModal';
import { X, Loader2, AlertCircle, Settings } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  classLevels: ClassLevel[];
  sections: Section[];
  shifts: Shift[];
  initialData?: Student | null;
  onAddClass?: (payload: ClassLevelPayload) => Promise<ClassLevel>;
  onUpdateClass?: (id: number, payload: Partial<ClassLevelPayload>) => Promise<ClassLevel>;
  onDeleteClass?: (id: number) => Promise<{ message: string }>;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  classLevels,
  sections,
  shifts,
  initialData,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
}) => {
  const [formData, setFormData] = useState({
    student_id: '',
    roll_number: 1,
    first_name: '',
    last_name: '',
    father_name: '',
    mother_name: '',
    phone_number: '',
    email: '',
    gender: 'Male' as Student['gender'],
    status: 'active' as Student['status'],
    class_level_id: classLevels[0]?.id || 1,
    section_id: sections[0]?.id || 1,
    shift_id: shifts[0]?.id || 1,
    date_of_birth: '',
    address: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        student_id: initialData.student_id,
        roll_number: initialData.roll_number,
        first_name: initialData.first_name,
        last_name: initialData.last_name || '',
        father_name: initialData.father_name,
        mother_name: initialData.mother_name,
        phone_number: initialData.phone_number,
        email: initialData.email || '',
        gender: initialData.gender,
        status: initialData.status,
        class_level_id: initialData.class_level_id,
        section_id: initialData.section_id,
        shift_id: initialData.shift_id || shifts[0]?.id || 1,
        date_of_birth: initialData.date_of_birth || '',
        address: initialData.address || '',
      });
    } else {
      setFormData({
        student_id: `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        roll_number: 1,
        first_name: '',
        last_name: '',
        father_name: '',
        mother_name: '',
        phone_number: '017',
        email: '',
        gender: 'Male',
        status: 'active',
        class_level_id: classLevels[0]?.id || 1,
        section_id: sections[0]?.id || 1,
        shift_id: shifts[0]?.id || 1,
        date_of_birth: '',
        address: '',
      });
    }
  }, [initialData, classLevels, sections, shifts, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate 11-digit BD Phone
    if (!isValidBdPhoneNumber(formData.phone_number)) {
      setValidationError('Please enter a valid 11-digit Bangladeshi mobile number starting with 01[3-9] (e.g. 01712345678).');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setValidationError(ax.response?.data?.message || 'Failed to submit student record.');
      } else {
        setValidationError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {initialData ? 'Edit Student Record' : 'Enroll New Bangladeshi Student'}
            </h3>
            <p className="text-xs text-slate-500">Class & Section SIS Registration Form</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Academic Placement */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
              Academic Placement
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs font-mono font-bold bg-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                    Class Level *
                  </label>
                  {onAddClass && (
                    <button
                      type="button"
                      onClick={() => setIsClassModalOpen(true)}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-0.5"
                      title="Add, edit, or delete school classes"
                    >
                      <Settings className="h-3 w-3" />
                      <span>Manage</span>
                    </button>
                  )}
                </div>
                <select
                  value={formData.class_level_id}
                  onChange={(e) => setFormData({ ...formData, class_level_id: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs bg-white focus:border-indigo-600 focus:outline-hidden"
                >
                  {classLevels.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Section
                </label>
                <select
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs bg-white focus:border-indigo-600 focus:outline-hidden"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Roll No.
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs bg-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Student Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tahmid"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Last Name (Surname)
              </label>
              <input
                type="text"
                placeholder="e.g. Rahman"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Parents Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Father's Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Khandakar M. Rahman"
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mother's Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Begum Rokeya"
                value={formData.mother_name}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Contact & BD Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Guardian Phone (BD 11-digit) *
              </label>
              <input
                type="text"
                required
                maxLength={11}
                placeholder="01712345678"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Shift
              </label>
              <select
                value={formData.shift_id}
                onChange={(e) => setFormData({ ...formData, shift_id: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
              >
                {shifts.map((sh) => (
                  <option key={sh.id} value={sh.id}>{sh.name} Shift</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Student['gender'] })}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
              <span>{initialData ? 'Update Record' : 'Complete Enrollment'}</span>
            </button>
          </div>
        </form>

        {onAddClass && onUpdateClass && onDeleteClass && (
          <ClassManagementModal
            isOpen={isClassModalOpen}
            onClose={() => setIsClassModalOpen(false)}
            classLevels={classLevels}
            onAddClass={onAddClass}
            onUpdateClass={onUpdateClass}
            onDeleteClass={onDeleteClass}
            onSelectClass={(id) => setFormData((prev) => ({ ...prev, class_level_id: id }))}
          />
        )}
      </div>
    </div>
  );
};

