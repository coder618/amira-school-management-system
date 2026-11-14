import { apiClient } from '../../../shared/services/apiClient';
import { Teacher, TeacherPayload } from '../types';

export const hrApi = {
  getTeachers: async (): Promise<Teacher[]> => {
    const res = await apiClient.get<Teacher[]>('/teachers');
    return res.data;
  },

  getTeacherById: async (id: number): Promise<Teacher> => {
    const res = await apiClient.get<Teacher>(`/teachers/${id}`);
    return res.data;
  },

  createTeacher: async (payload: TeacherPayload): Promise<Teacher> => {
    const res = await apiClient.post<Teacher>('/teachers', payload);
    return res.data;
  },

  deleteTeacher: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/teachers/${id}`);
    return res.data;
  },
};

