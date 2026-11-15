import React, { useState, useRef, useEffect } from 'react';
import { AttendanceDevice, DevicePunchSimulationResult } from '../types';
import {
  X,
  CreditCard,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus,
  Clock,
} from 'lucide-react';

interface DeviceSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: AttendanceDevice[];
  onSimulate: (payload: {
    device_id?: number;
    identifier: string;
    punch_type?: string;
    verification_method?: string;
  }) => Promise<DevicePunchSimulationResult>;
  onOpenAssignModal?: (cardId: string) => void;
}

export const DeviceSimulatorModal: React.FC<DeviceSimulatorModalProps> = ({
  isOpen,
  onClose,
  devices,
  onSimulate,
  onOpenAssignModal,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | ''>('');
  const [identifier, setIdentifier] = useState('');
  const [punchType, setPunchType] = useState('check_in');
  const [verificationMethod, setVerificationMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DevicePunchSimulationResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (devices.length > 0 && selectedDeviceId === '') {
        setSelectedDeviceId(devices[0].id);
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setResult(null);
      setIdentifier('');
    }
  }, [isOpen, devices]);

  if (!isOpen) return null;

  const handlePunch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await onSimulate({
        device_id: selectedDeviceId ? Number(selectedDeviceId) : undefined,
        identifier: cleanId,
        punch_type: punchType,
        verification_method: verificationMethod,
      });
      setResult(res);
      setIdentifier('');
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err: any) {
      setResult({
        status: 'error',
        message: err?.response?.data?.message || 'Error communicating with attendance server.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-50 border border-violet-100 text-violet-600">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Live External Device Punch Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Scan RFID smart card, barcode, or simulate biometric punch
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
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Hardware Device Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active External Device
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden bg-white"
              >
                <option value="">Virtual Test Device</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.device_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification Method
              </label>
              <select
                value={verificationMethod}
                onChange={(e) => setVerificationMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden bg-white"
              >
                <option value="card">RFID Smart Card Scan</option>
                <option value="fingerprint">Biometric Fingerprint</option>
                <option value="face">Facial Recognition</option>
                <option value="barcode_qr">Barcode / QR Code</option>
                <option value="manual">Manual ID Punch</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Punch Type
              </label>
              <select
                value={punchType}
                onChange={(e) => setPunchType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden bg-white"
              >
                <option value="check_in">Check-in (Arrival)</option>
                <option value="check_out">Check-out (Departure)</option>
                <option value="auto">Auto / General</option>
              </select>
            </div>
          </div>

          {/* Punch input */}
          <form onSubmit={handlePunch} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Scan Card / Tap Badge / Enter ID</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  USB Scanners auto-submit on Enter
                </span>
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  required
                  placeholder="Scan or type RFID UID / Student ID / Employee ID..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-24 py-3 text-sm font-mono border-2 border-indigo-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
                />
                <CreditCard className="w-5 h-5 text-indigo-500 absolute left-3 top-3.5" />
                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
                  <span>Record</span>
                </button>
              </div>
            </div>
          </form>

          {/* Quick Test Pill Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-medium text-slate-500">Quick Test:</span>
            <button
              type="button"
              onClick={() => {
                setIdentifier('STU-2026-001');
                setTimeout(() => handlePunch(), 50);
              }}
              className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              STU-2026-001
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('RFID-998877');
                setTimeout(() => handlePunch(), 50);
              }}
              className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              RFID-998877
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('EMP-1001');
                setTimeout(() => handlePunch(), 50);
              }}
              className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              EMP-1001
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier(`CARD-${Math.floor(100000 + Math.random() * 900000)}`);
              }}
              className="px-2 py-0.5 text-[11px] font-mono bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md transition-colors cursor-pointer"
            >
              Random Unknown Card
            </button>
          </div>

          {/* Result Card */}
          {result && (
            <div
              className={`rounded-2xl p-4 border animate-in zoom-in-95 duration-200 ${
                result.status === 'success'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : result.status === 'unrecognized'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.status === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold truncate">
                      {result.status === 'success' ? result.name : 'Unknown Card / ID'}
                    </h4>
                    {result.attendance_status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          result.attendance_status === 'Present'
                            ? 'bg-emerald-200/80 text-emerald-800'
                            : 'bg-amber-200/80 text-amber-800'
                        }`}
                      >
                        {result.attendance_status}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-0.5">
                    {result.message}
                  </p>

                  {result.status === 'success' && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                      <div>
                        <span className="text-slate-500">ID / Roll:</span>{' '}
                        <span className="font-semibold font-mono">
                          {result.identifier || 'N/A'}{result.roll_number ? ` (Roll: ${result.roll_number})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Class / Dept:</span>{' '}
                        <span className="font-semibold">
                          {result.class ? `${result.class} - ${result.section}` : (result.designation || 'Staff')}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Punched at {result.punched_at || 'Just now'}</span>
                      </div>
                    </div>
                  )}

                  {result.status === 'unrecognized' && onOpenAssignModal && (
                    <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex items-center justify-between">
                      <span className="text-[11px] text-amber-800">
                        Card UID: <code className="font-bold">{result.identifier}</code>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (result.identifier) {
                            onOpenAssignModal(result.identifier);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Assign to Student/Teacher</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
