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

