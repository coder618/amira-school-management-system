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
    ROOT: '/finance',
    INVOICES: '/finance/invoices',
    PAYMENTS: '/finance/payments',
    FUND_COLLECTIONS: '/finance/fund-collections',
    FEE_CATEGORIES: '/finance/fund-collections',
  },
  EXAMINATION: {
    MARKS_ENTRY: '/exams/marks-entry',
    REPORT_CARDS: '/exams/report-cards',
    SCHEDULE: '/exams/schedule',
  },
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
} as const;

