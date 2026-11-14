import { BaseEntity } from '../../../shared/types';

export interface CreateSchoolPayload {
  name: string;
  address: string;
  headmaster_email: string;
  headmaster_password: string;
  headmaster_name?: string;
  code?: string;
  eiin?: string;
  board?: string;
  phone?: string;
  email?: string;
}

export interface OnboardedSchool extends BaseEntity {
  name: string;
  code: string;
  eiin?: string;
  board: string;
  address: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  users_count?: number;
  academic_years_count?: number;
  users?: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
  }>;
  current_academic_year?: {
    id: number;
    title: string;
  };
}

export interface CreateSchoolResponse {
  message: string;
  school: OnboardedSchool;
  academic_year: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
  };
  headmaster: {
    id: number;
    name: string;
    email: string;
    role: string;
    school_id: number;
  };
}

