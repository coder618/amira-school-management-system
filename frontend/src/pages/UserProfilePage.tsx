import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, mediaApi } from '../services/api';
import { User, MediaItem } from '../types';
import {
  User as UserIcon,
  Camera,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Building2,
  Mail,
  Phone,
  Shield,
  Calendar,
  Image as ImageIcon,
  FolderLock,
  ArrowLeft,
  Check,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user: currentUser, updateUser, uploadProfilePicture, removeProfilePicture } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for editable fields
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
  });

  // Media module assets state
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !id || (currentUser && String(currentUser.id) === id);

  // Load User Data
  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      setLoading(true);
      setFeedback(null);
      try {
        if (!id || (currentUser && String(currentUser.id) === id)) {
          // Viewing own profile
          if (currentUser) {
            setProfileUser(currentUser);
            setFormData({
              name: currentUser.name || '',
              phone_number: currentUser.phone_number || '',
            });
          } else {
            const res = await authApi.me();
            if (isMounted) {
              setProfileUser(res.user);
              setFormData({
                name: res.user.name || '',
                phone_number: res.user.phone_number || '',
              });
            }
          }
        } else {
          // Viewing specific user by ID
          const res = await authApi.getUser(Number(id));
          if (isMounted) {
            setProfileUser(res.user);
            setFormData({
              name: res.user.name || '',
              phone_number: res.user.phone_number || '',
            });
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const ax = err as { response?: { data?: { message?: string } } };
          setFeedback({
            type: 'error',
            message: ax.response?.data?.message || 'Failed to load user profile.',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [id, currentUser]);

  // Load Media Module items for this user
  const fetchUserMedia = async (userId: number) => {
    setMediaLoading(true);
    try {
      const res = await mediaApi.getMedia({
        collection_name: 'profile_pictures',
        user_id: userId,
        per_page: 50,
      });
      setMediaList(res.data || []);
    } catch {
      // Non-blocking error
    } finally {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    if (profileUser?.id) {
      fetchUserMedia(profileUser.id);
    }
  }, [profileUser?.id]);

  // Handle Profile Details Update (Name, Phone)
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUser) return;

    setSaving(true);
    setFeedback(null);
    try {
      const res = await authApi.updateProfile({
        name: formData.name.trim(),
        phone_number: formData.phone_number.trim(),
      });
      setProfileUser(res.user);
      if (isOwnProfile) {
        updateUser(res.user);
      }
      setFeedback({ type: 'success', message: 'Profile details updated successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setFeedback({
        type: 'error',
        message: ax.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Upload Profile Image via Media Module
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please select a valid image file (PNG, JPG, WEBP, GIF).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Selected image exceeds the 5MB maximum limit.' });
      return;
    }

    setUploadingImage(true);
    setFeedback(null);
    try {
      // Upload via backend auth controller backed by MediaService and media module
      const updated = await uploadProfilePicture(file);
      setProfileUser(updated);
      setFeedback({
        type: 'success',
        message: 'Profile image uploaded and processed via Media Module successfully!',
      });
      setTimeout(() => setFeedback(null), 4000);
      if (profileUser?.id) {
        fetchUserMedia(profileUser.id);
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setFeedback({
        type: 'error',
        message: ax.response?.data?.message || 'Failed to upload profile picture.',
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload directly to Media module archive
  const handleArchiveMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileUser) return;

    setUploadingImage(true);
    setFeedback(null);
    try {
      const res = await mediaApi.upload(
        file,
        'profile_pictures',
        'App\\Modules\\Core\\Models\\User',
        profileUser.id
      );

      // Now set this media as current profile picture
      const setRes = await authApi.setProfilePictureFromMedia(res.data.id);
      setProfileUser(setRes.user);
      if (isOwnProfile) {
        updateUser(setRes.user);
      }

      setFeedback({
        type: 'success',
        message: 'New media asset archived in Media Module and applied to profile!',
      });
      setTimeout(() => setFeedback(null), 4000);
      fetchUserMedia(profileUser.id);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setFeedback({
        type: 'error',
        message: ax.response?.data?.message || 'Failed to upload to media module.',
      });
    } finally {
      setUploadingImage(false);
      if (archiveInputRef.current) archiveInputRef.current.value = '';
    }
  };

  // Set Profile Picture from existing Media Module Item
  const handleSelectMediaAsAvatar = async (mediaItem: MediaItem) => {
    if (!profileUser) return;
    setUploadingImage(true);
    setFeedback(null);
    try {
      const res = await authApi.setProfilePictureFromMedia(mediaItem.id);
      setProfileUser(res.user);
      if (isOwnProfile) {
        updateUser(res.user);
      }
      setFeedback({
        type: 'success',
        message: `Set profile picture from Media Module asset "${mediaItem.file_name}".`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setFeedback({
        type: 'error',
        message: ax.response?.data?.message || 'Failed to apply media asset as profile picture.',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove Profile Picture
  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;

    setUploadingImage(true);
    setFeedback(null);
    try {
      const updated = await removeProfilePicture();
      setProfileUser(updated);
      setFeedback({ type: 'success', message: 'Profile picture removed.' });
      setTimeout(() => setFeedback(null), 3000);
      if (profileUser?.id) {
        fetchUserMedia(profileUser.id);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to remove profile picture.' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete an individual asset from the Media Module
  const handleDeleteMediaAsset = async (mediaId: number) => {
    if (!window.confirm('Delete this media asset permanently from tenant storage?')) return;
    try {
      await mediaApi.delete(mediaId);
      if (profileUser?.id) {
        fetchUserMedia(profileUser.id);
      }
      setFeedback({ type: 'success', message: 'Media asset deleted successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete media asset.' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-slate-500">Loading user profile...</span>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-8 space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-rose-900">User Not Found</h2>
          <p className="text-xs text-rose-700">The requested user profile could not be located in this tenant.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-rose-800 hover:bg-rose-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const avatarUrl = profileUser.profile_picture_url || profileUser.profile_picture;
  const initials = profileUser.name ? profileUser.name.charAt(0).toUpperCase() : 'U';

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Hidden File Inputs for Media Module */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={archiveInputRef}
        onChange={handleArchiveMediaUpload}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />

      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">User Profile</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserIcon className="h-7 w-7 text-indigo-600" />
            <span>{isOwnProfile ? 'My Profile' : `${profileUser.name}'s Profile`}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Account credentials, profile avatar, and verified records stored securely in Media Module
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (profileUser.id) fetchUserMedia(profileUser.id);
            }}
            disabled={mediaLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Media Module Archive"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${mediaLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Media</span>
          </button>

          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>School Settings</span>
          </Link>
        </div>
      </div>

      {/* Feedback Alert Bar */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Hero Profile Banner & Avatar Uploader */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Banner decorative background */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 relative p-6 flex items-end justify-between">
          <div className="flex items-center gap-2 text-white/70 text-xs font-medium">
            <FolderLock className="h-4 w-4 text-indigo-400" />
            <span>Tenant Media-Managed User Identity</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-indigo-200 border border-white/15">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {profileUser.is_active !== false ? 'Active Account' : 'Suspended'}
          </span>
        </div>

        {/* Profile Card Body with Floating Avatar */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            {/* Avatar Container with Action Trigger */}
            <div className="flex items-end gap-5">
              <div className="relative group">
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl overflow-hidden bg-white p-1.5 shadow-xl border-2 border-white ring-4 ring-indigo-50">
                  <div className="h-full w-full rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl shadow-inner">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={profileUser.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                </div>

                {/* Camera Click Badge */}
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-transform active:scale-90 cursor-pointer border-2 border-white"
                    title="Upload profile picture via Media module"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* User Identity Details */}
              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {profileUser.name}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                    <Shield className="h-3 w-3" />
                    {profileUser.role || 'Staff'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{profileUser.email}</span>
                </p>
                {profileUser.phone_number && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{profileUser.phone_number}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Photo Actions */}
            {isOwnProfile && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <span>Upload Profile Image</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Left Profile Edit, Right Media Module Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (1 Col): Edit Personal Information Form */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <UserIcon className="h-4 w-4 text-indigo-600" />
              <span>Personal Details</span>
            </h3>

            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isOwnProfile || saving}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profileUser.email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-500 cursor-not-allowed"
                  />
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Email authentication identifier is verified
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  disabled={!isOwnProfile || saving}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Role
                </label>
                <input
                  type="text"
                  value={profileUser.role || 'Staff'}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-500 font-semibold cursor-not-allowed"
                />
              </div>

              {isOwnProfile && (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Changes</span>
                </button>
              )}
            </form>
          </div>

          {/* School / Tenant Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span>School Tenant Info</span>
            </h4>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Institution:</span>
                <span className="font-bold text-slate-800 text-right">{profileUser.school?.name || 'Dhaka Ideal High School & College'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tenant Code:</span>
                <span className="font-mono text-indigo-600 font-bold">{profileUser.school?.code || 'DIHS-01'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Board:</span>
                <span className="font-semibold text-slate-700">{profileUser.school?.board || 'Dhaka'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Joined Date:</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {profileUser.created_at ? new Date(profileUser.created_at).toLocaleDateString() : 'Active Member'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col (2 Cols): Media Module Storage & Profile Images */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-indigo-600" />
                  <span>Media Module Asset Library</span>
                </h3>
                <p className="text-xs text-slate-500">
                  All profile pictures uploaded and retrieved via the tenant Media Module (/api/media)
                </p>
              </div>

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => archiveInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Upload to Media Library</span>
                </button>
              )}
            </div>

            {/* Media Module Banner Info */}
            <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-4 text-xs text-indigo-900 flex items-start gap-3">
              <FolderLock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Tenant-Isolated Media Storage Active</p>
                <p className="text-[11px] text-indigo-700/90 mt-0.5">
                  Uploaded profile images are validated, stored in tenant directories, and linked through the
                  backend <code>Media</code> database model. You can select any previous media asset below to set as your active profile avatar.
                </p>
              </div>
            </div>

            {/* Media Items Grid */}
            {mediaLoading ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-xs text-slate-500">Loading media assets...</span>
              </div>
            ) : mediaList.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No media records found for this user</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Upload a profile picture to create and view assets archived in the Media Module.
                </p>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Upload First Image</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {mediaList.map((item) => {
                  const isActiveAvatar =
                    profileUser.profile_picture === item.file_path ||
                    (profileUser.profile_picture_url && profileUser.profile_picture_url === item.url);

                  return (
                    <div
                      key={item.id}
                      className={`group relative rounded-2xl border overflow-hidden bg-white shadow-xs transition-all hover:shadow-md ${
                        isActiveAvatar
                          ? 'border-indigo-500 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="aspect-square bg-slate-100 overflow-hidden relative">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://placehold.co/400x400?text=Media+Preview';
                          }}
                        />

                        {/* Active Badge */}
                        {isActiveAvatar && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                            <Check className="h-3 w-3" />
                            <span>Active Avatar</span>
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="p-3 space-y-1.5 text-xs">
                        <p className="font-bold text-slate-800 truncate" title={item.file_name}>
                          {item.name || item.file_name}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{formatFileSize(item.size)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>

                        {/* Actions */}
                        {isOwnProfile && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            {!isActiveAvatar ? (
                              <button
                                type="button"
                                onClick={() => handleSelectMediaAsAvatar(item)}
                                disabled={uploadingImage}
                                className="flex-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1 px-2 text-[11px] font-bold transition-colors cursor-pointer text-center"
                              >
                                Set as Avatar
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Current
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteMediaAsset(item.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete from Media Module"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
