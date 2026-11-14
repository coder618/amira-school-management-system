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

  createStudent: async (payload: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> => {
    const res = await apiClient.post<Student>('/students', payload);
    return res.data;
  },

  updateStudent: async (id: number, payload: Partial<Student>): Promise<Student> => {
    const res = await apiClient.put<Student>(`/students/${id}`, payload);
    return res.data;
  },

  deleteStudent: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/students/${id}`);
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
};

