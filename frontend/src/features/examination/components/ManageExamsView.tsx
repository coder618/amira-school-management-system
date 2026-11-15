import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolExamsApi } from '../../../services/api';
import { SchoolExam } from '../../../types';
import {
  Award,
  Calendar,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
  FileSpreadsheet,
  Clock,
  RefreshCw,
  Edit3,
} from 'lucide-react';

const COMMON_TERMS = [
  'First Term',
  'Second Term',
  'Mid Term',
  'Half-Yearly',
  'Final Exam',
  'Annual Exam',
  'Pre-Test',
  'Test',
];

export const ManageExamsView: React.FC = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState<SchoolExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [termFilter, setTermFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedExamForEdit, setSelectedExamForEdit] = useState<SchoolExam | null>(null);
  const [selectedExamForDelete, setSelectedExamForDelete] = useState<SchoolExam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingPublishId, setTogglingPublishId] = useState<number | null>(null);

  // Form states
  const [examForm, setExamForm] = useState({
    name: '',
    term: 'First Term',
    start_date: '',
    end_date: '',
    is_published: false,
  });

  const fetchExams = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await schoolExamsApi.getAll();
      setExams(data);
    } catch (err: any) {
      console.error('Failed to load exams', err);
      setFeedback({
        type: 'error',
        message: 'Could not load exams from server. Please try again.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.term.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTerm = termFilter === 'ALL' || exam.term === termFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PUBLISHED' && exam.is_published) ||
        (statusFilter === 'DRAFT' && !exam.is_published);

      return matchesSearch && matchesTerm && matchesStatus;
    });
  }, [exams, searchQuery, termFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = exams.length;
    const published = exams.filter((e) => e.is_published).length;
    const draft = total - published;
    const totalMarks = exams.reduce((sum, e) => sum + (e.marks_count || 0), 0);
    return { total, published, draft, totalMarks };
  }, [exams]);

  // Open Create Modal
  const openCreateModal = () => {
    setExamForm({
      name: '',
      term: 'First Term',
      start_date: '',
      end_date: '',
      is_published: false,
    });
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (exam: SchoolExam) => {
    setSelectedExamForEdit(exam);
    setExamForm({
      name: exam.name,
      term: exam.term,
      start_date: exam.start_date ? exam.start_date.substring(0, 10) : '',
      end_date: exam.end_date ? exam.end_date.substring(0, 10) : '',
      is_published: Boolean(exam.is_published),
    });
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.name.trim()) {
      setFeedback({ type: 'error', message: 'Exam name is required.' });
      return;
    }
    if (examForm.start_date && examForm.end_date && examForm.start_date > examForm.end_date) {
      setFeedback({ type: 'error', message: 'Start date cannot be after end date.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await schoolExamsApi.create({
        name: examForm.name.trim(),
        term: examForm.term,
        start_date: examForm.start_date || undefined,
        end_date: examForm.end_date || undefined,
        is_published: examForm.is_published,
      });
      setFeedback({
        type: 'success',
        message: `Exam "${examForm.name}" created successfully.`,
      });
      setIsCreateOpen(false);
      await fetchExams();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to create exam.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForEdit) return;
    if (!examForm.name.trim()) {
      setFeedback({ type: 'error', message: 'Exam name is required.' });
      return;
    }
    if (examForm.start_date && examForm.end_date && examForm.start_date > examForm.end_date) {
      setFeedback({ type: 'error', message: 'Start date cannot be after end date.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await schoolExamsApi.update(selectedExamForEdit.id, {
        name: examForm.name.trim(),
        term: examForm.term,
        start_date: examForm.start_date || null,
        end_date: examForm.end_date || null,
        is_published: examForm.is_published,
      });
      setFeedback({
        type: 'success',
        message: `Exam "${examForm.name}" updated successfully.`,
      });
      setSelectedExamForEdit(null);
      await fetchExams();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to update exam.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Publish
  const handleTogglePublish = async (exam: SchoolExam) => {
    try {
      setTogglingPublishId(exam.id);
      const res = await schoolExamsApi.togglePublish(exam.id);
      setFeedback({
        type: 'success',
        message: res.message || `Exam "${exam.name}" publication status updated.`,
      });
      setExams((prev) =>
        prev.map((e) => (e.id === exam.id ? { ...e, is_published: res.is_published } : e))
      );
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Could not toggle exam publication status.',
      });
    } finally {
      setTogglingPublishId(null);
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!selectedExamForDelete) return;
    try {
      setIsSubmitting(true);
      const res = await schoolExamsApi.delete(selectedExamForDelete.id);
      setFeedback({
        type: 'success',
        message: res.message || `Exam "${selectedExamForDelete.name}" deleted successfully.`,
      });
      setSelectedExamForDelete(null);
      await fetchExams();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        `Cannot delete exam "${selectedExamForDelete.name}". Please ensure no student results or marks are attached.`;
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
            <Award className="h-7 w-7 text-indigo-600" />
            Exam Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, schedule, edit, and publish school examinations for the academic year.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchExams}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/exams/marks')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Edit2 className="h-4 w-4 text-indigo-600" />
            <span>Exam Marks</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/exams/results')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Exam Results</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Exam</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
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

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Exams</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-0.5 text-xs text-slate-400">Scheduled for this tenant</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Published Results</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.published}</p>
          <p className="mt-0.5 text-xs text-slate-400">Visible to students & guardians</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Draft / In Progress</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{stats.draft}</p>
          <p className="mt-0.5 text-xs text-slate-400">Results pending publication</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Marks Stored</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{stats.totalMarks}</p>
          <p className="mt-0.5 text-xs text-slate-400">Recorded student scores</p>
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
            placeholder="Search exam by title or term..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="rounded-lg border border-slate-200 py-2 px-3 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="ALL">All Terms</option>
            {COMMON_TERMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 py-2 px-3 text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="ALL">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Exams Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-sm">Loading school exams...</span>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No exams found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || termFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first exam session.'}
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Exam</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Exam Name</th>
                  <th className="py-3 px-3">Term</th>
                  <th className="py-3 px-3">Schedule</th>
                  <th className="py-3 px-3 text-center">Marks Recorded</th>
                  <th className="py-3 px-3 text-center">Publication Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Exam Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <Award className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span>{exam.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">ID #{exam.id}</span>
                    </td>

                    {/* Term */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {exam.term}
                      </span>
                    </td>

                    {/* Schedule */}
                    <td className="py-3.5 px-3">
                      {exam.start_date || exam.end_date ? (
                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            {exam.start_date || 'TBD'} &rarr; {exam.end_date || 'TBD'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not scheduled</span>
                      )}
                    </td>

                    {/* Marks Count */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          (exam.marks_count || 0) > 0
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        <FileSpreadsheet className="h-3 w-3" />
                        {exam.marks_count || 0} marks
                      </span>
                    </td>

                    {/* Publication Status & Toggle */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(exam)}
                        disabled={togglingPublishId === exam.id}
                        title="Click to toggle publication status"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          exam.is_published
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {togglingPublishId === exam.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : exam.is_published ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Clock className="h-3 w-3 text-amber-600" />
                        )}
                        <span>{exam.is_published ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/exams/marks?exam_id=${exam.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Enter & View Marks"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Marks</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/exams/results?exam_id=${exam.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="View & Manage Results"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Results</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(exam)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Exam"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedExamForDelete(exam)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Exam"
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

      {/* CREATE EXAM MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Create New Exam Session</h3>
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
                  Exam Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Term Examination 2026"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Term / Session <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={examForm.term}
                    onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  >
                    {COMMON_TERMS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Custom Term (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="or type custom term"
                    onChange={(e) => {
                      if (e.target.value.trim()) {
                        setExamForm({ ...examForm, term: e.target.value.trim() });
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={examForm.start_date}
                    onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={examForm.end_date}
                    onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={examForm.is_published}
                    onChange={(e) => setExamForm({ ...examForm, is_published: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Publish exam results immediately (visible on student report cards)
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
                  <span>Create Exam</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EXAM MODAL */}
      {selectedExamForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Exam #{selectedExamForEdit.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExamForEdit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Exam Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Term / Session <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={examForm.term}
                  onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={examForm.start_date}
                    onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={examForm.end_date}
                    onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={examForm.is_published}
                    onChange={(e) => setExamForm({ ...examForm, is_published: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Results Published (check to make results public to students)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedExamForEdit(null)}
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
      {selectedExamForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rose-50 p-3 text-rose-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Exam</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900 font-semibold">{selectedExamForDelete.name}</strong>?
            </p>

            {(selectedExamForDelete.marks_count || 0) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Notice:</strong> This exam has {selectedExamForDelete.marks_count} student marks recorded.
                  The server prevents deleting exams that have marks recorded.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedExamForDelete(null)}
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
