import React, { useState } from 'react';
import { AttendanceDevice } from '../types';
import { X, Key, Copy, Check, Terminal, Code2, Globe, ShieldCheck } from 'lucide-react';

interface DeviceIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: AttendanceDevice | null;
  onRegenerateToken: (id: number) => Promise<string>;
}

export const DeviceIntegrationModal: React.FC<DeviceIntegrationModalProps> = ({
  isOpen,
  onClose,
  device,
  onRegenerateToken,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'json'>('curl');

  if (!isOpen || !device) return null;

  const apiUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/attendance/device/punch`
    : 'https://your-domain.com/api/attendance/device/punch';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm('Are you sure you want to regenerate this device API token? Any existing hardware scanner using this token will stop syncing until updated.')) {
      return;
    }
    setRegenerating(true);
    try {
      await onRegenerateToken(device.id);
    } finally {
      setRegenerating(false);
    }
  };

  const curlExample = `curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Device-Token: ${device.api_token}" \\
  -d '{
    "identifier": "CARD-998877",
    "verification_method": "card",
    "punch_type": "check_in"
  }'`;

  const pythonExample = `# Python Bridge Script for USB RFID Reader / ZKTeco Device
import requests
import json
from datetime import datetime

API_URL = "${apiUrl}"
DEVICE_TOKEN = "${device.api_token}"

def send_attendance_punch(card_id):
    headers = {
        "Content-Type": "application/json",
        "X-Device-Token": DEVICE_TOKEN
    }
    payload = {
        "identifier": card_id,
        "verification_method": "${device.device_type === 'fingerprint' ? 'fingerprint' : 'card'}",
        "punch_type": "check_in",
        "punched_at": datetime.now().isoformat()
    }
    response = requests.post(API_URL, json=payload, headers=headers)
    print("Status:", response.status_code, response.json())

# Example punch:
send_attendance_punch("STU-2026-001")`;

  const jsonPayloadExample = `{
  "identifier": "STU-2026-001 or RFID-123456",
  "verification_method": "card", // card | fingerprint | face | barcode_qr
  "punch_type": "check_in",      // check_in | check_out | auto
  "punched_at": "2026-11-15 08:15:00" // optional, defaults to now()
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Device Connection & API Integration
              </h3>
              <p className="text-xs text-slate-500">
                {device.name} ({device.device_id})
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

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Endpoint URL Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                Ingestion Endpoint (Webhook URL)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(apiUrl, 'url')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'url' ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-[10px] font-bold text-white uppercase tracking-wider">
                POST
              </span>
              <code className="text-xs font-mono text-slate-800 break-all select-all font-semibold">
                {apiUrl}
              </code>
            </div>
          </div>

          {/* Device API Token Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Device Secret API Token
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate Token'}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(device.api_token, 'token')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  {copiedKey === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'token' ? 'Copied' : 'Copy Token'}</span>
                </button>
              </div>
            </div>
            <code className="block text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 break-all select-all font-semibold">
              {device.api_token}
            </code>
            <p className="text-[11px] text-slate-500 mt-2">
              Pass this token in HTTP header <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">X-Device-Token: {device.api_token}</code> with every punch payload.
            </p>
          </div>

          {/* Code Tabs */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('curl')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'curl'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  cURL Command
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('python')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'python'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Python Bridge
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'json'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  JSON Schema
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const content =
                    activeTab === 'curl'
                      ? curlExample
                      : activeTab === 'python'
                      ? pythonExample
                      : jsonPayloadExample;
                  copyToClipboard(content, 'code');
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                {copiedKey === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'code' ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-56">
              {activeTab === 'curl' && curlExample}
              {activeTab === 'python' && pythonExample}
              {activeTab === 'json' && jsonPayloadExample}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
