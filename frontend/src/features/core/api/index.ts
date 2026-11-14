import { apiClient } from '../../../shared/services/apiClient';
import { CreateSchoolPayload, CreateSchoolResponse, OnboardedSchool } from '../types';

export const schoolsApi = {
  getSchools: async (): Promise<OnboardedSchool[]> => {
    const res = await apiClient.get<OnboardedSchool[]>('/schools');
    return res.data;
  },

  createSchool: async (payload: CreateSchoolPayload): Promise<CreateSchoolResponse> => {
    const res = await apiClient.post<CreateSchoolResponse>('/schools', payload);
    return res.data;
  },
};

