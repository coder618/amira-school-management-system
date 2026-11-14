import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { academicApi } from '../../academic/api';
import { ClassLevel, Subject, SubjectPayload } from '../../academic/types';
import {
  BookOpen,
  Layers,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  CheckCircle2,
  X,
  FileSpreadsheet,
  BookMarked,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const ClassSubjectsView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<number | 'ALL'>(
    searchParams.get('class_id') ? parseInt(searchParams.get('class_id')!) : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'COMPULSORY' | 'OPTIONAL' | '4TH_SUBJECT'>('ALL');

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
  const [selectedSubjectForDelete, setSelectedSubjectForDelete] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<SubjectPayload>({
    class_level_id: 0,
    name: '',
    code: '',
    full_mark: 100,
    pass_mark: 33,
    is_optional: false,
    can_be_4th_subject: false,
  });

  // Quick inline creator state
  const [showQuickCreator, setShowQuickCreator] = useState(false);
  const [quickClassId, setQuickClassId] = useState<number | ''>('');
  const [quickName, setQuickName] = useState('');
  const [quickCode, setQuickCode] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);

  // Load classes & subjects
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [classesData, subjectsData] = await Promise.all([
        academicApi.getClassLevels(),
        academicApi.getSubjects(),
      ]);
      setClasses(classesData);
      setSubjects(subjectsData);
      if (classesData.length > 0 && !quickClassId) {
        setQuickClassId(classesData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load classes or subjects', err);
      setFeedback({
        type: 'error',
        message: 'Could not load class subjects from server. Please try again.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [quickClassId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      // Class filter
      if (selectedClassId !== 'ALL' && subject.class_level_id !== selectedClassId) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = subject.name.toLowerCase().includes(q);
        const matchesCode = (subject.code || '').toLowerCase().includes(q);
        const matchesClass = (subject.class_level?.name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesClass) return false;
      }

      // Type filter
      if (typeFilter === 'COMPULSORY' && subject.is_optional) return false;
      if (typeFilter === 'OPTIONAL' && !subject.is_optional) return false;
      if (typeFilter === '4TH_SUBJECT' && !subject.can_be_4th_subject) return false;

      return true;
    });
  }, [subjects, selectedClassId, searchQuery, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = subjects.length;
    const classIdsWithSubjects = new Set(subjects.map((s) => s.class_level_id));
    const classesCovered = classIdsWithSubjects.size;
    const compulsory = subjects.filter((s) => !s.is_optional).length;
    const fourthSubjectEligible = subjects.filter((s) => s.can_be_4th_subject).length;
    return { total, classesCovered, compulsory, fourthSubjectEligible };
  }, [subjects]);

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      class_level_id: typeof selectedClassId === 'number' ? selectedClassId : classes[0]?.id || 0,
      name: '',
      code: '',
      full_mark: 100,
      pass_mark: 33,
      is_optional: false,
      can_be_4th_subject: false,
    });
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (subject: Subject) => {
    setSelectedSubjectForEdit(subject);
    setFormData({
      class_level_id: subject.class_level_id,
      name: subject.name,
      code: subject.code || '',
      full_mark: Number(subject.full_mark) || 100,
      pass_mark: Number(subject.pass_mark) || 33,
      is_optional: Boolean(subject.is_optional),
      can_be_4th_subject: Boolean(subject.can_be_4th_subject),
    });
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Subject name is required.' });
      return;
    }
    if (!formData.class_level_id) {
      setFeedback({ type: 'error', message: 'Please select a Class Level for this subject.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await academicApi.createSubject({
        class_level_id: formData.class_level_id,
        name: formData.name.trim(),
        code: formData.code?.trim() || undefined,
        full_mark: Number(formData.full_mark) || 100,
        pass_mark: Number(formData.pass_mark) || 33,
        is_optional: formData.is_optional,
        can_be_4th_subject: formData.can_be_4th_subject,
      });

      setFeedback({
        type: 'success',
        message: `Subject "${formData.name.trim()}" created successfully.`,
      });
      setIsCreateOpen(false);
      await fetchData();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to create subject.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Inline Creator Submit
  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      setQuickError('Subject name is required');
      return;
    }
    if (!quickClassId) {
      setQuickError('Class selection is required');
      return;
    }

    setQuickSubmitting(true);
    setQuickError(null);
    setQuickSuccess(null);

    try {
      await academicApi.createSubject({
        class_level_id: Number(quickClassId),
        name: quickName.trim(),
        code: quickCode.trim() || undefined,
        full_mark: 100,
        pass_mark: 33,
        is_optional: false,
        can_be_4th_subject: false,
      });
      setQuickSuccess(`Subject "${quickName.trim()}" added successfully!`);
      setQuickName('');
      setQuickCode('');
      setTimeout(() => setQuickSuccess(null), 3000);
      await fetchData();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to create subject.';
      setQuickError(errMsg);
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectForEdit) return;
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Subject name is required.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await academicApi.updateSubject(selectedSubjectForEdit.id, {
        class_level_id: formData.class_level_id,
        name: formData.name.trim(),
        code: formData.code?.trim() || undefined,
        full_mark: Number(formData.full_mark) || 100,
        pass_mark: Number(formData.pass_mark) || 33,
        is_optional: formData.is_optional,
        can_be_4th_subject: formData.can_be_4th_subject,
      });

      setFeedback({
        type: 'success',
        message: `Subject "${formData.name.trim()}" updated successfully.`,
      });
      setSelectedSubjectForEdit(null);
      await fetchData();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to update subject.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!selectedSubjectForDelete) return;

    try {
      setIsSubmitting(true);
      const res = await academicApi.deleteSubject(selectedSubjectForDelete.id);
      setFeedback({
        type: 'success',
        message: res.message || `Subject "${selectedSubjectForDelete.name}" deleted successfully.`,
      });
      setSelectedSubjectForDelete(null);
      await fetchData();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        `Cannot delete subject "${selectedSubjectForDelete.name}". Make sure no student marks are attached.`;
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-indigo-600" />
            Class Subjects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage academic subjects for each school class. Each subject belongs to a single class, isolated by tenant.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh subjects list"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/classes/manage')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Layers className="h-4 w-4 text-slate-500" />
            <span>Manage Classes</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-2 rounded-xl p-4 text-sm border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subjects Configured</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-0.5 text-xs text-slate-400">Total in this school tenant</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Classes Covered</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.classesCovered}</p>
          <p className="mt-0.5 text-xs text-slate-400">Out of {classes.length} class levels</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compulsory Subjects</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BookMarked className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{stats.compulsory}</p>
          <p className="mt-0.5 text-xs text-slate-400">Mandatory curriculum</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">4th Subject Eligible</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{stats.fourthSubjectEligible}</p>
          <p className="mt-0.5 text-xs text-slate-400">NCTB GPA bonus rules</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject by name (e.g. Math, Science) or code..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Level Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedClassId(val === 'ALL' ? 'ALL' : parseInt(val));
            }}
            className="rounded-lg border border-slate-200 py-2 px-3 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="ALL">All Classes ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subject Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 py-2 px-3 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="ALL">All Subject Types</option>
            <option value="COMPULSORY">Compulsory Only</option>
            <option value="OPTIONAL">Optional Only</option>
            <option value="4TH_SUBJECT">4th Subject Eligible</option>
          </select>

          {/* Quick inline creator toggle */}
          <button
            type="button"
            onClick={() => setShowQuickCreator((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showQuickCreator
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Quick Creator</span>
          </button>
        </div>
      </div>

      {/* Quick Subject Creator Box */}
      {showQuickCreator && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-indigo-600" />
              Quick Add Class Subject
            </span>
            <button
              type="button"
              onClick={() => setShowQuickCreator(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Close
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
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Class Level <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={quickClassId}
                onChange={(e) => setQuickClassId(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Subject Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bangla 1st Paper, General Science"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 101"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-1">
              <button
                type="submit"
                disabled={quickSubmitting}
                className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-2 px-3 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                {quickSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subjects Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-sm">Loading class subjects...</span>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No class subjects found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || selectedClassId !== 'ALL' || typeFilter !== 'ALL'
                ? 'Try adjusting your search or filters'
                : 'Get started by configuring subjects for your school classes.'}
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Subject</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-3">Class Level</th>
                  <th className="py-3 px-3">Subject Code</th>
                  <th className="py-3 px-3 text-center">Full / Pass Mark</th>
                  <th className="py-3 px-3 text-center">Classification</th>
                  <th className="py-3 px-3 text-center">Marks Recorded</th>
                  <th className="py-3 px-3 text-center">Tenant Scope</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Subject Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span>{subject.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">Subject ID #{subject.id}</span>
                    </td>

                    {/* Class Level */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        <Layers className="h-3 w-3 text-indigo-600" />
                        <span>{subject.class_level?.name || `Class #${subject.class_level_id}`}</span>
                      </span>
                    </td>

                    {/* Subject Code */}
                    <td className="py-3.5 px-3">
                      {subject.code ? (
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {subject.code}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 italic">None</span>
                      )}
                    </td>

                    {/* Marks Distribution */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="text-xs font-mono font-bold text-slate-800">
                        {Number(subject.full_mark) || 100}
                        <span className="text-[11px] font-normal text-slate-400"> (Pass: {Number(subject.pass_mark) || 33})</span>
                      </div>
                    </td>

                    {/* Classification Badges */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {subject.is_optional ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Optional
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Compulsory
                          </span>
                        )}

                        {subject.can_be_4th_subject && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200" title="Eligible for Bangladesh 4th Subject Rule (-2.00 deduction for GPA bonus)">
                            4th Sub Eligible
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Marks Recorded */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          (subject.results_count || 0) > 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}
                      >
                        <FileSpreadsheet className="h-3 w-3" />
                        {subject.results_count || 0} marks
                      </span>
                    </td>

                    {/* Tenant Scope */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        Tenant Isolated
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/exams/marks-entry?class_id=${subject.class_level_id}&subject_id=${subject.id}`
                            )
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Enter student marks for this subject"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Marks</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(subject)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Subject"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedSubjectForDelete(subject)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Subject"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SUBJECT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Add Class Subject</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Class Level <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.class_level_id}
                  onChange={(e) =>
                    setFormData({ ...formData, class_level_id: parseInt(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                >
                  <option value={0} disabled>
                    -- Select Class --
                  </option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Each subject strictly belongs to a single class grade.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Mathematics, General Science, Biology"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 101, 126"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Full Mark
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={formData.full_mark || 100}
                    onChange={(e) =>
                      setFormData({ ...formData, full_mark: parseFloat(e.target.value) || 100 })
                    }
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono text-center focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Pass Mark
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={formData.pass_mark || 33}
                    onChange={(e) =>
                      setFormData({ ...formData, pass_mark: parseFloat(e.target.value) || 33 })
                    }
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono text-center focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_optional}
                    onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Optional Subject (elective course for students)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.can_be_4th_subject}
                    onChange={(e) =>
                      setFormData({ ...formData, can_be_4th_subject: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Can be 4th Subject (Bangladesh NCTB rule: -2.00 deduction for composite GPA bonus)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Create Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUBJECT MODAL */}
      {selectedSubjectForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Subject #{selectedSubjectForEdit.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubjectForEdit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Class Level <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.class_level_id}
                  onChange={(e) =>
                    setFormData({ ...formData, class_level_id: parseInt(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Full Mark
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={formData.full_mark || 100}
                    onChange={(e) =>
                      setFormData({ ...formData, full_mark: parseFloat(e.target.value) || 100 })
                    }
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono text-center focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Pass Mark
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={formData.pass_mark || 33}
                    onChange={(e) =>
                      setFormData({ ...formData, pass_mark: parseFloat(e.target.value) || 33 })
                    }
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono text-center focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_optional}
                    onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Optional Subject
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.can_be_4th_subject}
                    onChange={(e) =>
                      setFormData({ ...formData, can_be_4th_subject: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Can be 4th Subject (NCTB GPA bonus rule)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectForEdit(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {selectedSubjectForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rose-50 p-3 text-rose-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Subject</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{selectedSubjectForDelete.name}</strong> from{' '}
              <strong className="text-slate-900">{selectedSubjectForDelete.class_level?.name || 'its class'}</strong>?
            </p>

            {(selectedSubjectForDelete.results_count || 0) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Notice:</strong> This subject has {selectedSubjectForDelete.results_count} student exam marks recorded.
                  The server prevents deleting subjects that have active marks.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSubjectForDelete(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
