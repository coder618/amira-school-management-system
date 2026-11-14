import { TenantEntity } from '../../../shared/types';
import { Student } from '../../academic/types';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface Attendance extends TenantEntity {
  student_id: number;
  section_id?: number | null;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  student?: Student;
}

export interface AttendanceSubmissionItem {
  student_id: number;
  status: AttendanceStatus;
  remarks?: string;
}

export interface BulkAttendancePayload {
  section_id: number;
  date: string;
  attendances: AttendanceSubmissionItem[];
  send_absent_sms?: boolean; // triggers SMS notification job
}

export interface AttendanceSummaryStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

