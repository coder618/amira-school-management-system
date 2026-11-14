import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '../../app/config';

export const apiClient: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: attach bearer token and active tenant headers
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN) ||
    localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  let schoolId = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TENANT_SCHOOL);
  if (!schoolId) {
    const savedUser =
      localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER) ||
      localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.school_id) {
          schoolId = String(parsed.school_id);
          localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TENANT_SCHOOL, schoolId);
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }

  if (schoolId) {
    config.headers['X-School-Id'] = schoolId;
  }

  const academicYearId = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TENANT_YEAR);
  if (academicYearId) {
    config.headers['X-Academic-Year-Id'] = academicYearId;
  }

  return config;
});

// Response interceptor: handle 401 unauthenticated
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

