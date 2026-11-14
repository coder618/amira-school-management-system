import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { schoolExamsApi, schoolExamResultsApi } from '../../../services/api';
import { academicApi } from '../../academic/api';
import { examinationApi } from '../api';
import { SchoolExam, SchoolExamResult, TabulationData } from '../../../types';
import { ClassLevel, Student } from '../../academic/types';
import { Subject, StudentReportCard, NctbGrade } from '../types';
import { ReportCardModal } from './ReportCardModal';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Award,
  RefreshCw,
  Edit3,
  X,
  Check,
  Trophy,
  Users,
  Printer,
} from 'lucide-react';

export const ManageResultsView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Primary Selection States
  const [exams, setExams] = useState<SchoolExam[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedExamId, setSelectedExamId] = useState<number | null>(
    searchParams.get('exam_id') ? parseInt(searchParams.get('exam_id')!) : null
  );
  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    searchParams.get('class_id') ? parseInt(searchParams.get('class_id')!) : null
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    searchParams.get('subject_id') ? parseInt(searchParams.get('subject_id')!) : null
  );

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Results State
  const [results, setResults] = useState<SchoolExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedResultForEdit, setSelectedResultForEdit] = useState<SchoolExamResult | null>(null);
  const [selectedResultForDelete, setSelectedResultForDelete] = useState<SchoolExamResult | null>(null);
  const [activeReportCard, setActiveReportCard] = useState<StudentReportCard | null>(null);
  const [loadingReportCardId, setLoadingReportCardId] = useState<number | null>(null);
  const [tabulationData, setTabulationData] = useState<TabulationData | null>(null);
  const [isTabulationOpen, setIsTabulationOpen] = useState(false);
  const [loadingTabulation, setLoadingTabulation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Form state
  const [addForm, setAddForm] = useState({
    exam_id: 0,
    class_level_id: 0,
    student_id: 0,
    subject_id: 0,
    subjective_mark: 0,
    objective_mark: 0,
    practical_mark: 0,
    is_4th_subject: false,
  });

  // Modal dynamic class subjects and students
  const [modalSubjects, setModalSubjects] = useState<Subject[]>([]);
  const [modalStudents, setModalStudents] = useState<Student[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  // Edit Form state
  const [editForm, setEditForm] = useState({
    subjective_mark: 0,
    objective_mark: 0,
    practical_mark: 0,
    is_4th_subject: false,
  });

  // Load initial dropdowns (Exams & Classes)
  useEffect(() => {
    Promise.all([
      schoolExamsApi.getAll(),
      academicApi.getClassLevels(),
    ])
      .then(([examsData, classesData]) => {
        setExams(examsData);
        if (examsData.length > 0 && !selectedExamId) {
          setSelectedExamId(examsData[0].id);
        }

        setClassLevels(classesData);
        if (classesData.length > 0 && !selectedClassId) {
          setSelectedClassId(classesData[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load initial metadata', err);
        setFeedback({ type: 'error', message: 'Could not load exams or class levels.' });
      });
  }, []);

  // When class changes, fetch subjects for that class
  useEffect(() => {
    if (!selectedClassId) return;

    examinationApi.getSubjects(selectedClassId)
      .then((subjectsData) => {
        setSubjects(subjectsData);
      })
      .catch((err) => {
        console.error('Failed to fetch class subjects', err);
      });
  }, [selectedClassId]);

  // Fetch results based on selected filters
  const fetchResults = useCallback(async () => {
    if (!selectedExamId) return;
    try {
      setRefreshing(true);
      const params: any = {
        exam_id: selectedExamId,
      };
      if (selectedClassId) params.class_level_id = selectedClassId;
      if (selectedSubjectId) params.subject_id = selectedSubjectId;

      const data = await schoolExamResultsApi.getAll(params);
      setResults(data);
    } catch (err: any) {
      console.error('Failed to load exam results', err);
      setFeedback({ type: 'error', message: 'Could not load exam marks from server.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedExamId, selectedClassId, selectedSubjectId]);

  useEffect(() => {
    if (selectedExamId) {
      fetchResults();
    }
  }, [selectedExamId, selectedClassId, selectedSubjectId, fetchResults]);

  // Client-side search filtering
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;
    const q = searchQuery.toLowerCase();
    return results.filter((res) => {
      const studentName = `${res.student?.first_name || ''} ${res.student?.last_name || ''}`.toLowerCase();
      const studentId = (res.student?.student_id || '').toLowerCase();
      const rollNumber = String(res.student?.roll_number || '');
      const subjectName = (res.subject?.name || '').toLowerCase();
      return (
        studentName.includes(q) ||
        studentId.includes(q) ||
        rollNumber.includes(q) ||
        subjectName.includes(q)
      );
    });
  }, [results, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredResults.length;
    if (total === 0) {
      return { total: 0, passRate: 0, avgGpa: '0.00', aPlusCount: 0 };
    }
    const passedCount = filteredResults.filter((r) => r.grade !== 'F').length;
    const passRate = Math.round((passedCount / total) * 100);
    const avgGpa = (
      filteredResults.reduce((acc, curr) => acc + (Number(curr.gpa) || 0), 0) / total
    ).toFixed(2);
    const aPlusCount = filteredResults.filter((r) => r.grade === 'A+').length;
    return { total, passRate, avgGpa, aPlusCount };
  }, [filteredResults]);

  // NCTB grade calculation helper for preview
  const calculateLocalGrade = (total: number): { gpa: number; grade: NctbGrade } => {
    if (total >= 80) return { gpa: 5.0, grade: 'A+' };
    if (total >= 70) return { gpa: 4.0, grade: 'A' };
    if (total >= 60) return { gpa: 3.5, grade: 'A-' };
    if (total >= 50) return { gpa: 3.0, grade: 'B' };
    if (total >= 40) return { gpa: 2.0, grade: 'C' };
    if (total >= 33) return { gpa: 1.0, grade: 'D' };
    return { gpa: 0.0, grade: 'F' };
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'A':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'A-':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'B':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'C':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'D':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'F':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  // Handle class selection inside Add Modal
  const handleModalClassChange = async (newClassId: number) => {
    setAddForm((prev) => ({
      ...prev,
      class_level_id: newClassId,
      subject_id: 0,
      student_id: 0,
    }));
    setLoadingModalData(true);
    try {
      const [subData, stuData] = await Promise.all([
        examinationApi.getSubjects(newClassId),
        academicApi.getStudents({ class_level_id: newClassId }),
      ]);
      setModalSubjects(subData);
      setModalStudents(stuData);
      setAddForm((prev) => ({
        ...prev,
        subject_id: subData[0]?.id ?? 0,
        student_id: stuData[0]?.id ?? 0,
        is_4th_subject: Boolean(subData[0]?.can_be_4th_subject),
      }));
    } catch (err) {
      console.error('Failed to load class subjects/students for modal', err);
    } finally {
      setLoadingModalData(false);
    }
  };

  // Open Add Modal
  const openAddModal = async () => {
    const initialClassId = selectedClassId || (classLevels[0]?.id ?? 0);
    const initialExamId = selectedExamId || (exams[0]?.id ?? 0);

    setIsAddOpen(true);
    setLoadingModalData(true);

    try {
      let subData: Subject[] = [];
      let stuData: Student[] = [];

      if (initialClassId) {
        const [fetchedSubjects, fetchedStudents] = await Promise.all([
          examinationApi.getSubjects(initialClassId),
          academicApi.getStudents({ class_level_id: initialClassId }),
        ]);
        subData = fetchedSubjects;
        stuData = fetchedStudents;
      }

      setModalSubjects(subData);
      setModalStudents(stuData);

      setAddForm({
        exam_id: initialExamId,
        class_level_id: initialClassId,
        subject_id: subData[0]?.id ?? 0,
        student_id: stuData[0]?.id ?? 0,
        subjective_mark: 0,
        objective_mark: 0,
        practical_mark: 0,
        is_4th_subject: Boolean(subData[0]?.can_be_4th_subject),
      });
    } catch (err) {
      console.error('Failed to initialize add form modal data', err);
    } finally {
      setLoadingModalData(false);
    }
  };

  // Submit Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.exam_id || !addForm.class_level_id || !addForm.student_id || !addForm.subject_id) {
      setFeedback({ type: 'error', message: 'Please select Exam, Class Level, Student, and Subject.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await schoolExamResultsApi.create({
        exam_id: addForm.exam_id,
        subject_id: addForm.subject_id,
        student_id: addForm.student_id,
        subjective_mark: Number(addForm.subjective_mark) || 0,
        objective_mark: Number(addForm.objective_mark) || 0,
        practical_mark: Number(addForm.practical_mark) || 0,
        is_4th_subject: addForm.is_4th_subject,
      });

      setFeedback({ type: 'success', message: 'Student mark recorded successfully.' });
      setIsAddOpen(false);
      await fetchResults();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to save student mark.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (result: SchoolExamResult) => {
    setSelectedResultForEdit(result);
    setEditForm({
      subjective_mark: result.subjective_mark,
      objective_mark: result.objective_mark,
      practical_mark: result.practical_mark || 0,
      is_4th_subject: Boolean(result.is_4th_subject),
    });
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResultForEdit) return;

    try {
      setIsSubmitting(true);
      await schoolExamResultsApi.update(selectedResultForEdit.id, {
        subjective_mark: Number(editForm.subjective_mark) || 0,
        objective_mark: Number(editForm.objective_mark) || 0,
        practical_mark: Number(editForm.practical_mark) || 0,
        is_4th_subject: editForm.is_4th_subject,
      });

      setFeedback({ type: 'success', message: 'Student mark updated successfully.' });
      setSelectedResultForEdit(null);
      await fetchResults();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to update student mark.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!selectedResultForDelete) return;

    try {
      setIsSubmitting(true);
      const res = await schoolExamResultsApi.delete(selectedResultForDelete.id);
      setFeedback({
        type: 'success',
        message: res.message || 'Exam mark removed successfully.',
      });
      setSelectedResultForDelete(null);
      await fetchResults();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to delete mark record.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Student Report Card
  const handleViewReportCard = async (studentId: number) => {
    if (!selectedExamId) return;
    try {
      setLoadingReportCardId(studentId);
      const data = await examinationApi.getStudentReportCard(studentId, selectedExamId);
      setActiveReportCard(data);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Could not load student report card.',
      });
    } finally {
      setLoadingReportCardId(null);
    }
  };

  // Open Class Tabulation Sheet
  const handleOpenTabulation = async () => {
    if (!selectedExamId || !selectedClassId) {
      setFeedback({ type: 'error', message: 'Please select an Exam and Class Level first.' });
      return;
    }
    try {
      setLoadingTabulation(true);
      const data = await schoolExamResultsApi.getTabulation(selectedExamId, selectedClassId);
      setTabulationData(data);
      setIsTabulationOpen(true);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Could not calculate class tabulation rankings.',
      });
    } finally {
      setLoadingTabulation(false);
    }
  };

  // Add Form live preview calculations
  const addTotal =
    Number(addForm.subjective_mark || 0) +
    Number(addForm.objective_mark || 0) +
    Number(addForm.practical_mark || 0);
  const addGrade = calculateLocalGrade(addTotal);

  // Edit Form live preview calculations
  const editTotal =
    Number(editForm.subjective_mark || 0) +
    Number(editForm.objective_mark || 0) +
    Number(editForm.practical_mark || 0);
  const editGrade = calculateLocalGrade(editTotal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Edit2 className="h-7 w-7 text-indigo-600" />
            Exam Marks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record, edit, delete, and inspect individual student subject marks, scores, and NCTB grades.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/exams/results')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Composite Results</span>
          </button>

          <button
            type="button"
            onClick={fetchResults}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh results"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenTabulation}
            disabled={loadingTabulation || !selectedExamId || !selectedClassId}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {loadingTabulation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4 text-amber-500" />}
            <span>Tabulation Sheet</span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/exams/marks-entry?exam_id=${selectedExamId || ''}&class_id=${selectedClassId || ''}&subject_id=${selectedSubjectId || ''}`
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Edit3 className="h-4 w-4 text-indigo-600" />
            <span>Bulk Marks Entry</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record Mark</span>
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

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Marks Stored</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-0.5 text-xs text-slate-400">Records matching filter</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Class Pass Rate</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.passRate}%</p>
          <p className="mt-0.5 text-xs text-slate-400">Non-failing subjects</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average GPA</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{stats.avgGpa}</p>
          <p className="mt-0.5 text-xs text-slate-400">Scale of 5.00</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">A+ Count (5.00)</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{stats.aPlusCount}</p>
          <p className="mt-0.5 text-xs text-slate-400">Top performance marks</p>
        </div>
      </div>

      {/* Filter Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs items-center">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Exam Session
          </label>
          <select
            value={selectedExamId || ''}
            onChange={(e) => setSelectedExamId(parseInt(e.target.value))}
            className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.term})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Class Level
          </label>
          <select
            value={selectedClassId || ''}
            onChange={(e) => {
              const cid = parseInt(e.target.value);
              setSelectedClassId(cid);
              setSelectedSubjectId(null);
            }}
            className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
          >
            {classLevels.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Subject Filter
          </label>
          <select
            value={selectedSubjectId || ''}
            onChange={(e) => setSelectedSubjectId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.code ? `(${s.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Search Student
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, Roll, or ID..."
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-sm">Fetching recorded marks...</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No examination marks found</p>
            <p className="text-xs text-slate-400 mt-1">
              There are no marks matching the selected criteria.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Record Single Mark</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/exams/marks-entry?exam_id=${selectedExamId || ''}&class_id=${selectedClassId || ''}&subject_id=${selectedSubjectId || ''}`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Edit3 className="h-4 w-4 text-indigo-600" />
                <span>Bulk Entry Sheet</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3 text-center">CQ</th>
                  <th className="py-3 px-3 text-center">MCQ</th>
                  <th className="py-3 px-3 text-center">Practical</th>
                  <th className="py-3 px-3 text-center">Total</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                  <th className="py-3 px-3 text-center">GPA</th>
                  <th className="py-3 px-3 text-center">4th Sub</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Roll */}
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      #{result.student?.roll_number ?? '-'}
                    </td>

                    {/* Student */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {result.student?.first_name} {result.student?.last_name}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {result.student?.student_id} {result.student?.section?.name ? `(${result.student.section.name})` : ''}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{result.subject?.name}</div>
                      {result.subject?.code && (
                        <span className="text-[11px] text-slate-400 font-mono">{result.subject.code}</span>
                      )}
                    </td>

                    {/* CQ */}
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                      {result.subjective_mark}
                    </td>

                    {/* MCQ */}
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                      {result.objective_mark}
                    </td>

                    {/* Practical */}
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                      {result.practical_mark || 0}
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                      {result.total_mark}
                    </td>

                    {/* Grade */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${getGradeBadge(
                          result.grade
                        )}`}
                      >
                        {result.grade}
                      </span>
                    </td>

                    {/* GPA */}
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                      {Number(result.gpa).toFixed(2)}
                    </td>

                    {/* 4th Subject */}
                    <td className="py-3 px-3 text-center">
                      {result.is_4th_subject ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          4th Sub
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewReportCard(result.student_id)}
                          disabled={loadingReportCardId === result.student_id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 transition-colors cursor-pointer"
                          title="View NCTB Transcript"
                        >
                          {loadingReportCardId === result.student_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Award className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">Transcript</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(result)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Mark"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedResultForDelete(result)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Mark"
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

      {/* RECORD SINGLE MARK MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Record Student Mark</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {/* Row 1: Exam Session & Class Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Exam Session <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addForm.exam_id}
                    onChange={(e) => setAddForm({ ...addForm, exam_id: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.term})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Class Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addForm.class_level_id}
                    onChange={(e) => handleModalClassChange(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
                  >
                    {classLevels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Subject (based on Class) & Student (based on Class) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    {loadingModalData && (
                      <span className="text-[10px] text-indigo-600 flex items-center gap-1 font-medium">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Loading...
                      </span>
                    )}
                  </div>
                  <select
                    value={addForm.subject_id}
                    onChange={(e) => {
                      const subId = parseInt(e.target.value);
                      const sub = modalSubjects.find((s) => s.id === subId);
                      setAddForm({
                        ...addForm,
                        subject_id: subId,
                        is_4th_subject: Boolean(sub?.can_be_4th_subject),
                      });
                    }}
                    disabled={loadingModalData || modalSubjects.length === 0}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {modalSubjects.length === 0 ? (
                      <option value={0}>No subjects in this class</option>
                    ) : (
                      modalSubjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} {sub.code ? `(${sub.code})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  {modalSubjects.length === 0 && !loadingModalData && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      No subjects configured for this class yet.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Select Student <span className="text-rose-500">*</span>
                    </label>
                    {loadingModalData && (
                      <span className="text-[10px] text-indigo-600 flex items-center gap-1 font-medium">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Loading...
                      </span>
                    )}
                  </div>
                  <select
                    value={addForm.student_id}
                    onChange={(e) => setAddForm({ ...addForm, student_id: parseInt(e.target.value) })}
                    disabled={loadingModalData || modalStudents.length === 0}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {modalStudents.length === 0 ? (
                      <option value={0}>No students found in this class</option>
                    ) : (
                      modalStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          #{st.roll_number} - {st.first_name} {st.last_name} ({st.student_id})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Marks Inputs */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Creative (CQ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={addForm.subjective_mark}
                    onChange={(e) =>
                      setAddForm({ ...addForm, subjective_mark: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono font-bold text-center focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Objective (MCQ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={addForm.objective_mark}
                    onChange={(e) =>
                      setAddForm({ ...addForm, objective_mark: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono font-bold text-center focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Practical
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={addForm.practical_mark}
                    onChange={(e) =>
                      setAddForm({ ...addForm, practical_mark: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono font-bold text-center focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 4th Subject Rule Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.is_4th_subject}
                    onChange={(e) => setAddForm({ ...addForm, is_4th_subject: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Apply Bangladesh 4th Subject Rule (-2.00 deduction for GPA bonus)
                  </span>
                </label>
              </div>

              {/* Real-time Result Preview */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Calculated Total
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {addTotal} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      GPA
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {addGrade.gpa.toFixed(2)}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border ${getGradeBadge(
                      addGrade.grade
                    )}`}
                  >
                    {addGrade.grade}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
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
                  <span>Save Mark</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MARK MODAL */}
      {selectedResultForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Mark for {selectedResultForEdit.student?.first_name} {selectedResultForEdit.student?.last_name}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Subject: {selectedResultForEdit.subject?.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResultForEdit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Marks Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Creative (CQ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.subjective_mark}
                    onChange={(e) =>
                      setEditForm({ ...editForm, subjective_mark: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono font-bold text-center focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Objective (MCQ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.objective_mark}
                    onChange={(e) =>
                      setEditForm({ ...editForm, objective_mark: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono font-bold text-center focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Practical
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.practical_mark}
                    onChange={(e) =>
                      setEditForm({ ...editForm, practical_mark: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm font-mono font-bold text-center focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 4th Subject Rule Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_4th_subject}
                    onChange={(e) => setEditForm({ ...editForm, is_4th_subject: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Apply Bangladesh 4th Subject Rule (-2.00 deduction for GPA bonus)
                  </span>
                </label>
              </div>

              {/* Real-time Result Preview */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Calculated Total
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {editTotal} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      GPA
                    </span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {editGrade.gpa.toFixed(2)}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border ${getGradeBadge(
                      editGrade.grade
                    )}`}
                  >
                    {editGrade.grade}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedResultForEdit(null)}
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
      {selectedResultForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-rose-50 p-3 text-rose-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Mark Record</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete the exam mark for{' '}
              <strong className="text-slate-900">
                {selectedResultForDelete.student?.first_name} {selectedResultForDelete.student?.last_name}
              </strong>{' '}
              in <strong className="text-slate-900">{selectedResultForDelete.subject?.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedResultForDelete(null)}
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

      {/* STUDENT REPORT CARD MODAL */}
      {activeReportCard && (
        <ReportCardModal
          reportCard={activeReportCard}
          onClose={() => setActiveReportCard(null)}
        />
      )}

      {/* CLASS TABULATION MODAL */}
      {isTabulationOpen && tabulationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Trophy className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Class Merit Tabulation Sheet & Rankings
                  </h3>
                  <span className="text-xs text-slate-500">
                    Exam: {tabulationData.exam.name} | Class: {tabulationData.class_level.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                  title="Print Tabulation Sheet"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsTabulationOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 text-center">Merit Rank</th>
                      <th className="py-3 px-3">Roll</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-3">Section</th>
                      {tabulationData.subjects.map((sub) => (
                        <th key={sub.id} className="py-3 px-3 text-center">
                          {sub.name}
                        </th>
                      ))}
                      <th className="py-3 px-3 text-center">Total Marks</th>
                      <th className="py-3 px-3 text-center">GPA (NCTB)</th>
                      <th className="py-3 px-3 text-center">Grade</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tabulationData.tabulation.map((row) => (
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
                        <td className="py-3 px-3 font-semibold text-slate-700">#{row.roll_number}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{row.name}</td>
                        <td className="py-3 px-3 text-slate-500">{row.section || '-'}</td>
                        {tabulationData.subjects.map((sub) => {
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
                        <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                          {row.total_marks}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-indigo-600 font-mono">
                          {row.final_gpa.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${getGradeBadge(
                              row.final_grade
                            )}`}
                          >
                            {row.final_grade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.passed ? (
                            <span className="text-emerald-600 font-bold text-[11px]">Passed</span>
                          ) : (
                            <span className="text-rose-600 font-bold text-[11px]">Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
