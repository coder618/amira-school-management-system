import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { schoolExamsApi, schoolExamResultsApi } from '../../../services/api';
import { academicApi } from '../../academic/api';
import { examinationApi } from '../api';
import { SchoolExam, TabulationData } from '../../../types';
import { ClassLevel, Student } from '../../academic/types';
import { Subject, StudentReportCard, NctbGrade } from '../types';
import { ReportCardModal } from './ReportCardModal';
import {
  FileSpreadsheet,
  Award,
  Trophy,
  Users,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Printer,
  X,
  Check,
  Eye,
} from 'lucide-react';

interface StudentSubjectMarkRow {
  subject_id: number;
  subject_name: string;
  subject_code?: string | null;
  full_mark: number;
  pass_mark: number;
  subjective_mark: number;
  objective_mark: number;
  practical_mark: number;
  total_mark: number;
  gpa: number;
  grade: NctbGrade;
  is_4th_subject: boolean;
  can_be_4th_subject: boolean;
}

export const ExamResultsView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selection states
  const [exams, setExams] = useState<SchoolExam[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);

  const [selectedExamId, setSelectedExamId] = useState<number | null>(
    searchParams.get('exam_id') ? parseInt(searchParams.get('exam_id')!) : null
  );
  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    searchParams.get('class_id') ? parseInt(searchParams.get('class_id')!) : null
  );
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  // Search & Status filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'TOP10'>('ALL');

  // Tabulation & Combined Results Data
  const [tabulationData, setTabulationData] = useState<TabulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentMarksForm, setStudentMarksForm] = useState<StudentSubjectMarkRow[]>([]);
  const [isSubmittingMarks, setIsSubmittingMarks] = useState(false);

  // Details Modal
  const [detailsStudentId, setDetailsStudentId] = useState<number | null>(null);
  const [activeReportCard, setActiveReportCard] = useState<StudentReportCard | null>(null);
  const [loadingTranscriptId, setLoadingTranscriptId] = useState<number | null>(null);

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

  // When class changes, fetch subjects & students for that class
  useEffect(() => {
    if (!selectedClassId) return;

    Promise.all([
      examinationApi.getSubjects(selectedClassId),
      academicApi.getStudents({ class_level_id: selectedClassId }),
    ])
      .then(([subjectsData, studentsData]) => {
        setClassSubjects(subjectsData);
        setClassStudents(studentsData);
      })
      .catch((err) => {
        console.error('Failed to load class subjects or students', err);
      });
  }, [selectedClassId]);

  // Fetch combined tabulation results
  const fetchTabulation = useCallback(async () => {
    if (!selectedExamId || !selectedClassId) return;
    try {
      setRefreshing(true);
      const data = await schoolExamResultsApi.getTabulation(selectedExamId, selectedClassId);
      setTabulationData(data);
    } catch (err: any) {
      console.error('Failed to load class tabulation', err);
      setFeedback({ type: 'error', message: 'Could not load class exam results.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedExamId, selectedClassId]);

  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      fetchTabulation();
    }
  }, [selectedExamId, selectedClassId, fetchTabulation]);

  // Sections list for filtering
  const availableSections = useMemo(() => {
    if (!tabulationData) return [];
    const secSet = new Set<string>();
    tabulationData.tabulation.forEach((r) => {
      if (r.section) secSet.add(r.section);
    });
    return Array.from(secSet);
  }, [tabulationData]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!tabulationData) return [];
    return tabulationData.tabulation.filter((row) => {
      // Section filter
      if (selectedSection !== 'ALL' && row.section !== selectedSection) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = row.name.toLowerCase().includes(q);
        const matchesRoll = String(row.roll_number).includes(q);
        const matchesCode = (row.student_code || '').toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesCode) return false;
      }

      // Status filter
      if (statusFilter === 'PASSED' && !row.passed) return false;
      if (statusFilter === 'FAILED' && row.passed) return false;
      if (statusFilter === 'TOP10') {
        if (!row.rank || row.rank > 10) return false;
      }

      return true;
    });
  }, [tabulationData, selectedSection, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (!tabulationData || tabulationData.tabulation.length === 0) {
      return { totalStudents: 0, passRate: 0, avgGpa: '0.00', aPlusCount: 0, topRankStudent: null };
    }
    const all = tabulationData.tabulation;
    const evaluated = all.filter((r) => Object.values(r.subjects).some((s) => s !== null));
    const passed = evaluated.filter((r) => r.passed);
    const passRate = evaluated.length > 0 ? Math.round((passed.length / evaluated.length) * 100) : 0;
    const avgGpa = evaluated.length > 0
      ? (evaluated.reduce((acc, curr) => acc + (Number(curr.final_gpa) || 0), 0) / evaluated.length).toFixed(2)
      : '0.00';
    const aPlusCount = evaluated.filter((r) => r.final_grade === 'A+').length;
    const topRankStudent = all.find((r) => r.rank === 1) || null;

    return { totalStudents: evaluated.length, passRate, avgGpa, aPlusCount, topRankStudent };
  }, [tabulationData]);

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

  // Open Multi-subject Result Modal for a Student
  const openStudentResultModal = (student: Student) => {
    setEditingStudent(student);

    // Look for existing marks in tabulationData
    const existingTabRow = tabulationData?.tabulation.find((r) => r.student_id === student.id);

    const initialMarks: StudentSubjectMarkRow[] = classSubjects.map((sub) => {
      const existingMark = existingTabRow?.subjects[sub.id];
      const subMark = existingMark ? existingMark.subjective : 0;
      const objMark = existingMark ? existingMark.objective : 0;
      const pracMark = existingMark ? existingMark.practical : 0;
      const total = subMark + objMark + pracMark;
      const calc = calculateLocalGrade(total);

      return {
        subject_id: sub.id,
        subject_name: sub.name,
        subject_code: sub.code,
        full_mark: Number(sub.full_mark) || 100,
        pass_mark: Number(sub.pass_mark) || 33,
        subjective_mark: subMark,
        objective_mark: objMark,
        practical_mark: pracMark,
        total_mark: total,
        gpa: calc.gpa,
        grade: calc.grade,
        is_4th_subject: existingMark ? existingMark.is_4th : Boolean(sub.can_be_4th_subject),
        can_be_4th_subject: Boolean(sub.can_be_4th_subject),
      };
    });

    setStudentMarksForm(initialMarks);
    setIsEditModalOpen(true);
  };

  // Update mark for a specific subject row in the modal
  const updateModalSubjectMark = (
    subjectId: number,
    field: 'subjective_mark' | 'objective_mark' | 'practical_mark' | 'is_4th_subject',
    value: any
  ) => {
    setStudentMarksForm((prev) =>
      prev.map((row) => {
        if (row.subject_id !== subjectId) return row;
        const updated = { ...row, [field]: value };
        const total =
          Number(updated.subjective_mark || 0) +
          Number(updated.objective_mark || 0) +
          Number(updated.practical_mark || 0);
        const { gpa, grade } = calculateLocalGrade(total);
        return { ...updated, total_mark: total, gpa, grade };
      })
    );
  };

  // Real-time Composite Calculation for Modal
  const modalCompositeResult = useMemo(() => {
    if (studentMarksForm.length === 0) {
      return { totalMarks: 0, finalGpa: 0, finalGrade: 'F', passed: false, fourthSubjectBonus: 0 };
    }

    const totalMarks = studentMarksForm.reduce((sum, r) => sum + r.total_mark, 0);

    const mainSubjects = studentMarksForm.filter((r) => !r.is_4th_subject);
    const fourthSubject = studentMarksForm.find((r) => r.is_4th_subject);

    const hasFailedMain = mainSubjects.some((r) => r.grade === 'F');

    let fourthSubjectBonus = 0;
    if (fourthSubject && fourthSubject.gpa > 2.0) {
      fourthSubjectBonus = fourthSubject.gpa - 2.0;
    }

    let finalGpa = 0;
    let finalGrade: NctbGrade = 'F';
    const passed = !hasFailedMain && mainSubjects.length > 0;

    if (passed) {
      const sumGpa = mainSubjects.reduce((sum, r) => sum + r.gpa, 0) + fourthSubjectBonus;
      const rawGpa = sumGpa / mainSubjects.length;
      finalGpa = Math.min(5.0, Math.round(rawGpa * 100) / 100);

      if (finalGpa >= 5.0) finalGrade = 'A+';
      else if (finalGpa >= 4.0) finalGrade = 'A';
      else if (finalGpa >= 3.5) finalGrade = 'A-';
      else if (finalGpa >= 3.0) finalGrade = 'B';
      else if (finalGpa >= 2.0) finalGrade = 'C';
      else if (finalGpa >= 1.0) finalGrade = 'D';
      else finalGrade = 'F';
    }

    return { totalMarks, finalGpa, finalGrade, passed, fourthSubjectBonus };
  }, [studentMarksForm]);

  // Submit Multi-subject Result
  const handleSaveStudentResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !selectedExamId) return;

    try {
      setIsSubmittingMarks(true);
      await schoolExamResultsApi.saveStudentResult({
        student_id: editingStudent.id,
        exam_id: selectedExamId,
        marks: studentMarksForm.map((m) => ({
          subject_id: m.subject_id,
          subjective_mark: Number(m.subjective_mark) || 0,
          objective_mark: Number(m.objective_mark) || 0,
          practical_mark: Number(m.practical_mark) || 0,
          is_4th_subject: m.is_4th_subject,
        })),
      });

      setFeedback({
        type: 'success',
        message: `Composite result saved for ${editingStudent.first_name} ${editingStudent.last_name} (${studentMarksForm.length} subjects).`,
      });
      setIsEditModalOpen(false);
      await fetchTabulation();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to save composite student result.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setIsSubmittingMarks(false);
    }
  };

  // Open Full NCTB Transcript (ReportCardModal)
  const handleViewTranscript = async (studentId: number) => {
    if (!selectedExamId) return;
    try {
      setLoadingTranscriptId(studentId);
      const data = await examinationApi.getStudentReportCard(studentId, selectedExamId);
      setActiveReportCard(data);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Could not load student transcript.' });
    } finally {
      setLoadingTranscriptId(null);
    }
  };

  const selectedRowForDetails = useMemo(() => {
    if (!detailsStudentId || !tabulationData) return null;
    return tabulationData.tabulation.find((r) => r.student_id === detailsStudentId) || null;
  }, [detailsStudentId, tabulationData]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileSpreadsheet className="h-7 w-7 text-indigo-600" />
            Exam Results & Grading
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Composite examination results combining all subject marks, NCTB GPA, merit rankings, and academic transcripts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTabulation}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh results"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Print Full Tabulation"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Print Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/exams/marks')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Edit2 className="h-4 w-4 text-indigo-600" />
            <span>Manage Exam Marks</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (classStudents.length > 0) {
                openStudentResultModal(classStudents[0]);
              } else {
                setFeedback({
                  type: 'error',
                  message: `No enrolled students found in ${classLevels.find((c) => c.id === selectedClassId)?.name || 'the selected class'}. Please switch to a class with enrolled students (e.g. Class 10) or enroll students in Students (SIS).`,
                });
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record Student Result</span>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evaluated Students</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
          <p className="mt-0.5 text-xs text-slate-400">With multiple subject marks</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Class Pass Rate</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.passRate}%</p>
          <p className="mt-0.5 text-xs text-slate-400">Passed all compulsory subjects</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Class GPA</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{stats.avgGpa}</p>
          <p className="mt-0.5 text-xs text-slate-400">Scale of 5.00 (NCTB)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rank #1 Top Student</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-base font-bold text-slate-900 truncate">
            {stats.topRankStudent ? stats.topRankStudent.name : 'N/A'}
          </p>
          <p className="mt-0.5 text-xs text-amber-600 font-semibold">
            {stats.topRankStudent ? `GPA ${stats.topRankStudent.final_gpa.toFixed(2)} (${stats.topRankStudent.total_marks} Marks)` : 'No marks yet'}
          </p>
        </div>
      </div>

      {/* Selectors and Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs items-center">
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
              setSelectedSection('ALL');
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
            Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="ALL">All Sections</option>
            {availableSections.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Status / Ranking
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="ALL">All Students</option>
            <option value="PASSED">Passed Students</option>
            <option value="FAILED">Failed Students</option>
            <option value="TOP10">Top 10 Merit List</option>
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

      {/* Combined Results Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-sm">Calculating composite class results...</span>
          </div>
        ) : !tabulationData || filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No student results found</p>
            <p className="text-xs text-slate-400 mt-1">
              Select another class or exam, or record marks for students in this class.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (classStudents.length > 0) {
                    openStudentResultModal(classStudents[0]);
                  } else {
                    setFeedback({
                      type: 'error',
                      message: `No enrolled students found in ${classLevels.find((c) => c.id === selectedClassId)?.name || 'the selected class'}. Please switch to a class with enrolled students (e.g. Class 10) or enroll students in Students (SIS).`,
                    });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Record Student Result</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/exams/marks-entry')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                <span>Bulk Entry Sheet</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3">Section</th>
                  <th className="py-3 px-4">Subject Marks (CQ+MCQ+Prac)</th>
                  <th className="py-3 px-3 text-center">Total Marks</th>
                  <th className="py-3 px-3 text-center">Composite GPA</th>
                  <th className="py-3 px-3 text-center">Grade</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => {
                  const studentObj = classStudents.find((s) => s.id === row.student_id);

                  return (
                    <tr key={row.student_id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Merit Rank */}
                      <td className="py-3 px-3 text-center">
                        {row.rank ? (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              row.rank === 1
                                ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                                : row.rank === 2
                                ? 'bg-slate-200 text-slate-800 ring-2 ring-slate-300'
                                : row.rank === 3
                                ? 'bg-amber-700/20 text-amber-900 ring-2 ring-amber-600/30'
                                : 'bg-slate-100 text-slate-600 font-semibold'
                            }`}
                          >
                            {row.rank}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>

                      {/* Roll */}
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        #{row.roll_number}
                      </td>

                      {/* Student */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{row.name}</div>
                        <span className="text-xs text-slate-400 font-mono">{row.student_code}</span>
                      </td>

                      {/* Section */}
                      <td className="py-3 px-3 text-slate-600 text-xs">
                        {row.section || '-'}
                      </td>

                      {/* Subject Marks Pills */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {tabulationData.subjects.map((sub) => {
                            const mark = row.subjects[sub.id];
                            if (!mark) {
                              return (
                                <span
                                  key={sub.id}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400 border border-slate-200"
                                  title={`${sub.name}: No mark recorded`}
                                >
                                  {sub.name.substring(0, 4)}: -
                                </span>
                              );
                            }
                            return (
                              <span
                                key={sub.id}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  mark.grade === 'F'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                                title={`${sub.name}: ${mark.total} (CQ: ${mark.subjective}, MCQ: ${mark.objective}, Prac: ${mark.practical}) - Grade ${mark.grade} (${mark.gpa})`}
                              >
                                <span className="font-bold">{sub.name.substring(0, 4)}:</span>
                                <span className="font-mono">{mark.total}</span>
                                <span className="font-bold text-[9px] opacity-75">[{mark.grade}]</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Total Marks */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {row.total_marks}
                      </td>

                      {/* Composite GPA */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-indigo-600">
                        {Number(row.final_gpa).toFixed(2)}
                      </td>

                      {/* Grade */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getGradeBadge(
                            row.final_grade
                          )}`}
                        >
                          {row.final_grade}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {row.passed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="h-3 w-3" />
                            Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Failed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailsStudentId(row.student_id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="View Result Slip & Subject Breakdown"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (studentObj) {
                                openStudentResultModal(studentObj);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                            title="Edit / Enter marks across all subjects for this student"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit Result</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewTranscript(row.student_id)}
                            disabled={loadingTranscriptId === row.student_id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer"
                            title="View Official NCTB Academic Transcript"
                          >
                            {loadingTranscriptId === row.student_id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Award className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">Transcript</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MULTI-SUBJECT RESULT MODAL (ENTER / EDIT RESULT FOR STUDENT) */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Record Result for {editingStudent.first_name} {editingStudent.last_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Roll #{editingStudent.roll_number} | ID: {editingStudent.student_id} | Class:{' '}
                    {classLevels.find((c) => c.id === selectedClassId)?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentResult} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Select Student Selector (if wanting to switch) */}
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Selected Student
                  </label>
                  <select
                    value={editingStudent.id}
                    onChange={(e) => {
                      const sid = parseInt(e.target.value);
                      const st = classStudents.find((s) => s.id === sid);
                      if (st) openStudentResultModal(st);
                    }}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden bg-white"
                  >
                    {classStudents.map((st) => (
                      <option key={st.id} value={st.id}>
                        #{st.roll_number} - {st.first_name} {st.last_name} ({st.student_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject Marks Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3 text-center">Creative (CQ)</th>
                      <th className="py-2.5 px-3 text-center">Objective (MCQ)</th>
                      <th className="py-2.5 px-3 text-center">Practical</th>
                      <th className="py-2.5 px-3 text-center">Total</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3 text-center">4th Sub</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentMarksForm.map((row) => (
                      <tr key={row.subject_id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{row.subject_name}</div>
                          {row.subject_code && (
                            <span className="text-[10px] text-slate-400 font-mono">Code: {row.subject_code}</span>
                          )}
                        </td>

                        {/* CQ */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            max={100}
                            value={row.subjective_mark}
                            onChange={(e) =>
                              updateModalSubjectMark(
                                row.subject_id,
                                'subjective_mark',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 text-center rounded-lg border border-slate-300 py-1 px-1.5 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-hidden"
                          />
                        </td>

                        {/* MCQ */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            max={100}
                            value={row.objective_mark}
                            onChange={(e) =>
                              updateModalSubjectMark(
                                row.subject_id,
                                'objective_mark',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 text-center rounded-lg border border-slate-300 py-1 px-1.5 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-hidden"
                          />
                        </td>

                        {/* Practical */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            max={100}
                            value={row.practical_mark}
                            onChange={(e) =>
                              updateModalSubjectMark(
                                row.subject_id,
                                'practical_mark',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 text-center rounded-lg border border-slate-300 py-1 px-1.5 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-hidden"
                          />
                        </td>

                        {/* Total */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {row.total_mark}
                        </td>

                        {/* Grade */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${getGradeBadge(
                              row.grade
                            )}`}
                          >
                            {row.grade} ({row.gpa.toFixed(1)})
                          </span>
                        </td>

                        {/* 4th Subject */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.is_4th_subject}
                            onChange={(e) =>
                              updateModalSubjectMark(
                                row.subject_id,
                                'is_4th_subject',
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            title="Apply Bangladesh 4th subject rule"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Composite Live Preview Card */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Total Marks Obtained
                  </span>
                  <span className="text-xl font-bold text-slate-900 font-mono">
                    {modalCompositeResult.totalMarks}{' '}
                    <span className="text-xs text-slate-500 font-normal">
                      / {studentMarksForm.length * 100}
                    </span>
                  </span>
                  {modalCompositeResult.fourthSubjectBonus > 0 && (
                    <span className="text-[11px] text-emerald-700 block font-semibold">
                      +4th Subject GPA Bonus: +{modalCompositeResult.fourthSubjectBonus.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Composite GPA
                    </span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {modalCompositeResult.finalGpa.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Final Grade
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border ${getGradeBadge(
                        modalCompositeResult.finalGrade
                      )}`}
                    >
                      {modalCompositeResult.finalGrade}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Status
                    </span>
                    {modalCompositeResult.passed ? (
                      <span className="text-emerald-600 font-bold text-xs">Passed</span>
                    ) : (
                      <span className="text-rose-600 font-bold text-xs">Failed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMarks}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmittingMarks ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Result ({studentMarksForm.length} Subjects)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT RESULT DETAILS MODAL (RESULT SLIP) */}
      {selectedRowForDetails && tabulationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Trophy className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Result Slip - {selectedRowForDetails.name}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Roll #{selectedRowForDetails.roll_number} | Rank #{selectedRowForDetails.rank || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                  title="Print Result Slip"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsStudentId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Total Marks</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {selectedRowForDetails.total_marks}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Composite GPA</span>
                  <span className="text-base font-bold text-indigo-600 font-mono">
                    {selectedRowForDetails.final_gpa.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Final Grade</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getGradeBadge(
                      selectedRowForDetails.final_grade
                    )}`}
                  >
                    {selectedRowForDetails.final_grade}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Result Status</span>
                  <span
                    className={`font-bold ${
                      selectedRowForDetails.passed ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {selectedRowForDetails.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3 text-center">CQ</th>
                      <th className="py-2.5 px-3 text-center">MCQ</th>
                      <th className="py-2.5 px-3 text-center">Practical</th>
                      <th className="py-2.5 px-3 text-center">Total</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3 text-center">GPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tabulationData.subjects.map((sub) => {
                      const mark = selectedRowForDetails.subjects[sub.id];
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {sub.name}
                            {mark?.is_4th && (
                              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                4th Sub
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{mark ? mark.subjective : '-'}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{mark ? mark.objective : '-'}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{mark ? mark.practical : '-'}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                            {mark ? mark.total : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {mark ? (
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${getGradeBadge(
                                  mark.grade
                                )}`}
                              >
                                {mark.grade}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold">
                            {mark ? mark.gpa.toFixed(2) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NCTB OFFICIAL ACADEMIC TRANSCRIPT MODAL */}
      {activeReportCard && (
        <ReportCardModal
          reportCard={activeReportCard}
          onClose={() => setActiveReportCard(null)}
        />
      )}
    </div>
  );
};
