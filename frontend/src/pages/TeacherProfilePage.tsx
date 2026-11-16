import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hrApi } from '../features/hr/api';
import { Teacher, TeacherFullSummaryResponse } from '../features/hr/types';
import { TeacherDetailTables } from '../features/hr/components/TeacherDetailTables';
import {
  Users,
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Calendar,
  ShieldCheck,
  Layers,
  Loader2,
  AlertCircle,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';

export const TeacherProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [summary, setSummary] = useState<TeacherFullSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

          const fetchTeacher = useCallback(async () => {
            if (!id) return;
            try {
              setLoading(true);
              setError(null);
              const summaryData = await hrApi.getTeacherFullSummary(Number(id));
              setSummary(summaryData);
              setTeacher(summaryData.teacher);
            } catch (err: unknown) {
              if (err && typeof err === 'object' && 'response' in err) {
                const ax = err as { response?: { status?: number; data?: { message?: string } } };
                if (ax.response?.status === 404) {
                  setError('Faculty member record not found in this school tenant.');
                } else {
                  setError(ax.response?.data?.message || 'Failed to load faculty profile.');
                }
              } else {
                setError('Failed to load faculty profile.');
              }
          } finally {
            setLoading(false);
          }
        }, [id]);

  useEffect(() => {
    fetchTeacher();
}, [fetchTeacher]);

const handleDelete = async () => {
  if (!teacher) return;
  const teacherName = teacher.user?.name || 'this faculty member';
  if (window.confirm(`Are you sure you want to permanently delete the profile for "${teacherName}"?`)) {
    try {
      await hrApi.deleteTeacher(teacher.id);
      navigate('/teachers');
    } catch (err: unknown) {
      alert('Failed to remove teacher record. Only administrators can delete faculty records.');
    }
  }
};

if (loading) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-slate-500 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <span className="text-sm font-medium">Loading faculty member profile...</span>
    </div>
  );
}

if (error || !teacher) {
  return (
    <div className="max-w-3xl mx-auto space-y-4 py-8">
      <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-6 text-sm text-rose-800">
        <AlertCircle className="h-6 w-6 shrink-0 text-rose-500" />
        <div className="flex-1">
          <h3 className="font-bold text-base">Error Loading Faculty Profile</h3>
          <p className="mt-1 text-xs text-rose-700">{error || 'Faculty member not found.'}</p>
        </div>
        <Link
          to="/teachers"
          className="rounded-xl bg-white border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100/50 transition-colors"
        >
          Back to Directory
        </Link>
      </div>
    </div>
  );
}

const avatarUrl = teacher.profile_picture_url || teacher.user?.profile_picture_url;
const teacherName = teacher.user?.name || 'Faculty Member';
const assignedSections = teacher.assignedSections || teacher.assigned_sections || [];

return (
  <div className="max-w-4xl mx-auto space-y-6 pb-12">
    {/* Top Header & Breadcrumbs */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
      <div>
        <Link
          to="/teachers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Faculty Directory</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          Faculty Profile Overview
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Academic credentials, department role, and class teacher assignments
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={fetchTeacher}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          title="Refresh faculty details"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        {isAdmin && (
          <>
            <Link
              to={`/teachers/${teacher.id}/edit`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 shadow-xs hover:bg-rose-50 transition-all cursor-pointer"
              title="Remove Faculty Record"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>

    {/* Profile Card Header */}
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Decorative banner */}
      <div className="h-28 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 px-6 relative" />

      <div className="px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-14 mb-4 text-center sm:text-left">
          {/* Avatar Photo */}
          <div
            onClick={() => avatarUrl && setSelectedImage(avatarUrl)}
            className={`relative group h-28 w-28 rounded-2xl overflow-hidden border-4 border-white shadow-md shrink-0 bg-indigo-50 ${avatarUrl ? 'cursor-pointer' : ''
              }`}
          >
            {avatarUrl ? (
              <>
                <img
                  src={avatarUrl}
                  alt={teacherName}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Eye className="h-5 w-5" />
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-indigo-700 text-3xl font-bold bg-indigo-100">
                {teacherName.charAt(0)}
              </div>
            )}
          </div>

          {/* Title & Badges */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">{teacherName}</h2>
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {teacher.employee_id}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3 w-3" />
                <span>Active Faculty</span>
              </span>
            </div>
            <p className="text-sm font-medium text-indigo-600 mt-0.5">{teacher.designation}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              Academic & Department
            </h3>

            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {teacher.department || 'General'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Designation:</span>
                <span className="font-semibold text-slate-900">{teacher.designation}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Qualification:</span>
                <span className="font-semibold text-slate-900">
                  {teacher.qualification || 'Not Specified'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Joining Date:</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{teacher.joining_date || 'N/A'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Contact & System Account */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              Contact & Portal Account
            </h3>

            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email Address:</span>
                <a
                  href={`mailto:${teacher.user?.email}`}
                  className="font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{teacher.user?.email || 'N/A'}</span>
                </a>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mobile Phone:</span>
                {teacher.phone_number ? (
                  <a
                    href={`tel:${teacher.phone_number}`}
                    className="font-mono font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{teacher.phone_number}</span>
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Not provided</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">System Role:</span>
                <span className="font-semibold text-slate-800 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                  {teacher.user?.role || 'Teacher'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account Status:</span>
                <span className="font-semibold text-emerald-700">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Classes / Sections */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-indigo-600" />
            Class Teacher & Section Assignments
          </h3>

          {assignedSections.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 text-center">
              This faculty member is not currently assigned as a class teacher to any section.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {assignedSections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3 shadow-2xs"
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {sec.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      Section: {sec.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {sec.class_level?.name || (sec as any).classLevel?.name || 'Class Level'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Faculty Attendance & Given Student Notes Tables */}
    {summary && (
      <TeacherDetailTables
        attendance={summary.attendance}
        teacherNotes={summary.teacher_notes}
        teacherName={teacherName}
        onRefresh={fetchTeacher}
      />
    )}

    {/* Lightbox Modal for Photo Zoom */}
    {selectedImage && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
        onClick={() => setSelectedImage(null)}
      >
        <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={selectedImage} alt="Teacher Large" className="w-full max-h-[80vh] object-contain" />
          <div className="p-4 bg-white text-center font-bold text-slate-900 text-sm">
            {teacherName} — {teacher.designation}
          </div>
        </div>
      </div>
    )}
  </div>
);
};
