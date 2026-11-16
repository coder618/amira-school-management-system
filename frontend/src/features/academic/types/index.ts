import { TenantEntity } from '../../../shared/types';
import { School } from '../../auth/types';

export interface Shift extends TenantEntity {
  name: string; // Morning, Day
  start_time?: string;
  end_time?: string;
  is_active: boolean;
}

export interface ClassLevel extends TenantEntity {
  name: string; // Class 6, Class 7, Class 8, Class 9, Class 10
  numeric_value?: number;
  code?: string;
  students_count?: number;
  sections_count?: number;
  sections?: Section[];
}

export interface ClassLevelPayload {
  name: string;
  numeric_value?: number;
  code?: string;
}

export interface Section extends TenantEntity {
  class_level_id: number;
  class_teacher_id?: number | null;
  name: string; // Section A, Padma, Meghna, Jamuna
  capacity: number;
  class_level?: ClassLevel;
}

export interface Student extends TenantEntity {
  class_level_id: number;
  section_id: number;
  shift_id?: number | null;
  user_id?: number | null;
  student_id: string; // unique ID
  roll_number: number;
  first_name: string;
  last_name?: string;
  full_name?: string;
  father_name: string;
  mother_name: string;
  phone_number: string; // 11 digits
  email?: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth?: string;
  address?: string;
  student_image?: string | null;
  card_rfid?: string | null;
  biometric_id?: string | null;
  parent_image?: string | null;
  father_image?: string | null;
  mother_image?: string | null;
  student_image_url?: string | null;
  parent_image_url?: string | null;
  father_image_url?: string | null;
  mother_image_url?: string | null;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  enrollment_date?: string;
  class_level?: ClassLevel;
  section?: Section;
  shift?: Shift;
  school?: School;
  academic_year?: {
    id: number;
    title: string;
    start_date?: string;
    end_date?: string;
  };
  academicYear?: {
    id: number;
    title: string;
    start_date?: string;
    end_date?: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    phone_number?: string;
    profile_picture?: string;
    profile_picture_url?: string;
  };
}

export interface StudentFilterParams {
  search?: string;
  class_level_id?: number;
  section_id?: number;
  shift_id?: number;
  status?: Student['status'];
  page?: number;
}

export interface Subject extends TenantEntity {
  class_level_id: number;
  name: string;
  code?: string | null;
  full_mark: number;
  pass_mark: number;
  is_optional: boolean;
  can_be_4th_subject: boolean;
  class_level?: ClassLevel;
  results_count?: number;
}

export interface SubjectPayload {
  class_level_id: number;
  name: string;
  code?: string;
  full_mark?: number;
  pass_mark?: number;
  is_optional?: boolean;
  can_be_4th_subject?: boolean;
}

export interface StudentAttendanceHistoryItem {
  id: number;
  date: string;
  day: string;
  status: 'Present' | 'Absent' | 'Late' | 'Holiday';
  remarks: string;
  is_holiday: boolean;
  holiday?: {
    id: number;
    title: string;
    type: string;
  } | null;
  attendance_id?: number | null;
}

export interface StudentAttendanceHistoryResponse {
  student_id: number;
  days: number;
  data: StudentAttendanceHistoryItem[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    holiday: number;
  };
}

export interface TeacherNoteItem {
  id: number;
  school_id: number;
  student_id: number;
  teacher_id?: number | null;
  author_id?: number | null;
  author_name?: string | null;
  title: string;
  category: string;
  note: string;
  date: string;
  created_at?: string;
  author?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface StudentInvoiceItem {
  id: number;
  invoice_no: string;
  title: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'partial' | 'cancelled';
  paid_amount?: number;
  fund_collection_name?: {
    id: number;
    name: string;
  } | null;
  created_at?: string;
}

export interface StudentPaymentItem {
  id: number;
  receipt_no: string;
  amount: number;
  payment_method: string;
  payment_date?: string;
  transaction_id?: string | null;
  status: string;
  fund_collection_name?: {
    id: number;
    name: string;
  } | null;
  created_at?: string;
}

export interface StudentLibraryRentItem {
  id: number;
  book_id: number;
  status: 'issued' | 'returned' | 'overdue' | 'lost';
  issue_date: string;
  due_date: string;
  return_date?: string | null;
  fine_amount?: number;
  fine_status?: string;
  notes?: string | null;
  book?: {
    id: number;
    title: string;
    isbn?: string | null;
    author?: string | null;
    call_number?: string | null;
  } | null;
}

export interface StudentExamResultItem {
  id: number;
  exam_id: number;
  subject_id: number;
  total_mark: number;
  grade?: string | null;
  gpa?: number | null;
  note?: string | null;
  exam?: {
    id: number;
    name: string;
    exam_type?: string;
    term?: string;
  } | null;
  subject?: {
    id: number;
    name: string;
    code?: string;
    full_mark?: number;
  } | null;
}

export interface StudentDocumentItem {
  id: number;
  title: string;
  document_type: string;
  file_name?: string;
  file_size?: number;
  formatted_file_size?: string;
  created_at: string;
  file_url?: string;
}

export interface StudentFullSummaryResponse {
  student: Student;
  attendance: {
    total: number;
    data: StudentAttendanceHistoryItem[];
  };
  invoices: {
    total: number;
    data: StudentInvoiceItem[];
  };
  payments: {
    total: number;
    data: StudentPaymentItem[];
  };
  teacher_notes: {
    total: number;
    data: TeacherNoteItem[];
  };
  library_rents: {
    total: number;
    data: StudentLibraryRentItem[];
  };
  exam_results: {
    total: number;
    data: StudentExamResultItem[];
  };
  documents: {
    total: number;
    data: StudentDocumentItem[];
  };
}



