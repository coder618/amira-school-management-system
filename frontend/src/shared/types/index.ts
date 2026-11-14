export interface BaseEntity {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface TenantEntity extends BaseEntity {
  school_id: number;
  academic_year_id?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type QueryFilterParams = {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

