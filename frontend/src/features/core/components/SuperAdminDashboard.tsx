import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSchools } from '../hooks/useSchools';
import { RegisterSchoolModal } from './RegisterSchoolModal';
import { CreateSchoolResponse } from '../types';
import {
  ShieldCheck,
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  MapPin,
  Calendar,
  Layers,
  Globe,
  Loader2,
  KeyRound,
  Cpu,
} from 'lucide-react';
import { MultiTenantDeviceManagement } from '../../attendance';

export const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { schools, totalCount, loading, error, search, setSearch, addSchool } = useSchools();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [lastOnboarded, setLastOnboarded] = useState<CreateSchoolResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'schools' | 'devices'>('schools');

  // Role Gate check: visible only when logged in as a SuperAdmin
  const isSuperAdmin = user?.role === 'SuperAdmin';

  if (!isSuperAdmin) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center max-w-2xl mx-auto my-12 shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mx-auto mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Restricted SuperAdmin Area</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          The Global School Onboarding & Multi-Tenant Partitioning Console is restricted to users with the{' '}
          <span className="font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">SuperAdmin</span> role.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Your current account role is: <strong>{user?.role || 'Guest'}</strong> ({user?.email})
        </p>
        <div className="mt-6 p-3 rounded-lg bg-white border border-rose-200 text-xs text-slate-600">
          To test SuperAdmin features, sign out and sign in with:{' '}
          <span className="font-mono font-bold text-indigo-700">superadmin@school.com</span> /{' '}
          <span className="font-mono font-bold text-indigo-700">password</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SuperAdmin Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-linear-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20 border border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300 border border-indigo-400/30">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              SaaS Multi-Tenant Root Controller
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            SuperAdmin School Onboarding Dashboard
          </h1>
          <p className="mt-1 text-slate-300 text-sm max-w-2xl">
            Provision isolated institutional tenants across Bangladesh, configure board boundaries, and automatically generate Headmaster administrative accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsRegisterModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:shadow-indigo-500/40 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="h-5 w-5" />
          <span>Register New School</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('schools')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'schools'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Institutions Directory ({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('devices')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'devices'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-600" />
          <span>Multi-Tenant Attendance Devices</span>
        </button>
      </div>

      {activeTab === 'devices' ? (
        <MultiTenantDeviceManagement />
      ) : (
        <>
          {/* Success Notification for newly onboarded school */}
      {lastOnboarded && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-emerald-900">
                School Successfully Onboarded & Partitioned
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                {lastOnboarded.message}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono bg-white p-3 rounded-lg border border-emerald-200">
                <div>
                  <span className="text-slate-400 block font-sans">School Code:</span>
                  <span className="font-bold text-slate-800">{lastOnboarded.school.code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Headmaster Account:</span>
                  <span className="font-bold text-indigo-700">{lastOnboarded.headmaster.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Role:</span>
                  <span className="font-bold text-emerald-700">{lastOnboarded.headmaster.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Academic Year:</span>
                  <span className="font-bold text-slate-800">{lastOnboarded.academic_year.title}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastOnboarded(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Onboarded Schools
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{totalCount}</div>
          <p className="text-xs text-slate-400 mt-0.5">Isolated tenant instances</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tenant Architecture
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-lg font-bold text-emerald-700">100% Isolated</div>
          <p className="text-xs text-slate-400 mt-0.5">Scaped by school_id & year</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Education Boards
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Globe className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {new Set(schools.map((s) => s.board)).size}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Dhaka, Chittagong, etc.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Administrator Accounts
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <KeyRound className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {schools.reduce((acc, s) => acc + (s.users_count || 1), 0)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Headmasters & Staff</p>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by school name, code, EIIN, or Headmaster..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
            />
          </div>
          <span className="text-xs font-medium text-slate-500">
            Showing {schools.length} of {totalCount} Schools
          </span>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Fetching multi-tenant school registry...</span>
          </div>
        ) : schools.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No schools found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Register New School&quot; above to onboard your first educational institution.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">School & Code</th>
                  <th className="py-3 px-4">EIIN & Board</th>
                  <th className="py-3 px-4">Campus Address</th>
                  <th className="py-3 px-4">Headmaster / Admin Account</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map((school) => {
                  const headmaster = school.users && school.users.length > 0 ? school.users[0] : null;
                  return (
                    <tr key={school.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* School & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{school.name}</div>
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {school.code}
                        </span>
                      </td>

                      {/* EIIN & Board */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          Board: <span className="font-bold">{school.board}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          EIIN: {school.eiin || 'N/A'}
                        </span>
                      </td>

                      {/* Campus Address */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{school.address}</span>
                        </div>
                      </td>

                      {/* Headmaster Credentials */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {headmaster?.name || 'Administrator'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{headmaster?.email || school.email || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Academic Year */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-700">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {school.current_academic_year?.title || '2026-2027'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          Active Tenant
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* Registration Modal */}
      <RegisterSchoolModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={addSchool}
        onSuccess={(data) => setLastOnboarded(data)}
      />
    </div>
  );
};

