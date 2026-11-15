import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTeachers } from '../hooks/useTeachers';
import {
  Users,
  UserPlus,
  Trash2,
  Edit,
  Eye,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Calendar,
  Search,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const TeacherList: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const {
    teachers,
    loading,
    error,
    search,
    setSearch,
    department,
    setDepartment,
    removeTeacher,
  } = useTeachers();

  const handleDelete = async (id: number, name: string) => {
    if (!isAdmin) {
      alert('Only administrators can remove teacher profiles.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove teacher profile "${name}"?`)) {
      try {
        await removeTeacher(id);
      } catch {
        alert('Failed to delete teacher record. Only admin role users can perform this operation.');
      }
    }
  };

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

        {isAdmin && (
          <Link
            to="/teachers/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Teacher</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter, Search & View Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
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
            <option value="ICT">ICT</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Teachers Roster Presentation (List View Only) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Fetching faculty roster...</span>
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">No faculty members found</p>
          <p className="text-xs text-slate-400 mt-1">
            Try resetting the search or department filter{isAdmin ? ', or click "Add New Teacher" above.' : '.'}
          </p>
        </div>
      ) : (
        /* TABLE LIST VIEW ONLY */
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Faculty & ID</th>
                  <th className="py-3 px-4">Designation & Dept</th>
                  <th className="py-3 px-4">Academic Qualification</th>
                  <th className="py-3 px-4">Contact (BD)</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => {
                  const avatarUrl = t.profile_picture_url || t.user?.profile_picture_url;
                  const teacherName = t.user?.name || 'Faculty Member';
                  const initials = teacherName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Faculty Photo & Name & ID */}
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/teachers/${t.id}`}
                          className="flex items-center gap-3 group"
                          title="View Faculty Profile"
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={teacherName}
                              className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0 group-hover:border-indigo-400 transition-colors"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs shrink-0 group-hover:bg-indigo-100 transition-colors">
                              {initials || 'T'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                              {teacherName}
                            </div>
                            <span className="inline-block mt-0.5 font-mono text-[11px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              {t.employee_id}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Designation & Department */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{t.designation}</div>
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                          <Briefcase className="h-3 w-3" />
                          <span>{t.department || 'General'}</span>
                        </span>
                      </td>

                      {/* Qualification */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {t.qualification ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{t.qualification}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">—</span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 text-xs space-y-1">
                        {t.phone_number ? (
                          <div className="flex items-center gap-1.5 font-mono text-slate-700">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{t.phone_number}</span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{t.user?.email}</span>
                        </div>
                      </td>

                      {/* Joining Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {t.joining_date ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{t.joining_date}</span>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Active</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <Link
                            to={`/teachers/${t.id}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="View Faculty Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {isAdmin && (
                            <>
                              <Link
                                to={`/teachers/${t.id}/edit`}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Edit Faculty Profile"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDelete(t.id, teacherName)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove Faculty Record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
