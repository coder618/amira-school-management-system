import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  Loader2,
  BookOpen,
  Eye,
  Trophy,
  X,
} from 'lucide-react';
import { schoolExamsApi, schoolExamResultsApi } from '../../services/api';
import { apiClient } from '../../shared/services/apiClient';
import { SchoolExam, TabulationData } from '../../types';

interface ClassOption {
  id: number;
  name: string;
  numeric_value: number;
}

interface ReportCardData {
  student: {
    first_name: string;
    last_name: string;
    student_id: string;
    roll_number: number;
    class_level?: { name: string };
    section?: { name: string };
    school?: { name: string };
  };
  exam: {
    name: string;
    term: string;
  };
  marks: Array<{
    id: number;
    subjective_mark: number;
    objective_mark: number;
    practical_mark: number;
    total_mark: number;
    gpa: number;
    grade: string;
    is_4th_subject: boolean;
    subject?: { name: string; code?: string };
  }>;
  total_marks_obtained: number;
  final_gpa: number;
  final_grade: string;
  passed: boolean;
  has_failed_main_subject: boolean;
  fourth_subject_bonus: number;
  total_grade_points: number;
}

export const SchoolExamsAndResultsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exams' | 'results'>('exams');
  const [exams, setExams] = useState<SchoolExam[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Exam Creation Modal State
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    name: '',
    term: 'First Term',
    start_date: '',
    end_date: '',
    is_published: false,
  });
  const [creatingExam, setCreatingExam] = useState(false);

  // Tabulation State
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [tabulation, setTabulation] = useState<TabulationData | null>(null);
  const [loadingTabulation, setLoadingTabulation] = useState(false);

  // Report Card Modal State
  const [activeReportCard, setActiveReportCard] = useState<ReportCardData | null>(null);
  const [loadingStudentId, setLoadingStudentId] = useState<number | null>(null);

  // Search filter for exams
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch initial exams and classes
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [examsData, classesRes] = await Promise.all([
        schoolExamsApi.getAll(),
        apiClient.get<ClassOption[]>('/class-levels'),
      ]);
      setExams(examsData);
      setClasses(classesRes.data);

      if (examsData.length > 0 && !selectedExamId) {
        setSelectedExamId(examsData[0].id);
      }
      if (classesRes.data.length > 0 && !selectedClassId) {
        setSelectedClassId(classesRes.data[0].id);
      }
    } catch {
      setError('Failed to load examination modules data.');
    } finally {
      setLoading(false);
    }
  }, [selectedExamId, selectedClassId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load Tabulation Sheet when exam & class are selected
  const loadTabulation = useCallback(async () => {
    if (!selectedExamId || !selectedClassId) return;
    try {
      setLoadingTabulation(true);
      const data = await schoolExamResultsApi.getTabulation(selectedExamId, selectedClassId);
      setTabulation(data);
    } catch {
      setTabulation(null);
    } finally {
      setLoadingTabulation(false);
    }
  }, [selectedExamId, selectedClassId]);

  useEffect(() => {
    if (activeTab === 'results' && selectedExamId && selectedClassId) {
      loadTabulation();
    }
  }, [activeTab, selectedExamId, selectedClassId, loadTabulation]);

  // Handle Exam Creation
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingExam(true);
      setError(null);
      const newExam = await schoolExamsApi.create(examForm);
      setExams((prev) => [newExam, ...prev]);
      setShowCreateExamModal(false);
      setExamForm({
        name: '',
        term: 'First Term',
        start_date: '',
        end_date: '',
        is_published: false,
      });
      setSuccessMsg(`Exam "${newExam.name}" scheduled successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Failed to create exam.');
    } finally {
      setCreatingExam(false);
    }
  };

  // Handle Toggle Publish
  const handleTogglePublish = async (exam: SchoolExam) => {
    try {
      const res = await schoolExamsApi.togglePublish(exam.id);
      setExams((prev) =>
        prev.map((e) => (e.id === exam.id ? { ...e, is_published: res.is_published } : e))
      );
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Failed to update exam publication status.');
    }
  };

  // Handle Delete Exam
  const handleDeleteExam = async (exam: SchoolExam) => {
    if (!window.confirm(`Are you sure you want to delete exam "${exam.name}"?`)) return;
    try {
      await schoolExamsApi.delete(exam.id);
      setExams((prev) => prev.filter((e) => e.id !== exam.id));
      setSuccessMsg(`Exam "${exam.name}" removed.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Cannot delete exam.');
    }
  };

  // Handle View Student Report Card
  const handleViewReportCard = async (studentId: number) => {
    if (!selectedExamId) return;
    try {
      setLoadingStudentId(studentId);
      const res = await schoolExamResultsApi.getReportCard(studentId, selectedExamId);
      setActiveReportCard(res as ReportCardData);
    } catch {
      setError('Failed to load official report card.');
    } finally {
      setLoadingStudentId(null);
    }
  };

  const filteredExams = exams.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.term.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header with Module Navigation */}
      <div className="border-b border-slate-100 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Examinations & Result Center
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/30">
                  Tenant Scoped
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Manage institutional exams (<code className="text-indigo-300">SchoolExams</code>) and NCTB tabulation with rankings (<code className="text-indigo-300">SchoolExamResults</code>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateExamModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule New Exam</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex border-b border-indigo-800/60 gap-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('exams')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'exams'
                ? 'border-indigo-400 text-white font-semibold'
                : 'border-transparent text-indigo-300/70 hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>School Exams Directory ({exams.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'results'
                ? 'border-indigo-400 text-white font-semibold'
                : 'border-transparent text-indigo-300/70 hover:text-white'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Class Results & Tabulation Sheet</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      <div className="p-4">
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* TAB 1: SchoolExams Management */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            {/* Filter & Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search exam name or term..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Published: <strong>{exams.filter((e) => e.is_published).length}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  Drafts: <strong>{exams.filter((e) => !e.is_published).length}</strong>
                </span>
              </div>
            </div>

            {/* Exams Table */}
            {loading ? (
              <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading tenant exams...</span>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <Award className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No exams registered for this school yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Click "Schedule New Exam" to create the first term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Exam Name</th>
                      <th className="py-3 px-4">Term</th>
                      <th className="py-3 px-4">Schedule</th>
                      <th className="py-3 px-4">Marks Recorded</th>
                      <th className="py-3 px-4">Results Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {exam.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700">
                            {exam.term}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {exam.start_date ? `${exam.start_date} ~ ${exam.end_date || 'TBD'}` : 'Schedule Pending'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">
                            {exam.marks_count ?? 0}
                          </span>{' '}
                          <span className="text-slate-400">marks</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(exam)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold cursor-pointer transition-colors ${
                              exam.is_published
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${exam.is_published ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                            {exam.is_published ? 'Published' : 'Draft (Unpublished)'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExamId(exam.id);
                                setActiveTab('results');
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="View Tabulation Sheet"
                            >
                              <Trophy className="h-3 w-3" />
                              <span>Tabulation</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExam(exam)}
                              className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Exam"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        )}

        {/* TAB 2: SchoolExamResults Management */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {/* Filter selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Select Exam</label>
                  <select
                    value={selectedExamId || ''}
                    onChange={(e) => setSelectedExamId(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-medium focus:border-indigo-500 focus:outline-hidden"
                  >
                    {exams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.term})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Select Class Level</label>
                  <select
                    value={selectedClassId || ''}
                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-medium focus:border-indigo-500 focus:outline-hidden"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end">
                <button
                  type="button"
                  onClick={loadTabulation}
                  disabled={loadingTabulation}
                  className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {loadingTabulation ? 'Refreshing...' : 'Refresh Sheet'}
                </button>
              </div>
            </div>

            {/* Tabulation Table */}
            {loadingTabulation ? (
              <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Calculating NCTB class merit rankings...</span>
              </div>
            ) : !tabulation || tabulation.tabulation.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No marks recorded for this class in this exam</p>
                <p className="text-xs text-slate-400 mt-0.5">Use the "Exams & GPA" module from sidebar to bulk enter student marks.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 text-center">Merit Rank</th>
                      <th className="py-3 px-3">Roll</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-3">Section</th>
                      {tabulation.subjects.map((sub) => (
                        <th key={sub.id} className="py-3 px-3 text-center">
                          {sub.name}
                        </th>
                      ))}
                      <th className="py-3 px-3 text-center">Total Marks</th>
                      <th className="py-3 px-3 text-center">GPA (NCTB)</th>
                      <th className="py-3 px-3 text-center">Grade</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Report Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tabulation.tabulation.map((row) => (
                      <tr key={row.student_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center font-bold">
                          {row.rank ? (
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                row.rank === 1
                                  ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                                  : row.rank === 2
                                  ? 'bg-slate-200 text-slate-800 ring-2 ring-slate-300'
                                  : row.rank === 3
                                  ? 'bg-amber-700/20 text-amber-900 ring-2 ring-amber-600/30'
                                  : 'text-slate-600'
                              }`}
                            >
                              {row.rank}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{row.roll_number}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{row.name}</td>
                        <td className="py-3 px-3 text-slate-500">{row.section || '-'}</td>
                        {tabulation.subjects.map((sub) => {
                          const mark = row.subjects[sub.id];
                          return (
                            <td key={sub.id} className="py-3 px-3 text-center">
                              {mark ? (
                                <div>
                                  <span className="font-semibold text-slate-900">{mark.total}</span>
                                  <span className="block text-[10px] text-slate-400">
                                    {mark.grade} ({mark.gpa})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {row.total_marks}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs ${
                              row.final_gpa >= 5.0
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : row.final_gpa >= 3.5
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : row.final_gpa >= 1.0
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {Number(row.final_gpa).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs ${
                              row.final_grade === 'A+'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.final_grade === 'F'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {row.final_grade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.passed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle className="h-3.5 w-3.5" /> Passed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                              <AlertCircle className="h-3.5 w-3.5" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleViewReportCard(row.student_id)}
                            disabled={loadingStudentId === row.student_id}
                            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {loadingStudentId === row.student_id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                            <span>Report</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Create New Exam */}
      {showCreateExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Schedule New Examination
              </h3>
              <button
                onClick={() => setShowCreateExamModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exam Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Term Exam 2026, Annual Exam"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Term <span className="text-rose-500">*</span>
                </label>
                <select
                  value={examForm.term}
                  onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="First Term">First Term Examination</option>
                  <option value="Half-Yearly">Half-Yearly Examination</option>
                  <option value="Final Exam">Final / Annual Examination</option>
                  <option value="Pre-Test">Pre-Test Examination (SSC/HSC)</option>
                  <option value="Test">Test Examination (SSC/HSC)</option>
                  <option value="Model Test">Model Test</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={examForm.start_date}
                    onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={examForm.end_date}
                    onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_published_checkbox"
                  checked={examForm.is_published}
                  onChange={(e) => setExamForm({ ...examForm, is_published: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_published_checkbox" className="text-xs font-medium text-slate-700">
                  Publish results immediately upon completion
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateExamModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingExam}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {creatingExam ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Save Exam Cycle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Official NCTB Report Card */}
      {activeReportCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                  Government of the People's Republic of Bangladesh
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Academic Progress Report Card
                </h3>
                <p className="text-xs text-slate-500">
                  {activeReportCard.student.school?.name || 'Institutional Evaluation'} • {activeReportCard.exam.name}
                </p>
              </div>
              <button
                onClick={() => setActiveReportCard(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Student Info Card */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Student Name</span>
                <strong className="text-slate-800">
                  {activeReportCard.student.first_name} {activeReportCard.student.last_name}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Student ID</span>
                <strong className="text-slate-800 font-mono">{activeReportCard.student.student_id}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Class & Section</span>
                <strong className="text-slate-800">
                  {activeReportCard.student.class_level?.name || 'Class'} ({activeReportCard.student.section?.name || 'A'})
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Roll Number</span>
                <strong className="text-slate-800">{activeReportCard.student.roll_number}</strong>
              </div>
            </div>

            {/* Marks Breakdown Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-2 text-center">CQ</th>
                    <th className="py-2.5 px-2 text-center">MCQ</th>
                    <th className="py-2.5 px-2 text-center">Practical</th>
                    <th className="py-2.5 px-3 text-center">Total</th>
                    <th className="py-2.5 px-2 text-center">Grade</th>
                    <th className="py-2.5 px-2 text-center">GPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeReportCard.marks.map((m) => (
                    <tr key={m.id} className={m.is_4th_subject ? 'bg-amber-50/50' : ''}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {m.subject?.name || 'Subject'}
                        {m.is_4th_subject && (
                          <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                            4th Subject
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{m.subjective_mark}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{m.objective_mark}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{m.practical_mark}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{m.total_mark}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-indigo-700">{m.grade}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800">{Number(m.gpa).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* NCTB Evaluation Summary */}
            <div className="mt-4 rounded-xl bg-linear-to-r from-indigo-900 to-slate-900 p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Result Evaluation
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-black">{Number(activeReportCard.final_gpa).toFixed(2)}</span>
                  <span className="rounded-lg bg-white/10 px-2.5 py-1 text-sm font-extrabold text-amber-300 border border-white/10">
                    Grade {activeReportCard.final_grade}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      activeReportCard.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {activeReportCard.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-indigo-200 text-right space-y-0.5">
                <div>Total Marks: <strong>{activeReportCard.total_marks_obtained}</strong></div>
                {activeReportCard.fourth_subject_bonus > 0 && (
                  <div>
                    4th Subject Bonus: <strong className="text-emerald-400">+{activeReportCard.fourth_subject_bonus.toFixed(2)} pts</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveReportCard(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
