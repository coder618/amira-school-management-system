import { TenantEntity } from '../../../shared/types';
import { Student } from '../../academic/types';

export type NctbGrade = 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F';

export interface Exam extends TenantEntity {
  name: string; // First Term, Half-Yearly, Final Exam
  term: string;
  start_date?: string;
  end_date?: string;
  is_published: boolean;
}

export interface Subject extends TenantEntity {
  class_level_id: number;
  name: string;
  code?: string;
  full_mark: number;
  pass_mark: number;
  is_optional: boolean;
  can_be_4th_subject: boolean;
}

export interface ExamMark extends TenantEntity {
  student_id: number;
  exam_id: number;
  subject_id: number;
  subjective_mark: number; // CQ
  objective_mark: number;  // MCQ
  practical_mark?: number;
  total_mark: number;
  is_4th_subject: boolean; // Bangladesh 4th Subject rule
  gpa: number;             // 0.00 - 5.00
  grade: NctbGrade;        // A+, A, A-, B, C, D, F
  student?: Student;
  subject?: Subject;
  exam?: Exam;
}

export interface StudentReportCard {
  student: Student;
  exam: Exam;
  marks: ExamMark[];
  total_marks_obtained: number;
  final_gpa: number;
  final_grade: NctbGrade;
  passed: boolean;
  has_failed_main_subject: boolean;
  fourth_subject_bonus?: number;
}

