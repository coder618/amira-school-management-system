import { useState, useEffect, useCallback } from 'react';
import { examinationApi } from '../api';
import { academicApi } from '../../academic/api';
import { Exam, Subject, ExamMark, StudentReportCard, NctbGrade } from '../types';
import { Student, ClassLevel } from '../../academic/types';

export interface StudentMarkEntryRow {
  student: Student;
  subjective_mark: number;
  objective_mark: number;
  practical_mark: number;
  is_4th_subject: boolean;
  total_mark: number;
  gpa: number;
  grade: NctbGrade;
}

export const useExamination = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const [rows, setRows] = useState<StudentMarkEntryRow[]>([]);
  const [activeReportCard, setActiveReportCard] = useState<StudentReportCard | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initial metadata
  useEffect(() => {
    Promise.all([
      examinationApi.getExams(),
      academicApi.getClassLevels(),
    ]).then(([examsData, classesData]) => {
      setExams(examsData);
      if (examsData.length > 0) setSelectedExamId(examsData[0].id);

      setClassLevels(classesData);
      if (classesData.length > 0) setSelectedClassId(classesData[0].id);
    });
  }, []);

  // Fetch subjects when selectedClassId changes
  useEffect(() => {
    if (!selectedClassId) return;
    examinationApi.getSubjects(selectedClassId).then((data) => {
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubjectId(data[0].id);
      } else {
        setSelectedSubjectId(null);
      }
    });
  }, [selectedClassId]);

  // Load students & existing marks
  const loadExamMarks = useCallback(async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) return;
    setLoading(true);
    setFeedback(null);
    try {
      const [studentsData] = await Promise.all([
        academicApi.getStudents({ class_level_id: selectedClassId }),
      ]);

      // fetch existing marks
      const marksRes = await fetch(
        `http://127.0.0.1:8000/api/exam-marks?exam_id=${selectedExamId}&subject_id=${selectedSubjectId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('educore_auth_token') || localStorage.getItem('token') || ''}`,
            Accept: 'application/json',
          },
        }
      );
      const marksData: ExamMark[] = marksRes.ok ? await marksRes.json() : [];

      const marksMap = new Map<number, ExamMark>();
      marksData.forEach((m) => marksMap.set(m.student_id, m));

      const newRows: StudentMarkEntryRow[] = studentsData.map((s) => {
        const ex = marksMap.get(s.id);
        const sub = ex ? Number(ex.subjective_mark) : 0;
        const obj = ex ? Number(ex.objective_mark) : 0;
        const prac = ex ? Number(ex.practical_mark || 0) : 0;
        const total = sub + obj + prac;

        return {
          student: s,
          subjective_mark: sub,
          objective_mark: obj,
          practical_mark: prac,
          is_4th_subject: ex ? ex.is_4th_subject : false,
          total_mark: total,
          gpa: ex ? Number(ex.gpa) : 0,
          grade: ex ? ex.grade : 'F',
        };
      });

      setRows(newRows);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load examination sheet.' });
    } finally {
      setLoading(false);
    }
  }, [selectedExamId, selectedClassId, selectedSubjectId]);

  useEffect(() => {
    loadExamMarks();
  }, [loadExamMarks]);

  // Real-time recalculation helper
  const calculateLocalGrade = (total: number): { gpa: number; grade: NctbGrade } => {
    if (total >= 80) return { gpa: 5.0, grade: 'A+' };
    if (total >= 70) return { gpa: 4.0, grade: 'A' };
    if (total >= 60) return { gpa: 3.5, grade: 'A-' };
    if (total >= 50) return { gpa: 3.0, grade: 'B' };
    if (total >= 40) return { gpa: 2.0, grade: 'C' };
    if (total >= 33) return { gpa: 1.0, grade: 'D' };
    return { gpa: 0.0, grade: 'F' };
  };

  const updateStudentMark = (
    studentId: number,
    field: 'subjective_mark' | 'objective_mark' | 'practical_mark' | 'is_4th_subject',
    value: any
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.student.id !== studentId) return r;
        const updated = { ...r, [field]: value };
        const total =
          Number(updated.subjective_mark) +
          Number(updated.objective_mark) +
          Number(updated.practical_mark);
        const { gpa, grade } = calculateLocalGrade(total);
        return { ...updated, total_mark: total, gpa, grade };
      })
    );
  };

  const saveMarks = async () => {
    if (!selectedExamId || !selectedSubjectId || rows.length === 0) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload = rows.map((r) => ({
        student_id: r.student.id,
        subjective_mark: r.subjective_mark,
        objective_mark: r.objective_mark,
        practical_mark: r.practical_mark,
        is_4th_subject: r.is_4th_subject,
      }));

      const res = await examinationApi.submitExamMarks(payload);
      setFeedback({
        type: 'success',
        message: res.message || 'Marks and NCTB grades saved successfully.',
      });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to record marks in database.' });
    } finally {
      setSaving(false);
    }
  };

  const viewReportCard = async (studentId: number) => {
    if (!selectedExamId) return;
    try {
      const rc = await examinationApi.getStudentReportCard(studentId, selectedExamId);
      setActiveReportCard(rc);
    } catch {
      alert('Could not generate report card for student.');
    }
  };

  return {
    exams,
    classLevels,
    subjects,
    selectedExamId,
    setSelectedExamId,
    selectedClassId,
    setSelectedClassId,
    selectedSubjectId,
    setSelectedSubjectId,
    rows,
    loading,
    saving,
    feedback,
    activeReportCard,
    setActiveReportCard,
    updateStudentMark,
    saveMarks,
    viewReportCard,
  };
};
