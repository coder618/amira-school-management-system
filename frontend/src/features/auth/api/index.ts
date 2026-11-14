import { apiClient } from '../../../shared/services/apiClient';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/login', payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/register', payload);
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/logout');
    return res.data;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const res = await apiClient.get<{ user: User }>('/user');
    return res.data;
  },
};

