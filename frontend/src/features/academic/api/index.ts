import { apiClient } from '../../../shared/services/apiClient';
import {
  Student,
  StudentFilterParams,
  ClassLevel,
  ClassLevelPayload,
  Section,
  Shift,
  Subject,
  SubjectPayload,
  StudentFullSummaryResponse,
  StudentAttendanceHistoryResponse,
  TeacherNoteItem,
} from '../types';

export const academicApi = {
  // Students
  getStudents: async (params?: StudentFilterParams): Promise<Student[]> => {
    const res = await apiClient.get<Student[]>('/students', { params });
    return res.data;
  },

  getStudentById: async (id: number): Promise<Student> => {
    const res = await apiClient.get<Student>(`/students/${id}`);
    return res.data;
  },

  createStudent: async (payload: FormData | Omit<Student, 'id' | 'created_at' | 'updated_at'> | any): Promise<Student> => {
    const res = await apiClient.post<any>('/students', payload);
    return res.data.data || res.data;
  },

  updateStudent: async (id: number, payload: FormData | Partial<Student> | any): Promise<Student> => {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    let res;
    if (isFormData) {
      payload.append('_method', 'PUT');
      res = await apiClient.post<any>(`/students/${id}`, payload);
    } else {
      res = await apiClient.put<any>(`/students/${id}`, payload);
    }
    return res.data.data || res.data;
  },

  deleteStudent: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/students/${id}`);
    return res.data;
  },

  uploadMedia: async (file: File, collectionName = 'default'): Promise<{ url: string; file_path: string; data: any }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection_name', collectionName);
    const res = await apiClient.post<any>('/media/upload', formData);
    return res.data;
  },

  // Class Levels (Tenant-unique CRUD)
  getClassLevels: async (): Promise<ClassLevel[]> => {
    const res = await apiClient.get<ClassLevel[]>('/class-levels');
    return res.data;
  },

  createClassLevel: async (payload: ClassLevelPayload): Promise<ClassLevel> => {
    const res = await apiClient.post<ClassLevel>('/class-levels', payload);
    return res.data;
  },

  updateClassLevel: async (id: number, payload: Partial<ClassLevelPayload>): Promise<ClassLevel> => {
    const res = await apiClient.put<ClassLevel>(`/class-levels/${id}`, payload);
    return res.data;
  },

  deleteClassLevel: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/class-levels/${id}`);
    return res.data;
  },

  // Sections & Shifts
  getSections: async (classLevelId?: number): Promise<Section[]> => {
    const res = await apiClient.get<Section[]>('/sections', { params: { class_level_id: classLevelId } });
    return res.data;
  },

  getShifts: async (): Promise<Shift[]> => {
    const res = await apiClient.get<Shift[]>('/shifts');
    return res.data;
  },

  // Subjects (Tenant-scoped CRUD)
  getSubjects: async (params?: { class_level_id?: number; search?: string; is_optional?: boolean; can_be_4th_subject?: boolean }): Promise<Subject[]> => {
    const res = await apiClient.get<Subject[]>('/subjects', { params });
    return res.data;
  },

  createSubject: async (payload: SubjectPayload): Promise<Subject> => {
    const res = await apiClient.post<Subject>('/subjects', payload);
    return res.data;
  },

  updateSubject: async (id: number, payload: Partial<SubjectPayload>): Promise<Subject> => {
    const res = await apiClient.put<Subject>(`/subjects/${id}`, payload);
    return res.data;
  },

  deleteSubject: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/subjects/${id}`);
    return res.data;
  },

  // Student Full Summary & Detail Modules
  getStudentFullSummary: async (studentId: number): Promise<StudentFullSummaryResponse> => {
    const res = await apiClient.get<StudentFullSummaryResponse>(`/students/${studentId}/full-summary`);
    return res.data;
  },

  getStudentAttendanceHistory: async (
    studentId: number,
    days = 10
  ): Promise<StudentAttendanceHistoryResponse> => {
    const res = await apiClient.get<StudentAttendanceHistoryResponse>(
      `/students/${studentId}/attendance-history`,
      { params: { days } }
    );
    return res.data;
  },

  getStudentTeacherNotes: async (
    studentId: number,
    page = 1,
    perPage = 10
  ): Promise<{ data: TeacherNoteItem[]; current_page: number; total: number; last_page: number }> => {
    const res = await apiClient.get<{
      data: TeacherNoteItem[];
      current_page: number;
      total: number;
      last_page: number;
    }>(`/students/${studentId}/teacher-notes`, { params: { page, per_page: perPage } });
    return res.data;
  },

  createTeacherNote: async (
    studentId: number,
    payload: { title: string; note: string; category?: string; date?: string }
  ): Promise<{ message: string; data: TeacherNoteItem }> => {
    const res = await apiClient.post<{ message: string; data: TeacherNoteItem }>(
      `/students/${studentId}/teacher-notes`,
      payload
    );
    return res.data;
  },

  deleteTeacherNote: async (studentId: number, noteId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(
      `/students/${studentId}/teacher-notes/${noteId}`
    );
    return res.data;
  },
};

