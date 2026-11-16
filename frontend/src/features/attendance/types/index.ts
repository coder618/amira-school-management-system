import { TenantEntity } from '../../../shared/types';
import { Student } from '../../academic/types';
import { Teacher } from '../../hr/types';
import { User } from '../../auth/types';

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

export type DeviceType = 'rfid' | 'fingerprint' | 'facial' | 'barcode_qr' | 'general';
export type DeviceStatus = 'active' | 'inactive' | 'maintenance';

export interface AttendanceDevice extends TenantEntity {
  name: string;
  device_id: string;
  device_type: DeviceType;
  device_model?: string | null;
  api_token: string;
  ip_address?: string | null;
  location?: string | null;
  status: DeviceStatus;
  last_sync_at?: string | null;
  total_punches?: number;
  today_punches?: number;
  school?: {
    id: number;
    name: string;
    code: string;
    board?: string;
    address?: string;
    phone?: string;
  };
}

export interface AttendanceDevicePayload {
  name: string;
  device_id: string;
  device_type: DeviceType;
  device_model?: string;
  ip_address?: string;
  location?: string;
  status?: DeviceStatus;
}

export interface AttendanceDeviceLog extends TenantEntity {
  attendance_device_id?: number | null;
  device_identifier?: string | null;
  raw_identifier: string;
  user_type: 'student' | 'teacher' | 'user' | 'unknown';
  user_id?: number | null;
  student_id?: number | null;
  teacher_id?: number | null;
  punched_at: string;
  punch_type: 'check_in' | 'check_out' | 'auto';
  verification_method: 'card' | 'fingerprint' | 'face' | 'barcode_qr' | 'manual' | 'other';
  status: 'success' | 'unrecognized' | 'duplicate' | 'error';
  response_message?: string | null;
  payload_json?: any;
  device?: AttendanceDevice | null;
  student?: Student | null;
  teacher?: Teacher | null;
  user?: User | null;
}

export interface DeviceAttendanceStats {
  total_devices: number;
  active_devices: number;
  today_punches: number;
  success_punches: number;
  unrecognized_punches: number;
  date: string;
  latest_punch?: AttendanceDeviceLog | null;
}

export interface MultiTenantDeviceStats {
  total_devices: number;
  active_devices: number;
  schools_with_devices: number;
  total_schools: number;
  today_punches: number;
  success_punches: number;
  unrecognized_punches: number;
  devices_by_type: Record<string, number>;
  date: string;
}

export interface DevicePunchSimulationResult {
  status: 'success' | 'unrecognized' | 'error';
  message: string;
  user_type?: string;
  student_id?: number;
  teacher_id?: number;
  user_id?: number;
  name?: string;
  identifier?: string;
  class?: string;
  section?: string;
  roll_number?: number;
  designation?: string;
  department?: string;
  role?: string;
  attendance_status?: string;
  punched_at?: string;
  device?: string;
  photo_url?: string | null;
  log_id?: number;
  attendance_id?: number;
}

export interface AssignCardPayload {
  target_type: 'student' | 'teacher' | 'user';
  target_id: number;
  card_rfid?: string;
  biometric_id?: string;
}

export interface Holiday extends TenantEntity {
  title: string;
  date: string;
  end_date?: string | null;
  type: string;
  description?: string | null;
  is_half_day?: boolean;
  created_by?: number | null;
  creator?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface HolidayPayload {
  title: string;
  date: string;
  end_date?: string | null;
  type?: string;
  description?: string | null;
  is_half_day?: boolean;
  academic_year_id?: number | null;
}

export interface HolidayStats {
  total_in_query: number;
  total_year: number;
  upcoming: Holiday[];
}

export interface HolidayListResponse {
  data: Holiday[];
  stats: HolidayStats;
}

