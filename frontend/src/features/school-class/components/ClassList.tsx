import React, { useState } from 'react';
import { useSchoolClasses } from '../hooks/useSchoolClasses';
import { ClassManagementModal } from './ClassManagementModal';
import { ClassLevel } from '../types';
import {
  Layers,
  Plus,
  Search,
  Users,
  Grid,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
} from 'lucide-react';

export const ClassList: React.FC = () => {
  const {
    classes,
    allClasses,
    loading,
    error,
    search,
    setSearch,
    fetchClasses,
    addClass,
    updateClass,
    removeClass,
  } = useSchoolClasses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Quick Inline Creator State
  const [showQuickCreator, setShowQuickCreator] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickNumericValue, setQuickNumericValue] = useState<number | ''>('');
  const [quickCode, setQuickCode] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      setQuickError('Class name is required');
      return;
    }
    setQuickSubmitting(true);
    setQuickError(null);
    setQuickSuccess(null);
    try {
      await addClass({
        name: quickName.trim(),
        numeric_value: quickNumericValue !== '' ? Number(quickNumericValue) : undefined,
        code: quickCode.trim() || undefined,
      });
      setQuickSuccess(`Class "${quickName.trim()}" created successfully!`);
      setQuickName('');
      setQuickNumericValue('');
      setQuickCode('');
      setTimeout(() => setQuickSuccess(null), 3000);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const data = ax.response?.data;
        let msg = data?.message;
        if (data?.errors) {
          const firstErr = Object.values(data.errors).flat()[0];
          if (firstErr) msg = firstErr;
        }
        setQuickError(msg || 'Failed to create class');
      } else {
        setQuickError('Network error creating class');
      }
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Computed stats
  const totalClasses = allClasses.length;
  const totalSections = allClasses.reduce(
    (acc, curr) => acc + (curr.sections_count ?? curr.sections?.length ?? 0),
    0
  );
  const totalStudents = allClasses.reduce(
    (acc, curr) => acc + (curr.students_count ?? 0),
    0
  );

  const handleDelete = async (cls: ClassLevel) => {
    setDeleteError(null);
    if (cls.students_count && cls.students_count > 0) {
      setDeleteError(`Cannot delete "${cls.name}" because ${cls.students_count} active students are enrolled in it.`);
      return;
    }
    if (cls.sections_count && cls.sections_count > 0) {
      setDeleteError(`Cannot delete "${cls.name}" because sections are attached. Reassign or remove sections first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${cls.name}"? This action cannot be undone.`)) {
      try {
        await removeClass(cls.id);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const ax = err as { response?: { data?: { message?: string } } };
          setDeleteError(ax.response?.data?.message || 'Failed to delete class.');
        } else {
          setDeleteError('Error deleting class.');
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="h-7 w-7 text-indigo-600" />
            School Classes & Structure
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Dedicated module to manage class levels, academic grades, and sections unique to this school tenant
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchClasses()}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Refresh roster"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add / Manage Classes</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Classes Configured
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalClasses}</span>
            <span className="text-xs text-slate-500">grades/levels</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sections Active
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Grid className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalSections}</span>
            <span className="text-xs text-slate-500">streams (Padma, Meghna, etc.)</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-500">in class rosters</span>
          </div>
        </div>
      </div>

      {deleteError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{deleteError}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search class by name (e.g. Class 6), code (C6), or numeric grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowQuickCreator(!showQuickCreator)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
            showQuickCreator
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Plus className="h-3.5 w-3.5 text-indigo-600" />
          <span>{showQuickCreator ? 'Close Quick Creator' : '+ Quick Class Creator'}</span>
        </button>
      </div>

      {/* Inline Quick Creator Card */}
      {showQuickCreator && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-xs transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                +
              </span>
              <h3 className="text-sm font-bold text-indigo-950">Quick Add Class</h3>
              <span className="text-[11px] text-indigo-600/80 font-medium">Unique to this school tenant</span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickCreator(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {quickError && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{quickError}</span>
            </div>
          )}

          {quickSuccess && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{quickSuccess}</span>
            </div>
          )}

          <form onSubmit={handleQuickCreate} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Class Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Class 11, Playgroup, Nursery"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden"
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
                value={quickNumericValue}
                onChange={(e) => setQuickNumericValue(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Code
              </label>
              <input
                type="text"
                placeholder="e.g. C11"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={quickSubmitting}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 px-3 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                {quickSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>Add Class</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Class Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Loading school classes...</span>
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">No classes found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'No classes match your search query. Clear search or create a new class level.'
              : 'Your school currently has no classes configured. Click below to add your first class.'}
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Class</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-base shadow-xs">
                      {cls.numeric_value ?? '•'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{cls.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {cls.code && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
                            {cls.code}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          Grade {cls.numeric_value ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
                    Tenant Isolated
                  </span>
                </div>

                {/* Sections list */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Sections ({cls.sections?.length ?? 0})
                  </span>
                  {cls.sections && cls.sections.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {cls.sections.map((sec) => (
                        <span
                          key={sec.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 border border-slate-200"
                        >
                          <Grid className="h-3 w-3 text-slate-400" />
                          <span>{sec.name}</span>
                          <span className="text-[10px] text-slate-400">({sec.capacity} cap)</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No sections created yet</p>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                  <Users className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{cls.students_count ?? 0} Enrolled Students</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Edit Class"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cls)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Class"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dedicated Management Modal */}
      <ClassManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classLevels={allClasses}
        onAddClass={addClass}
        onUpdateClass={updateClass}
        onDeleteClass={removeClass}
      />
    </div>
  );
};
