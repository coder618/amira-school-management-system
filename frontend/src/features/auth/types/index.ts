import { BaseEntity } from '../../../shared/types';

export type UserRole = 'SuperAdmin' | 'Admin' | 'Teacher' | 'Student' | 'Student/Parent';

export interface School extends BaseEntity {
  name: string;
  code: string;
  eiin?: string;
  board: string;
  division?: string;
  district?: string;
  thana?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  is_active: boolean;
}

export interface AcademicYear extends BaseEntity {
  school_id: number;
  title: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface User extends BaseEntity {
  school_id: number | null;
  name: string;
  email: string;
  role: UserRole;
  phone_number?: string;
  is_active: boolean;
  school?: School;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  school_id?: number;
  phone_number?: string;
}

