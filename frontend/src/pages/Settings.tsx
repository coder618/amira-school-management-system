import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Key, Database, Globe, Camera, Trash2, Loader2, Check, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, uploadProfilePicture, removeProfilePicture } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file (PNG, JPG, WEBP).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image exceeds 5MB size limit.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      await uploadProfilePicture(file);
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload photo.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove profile picture?')) return;
    setUploading(true);
    setMessage(null);
    try {
      await removeProfilePicture();
      setMessage({ type: 'success', text: 'Profile picture removed.' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove picture.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings & Account</h1>
        <p className="text-sm text-slate-500">Manage your administrative profile and review system connections</p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {user?.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-2xl font-bold border border-indigo-200">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Change Photo"
                className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition"
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/50 uppercase">
                <Shield className="h-3 w-3" />
                {user?.role || 'Administrator'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Camera className="h-3.5 w-3.5 text-slate-500" />
              <span>Change Photo</span>
            </button>
            {user?.profile_picture_url && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account ID</span>
            <p className="mt-1 text-sm font-semibold text-slate-900 font-mono">#{user?.id}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security Standard</span>
            <p className="mt-1 text-sm font-semibold text-slate-900">Laravel Sanctum Bearer Auth</p>
          </div>
        </div>
      </div>

      {/* Monorepo Architecture Specs */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-600" />
          Monorepo Environment Parameters
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Detailed connectivity parameters between decoupled frontend and backend
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-400" />
              API Base URL
            </span>
            <code className="bg-white px-2 py-1 rounded border border-slate-200 text-indigo-700 font-mono">
              {import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}
            </code>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <Key className="h-4 w-4 text-slate-400" />
              Frontend Rendering Mode
            </span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              Static SPA (Vite + React, No SSR)
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              Backend Framework
            </span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
              Laravel API Only (No Blade)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

