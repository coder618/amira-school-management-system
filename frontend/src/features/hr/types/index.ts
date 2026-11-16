import { TenantEntity } from '../../../shared/types';
import { User } from '../../auth/types';

export interface Teacher extends TenantEntity {
  user_id: number;
  employee_id: string;
  designation: string; // Headmaster, Senior Teacher, Assistant Teacher
  department?: string; // Science, Commerce, Arts
  qualification?: string; // B.Sc, M.Sc, B.Ed
  phone_number?: string;
  card_rfid?: string | null;
  biometric_id?: string | null;
  joining_date?: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
  user?: User;
  assigned_sections?: Array<{
    id: number;
    name: string;
    class_level?: { id: number; name: string };
  }>;
  assignedSections?: Array<{
    id: number;
    name: string;
    class_level?: { id: number; name: string };
    classLevel?: { id: number; name: string };
  }>;
}

export interface TeacherPayload {
  name: string;
  email: string;
  password?: string;
  employee_id: string;
  designation: string;
  department?: string;
  qualification?: string;
  phone_number?: string;
  card_rfid?: string | null;
  biometric_id?: string | null;
  joining_date?: string;
  profile_picture?: File | string | null;
  image?: File | string | null;
}

export interface TeacherAttendanceHistoryItem {
  id: number;
  date: string;
  day: string;
  status: 'Present' | 'Absent' | 'Late' | 'Holiday';
  in_time?: string | null;
  out_time?: string | null;
  punch_count?: number;
  remarks?: string | null;
  is_holiday?: boolean;
  holiday?: {
    title: string;
    type?: string | null;
  } | null;
}

export interface TeacherGivenNoteStudent {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  roll_number?: number | string | null;
  phone_number?: string | null;
  class_level?: { id: number; name: string } | null;
  section?: { id: number; name: string } | null;
}

export interface TeacherGivenNoteItem {
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
  student?: TeacherGivenNoteStudent | null;
  author?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface TeacherFullSummaryResponse {
  teacher: Teacher;
  attendance: {
    total: number;
    data: TeacherAttendanceHistoryItem[];
  };
  teacher_notes: {
    total: number;
    data: TeacherGivenNoteItem[];
  };
}


