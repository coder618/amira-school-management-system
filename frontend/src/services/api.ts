import axios from 'axios';
import { AuthResponse, DashboardStats, Student, Course, User, School, SchoolExam, SchoolExamResult, TabulationData, FundCollectionName, TenantPayment, MediaItem, MediaPaginationResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Attach Authorization Bearer token to all requests if present
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('educore_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle unauthenticated 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('educore_auth_token');
      localStorage.removeItem('educore_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/login', credentials);
    return res.data;
  },
  register: async (userData: { name: string; email: string; password: string; password_confirmation: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/register', userData);
    return res.data;
  },
  logout: async (): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/logout');
    return res.data;
  },
  me: async (): Promise<{ user: User }> => {
    const res = await apiClient.get<{ user: User }>('/user');
    return res.data;
  },
  getUser: async (id: number): Promise<{ user: User }> => {
    const res = await apiClient.get<{ user: User }>(`/users/${id}`);
    return res.data;
  },
  uploadProfilePicture: async (file: File): Promise<{ message: string; user: User; profile_picture_url: string; media?: MediaItem }> => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    formData.append('file', file);
    formData.append('collection_name', 'profile_pictures');
    const res = await apiClient.post<{ message: string; user: User; profile_picture_url: string; media?: MediaItem }>(
      '/user/profile-picture',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },
  setProfilePictureFromMedia: async (mediaId: number): Promise<{ message: string; user: User; profile_picture_url: string }> => {
    const res = await apiClient.post<{ message: string; user: User; profile_picture_url: string }>(
      '/user/profile-picture',
      { media_id: mediaId }
    );
    return res.data;
  },
  deleteProfilePicture: async (): Promise<{ message: string; user: User }> => {
    const res = await apiClient.delete<{ message: string; user: User }>('/user/profile-picture');
    return res.data;
  },
  updateProfile: async (data: { name?: string; phone_number?: string }): Promise<{ message: string; user: User }> => {
    const res = await apiClient.put<{ message: string; user: User }>('/user/profile', data);
    return res.data;
  },
};

export const mediaApi = {
  getMedia: async (params?: { collection_name?: string; model_type?: string; model_id?: number; user_id?: number; page?: number; per_page?: number }): Promise<MediaPaginationResponse> => {
    const res = await apiClient.get<MediaPaginationResponse>('/media', { params });
    return res.data;
  },
  upload: async (file: File, collectionName = 'default', modelType?: string, modelId?: number): Promise<{ message: string; data: MediaItem; url: string; file_path: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection_name', collectionName);
    if (modelType) formData.append('model_type', modelType);
    if (modelId) formData.append('model_id', String(modelId));
    const res = await apiClient.post<{ message: string; data: MediaItem; url: string; file_path: string }>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  delete: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/media/${id}`);
    return res.data;
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },
};

export const studentsApi = {
  getAll: async (params?: { search?: string; grade?: string; status?: string }): Promise<Student[]> => {
    const res = await apiClient.get<Student[]>('/students', { params });
    return res.data;
  },
  create: async (student: Omit<Student, 'id' | 'created_at'>): Promise<Student> => {
    const res = await apiClient.post<Student>('/students', student);
    return res.data;
  },
  update: async (id: number, student: Partial<Student>): Promise<Student> => {
    const res = await apiClient.put<Student>(`/students/${id}`, student);
    return res.data;
  },
  delete: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/students/${id}`);
    return res.data;
  },
};

export const coursesApi = {
  getAll: async (): Promise<Course[]> => {
    const res = await apiClient.get<Course[]>('/courses');
    return res.data;
  },
  create: async (course: Omit<Course, 'id' | 'enrolled_count'>): Promise<Course> => {
    const res = await apiClient.post<Course>('/courses', course);
    return res.data;
  },
  delete: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/courses/${id}`);
    return res.data;
  },
};

export const subjectsApi = {
  getAll: async (params?: { class_level_id?: number; search?: string; is_optional?: boolean; can_be_4th_subject?: boolean }): Promise<any[]> => {
    const res = await apiClient.get('/subjects', { params });
    return res.data;
  },
  getById: async (id: number): Promise<any> => {
    const res = await apiClient.get(`/subjects/${id}`);
    return res.data;
  },
  create: async (data: {
    class_level_id: number;
    name: string;
    code?: string;
    full_mark?: number;
    pass_mark?: number;
    is_optional?: boolean;
    can_be_4th_subject?: boolean;
  }): Promise<any> => {
    const res = await apiClient.post('/subjects', data);
    return res.data;
  },
  update: async (id: number, data: Partial<{
    class_level_id: number;
    name: string;
    code?: string;
    full_mark?: number;
    pass_mark?: number;
    is_optional?: boolean;
    can_be_4th_subject?: boolean;
  }>): Promise<any> => {
    const res = await apiClient.put(`/subjects/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/subjects/${id}`);
    return res.data;
  },
};

export const schoolExamsApi = {
  getAll: async (params?: { term?: string; is_published?: boolean; search?: string }): Promise<SchoolExam[]> => {
    const res = await apiClient.get<SchoolExam[]>('/school-exams', { params });
    return res.data;
  },
  create: async (exam: { name: string; term: string; start_date?: string; end_date?: string; is_published?: boolean }): Promise<SchoolExam> => {
    const res = await apiClient.post<SchoolExam>('/school-exams', exam);
    return res.data;
  },
  update: async (id: number, exam: Partial<SchoolExam>): Promise<SchoolExam> => {
    const res = await apiClient.put<SchoolExam>(`/school-exams/${id}`, exam);
    return res.data;
  },
  delete: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/school-exams/${id}`);
    return res.data;
  },
  togglePublish: async (id: number, is_published?: boolean): Promise<{ message: string; is_published: boolean; exam: SchoolExam }> => {
    const res = await apiClient.patch(`/school-exams/${id}/publish`, { is_published });
    return res.data;
  },
};

export const schoolExamResultsApi = {
  getAll: async (params?: { exam_id?: number; subject_id?: number; student_id?: number; class_level_id?: number }): Promise<SchoolExamResult[]> => {
    const res = await apiClient.get<SchoolExamResult[]>('/school-exam-results', { params });
    return res.data;
  },
  create: async (data: { exam_id: number; subject_id: number; student_id: number; mark?: number; total_mark?: number; subjective_mark?: number; objective_mark?: number; practical_mark?: number; is_4th_subject?: boolean; note?: string | null }): Promise<SchoolExamResult> => {
    const res = await apiClient.post<SchoolExamResult>('/school-exam-results', data);
    return res.data;
  },
  bulkStore: async (payload: { exam_id: number; subject_id: number; marks: Array<{ student_id: number; subjective_mark: number; objective_mark: number; practical_mark?: number; is_4th_subject?: boolean }> }): Promise<{ message: string; count: number }> => {
    const res = await apiClient.post<{ message: string; count: number }>('/school-exam-results/bulk', payload);
    return res.data;
  },
  getReportCard: async (studentId: number, examId: number) => {
    const res = await apiClient.get(`/school-exam-results/report-card/${studentId}/exam/${examId}`);
    return res.data;
  },
  downloadReportCardPdf: async (studentId: number, examId: number, filename?: string): Promise<void> => {
    const res = await apiClient.get(`/school-exam-results/report-card/${studentId}/exam/${examId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || `Result-Slip-Student-${studentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
  saveStudentResult: async (payload: {
    student_id: number;
    exam_id: number;
    marks: Array<{
      subject_id: number;
      subjective_mark: number;
      objective_mark: number;
      practical_mark?: number;
      is_4th_subject?: boolean;
    }>;
  }) => {
    const res = await apiClient.post('/school-exam-results/student-result', payload);
    return res.data;
  },
  getTabulation: async (examId: number, classLevelId: number): Promise<TabulationData> => {
    const res = await apiClient.get<TabulationData>(`/school-exam-results/tabulation/${examId}/class/${classLevelId}`);
    return res.data;
  },
  update: async (id: number, data: Partial<{ mark?: number; total_mark?: number; subjective_mark: number; objective_mark: number; practical_mark?: number; is_4th_subject?: boolean; note?: string | null }>): Promise<SchoolExamResult> => {
    const res = await apiClient.put<SchoolExamResult>(`/school-exam-results/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/school-exam-results/${id}`);
    return res.data;
  },
};

export const fundCollectionNamesApi = {
  getAll: async (params?: { interval?: string; is_active?: boolean; search?: string }): Promise<FundCollectionName[]> => {
    const res = await apiClient.get<FundCollectionName[]>('/fund-collection-names', { params });
    return res.data;
  },
  create: async (data: { name: string; interval: string; default_amount?: number; description?: string; is_active?: boolean }): Promise<FundCollectionName> => {
    const res = await apiClient.post<FundCollectionName>('/fund-collection-names', data);
    return res.data;
  },
  update: async (id: number, data: Partial<FundCollectionName>): Promise<FundCollectionName> => {
    const res = await apiClient.put<FundCollectionName>(`/fund-collection-names/${id}`, data);
    return res.data;
  },
  delete: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/fund-collection-names/${id}`);
    return res.data;
  },
};

export const paymentsApi = {
  getAll: async (params?: { fund_collection_name_id?: number; student_id?: number; status?: string; payment_method?: string; search?: string }): Promise<TenantPayment[]> => {
    const res = await apiClient.get<TenantPayment[]>('/payments', { params });
    return res.data;
  },
  create: async (data: { fund_collection_name_id: number; student_id: number; amount: number; paid_amount?: number; status?: string; payment_method: string; transaction_id?: string; payment_date?: string; due_date?: string; notes?: string }): Promise<TenantPayment> => {
    const res = await apiClient.post<TenantPayment>('/payments', data);
    return res.data;
  },
  update: async (id: number, data: Partial<TenantPayment>): Promise<TenantPayment> => {
    const res = await apiClient.put<TenantPayment>(`/payments/${id}`, data);
    return res.data;
  },
  settle: async (id: number, data: { payment_amount: number; payment_method: string; transaction_id?: string; notes?: string }): Promise<{ message: string; payment: TenantPayment }> => {
    const res = await apiClient.post<{ message: string; payment: TenantPayment }>(`/payments/${id}/settle`, data);
    return res.data;
  },
  delete: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/payments/${id}`);
    return res.data;
  },
  getStats: async (): Promise<{ total_billed: number; total_collected: number; total_due: number; total_transactions: number; paid_count: number; due_count: number; partially_paid_count: number }> => {
    const res = await apiClient.get('/payments-stats');
    return res.data;
  },
};

export const schoolApi = {
  getCurrent: async (): Promise<School> => {
    const res = await apiClient.get<School>('/school/current');
    return res.data;
  },
  updateCurrent: async (data: Partial<School>): Promise<{ message: string; school: School }> => {
    const res = await apiClient.put<{ message: string; school: School }>('/school/current', data);
    return res.data;
  },
};




