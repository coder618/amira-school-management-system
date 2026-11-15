export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
  },
  DASHBOARD: '/dashboard',
  ACADEMIC: {
    STUDENTS: '/students',
    STUDENTS_ADD: '/students/create',
    STUDENT_VIEW: '/students/:id',
    STUDENT_EDIT: '/students/:id/edit',
    CLASS_LEVELS: '/classes',
    CLASSES_MANAGE: '/classes/manage',
    CLASS_SUBJECTS: '/classes/subjects',
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
    ROOT: '/exams',
    MANAGE_EXAMS: '/exams/manage',
    EXAM_MARKS: '/exams/marks',
    EXAM_RESULTS: '/exams/results',
    REPORT_CARDS: '/exams/report-cards',
    SCHEDULE: '/exams/schedule',
  },
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
} as const;

