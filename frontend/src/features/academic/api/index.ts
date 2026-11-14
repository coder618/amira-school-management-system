import { apiClient } from '../../../shared/services/apiClient';
import {
  Student,
  StudentFilterParams,
  ClassLevel,
  ClassLevelPayload,
  Section,
  Shift,
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
};

