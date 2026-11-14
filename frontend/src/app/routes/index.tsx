export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
  },
  DASHBOARD: '/dashboard',
  ACADEMIC: {
    STUDENTS: '/students',
    CLASS_LEVELS: '/classes',
    SECTIONS: '/sections',
  },
  HR: {
    TEACHERS: '/teachers',
  },
  ATTENDANCE: {
    DAILY: '/attendance',
    REPORTS: '/attendance/reports',
  },
  FINANCE: {
    INVOICES: '/finance/invoices',
    PAYMENTS: '/finance/payments',
    FEE_CATEGORIES: '/finance/categories',
  },
  EXAMINATION: {
    MARKS_ENTRY: '/exams/marks-entry',
    REPORT_CARDS: '/exams/report-cards',
    SCHEDULE: '/exams/schedule',
  },
  SETTINGS: '/settings',
} as const;

