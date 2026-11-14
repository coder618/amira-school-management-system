import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Camera,
  Trash2,
  Settings,
  Bell,
  ChevronDown,
  Loader2,
  Check,
  AlertCircle,
  Shield,
} from 'lucide-react';

export const UserProfileDropdown: React.FC = () => {
  const { user, logout, uploadProfilePicture, removeProfilePicture } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      await uploadProfilePicture(file);
      setUploadSuccess('Profile picture updated!');
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } };
        setUploadError(ax.response?.data?.message || 'Failed to upload photo.');
      } else {
        setUploadError('Network error uploading profile picture.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePicture = async () => {
    if (!window.confirm('Remove your custom profile picture?')) return;

    setUploading(true);
    setUploadError(null);
    try {
      await removeProfilePicture();
      setUploadSuccess('Profile picture removed.');
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch {
      setUploadError('Failed to remove picture.');
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = user?.profile_picture_url || user?.profile_picture;
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />

      {/* Trigger Button in Header Top-Right */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 rounded-2xl p-1.5 sm:px-3 sm:py-1.5 border transition-all cursor-pointer ${
          isOpen
            ? 'border-indigo-400 bg-indigo-50/70 shadow-xs'
            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
        }`}
        aria-label="User account menu"
      >
        {/* Avatar */}
        <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-xs border border-white">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || 'Profile'}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* User Info (Desktop) */}
        <div className="hidden sm:flex flex-col text-left min-w-0 pr-1">
          <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
            {user?.name || 'Headmaster'}
          </span>
          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {user?.role || 'Admin'}
          </span>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* User Profile Card Header */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white">
            <div className="flex items-center gap-3.5">
              {/* Avatar with Camera Overlay */}
              <div className="relative group">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white/10 text-white font-bold text-lg border-2 border-white/20 shadow-md">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.name || 'Profile'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                {/* Camera Click Icon */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-500 transition-transform active:scale-95 cursor-pointer"
                  title="Upload / Change profile picture"
                >
                  {uploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </button>
              </div>

              {/* Identity Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {user?.name || 'Administrator'}
                </h4>
                <p className="text-xs text-slate-300 truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-200 border border-white/10">
                    <Shield className="h-2.5 w-2.5" />
                    {user?.role || 'Admin'}
                  </span>
                </div>
              </div>
            </div>

            {/* Photo Action Buttons */}
            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white transition-colors cursor-pointer font-medium"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Change Photo</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePicture}
                  disabled={uploading}
                  className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer text-[11px]"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback Alerts */}
          {uploadError && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Navigation Links */}
          <div className="p-2 space-y-0.5">
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Account & School Settings</span>
            </Link>

            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Bell className="h-4 w-4 text-slate-400" />
              <span>Notifications Feed</span>
            </Link>
          </div>

          {/* Sign Out Button */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
