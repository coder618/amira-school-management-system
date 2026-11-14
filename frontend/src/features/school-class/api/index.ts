import { apiClient } from '../../../shared/services/apiClient';
import { ClassLevel, ClassLevelPayload, Section, SectionPayload } from '../types';

export const schoolClassApi = {
  // Class Levels
  getClasses: async (): Promise<ClassLevel[]> => {
    const res = await apiClient.get<ClassLevel[]>('/class-levels');
    return res.data;
  },

  getClassById: async (id: number): Promise<ClassLevel> => {
    const res = await apiClient.get<ClassLevel>(`/class-levels/${id}`);
    return res.data;
  },

  createClass: async (payload: ClassLevelPayload): Promise<ClassLevel> => {
    const res = await apiClient.post<ClassLevel>('/class-levels', payload);
    return res.data;
  },

  updateClass: async (id: number, payload: Partial<ClassLevelPayload>): Promise<ClassLevel> => {
    const res = await apiClient.put<ClassLevel>(`/class-levels/${id}`, payload);
    return res.data;
  },

  deleteClass: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/class-levels/${id}`);
    return res.data;
  },

  // Sections
  getSections: async (classLevelId?: number): Promise<Section[]> => {
    const res = await apiClient.get<Section[]>('/sections', {
      params: classLevelId ? { class_level_id: classLevelId } : undefined,
    });
    return res.data;
  },

  createSection: async (payload: SectionPayload): Promise<Section> => {
    const res = await apiClient.post<Section>('/sections', payload);
    return res.data;
  },

  deleteSection: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/sections/${id}`);
    return res.data;
  },
};

