import React, { useState } from 'react';
import { useTeachers } from '../hooks/useTeachers';
import { TeacherModal } from './TeacherModal';
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Calendar,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const TeacherList: React.FC = () => {
  const {
    teachers,
    loading,
    error,
    search,
    setSearch,
    department,
    setDepartment,
    addTeacher,
    removeTeacher,
  } = useTeachers();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-600" />
            Faculty & HR Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Teaching staff directory, academic qualifications, and class teacher assignments
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Recruit New Faculty</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by teacher name, ID, designation, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
          >
            <option value="">All Departments</option>
            <option value="Science">Science</option>
            <option value="Humanities">Humanities</option>
            <option value="Commerce">Commerce</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Language">Language</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Grid of Teachers */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Fetching faculty roster...</span>
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">No faculty members found</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the department filter or recruit a new teacher.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg">
                      {t.user?.name ? t.user.name.charAt(0) : 'T'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {t.user?.name || 'Faculty Member'}
                      </h3>
                      <span className="text-xs font-medium text-indigo-600 block">
                        {t.designation}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    {t.employee_id}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Dept: <strong>{t.department || 'General'}</strong></span>
                  </div>

                  {t.qualification && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.qualification}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.user?.email}</span>
                  </div>

                  {t.phone_number && (
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{t.phone_number}</span>
                    </div>
                  )}

                  {t.joining_date && (
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>Joined: {t.joining_date}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                  Active Faculty
                </span>
                <button
                  type="button"
                  onClick={() => removeTeacher(t.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove Teacher"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <TeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={addTeacher}
      />
    </div>
  );
};

