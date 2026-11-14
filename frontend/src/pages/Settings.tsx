import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Shield,
  Key,
  Database,
  Globe,
  Camera,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Building2,
  ShieldCheck,
  Lock,
  Save,
  FileText,
  MapPin,
  Phone,
  Mail,
  Hash,
  School as SchoolIcon,
} from 'lucide-react';
import { schoolApi } from '../services/api';
import { School } from '../types';

export const Settings: React.FC = () => {
  const { user, uploadProfilePicture, removeProfilePicture } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if current user has administrator role
  const isAdmin =
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin' ||
    user?.role?.toLowerCase() === 'admin' ||
    user?.role?.toLowerCase() === 'superadmin';

  // School Institutional State
  const [school, setSchool] = useState<School | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [schoolMessage, setSchoolMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [schoolFormData, setSchoolFormData] = useState({
    name: '',
    code: '',
    eiin: '',
    board: 'Dhaka',
    address: '',
    phone: '',
    email: '',
    division: '',
    district: '',
    thana: '',
  });

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        setSchoolLoading(true);
        const data = await schoolApi.getCurrent();
        setSchool(data);
        setSchoolFormData({
          name: data.name || '',
          code: data.code || '',
          eiin: data.eiin || '',
          board: data.board || 'Dhaka',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          division: data.division || '',
          district: data.district || '',
          thana: data.thana || '',
        });
        if (data.name) {
          localStorage.setItem('educore_school_name', data.name);
        }
      } catch (err: any) {
        console.error('Failed to load current school details:', err);
      } finally {
        setSchoolLoading(false);
      }
    };

    fetchSchool();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSchoolFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setSchoolMessage({
        type: 'error',
        text: 'Unauthorized: Only users with the Admin role can update school institutional information.',
      });
      return;
    }

    setSchoolSaving(true);
    setSchoolMessage(null);

    try {
      const res = await schoolApi.updateCurrent(schoolFormData);
      setSchool(res.school);
      setSchoolMessage({
        type: 'success',
        text: 'School information updated successfully! All future PDF receipts, vouchers, and reports will reflect these details.',
      });
      localStorage.setItem('educore_school_name', res.school.name);
      window.dispatchEvent(new CustomEvent('school-updated', { detail: res.school }));
      setTimeout(() => setSchoolMessage(null), 5000);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Failed to update school information.');
      setSchoolMessage({ type: 'error', text: errorMsg });
    } finally {
      setSchoolSaving(false);
    }
  };

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
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${message.type === 'success'
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

      {/* School Specific Information Card (Rendered in PDF Documents) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">School Institutional Information</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure school parameters that appear on official PDF payment receipts, invoices, and vouchers
            </p>
            {school?.updated_at && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Last modified: {new Date(school.updated_at).toLocaleString()}
              </p>
            )}
          </div>

          <div>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Admin Edit Access
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                Admin Role Required
              </span>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs text-amber-800">
            <Lock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">Administrator Privileges Required</p>
              <p className="mt-0.5 text-amber-700">
                You are currently signed in with role <span className="font-bold uppercase font-mono">{user?.role || 'Staff'}</span>.
                Only users with the <span className="font-semibold">Admin</span> role can modify school institutional details.
                These settings are presented in read-only mode.
              </p>
            </div>
          </div>
        )}

        {schoolMessage && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${schoolMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
          >
            {schoolMessage.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{schoolMessage.text}</span>
          </div>
        )}

        {/* Live PDF Header Preview */}
        <div className="mt-6 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/40 via-slate-50 to-indigo-50/20 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-blue-200/60 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                PDF Document Header Preview
              </span>
            </div>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Voucher Output
            </span>
          </div>

          <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="border-b-2 border-blue-600 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-blue-900 tracking-tight">
                    {schoolFormData.name || 'School Name'}
                  </h2>
                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-2">
                    <span>
                      <strong>EIIN:</strong> {schoolFormData.eiin || '—'}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      <strong>Code:</strong> {schoolFormData.code || '—'}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      <strong>Board:</strong> {schoolFormData.board || '—'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2">
                    <span>{schoolFormData.address || 'Campus Address Area'}</span>
                    {schoolFormData.phone && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>
                          <strong>Tel:</strong> {schoolFormData.phone}
                        </span>
                      </>
                    )}
                    {schoolFormData.email && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>
                          <strong>Email:</strong> {schoolFormData.email}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="inline-block bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                    Payment Voucher
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-800">
                    Receipt #REC-2026-0001
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold uppercase">
                    Paid
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-right">
              This preview matches the top header generated by the DomPDF receipt template.
            </p>
          </div>
        </div>

        {schoolLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading school parameters...</span>
          </div>
        ) : (
          <form onSubmit={handleSchoolSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  School Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <SchoolIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={schoolFormData.name}
                    onChange={handleInputChange}
                    disabled={!isAdmin}
                    placeholder="e.g. Dhaka Ideal High School & College"
                    className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm transition focus:outline-hidden ${!isAdmin
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Printed prominently as header title on all receipts.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  School Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="code"
                    required
                    value={schoolFormData.code}
                    onChange={handleInputChange}
                    disabled={!isAdmin}
                    placeholder="e.g. DIHS-001"
                    className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm transition focus:outline-hidden ${!isAdmin
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Unique institutional registration identifier.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  EIIN Number
                </label>
                <input
                  type="text"
                  name="eiin"
                  value={schoolFormData.eiin}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="e.g. 108250"
                  className={`w-full rounded-lg border py-2 px-3 text-sm transition focus:outline-hidden ${!isAdmin
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                />
                <p className="text-[11px] text-slate-400 mt-1">Educational Institute Identification Number.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Education Board
                </label>
                <input
                  type="text"
                  name="board"
                  list="boards-list"
                  value={schoolFormData.board}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="e.g. Dhaka, Chittagong, Rajshahi"
                  className={`w-full rounded-lg border py-2 px-3 text-sm transition focus:outline-hidden ${!isAdmin
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                />
                <datalist id="boards-list">
                  <option value="Dhaka" />
                  <option value="Chittagong" />
                  <option value="Rajshahi" />
                  <option value="Comilla" />
                  <option value="Barisal" />
                  <option value="Sylhet" />
                  <option value="Dinajpur" />
                  <option value="Mymensingh" />
                  <option value="Madrasah" />
                  <option value="Technical" />
                </datalist>
                <p className="text-[11px] text-slate-400 mt-1">Associated secondary or higher secondary education board.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Official Phone / Tel
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="phone"
                    value={schoolFormData.phone}
                    onChange={handleInputChange}
                    disabled={!isAdmin}
                    placeholder="e.g. 01711000000"
                    className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm transition focus:outline-hidden ${!isAdmin
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Printed in the PDF receipt header contact line.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Official Institutional Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={schoolFormData.email}
                    onChange={handleInputChange}
                    disabled={!isAdmin}
                    placeholder="e.g. info@dhaka-ideal.edu.bd"
                    className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm transition focus:outline-hidden ${!isAdmin
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Official contact email for inquiries and verification.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Campus / Institutional Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={schoolFormData.address}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="e.g. Motijheel C/A, Dhaka-1000, Bangladesh"
                  className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm transition focus:outline-hidden ${!isAdmin
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Physical address printed on PDF headers and invoices.</p>
            </div>

            {/* Regional breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Division
                </label>
                <input
                  type="text"
                  name="division"
                  value={schoolFormData.division}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="e.g. Dhaka"
                  className={`w-full rounded-lg border py-2 px-3 text-sm transition focus:outline-hidden ${!isAdmin
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={schoolFormData.district}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="e.g. Dhaka"
                  className={`w-full rounded-lg border py-2 px-3 text-sm transition focus:outline-hidden ${!isAdmin
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Thana / Upazila
                </label>
                <input
                  type="text"
                  name="thana"
                  value={schoolFormData.thana}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="e.g. Motijheel"
                  className={`w-full rounded-lg border py-2 px-3 text-sm transition focus:outline-hidden ${!isAdmin
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                />
              </div>
            </div>

            {isAdmin && (
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={schoolSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-60 cursor-pointer"
                >
                  {schoolSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{schoolSaving ? 'Saving Changes...' : 'Update School Information'}</span>
                </button>
              </div>
            )}
          </form>
        )}
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
