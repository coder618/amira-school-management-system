import React, { useState, useEffect, useCallback } from 'react';
import { attendanceApi, PaginatedResponse } from '../api';
import { AttendanceDevice, MultiTenantDeviceStats, DeviceType } from '../types';
import { schoolsApi } from '../../core/api';
import { OnboardedSchool } from '../../core/types';
import { DeviceIntegrationModal } from './DeviceIntegrationModal';
import {
  Cpu,
  Plus,
  RefreshCw,
  Search,
  Building2,
  CheckCircle2,
  Wifi,
  Key,
  Trash2,
  CreditCard,
  Fingerprint,
  Smile,
  QrCode,
  Globe,
  Loader2,
  X,
  Check,
} from 'lucide-react';

export const MultiTenantDeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<AttendanceDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MultiTenantDeviceStats | null>(null);
  const [schools, setSchools] = useState<OnboardedSchool[]>([]);

  // Filters
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedDeviceForIntegration, setSelectedDeviceForIntegration] = useState<AttendanceDevice | null>(null);

  // New device form state
  const [newSchoolId, setNewSchoolId] = useState<number | ''>('');
  const [newName, setNewName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<DeviceType>('rfid');
  const [newModel, setNewModel] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newIp, setNewIp] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load schools list for multi-tenant filter
  useEffect(() => {
    schoolsApi.getSchools().then((data) => {
      setSchools(data);
      if (data.length > 0 && newSchoolId === '') {
        setNewSchoolId(data[0].id);
      }
    }).catch(console.error);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await attendanceApi.getMultiTenantStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load multi-tenant stats', err);
    }
  }, []);

  const fetchDevices = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const res: PaginatedResponse<AttendanceDevice> = await attendanceApi.getMultiTenantDevices({
        school_id: selectedSchoolId ? Number(selectedSchoolId) : undefined,
        status: selectedStatus || undefined,
        device_type: selectedType || undefined,
        search: searchQuery || undefined,
        page: targetPage,
        per_page: 20,
      });
      setDevices(res.data);
      setPagination({
        currentPage: res.current_page,
        lastPage: res.last_page,
        total: res.total,
      });
    } catch (err) {
      console.error('Failed to load multi-tenant devices', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSchoolId, selectedStatus, selectedType, searchQuery]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchDevices(page);
  }, [fetchDevices, page]);

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolId) {
      setFormError('Please select a target school tenant.');
      return;
    }
    if (!newName.trim() || !newDeviceId.trim()) {
      setFormError('Device Name and Hardware ID are required.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await attendanceApi.createMultiTenantDevice({
        school_id: Number(newSchoolId),
        name: newName.trim(),
        device_id: newDeviceId.trim(),
        device_type: newDeviceType,
        device_model: newModel.trim() || undefined,
        location: newLocation.trim() || undefined,
        ip_address: newIp.trim() || undefined,
      });

      setIsRegisterModalOpen(false);
      setNewName('');
      setNewDeviceId(`DEV-${Math.floor(1000 + Math.random() * 9000)}`);
      setNewModel('');
      setNewLocation('');
      setNewIp('');
      fetchDevices(1);
      fetchStats();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to register device.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDevice = async (device: AttendanceDevice) => {
    if (confirm(`Remove device "${device.name}" from tenant ${device.school?.name || 'School'}?`)) {
      await attendanceApi.deleteDevice(device.id);
      fetchDevices(pagination.currentPage);
      fetchStats();
    }
  };

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'fingerprint':
        return <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />;
      case 'facial':
        return <Smile className="w-3.5 h-3.5 text-violet-600" />;
      case 'barcode_qr':
        return <QrCode className="w-3.5 h-3.5 text-amber-600" />;
      case 'rfid':
      default:
        return <CreditCard className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-300 border border-indigo-400/30">
              <Globe className="w-3.5 h-3.5" />
              SuperAdmin Multi-Tenant Module
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Cross-Tenant Hardware Attendance Devices
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Centrally manage and monitor all RFID gates, biometric terminals, and external punch machines deployed across institutions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              fetchDevices(page);
              fetchStats();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setNewDeviceId(`DEV-${Math.floor(1000 + Math.random() * 9000)}`);
              setFormError(null);
              setIsRegisterModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Device for Tenant</span>
          </button>
        </div>
      </div>

      {/* Global Telemetry Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Global Devices</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total_devices ?? devices.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Across all school tenants</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Online Terminals</span>
            <Wifi className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats?.active_devices ?? 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Broadcasting heartbeat / sync</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Institutions Connected</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            {stats?.schools_with_devices ?? 0} / {stats?.total_schools ?? schools.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Schools using hardware attendance</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Today's Total Punches</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats?.today_punches ?? 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Aggregated system-wide records</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Hardware Directory Across Tenants
            </h3>
            <span className="text-xs text-slate-500">({pagination.total} total devices)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* School Tenant Filter */}
            <select
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value ? Number(e.target.value) : '');
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white"
            >
              <option value="">All School Tenants</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Online</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white"
            >
              <option value="">All Device Types</option>
              <option value="rfid">RFID Smart Card</option>
              <option value="fingerprint">Fingerprint</option>
              <option value="facial">Facial Recognition</option>
              <option value="barcode_qr">Barcode / QR</option>
            </select>

            <div className="relative">
              <input
                type="text"
                placeholder="Search device, school, IP..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white w-48"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">School Tenant</th>
                <th className="py-3 px-4">Device Name & Serial</th>
                <th className="py-3 px-4">Hardware Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Sync</th>
                <th className="py-3 px-4">Total Punches</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && devices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading cross-tenant devices...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No hardware attendance devices found for this criteria.
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{device.school?.name || `Tenant #${device.school_id}`}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {device.school?.code} {device.school?.board ? `• ${device.school.board}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{device.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        UID: {device.device_id} {device.device_model ? `(${device.device_model})` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 text-slate-700 capitalize">
                        {getDeviceTypeIcon(device.device_type)}
                        <span>{device.device_type}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {device.location || 'N/A'}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          device.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {device.status === 'active' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        )}
                        {device.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {device.last_sync_at ? new Date(device.last_sync_at).toLocaleString() : 'Never'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-700">
                        {device.total_punches ?? 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Today: {device.today_punches ?? 0}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDeviceForIntegration(device)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="View API Token & Webhook"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDevice(device)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Device"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.lastPage > 1 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} total devices)
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={pagination.currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.currentPage >= pagination.lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Provision Device for Specific School Tenant */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Provision Device for School Tenant
                  </h3>
                  <p className="text-xs text-slate-500">
                    Deploy an attendance terminal directly to an institutional boundary
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDevice} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target School Tenant <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newSchoolId}
                  onChange={(e) => setNewSchoolId(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden bg-white"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.board || 'Dhaka'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Device Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Gate Turnstile"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Device Serial / ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Device Type
                  </label>
                  <select
                    value={newDeviceType}
                    onChange={(e) => setNewDeviceType(e.target.value as DeviceType)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden bg-white"
                  >
                    <option value="rfid">RFID Smart Card</option>
                    <option value="fingerprint">Biometric Fingerprint</option>
                    <option value="facial">Facial Recognition</option>
                    <option value="barcode_qr">Barcode / QR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hardware Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ZKTeco K40"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location / Gate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Campus East Gate"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Provision for School</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Integration Guide Modal */}
      {selectedDeviceForIntegration && (
        <DeviceIntegrationModal
          isOpen={!!selectedDeviceForIntegration}
          onClose={() => setSelectedDeviceForIntegration(null)}
          device={selectedDeviceForIntegration}
          onRegenerateToken={async (id) => {
            const token = await attendanceApi.regenerateDeviceToken(id);
            fetchDevices(page);
            return token.api_token;
          }}
        />
      )}
    </div>
  );
};
