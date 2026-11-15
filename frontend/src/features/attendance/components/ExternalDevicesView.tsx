import React, { useState } from 'react';
import { useAttendanceDevices } from '../hooks/useAttendanceDevices';
import { AttendanceDevice, AttendanceDevicePayload } from '../types';
import { DeviceManagementModal } from './DeviceManagementModal';
import { DeviceIntegrationModal } from './DeviceIntegrationModal';
import { DeviceSimulatorModal } from './DeviceSimulatorModal';
import { DeviceAssignCardModal } from './DeviceAssignCardModal';
import {
  Cpu,
  Plus,
  RefreshCw,
  ScanLine,
  Key,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Clock,
  Search,
  UserCheck,
  CreditCard,
  User,
  Fingerprint,
  Smile,
  QrCode,
} from 'lucide-react';

export const ExternalDevicesView: React.FC = () => {
  const {
    devices,
    devicesLoading,
    fetchDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    regenerateToken,

    stats,
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
    assignCard,
  } = useAttendanceDevices();

  // Modals state
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [selectedDeviceForEdit, setSelectedDeviceForEdit] = useState<AttendanceDevice | null>(null);

  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [selectedDeviceForIntegration, setSelectedDeviceForIntegration] = useState<AttendanceDevice | null>(null);

  const [simulatorOpen, setSimulatorOpen] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [cardToAssign, setCardToAssign] = useState<string>('');

  const handleOpenEdit = (device: AttendanceDevice) => {
    setSelectedDeviceForEdit(device);
    setDeviceModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedDeviceForEdit(null);
    setDeviceModalOpen(true);
  };

  const handleOpenIntegration = (device: AttendanceDevice) => {
    setSelectedDeviceForIntegration(device);
    setIntegrationModalOpen(true);
  };

  const handleDeleteDevice = async (device: AttendanceDevice) => {
    if (confirm(`Are you sure you want to remove device "${device.name}"?`)) {
      await deleteDevice(device.id);
    }
  };

  const handleOpenAssignModal = (cardUid: string) => {
    setCardToAssign(cardUid);
    setAssignModalOpen(true);
  };

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case 'fingerprint':
        return <Fingerprint className="w-4 h-4 text-emerald-600" />;
      case 'facial':
        return <Smile className="w-4 h-4 text-violet-600" />;
      case 'barcode_qr':
        return <QrCode className="w-4 h-4 text-amber-600" />;
      case 'rfid':
      default:
        return <CreditCard className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getDeviceTypeLabel = (type: string) => {
    switch (type) {
      case 'fingerprint':
        return 'Biometric Fingerprint';
      case 'facial':
        return 'Facial Recognition';
      case 'barcode_qr':
        return 'Barcode / QR';
      case 'rfid':
      default:
        return 'RFID Smart Card';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-indigo-600" />
            External Attendance Devices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure RFID card scanners, biometric terminals, and monitor live hardware attendance punches
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              fetchDevices();
              fetchStats();
              fetchLogs();
            }}
            disabled={devicesLoading || logsLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${devicesLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setSimulatorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors shadow-2xs cursor-pointer"
          >
            <ScanLine className="w-4 h-4 text-violet-600" />
            <span>Punch Simulator / Scanner</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add External Device</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Hardware Devices</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total_devices ?? devices.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Configured terminals & readers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Terminals</span>
            <Wifi className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {stats?.active_devices ?? devices.filter((d) => d.status === 'active').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Online & accepting punches</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Today's Device Punches</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{stats?.today_punches ?? 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats?.success_punches ?? 0} successfully recorded
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Unrecognized Scans</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats?.unrecognized_punches ?? 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Cards needing student/staff binding</p>
        </div>
      </div>

      {/* Registered Devices Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Connected Devices ({devices.length})
          </h3>
        </div>

        {devicesLoading && devices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            Loading devices...
          </div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">No external devices registered yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add your RFID gate turnstiles, biometric fingerprint machines, or face recognition terminals to record attendance automatically.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Device</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        {getDeviceTypeIcon(device.device_type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{device.name}</h4>
                        <span className="text-[11px] font-mono text-slate-500">ID: {device.device_id}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        device.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {device.status === 'active' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </>
                      ) : (
                        'Inactive'
                      )}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Type:</span>
                      <span className="font-medium text-slate-800">{getDeviceTypeLabel(device.device_type)}</span>
                    </div>

                    {device.device_model && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Model:</span>
                        <span className="font-mono text-slate-800">{device.device_model}</span>
                      </div>
                    )}

                    {device.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Location:</span>
                        <span className="font-medium text-slate-800">{device.location}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Last Synced:</span>
                      <span className="text-slate-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {device.last_sync_at ? new Date(device.last_sync_at).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500">Today Punches:</span>
                      <span className="font-bold text-indigo-600">
                        {device.today_punches ?? 0} records
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenIntegration(device)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>API Token & Guide</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(device)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Device"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDevice(device)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Device Punch Logs Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Logs Filter Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-indigo-600" />
              Live Hardware Punch Logs & Audit
            </h3>
            <p className="text-[11px] text-slate-500">
              Real-time audit log of all RFID card taps, biometric scans, and external punches
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={logFilterDate}
              onChange={(e) => setLogFilterDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white"
            />

            <select
              value={logFilterStatus}
              onChange={(e) => setLogFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="unrecognized">Unrecognized</option>
            </select>

            <select
              value={logFilterUserType}
              onChange={(e) => setLogFilterUserType(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white"
            >
              <option value="">All User Types</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="user">Staff / User</option>
              <option value="unknown">Unknown</option>
            </select>

            <select
              value={logFilterDeviceId || ''}
              onChange={(e) => setLogFilterDeviceId(e.target.value ? Number(e.target.value) : undefined)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white"
            >
              <option value="">All Devices</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <input
                type="text"
                placeholder="Search name, roll, card..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-600 bg-white w-40 sm:w-48"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Punched At</th>
                <th className="py-3 px-4">Identified User</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Card / UID</th>
                <th className="py-3 px-4">Device / Method</th>
                <th className="py-3 px-4">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logsLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading punch logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No punch records found for the selected filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const student = log.student;
                  const teacher = log.teacher;
                  const user = log.user;
                  const photoUrl =
                    student?.student_image_url ||
                    teacher?.profile_picture_url ||
                    user?.profile_picture_url;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(log.punched_at).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                            {photoUrl ? (
                              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {(student ? (student.full_name || `${student.first_name} ${student.last_name || ''}`) : null) ||
                                teacher?.user?.name ||
                                user?.name || (
                                  <span className="text-slate-400 italic font-normal">Unidentified</span>
                                )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {student && (
                                <>
                                  {student.student_id} • Roll {student.roll_number} •{' '}
                                  {student.class_level?.name || 'Class'}
                                </>
                              )}
                              {teacher && (
                                <>
                                  {teacher.employee_id} • {teacher.designation}
                                </>
                              )}
                              {!student && !teacher && (log.response_message || 'N/A')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            log.user_type === 'student'
                              ? 'bg-indigo-50 text-indigo-700'
                              : log.user_type === 'teacher'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {log.user_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {log.raw_identifier}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">
                          {log.device?.name || log.device_identifier || 'Direct API'}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">
                          {log.verification_method} • {log.punch_type}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              log.status === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {log.status === 'success' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Recorded
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Unrecognized
                              </>
                            )}
                          </span>

                          {log.status === 'unrecognized' && (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(log.raw_identifier)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-md border border-indigo-200 transition-colors cursor-pointer"
                              title="Assign this scanned card ID to student or staff"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Assign</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {logsPagination.lastPage > 1 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page {logsPagination.currentPage} of {logsPagination.lastPage} ({logsPagination.total} total logs)
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={logsPagination.currentPage <= 1}
                onClick={() => fetchLogs(logsPagination.currentPage - 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={logsPagination.currentPage >= logsPagination.lastPage}
                onClick={() => fetchLogs(logsPagination.currentPage + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DeviceManagementModal
        isOpen={deviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        device={selectedDeviceForEdit}
        onSubmit={async (payload: AttendanceDevicePayload) => {
          if (selectedDeviceForEdit) {
            await updateDevice(selectedDeviceForEdit.id, payload);
          } else {
            await createDevice(payload);
          }
        }}
      />

      <DeviceIntegrationModal
        isOpen={integrationModalOpen}
        onClose={() => setIntegrationModalOpen(false)}
        device={selectedDeviceForIntegration}
        onRegenerateToken={regenerateToken}
      />

      <DeviceSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        devices={devices}
        onSimulate={simulatePunch}
        onOpenAssignModal={handleOpenAssignModal}
      />

      <DeviceAssignCardModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        initialCardRfid={cardToAssign}
        onAssign={assignCard}
      />
    </div>
  );
};
