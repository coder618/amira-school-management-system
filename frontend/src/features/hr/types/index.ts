import { TenantEntity } from '../../../shared/types';
import { User } from '../../auth/types';

export interface Teacher extends TenantEntity {
  user_id: number;
  employee_id: string;
  designation: string; // Headmaster, Senior Teacher, Assistant Teacher
  department?: string; // Science, Commerce, Arts
  qualification?: string; // B.Sc, M.Sc, B.Ed
  phone_number?: string;
  joining_date?: string;
  user?: User;
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
  joining_date?: string;
}

