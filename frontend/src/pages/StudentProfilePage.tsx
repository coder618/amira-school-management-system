import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { academicApi } from '../features/academic/api';
import { Student } from '../features/academic/types';
import {
  ArrowLeft,
  Edit,
  Trash2,
  GraduationCap,
  Users,
  Phone,
  MapPin,
  Calendar,
  Sun,
  Moon,
  Camera,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
  Printer,
  Sparkles,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await academicApi.getStudentById(Number(id));
        setStudent(data);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const ax = err as { response?: { status?: number; data?: { message?: string } } };
          if (ax.response?.status === 404) {
            setError('Student record not found in this school tenant.');
          } else {
            setError(ax.response?.data?.message || 'Failed to load student profile.');
          }
        } else {
          setError('Failed to load student profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleDelete = async () => {
    if (!student) return;
    if (window.confirm(`Are you sure you want to remove ${student.first_name} ${student.last_name || ''}? This will also delete their login account.`)) {
      try {
        await academicApi.deleteStudent(student.id);
        navigate('/students');
      } catch (err) {
        alert('Failed to delete student.');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Loading student profile...</span>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-rose-900">Student Profile Error</h2>
          <p className="text-sm text-rose-700">{error || 'Student not found.'}</p>
          <div className="pt-2">
            <Link
              to="/students"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-rose-200 text-sm font-semibold text-rose-800 hover:bg-rose-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Student Directory</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fullName = `${student.first_name} ${student.last_name || ''}`.trim();
  const initials = `${student.first_name.charAt(0)}${student.last_name ? student.last_name.charAt(0) : ''}`;

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-4 space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/students"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="Back to Students Directory"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{fullName}</h1>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${
                  student.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {student.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Student ID: {student.student_id} • Roll: {student.roll_number}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Print Profile Document"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <Link
            to={`/students/${student.id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
            title="Delete Student"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="h-28 bg-linear-to-r from-indigo-700 via-indigo-600 to-sky-600 relative">
          <div className="absolute right-4 top-4 text-white/20">
            <GraduationCap className="h-20 w-20" />
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            <div className="relative group">
              {student.student_image_url ? (
                <img
                  src={student.student_image_url}
                  alt={fullName}
                  onClick={() => setSelectedImage({ url: student.student_image_url!, title: `${fullName} - Student Photo` })}
                  className="h-28 w-28 rounded-2xl object-cover border-4 border-white shadow-lg bg-white cursor-pointer hover:opacity-95 transition-opacity"
                />
              ) : (
                <div className="h-28 w-28 rounded-2xl bg-indigo-50 border-4 border-white shadow-lg flex items-center justify-center text-indigo-700 font-bold text-3xl">
                  {initials}
                </div>
              )}
              {student.student_image_url && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                  {student.student_id}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600">
                {student.class_level?.name || 'Class Grade'} • Section {student.section?.name || 'A'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Roll: {student.roll_number}
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                  {student.shift?.name === 'Morning' ? (
                    <Sun className="h-3 w-3 text-amber-500" />
                  ) : (
                    <Moon className="h-3 w-3 text-indigo-500" />
                  )}
                  <span>{student.shift?.name || 'Day'} Shift</span>
                </span>
                {student.enrollment_date && (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>Enrolled: {student.enrollment_date}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-xs">
            {student.user && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 px-3 flex items-center gap-2 text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Portal Account Active</span>
                  <span className="text-[11px] text-emerald-700 font-mono block">{student.user.email}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Academic & Personal Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Academic Enrollment Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
                Academic SIS Details
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {student.school?.name || 'Govt School'}
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Class Level</span>
                <p className="font-bold text-slate-900">{student.class_level?.name || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Section</span>
                <p className="font-bold text-slate-900">
                  {student.section?.name || 'A'}
                  {student.section?.capacity ? ` (Capacity: ${student.section.capacity})` : ''}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Class Roll</span>
                <p className="font-bold font-mono text-indigo-700">{student.roll_number}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Academic Shift</span>
                <p className="font-medium text-slate-800">{student.shift?.name || 'Day'} Shift</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Academic Year</span>
                <p className="font-medium text-slate-800">{student.academic_year?.title || 'Current Academic Session'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Enrollment Date</span>
                <p className="font-medium text-slate-800">{student.enrollment_date || 'Standard Academic Term'}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Personal & Demographic Information
              </h3>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Name</span>
                <p className="font-bold text-slate-900">{fullName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gender</span>
                <p className="font-medium text-slate-800">{student.gender}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date of Birth</span>
                <p className="font-medium text-slate-800">{student.date_of_birth || 'Not Specified'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Registered Email</span>
                <p className="font-mono text-slate-800">{student.email || 'None'}</p>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Residential Address</span>
                <p className="font-medium text-slate-800 flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{student.address || 'Address record not provided'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Module Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
            <Link
              to="/attendance"
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Attendance</span>
                <span className="text-[11px] text-slate-500">Daily SIS logs</span>
              </div>
            </Link>

            <Link
              to="/finance/invoices"
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Finance Fees</span>
                <span className="text-[11px] text-slate-500">Invoices & dues</span>
              </div>
            </Link>

            <Link
              to="/exams/results"
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Exams & Marks</span>
                <span className="text-[11px] text-slate-500">Results & GPA</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column: Parents & Attached Photos (Media Module) */}
        <div className="space-y-6">
          {/* Guardian / Parents Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Phone className="h-4 w-4 text-indigo-600" />
                Parents & Guardian Contact
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Father's Name</span>
                <p className="font-bold text-slate-900">{student.father_name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mother's Name</span>
                <p className="font-bold text-slate-900">{student.mother_name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Emergency Contact (BD)</span>
                <a
                  href={`tel:${student.phone_number}`}
                  className="font-mono font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-2 text-base"
                >
                  <Phone className="h-4 w-4" />
                  <span>{student.phone_number}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Attached Media & Photos Gallery (Cloudflare R2 / Media Module) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="h-4 w-4 text-indigo-600" />
                Stored Photos (Media)
              </h3>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Tenant Scoped
              </span>
            </div>

            <div className="p-6 space-y-4">
              {/* Student Photo */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                {student.student_image_url ? (
                  <img
                    src={student.student_image_url}
                    alt="Student Photo"
                    onClick={() => setSelectedImage({ url: student.student_image_url!, title: `${fullName} - Student Photo` })}
                    className="h-16 w-16 rounded-xl object-cover border border-slate-200 bg-white cursor-pointer hover:opacity-90"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">Student ID Photo</span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {student.student_image ? 'Saved in backend media' : 'No photo uploaded'}
                  </span>
                  {student.student_image_url && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage({ url: student.student_image_url!, title: `${fullName} - Student Photo` })}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline mt-0.5 inline-block cursor-pointer"
                    >
                      View full size
                    </button>
                  )}
                </div>
              </div>

              {/* Father / Parent Photo */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                {student.parent_image_url ? (
                  <img
                    src={student.parent_image_url}
                    alt="Parent Photo"
                    onClick={() => setSelectedImage({ url: student.parent_image_url!, title: `${student.father_name} - Father Photo` })}
                    className="h-16 w-16 rounded-xl object-cover border border-slate-200 bg-white cursor-pointer hover:opacity-90"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400">
                    <Users className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">Father / Guardian Photo</span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {student.parent_image || student.father_image ? 'Saved in backend media' : 'No photo uploaded'}
                  </span>
                  {student.parent_image_url && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage({ url: student.parent_image_url!, title: `${student.father_name} - Father Photo` })}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline mt-0.5 inline-block cursor-pointer"
                    >
                      View full size
                    </button>
                  )}
                </div>
              </div>

              {/* Mother Photo */}
              {student.mother_image_url && (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                  <img
                    src={student.mother_image_url}
                    alt="Mother Photo"
                    onClick={() => setSelectedImage({ url: student.mother_image_url!, title: `${student.mother_name} - Mother Photo` })}
                    className="h-16 w-16 rounded-xl object-cover border border-slate-200 bg-white cursor-pointer hover:opacity-90"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate">Mother Photo</span>
                    <span className="text-[11px] text-slate-500 block truncate">Saved in backend media</span>
                    <button
                      type="button"
                      onClick={() => setSelectedImage({ url: student.mother_image_url!, title: `${student.mother_name} - Mother Photo` })}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline mt-0.5 inline-block cursor-pointer"
                    >
                      View full size
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">{selectedImage.title}</span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-900/5 max-h-[70vh]">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <a
                href={selectedImage.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Original</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
