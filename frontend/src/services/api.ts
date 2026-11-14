import axios from 'axios';
import { AuthResponse, DashboardStats, Student, Course, User } from '../types';

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

