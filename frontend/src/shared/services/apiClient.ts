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
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
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
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('X-School-Id', schoolId);
    } else {
      config.headers['X-School-Id'] = schoolId;
    }
  }

  const academicYearId = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TENANT_YEAR);
  if (academicYearId) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('X-Academic-Year-Id', academicYearId);
    } else {
      config.headers['X-Academic-Year-Id'] = academicYearId;
    }
  }

  // If sending FormData, delete Content-Type so Axios/browser sets multipart/form-data with boundary
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
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
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

