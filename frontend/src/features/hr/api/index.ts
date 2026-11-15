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

  createTeacher: async (payload: TeacherPayload | FormData): Promise<Teacher> => {
    const config = payload instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    const res = await apiClient.post<Teacher | { data: Teacher }>('/teachers', payload, config);
    // Backend returns { message, data: teacher } on create or teacher directly
    const data = res.data;
    if (data && typeof data === 'object' && 'data' in data && data.data) {
      return data.data as Teacher;
    }
    return data as Teacher;
  },

  updateTeacher: async (id: number, payload: Partial<TeacherPayload> | FormData): Promise<Teacher> => {
    let res;
    if (payload instanceof FormData) {
      if (!payload.has('_method')) {
        payload.append('_method', 'PUT');
      }
      res = await apiClient.post<Teacher | { data: Teacher }>(`/teachers/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      res = await apiClient.put<Teacher | { data: Teacher }>(`/teachers/${id}`, payload);
    }
    const data = res.data;
    if (data && typeof data === 'object' && 'data' in data && data.data) {
      return data.data as Teacher;
    }
    return data as Teacher;
  },

  deleteTeacher: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/teachers/${id}`);
    return res.data;
  },
};

