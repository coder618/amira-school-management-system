import { TenantEntity } from '../../../shared/types';

export interface Section extends TenantEntity {
  class_level_id: number;
  class_teacher_id?: number | null;
  name: string;
  capacity: number;
  class_teacher?: {
    id: number;
    employee_id: string;
    designation: string;
    user?: {
      id: number;
      name: string;
    };
  };
}

export interface ClassLevel extends TenantEntity {
  name: string;
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

export interface SectionPayload {
  class_level_id: number;
  name: string;
  capacity: number;
  class_teacher_id?: number | null;
}

