import React, { useState } from 'react';
import { ClassLevel, ClassLevelPayload } from '../types';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Layers,
  Loader2,
  AlertCircle,
  Users,
  Grid,
} from 'lucide-react';

interface ClassManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  classLevels: ClassLevel[];
  onAddClass: (payload: ClassLevelPayload) => Promise<ClassLevel>;
  onUpdateClass: (id: number, payload: Partial<ClassLevelPayload>) => Promise<ClassLevel>;
  onDeleteClass: (id: number) => Promise<{ message: string }>;
  onSelectClass?: (classLevelId: number) => void;
}

export const ClassManagementModal: React.FC<ClassManagementModalProps> = ({
  isOpen,
  onClose,
  classLevels,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onSelectClass,
}) => {
  const [name, setName] = useState('');
  const [numericValue, setNumericValue] = useState<number | ''>('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumericValue, setEditNumericValue] = useState<number | ''>('');
  const [editCode, setEditCode] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('Class name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await onAddClass({
        name: name.trim(),
        numeric_value: numericValue !== '' ? Number(numericValue) : undefined,
        code: code.trim() || undefined,
      });

      setName('');
      setNumericValue('');
      setCode('');
      setSuccessMsg(`Class "${created.name}" created successfully for this school.`);
      if (onSelectClass) {
        onSelectClass(created.id);
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setError(ax.response?.data?.message || 'Failed to create class level.');
      } else {
        setError('Network error creating class level.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (cls: ClassLevel) => {
    setEditingId(cls.id);
    setEditName(cls.name);
    setEditNumericValue(cls.numeric_value ?? '');
    setEditCode(cls.code ?? '');
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditNumericValue('');
    setEditCode('');
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) {
      setError('Class name cannot be empty.');
      return;
    }
    setUpdating(true);
    setError(null);
    try {
      await onUpdateClass(id, {
        name: editName.trim(),
        numeric_value: editNumericValue !== '' ? Number(editNumericValue) : undefined,
        code: editCode.trim() || undefined,
      });
      setSuccessMsg('Class updated successfully.');
      cancelEdit();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setError(ax.response?.data?.message || 'Failed to update class.');
      } else {
        setError('Network error updating class.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (cls: ClassLevel) => {
    if (cls.students_count && cls.students_count > 0) {
      setError(`Cannot delete "${cls.name}" because ${cls.students_count} active students are enrolled in it.`);
      return;
    }
    if (cls.sections_count && cls.sections_count > 0) {
      setError(`Cannot delete "${cls.name}" because ${cls.sections_count} sections are attached. Remove or reassign sections first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete class "${cls.name}" from this school?`)) {
      return;
    }

    setDeletingId(cls.id);
    setError(null);
    try {
      await onDeleteClass(cls.id);
      setSuccessMsg(`Class "${cls.name}" was deleted.`);
      if (editingId === cls.id) {
        cancelEdit();
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setError(ax.response?.data?.message || 'Failed to delete class.');
      } else {
        setError('Network error deleting class.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Manage School Classes</h3>
              <p className="text-xs text-slate-500">Configure academic class levels unique to this school tenant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add New Class Form */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Create New Class (Tenant Unique)
              </span>
            </div>

            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 11, Playgroup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Numeric Grade
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 11"
                  value={numericValue}
                  onChange={(e) => setNumericValue(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. C11"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-1.5 px-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>

          {/* Current Class List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Existing Classes in Roster ({classLevels.length})
              </span>
              <span className="text-[11px] text-slate-400">Scoped exclusively to active school</span>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
              {classLevels.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No classes registered yet. Use the form above to add your first class level.
                </div>
              ) : (
                classLevels.map((cls) => {
                  const isEditing = editingId === cls.id;
                  const isDeleting = deletingId === cls.id;

                  return (
                    <div
                      key={cls.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded-md border border-indigo-400 py-1 px-2.5 text-xs text-slate-900 focus:outline-hidden"
                              placeholder="Class Name"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="number"
                              value={editNumericValue}
                              onChange={(e) =>
                                setEditNumericValue(e.target.value === '' ? '' : parseInt(e.target.value))
                              }
                              className="w-full rounded-md border border-indigo-400 py-1 px-2.5 text-xs text-slate-900 focus:outline-hidden"
                              placeholder="Grade (e.g. 6)"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value)}
                              className="w-full rounded-md border border-indigo-400 py-1 px-2.5 text-xs text-slate-900 focus:outline-hidden"
                              placeholder="Code"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdate(cls.id)}
                              disabled={updating}
                              className="rounded-md bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 transition-colors"
                              title="Save Changes"
                            >
                              {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-md bg-slate-200 p-1.5 text-slate-700 hover:bg-slate-300 transition-colors"
                              title="Cancel"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
                              {cls.numeric_value ?? '•'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                                  {cls.name}
                                </span>
                                {cls.code && (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-600">
                                    {cls.code}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Grid className="h-3 w-3 text-slate-400" />
                                  {cls.sections_count ?? cls.sections?.length ?? 0} Sections
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-slate-400" />
                                  {cls.students_count ?? 0} Students
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 self-end sm:self-center">
                            {onSelectClass && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectClass(cls.id);
                                  onClose();
                                }}
                                className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer mr-1"
                              >
                                Select
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => startEdit(cls)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit Class"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cls)}
                              disabled={isDeleting}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete Class"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

