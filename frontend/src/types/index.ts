export interface User {
  id: number;
  school_id?: number | null;
  name: string;
  email: string;
  role?: string;
  phone_number?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  grade_level: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  enrollment_date: string;
  created_at?: string;
}

export interface Course {
  id: number;
  course_code: string;
  title: string;
  department: string;
  credits: number;
  instructor_name: string;
  capacity: number;
  enrolled_count: number;
}

export interface Activity {
  id: number;
  user_name: string;
  action: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}

export interface DashboardStats {
  totalStudents: number;
  activeCourses: number;
  attendanceRate: number;
  totalFaculty: number;
  recentActivities: Activity[];
}

