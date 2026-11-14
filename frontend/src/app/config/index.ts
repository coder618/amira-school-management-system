export const APP_CONFIG = {
  APP_NAME: 'EduCore Bangladesh',
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  STORAGE_KEYS: {
    AUTH_TOKEN: 'educore_auth_token',
    USER: 'educore_user',
    TENANT_SCHOOL: 'educore_active_school',
    TENANT_YEAR: 'educore_active_academic_year',
  },
  REGEX: {
    BD_PHONE: /^01[3-9]\d{8}$/,
  },
  DEFAULT_BOARDS: [
    'Dhaka',
    'Chittagong',
    'Rajshahi',
    'Khulna',
    'Barisal',
    'Sylhet',
    'Comilla',
    'Dinajpur',
    'Mymensingh',
    'Madrasah',
    'Technical',
  ],
} as const;

