export interface User {
  id: number;
  school_id?: number | null;
  name: string;
  email: string;
  role?: string;
  phone_number?: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  grade_level: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  enrollment_date: string;
  created_at?: string;
}

export interface Course {
  id: number;
  course_code: string;
  title: string;
  department: string;
  credits: number;
  instructor_name: string;
  capacity: number;
  enrolled_count: number;
}

export interface Activity {
  id: number;
  user_name: string;
  action: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}

export interface DashboardStats {
  totalStudents: number;
  activeCourses: number;
  attendanceRate: number;
  totalFaculty: number;
  recentActivities: Activity[];
}

export interface SchoolExam {
  id: number;
  school_id: number;
  academic_year_id: number;
  name: string;
  term: string;
  start_date?: string | null;
  end_date?: string | null;
  is_published: boolean;
  marks_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolExamResult {
  id: number;
  school_id: number;
  academic_year_id: number;
  student_id: number;
  exam_id: number;
  subject_id: number;
  subjective_mark: number;
  objective_mark: number;
  practical_mark: number;
  total_mark: number;
  is_4th_subject: boolean;
  gpa: number;
  grade: string;
  note?: string | null;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
    roll_number: number;
    student_id: string;
    class_level?: { id: number; name: string };
    section?: { id: number; name: string };
  };
  subject?: {
    id: number;
    name: string;
    code?: string;
  };
  exam?: {
    id: number;
    name: string;
    term: string;
    is_published?: boolean;
  };
}

export interface TabulationRow {
  student_id: number;
  student_code: string;
  roll_number: number;
  name: string;
  section?: string | null;
  subjects: Record<number, {
    subjective: number;
    objective: number;
    practical: number;
    total: number;
    gpa: number;
    grade: string;
    is_4th: boolean;
  } | null>;
  total_marks: number;
  final_gpa: number;
  final_grade: string;
  passed: boolean;
  rank?: number | null;
}

export interface TabulationData {
  exam: SchoolExam;
  class_level: {
    id: number;
    name: string;
    numeric_value: number;
  };
  subjects: Array<{
    id: number;
    name: string;
    code?: string;
    full_mark: number;
  }>;
  tabulation: TabulationRow[];
}

export interface FundCollectionName {
  id: number;
  school_id: number;
  academic_year_id?: number | null;
  name: string;
  interval: 'Monthly' | 'Quarterly' | '6 Months' | 'Yearly' | 'One-Time';
  default_amount: number;
  description?: string | null;
  is_active: boolean;
  payments_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TenantPayment {
  id: number;
  school_id: number;
  academic_year_id?: number | null;
  fund_collection_name_id: number;
  student_id: number;
  receipt_no: string;
  amount: number;
  paid_amount: number;
  due_amount: number;
  status: 'paid' | 'due' | 'partially_paid' | 'cancelled';
  payment_method: 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Rocket';
  transaction_id?: string | null;
  payment_date?: string | null;
  due_date?: string | null;
  received_by?: string | null;
  notes?: string | null;
  fund_collection_name?: FundCollectionName;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
    roll_number: number;
    student_id: string;
  };
  created_at?: string;
  updated_at?: string;
}



