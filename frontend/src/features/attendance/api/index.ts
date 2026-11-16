import { apiClient } from '../../../shared/services/apiClient';
import {
  Attendance,
  BulkAttendancePayload,
  AttendanceSummaryStats,
  AttendanceDevice,
  AttendanceDevicePayload,
  AttendanceDeviceLog,
  DeviceAttendanceStats,
  MultiTenantDeviceStats,
  DevicePunchSimulationResult,
  AssignCardPayload,
  Holiday,
  HolidayPayload,
  HolidayListResponse,
} from '../types';

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

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

  // External Device Management
  getDevices: async (): Promise<AttendanceDevice[]> => {
    const res = await apiClient.get<AttendanceDevice[]>('/attendance/devices');
    return res.data;
  },

  createDevice: async (payload: AttendanceDevicePayload): Promise<{ message: string; device: AttendanceDevice }> => {
    const res = await apiClient.post<{ message: string; device: AttendanceDevice }>('/attendance/devices', payload);
    return res.data;
  },

  updateDevice: async (id: number, payload: Partial<AttendanceDevicePayload>): Promise<{ message: string; device: AttendanceDevice }> => {
    const res = await apiClient.put<{ message: string; device: AttendanceDevice }>(`/attendance/devices/${id}`, payload);
    return res.data;
  },

  deleteDevice: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/attendance/devices/${id}`);
    return res.data;
  },

  regenerateDeviceToken: async (id: number): Promise<{ message: string; api_token: string; device: AttendanceDevice }> => {
    const res = await apiClient.post<{ message: string; api_token: string; device: AttendanceDevice }>(
      `/attendance/devices/${id}/regenerate-token`
    );
    return res.data;
  },

  // Device Logs & Analytics
  getDeviceLogs: async (params?: {
    date?: string;
    status?: string;
    user_type?: string;
    device_id?: number;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<AttendanceDeviceLog>> => {
    const res = await apiClient.get<PaginatedResponse<AttendanceDeviceLog>>('/attendance/device-logs', { params });
    return res.data;
  },

  getDeviceStats: async (params?: { date?: string }): Promise<DeviceAttendanceStats> => {
    const res = await apiClient.get<DeviceAttendanceStats>('/attendance/device-stats', { params });
    return res.data;
  },

  // Device Simulator (Interactive Punch Testing)
  simulatePunch: async (payload: {
    device_id?: number;
    identifier: string;
    punch_type?: string;
    verification_method?: string;
  }): Promise<DevicePunchSimulationResult> => {
    const res = await apiClient.post<DevicePunchSimulationResult>('/attendance/device/simulate', payload);
    return res.data;
  },

  // Quick Card / Biometric ID Assignment
  assignCard: async (payload: AssignCardPayload): Promise<{ message: string; target: any }> => {
    const res = await apiClient.post<{ message: string; target: any }>('/attendance/device/assign-card', payload);
    return res.data;
  },

  // Multi-Tenant Device Management (SuperAdmin)
  getMultiTenantDevices: async (params?: {
    school_id?: number;
    status?: string;
    device_type?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<AttendanceDevice>> => {
    const res = await apiClient.get<PaginatedResponse<AttendanceDevice>>('/super-admin/attendance/devices', { params });
    return res.data;
  },

  createMultiTenantDevice: async (
    payload: AttendanceDevicePayload & { school_id: number }
  ): Promise<{ message: string; device: AttendanceDevice }> => {
    const res = await apiClient.post<{ message: string; device: AttendanceDevice }>(
      '/super-admin/attendance/devices',
      payload
    );
    return res.data;
  },

  getMultiTenantStats: async (): Promise<MultiTenantDeviceStats> => {
    const res = await apiClient.get<MultiTenantDeviceStats>('/super-admin/attendance/devices/stats');
    return res.data;
  },

  getMultiTenantLogs: async (params?: {
    school_id?: number;
    date?: string;
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<AttendanceDeviceLog>> => {
    const res = await apiClient.get<PaginatedResponse<AttendanceDeviceLog>>(
      '/super-admin/attendance/devices/logs',
      { params }
    );
    return res.data;
  },

  // Holiday Calendar APIs
  getHolidays: async (params?: {
    year?: number;
    month?: number;
    from?: string;
    to?: string;
    type?: string;
    search?: string;
  }): Promise<HolidayListResponse> => {
    const res = await apiClient.get<HolidayListResponse>('/attendance/holidays', { params });
    return res.data;
  },

  createHoliday: async (payload: HolidayPayload): Promise<{ message: string; data: Holiday }> => {
    const res = await apiClient.post<{ message: string; data: Holiday }>('/attendance/holidays', payload);
    return res.data;
  },

  updateHoliday: async (
    id: number,
    payload: Partial<HolidayPayload>
  ): Promise<{ message: string; data: Holiday }> => {
    const res = await apiClient.put<{ message: string; data: Holiday }>(`/attendance/holidays/${id}`, payload);
    return res.data;
  },

  deleteHoliday: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/attendance/holidays/${id}`);
    return res.data;
  },

  checkDateHoliday: async (date: string): Promise<{ date: string; is_holiday: boolean; holiday: Holiday | null }> => {
    const res = await apiClient.get<{ date: string; is_holiday: boolean; holiday: Holiday | null }>(
      '/attendance/holidays/check',
      { params: { date } }
    );
    return res.data;
  },
};
