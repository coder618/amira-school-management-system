import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Save,
  FileText,
  MapPin,
  Phone,
  Mail,
  Hash,
  School as SchoolIcon,
  Cpu,
} from 'lucide-react';
import { schoolApi } from '../services/api';
import { School } from '../types';
import { ExternalDevicesView, MultiTenantDeviceManagement } from '../features/attendance';

export const Settings: React.FC = () => {
  const { user, uploadProfilePicture, removeProfilePicture } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'school';

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if current user has administrator role
  const isAdmin =
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin' ||
    user?.role?.toLowerCase() === 'admin' ||
    user?.role?.toLowerCase() === 'superadmin';

  const isSuperAdmin = user?.role === 'SuperAdmin';

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
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings & Configuration</h1>
          <p className="text-sm text-slate-500">
            Manage institutional parameters, attendance hardware devices, and account profiles
          </p>
        </div>
      </div>

      {/* Sub-menu Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
        <button
          type="button"
          onClick={() => setTab('school')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            currentTab === 'school'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>School Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('devices')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            currentTab === 'devices'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-600" />
          <span>Attendance Devices</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('account')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            currentTab === 'account'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 text-indigo-600" />
          <span>Account & Security</span>
        </button>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setTab('multi-tenant-devices')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'multi-tenant-devices'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Multi-Tenant Devices</span>
            <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md">
              Cross-Tenant
            </span>
          </button>
        )}
      </div>

      {/* Tab 1: Tenant-Specific Attendance Devices */}
      {currentTab === 'devices' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-950">
                  Tenant-Isolated Attendance Device Hub
                </h4>
                <p className="text-xs text-indigo-700">
                  Devices configured here are strictly partitioned to{' '}
                  <span className="font-bold underline">{school?.name || 'your institution'}</span> ({school?.code || 'Tenant'}).
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tenant Boundary Active</span>
            </div>
          </div>

          <ExternalDevicesView />
        </div>
      )}

      {/* Tab 2: Multi-Tenant Devices (SuperAdmin Module) */}
      {currentTab === 'multi-tenant-devices' && isSuperAdmin && (
        <MultiTenantDeviceManagement />
      )}

      {/* Tab 3: School Profile Settings */}
      {currentTab === 'school' && (
        <div className="space-y-6">
          {schoolMessage && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3.5 text-sm border ${
                schoolMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
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

          {/* School Details Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Institutional School Parameters</h3>
                  <p className="text-xs text-slate-500">
                    Official school information printed on fee receipts, student ID cards, vouchers, and certificates
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Tenant Boundary
              </span>
            </div>

            {/* Receipt Header Live Preview */}
            <div className="mt-6 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Live PDF Voucher & Receipt Header Preview
                </span>
                <span className="text-[10px] text-slate-400 font-mono">DomPDF Layout</span>
              </div>

              <div className="rounded-lg bg-white p-4 border border-slate-200 shadow-2xs text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                      {schoolFormData.name || 'YOUR SCHOOL / COLLEGE NAME'}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      {schoolFormData.address || 'Campus Street Address'}, {schoolFormData.thana ? `${schoolFormData.thana}, ` : ''}{schoolFormData.district || 'District'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1">
                      {schoolFormData.eiin && <span>EIIN: <strong className="text-slate-700 font-mono">{schoolFormData.eiin}</strong></span>}
                      {schoolFormData.code && <span>School Code: <strong className="text-slate-700 font-mono">{schoolFormData.code}</strong></span>}
                      {schoolFormData.board && <span>Board: <strong className="text-slate-700">{schoolFormData.board}</strong></span>}
                      {schoolFormData.phone && <span>Mobile: <strong className="text-slate-700 font-mono">{schoolFormData.phone}</strong></span>}
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
                        className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm transition focus:outline-hidden ${
                          !isAdmin
                            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
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
                        placeholder="e.g. DIHS-101"
                        className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm font-mono transition focus:outline-hidden ${
                          !isAdmin
                            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      EIIN (Educational Institute Identification Number)
                    </label>
                    <input
                      type="text"
                      name="eiin"
                      value={schoolFormData.eiin}
                      onChange={handleInputChange}
                      disabled={!isAdmin}
                      placeholder="e.g. 108254"
                      className={`w-full rounded-xl border py-2 px-3 text-sm font-mono transition focus:outline-hidden ${
                        !isAdmin
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Education Board
                    </label>
                    <select
                      name="board"
                      value={schoolFormData.board}
                      onChange={handleInputChange}
                      disabled={!isAdmin}
                      className={`w-full rounded-xl border py-2 px-3 text-sm transition focus:outline-hidden ${
                        !isAdmin
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    >
                      <option value="Dhaka">Dhaka Board</option>
                      <option value="Chittagong">Chittagong Board</option>
                      <option value="Rajshahi">Rajshahi Board</option>
                      <option value="Sylhet">Sylhet Board</option>
                      <option value="Barisal">Barisal Board</option>
                      <option value="Jessore">Jessore Board</option>
                      <option value="Comilla">Comilla Board</option>
                      <option value="Dinajpur">Dinajpur Board</option>
                      <option value="Mymensingh">Mymensingh Board</option>
                      <option value="Madrasah">Madrasah Board</option>
                      <option value="Technical">Technical Board</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Official Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        name="phone"
                        value={schoolFormData.phone}
                        onChange={handleInputChange}
                        disabled={!isAdmin}
                        placeholder="e.g. 01712345678"
                        className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm font-mono transition focus:outline-hidden ${
                          !isAdmin
                            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Official Contact Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={schoolFormData.email}
                        onChange={handleInputChange}
                        disabled={!isAdmin}
                        placeholder="e.g. info@dihs.edu.bd"
                        className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm transition focus:outline-hidden ${
                          !isAdmin
                            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Campus Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="address"
                      value={schoolFormData.address}
                      onChange={handleInputChange}
                      disabled={!isAdmin}
                      placeholder="e.g. 12/A Motijheel Commercial Area"
                      className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm transition focus:outline-hidden ${
                        !isAdmin
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className={`w-full rounded-xl border py-2 px-3 text-sm transition focus:outline-hidden ${
                        !isAdmin
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
                      className={`w-full rounded-xl border py-2 px-3 text-sm transition focus:outline-hidden ${
                        !isAdmin
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
                      className={`w-full rounded-xl border py-2 px-3 text-sm transition focus:outline-hidden ${
                        !isAdmin
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
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-60 cursor-pointer"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              Monorepo Environment Parameters
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Detailed connectivity parameters between decoupled frontend and backend
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  API Base URL
                </span>
                <code className="bg-white px-2 py-1 rounded border border-slate-200 text-indigo-700 font-mono">
                  {import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}
                </code>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Key className="h-4 w-4 text-slate-400" />
                  Frontend Rendering Mode
                </span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  Static SPA (Vite + React, No SSR)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
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
      )}

      {/* Tab 4: Account & Security Profile */}
      {currentTab === 'account' && (
        <div className="space-y-6">
          {message && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3.5 text-sm border ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Account Info Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
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
                    className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Upload Picture</span>
                </button>
                {user?.profile_picture_url && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 shadow-2xs hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  {user?.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Assigned Tenant School
                </label>
                <div className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  {school?.name || `Tenant #${user?.school_id || 1}`} ({school?.code || 'FIS-001'})
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  RBAC Role
                </label>
                <div className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  {user?.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
