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
  father_name: string;
  mother_name: string;
  phone_number: string; // 11 digits
  email?: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth?: string;
  address?: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  enrollment_date?: string;
  class_level?: ClassLevel;
  section?: Section;
  shift?: Shift;
  school?: School;
}

export interface StudentFilterParams {
  search?: string;
  class_level_id?: number;
  section_id?: number;
  shift_id?: number;
  status?: Student['status'];
  page?: number;
}

