import { apiClient } from '../../../shared/services/apiClient';
import { Attendance, BulkAttendancePayload, AttendanceSummaryStats } from '../types';

export const attendanceApi = {
  getAttendanceList: async (params: { section_id: number; date: string }): Promise<Attendance[]> => {
    const res = await apiClient.get<Attendance[]>('/attendances', { params });
    return res.data;
  },

  submitBulkAttendance: async (payload: BulkAttendancePayload): Promise<{ message: string; count: number }> => {
    const res = await apiClient.post<{ message: string; count: number }>('/attendances/bulk-upsert', payload);
    return res.data;
  },

  getSectionDailyStats: async (params: { section_id: number; date: string }): Promise<AttendanceSummaryStats> => {
    const res = await apiClient.get<AttendanceSummaryStats>('/attendances/stats', { params });
    return res.data;
  },
};

