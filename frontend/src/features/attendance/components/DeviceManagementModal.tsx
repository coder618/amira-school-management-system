import React, { useState, useEffect } from 'react';
import { AttendanceDevice, AttendanceDevicePayload, DeviceType, DeviceStatus } from '../types';
import { X, Cpu, Check, Loader2 } from 'lucide-react';

interface DeviceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AttendanceDevicePayload) => Promise<any>;
  device?: AttendanceDevice | null;
}

export const DeviceManagementModal: React.FC<DeviceManagementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  device,
}) => {
  const [name, setName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('rfid');
  const [deviceModel, setDeviceModel] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<DeviceStatus>('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setName(device.name);
      setDeviceId(device.device_id);
      setDeviceType(device.device_type);
      setDeviceModel(device.device_model || '');
      setIpAddress(device.ip_address || '');
      setLocation(device.location || '');
      setStatus(device.status);
    } else {
      setName('');
      setDeviceId(`DEV-${Math.floor(1000 + Math.random() * 9000)}`);
      setDeviceType('rfid');
      setDeviceModel('');
      setIpAddress('');
      setLocation('');
      setStatus('active');
    }
    setError(null);
  }, [device, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a descriptive name for this device.');
      return;
    }
    if (!deviceId.trim()) {
      setError('Device Hardware ID / Serial is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        device_id: deviceId.trim(),
        device_type: deviceType,
        device_model: deviceModel.trim() || undefined,
        ip_address: ipAddress.trim() || undefined,
        location: location.trim() || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save attendance device.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {device ? 'Edit External Device' : 'Register New Attendance Device'}
              </h3>
              <p className="text-xs text-slate-500">
                Connect RFID readers, biometrics, or face recognition terminals
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Device Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Main Gate RFID Turnstile, Library Scanner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Device Serial / ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RFID-GATE-01"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Device Type
              </label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
              >
                <option value="rfid">RFID / Smart Card Scanner</option>
                <option value="fingerprint">Biometric Fingerprint Terminal</option>
                <option value="facial">Facial Recognition Terminal</option>
                <option value="barcode_qr">Barcode / QR Code Scanner</option>
                <option value="general">General / IoT Webhook Device</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hardware Model (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ZKTeco K40, Realtime T502"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location / Gate
              </label>
              <input
                type="text"
                placeholder="e.g. Campus East Gate, Building 2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                IP Address (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 192.168.1.150"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeviceStatus)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
              >
                <option value="active">Active & Online</option>
                <option value="inactive">Inactive / Offline</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{device ? 'Save Changes' : 'Register Device'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
