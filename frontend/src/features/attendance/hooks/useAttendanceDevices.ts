import { useState, useEffect, useCallback } from 'react';
import { attendanceApi, PaginatedResponse } from '../api';
import {
  AttendanceDevice,
  AttendanceDevicePayload,
  AttendanceDeviceLog,
  DeviceAttendanceStats,
  DevicePunchSimulationResult,
  AssignCardPayload,
} from '../types';

export const useAttendanceDevices = () => {
  const [devices, setDevices] = useState<AttendanceDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState<boolean>(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);

  const [stats, setStats] = useState<DeviceAttendanceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  const [logs, setLogs] = useState<AttendanceDeviceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [logsPagination, setLogsPagination] = useState<{
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
  }>({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20,
  });

  const [logFilterDate, setLogFilterDate] = useState<string>('');
  const [logFilterStatus, setLogFilterStatus] = useState<string>('');
  const [logFilterUserType, setLogFilterUserType] = useState<string>('');
  const [logFilterDeviceId, setLogFilterDeviceId] = useState<number | undefined>(undefined);
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  const [simulating, setSimulating] = useState<boolean>(false);
  const [lastSimulation, setLastSimulation] = useState<DevicePunchSimulationResult | null>(null);

  // Load registered devices
  const fetchDevices = useCallback(async () => {
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const data = await attendanceApi.getDevices();
      setDevices(data);
    } catch {
      setDevicesError('Failed to load registered attendance devices.');
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  // Load telemetry stats
  const fetchStats = useCallback(async (date?: string) => {
    setStatsLoading(true);
    try {
      const data = await attendanceApi.getDeviceStats({ date });
      setStats(data);
    } catch (err) {
      console.error('Failed to load device stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load punch logs
  const fetchLogs = useCallback(
    async (page = 1) => {
      setLogsLoading(true);
      try {
        const response: PaginatedResponse<AttendanceDeviceLog> = await attendanceApi.getDeviceLogs({
          date: logFilterDate || undefined,
          status: logFilterStatus || undefined,
          user_type: logFilterUserType || undefined,
          device_id: logFilterDeviceId,
          search: logSearchQuery || undefined,
          page,
          per_page: logsPagination.perPage,
        });

        setLogs(response.data);
        setLogsPagination({
          currentPage: response.current_page,
          lastPage: response.last_page,
          total: response.total,
          perPage: response.per_page,
        });
      } catch (err) {
        console.error('Failed to fetch attendance device logs', err);
      } finally {
        setLogsLoading(false);
      }
    },
    [logFilterDate, logFilterStatus, logFilterUserType, logFilterDeviceId, logSearchQuery, logsPagination.perPage]
  );

  useEffect(() => {
    fetchDevices();
    fetchStats();
  }, [fetchDevices, fetchStats]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  // Create device
  const createDevice = async (payload: AttendanceDevicePayload): Promise<AttendanceDevice> => {
    const res = await attendanceApi.createDevice(payload);
    await fetchDevices();
    await fetchStats();
    return res.device;
  };

  // Update device
  const updateDevice = async (id: number, payload: Partial<AttendanceDevicePayload>): Promise<AttendanceDevice> => {
    const res = await attendanceApi.updateDevice(id, payload);
    await fetchDevices();
    return res.device;
  };

  // Delete device
  const deleteDevice = async (id: number): Promise<void> => {
    await attendanceApi.deleteDevice(id);
    await fetchDevices();
    await fetchStats();
  };

  // Regenerate Token
  const regenerateToken = async (id: number): Promise<string> => {
    const res = await attendanceApi.regenerateDeviceToken(id);
    await fetchDevices();
    return res.api_token;
  };

  // Simulate punch
  const simulatePunch = async (payload: {
    device_id?: number;
    identifier: string;
    punch_type?: string;
    verification_method?: string;
  }): Promise<DevicePunchSimulationResult> => {
    setSimulating(true);
    try {
      const result = await attendanceApi.simulatePunch(payload);
      setLastSimulation(result);
      await fetchLogs(1);
      await fetchStats();
      await fetchDevices();
      return result;
    } finally {
      setSimulating(false);
    }
  };

  // Quick Card Assignment
  const assignCard = async (payload: AssignCardPayload): Promise<void> => {
    await attendanceApi.assignCard(payload);
    await fetchLogs(logsPagination.currentPage);
  };

  return {
    devices,
    devicesLoading,
    devicesError,
    fetchDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    regenerateToken,

    stats,
    statsLoading,
    fetchStats,

    logs,
    logsLoading,
    logsPagination,
    fetchLogs,
    logFilterDate,
    setLogFilterDate,
    logFilterStatus,
    setLogFilterStatus,
    logFilterUserType,
    setLogFilterUserType,
    logFilterDeviceId,
    setLogFilterDeviceId,
    logSearchQuery,
    setLogSearchQuery,

    simulatePunch,
    simulating,
    lastSimulation,
    setLastSimulation,

    assignCard,
  };
};
