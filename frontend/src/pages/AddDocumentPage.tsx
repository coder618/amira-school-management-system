import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileCheck,
  User,
  GraduationCap,
  AlertCircle,
  Loader2,
  FolderOpen,
  X,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Building2,
} from 'lucide-react';
import { documentsApi, authApi } from '../services/api';
import { academicApi } from '../features/academic/api';
import { Student } from '../features/academic/types';
import { User as UserType } from '../types';

const DOCUMENT_TYPES = [
  { value: 'identification', label: 'Identity / NID / Birth Certificate' },
  { value: 'academic', label: 'Academic Transcript / Certificate' },
  { value: 'admission', label: 'Admission & Transfer Records' },
  { value: 'medical', label: 'Medical & Immunization Record' },
  { value: 'financial', label: 'Financial & Fee Receipts' },
  { value: 'general', label: 'General Institutional Document' },
  { value: 'other', label: 'Other Document' },
];

export const AddDocumentPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('identification');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'verified' | 'archived'>('active');

  // Association selection
  const [associationType, setAssociationType] = useState<'none' | 'student' | 'user'>('none');
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);

  // Lookups
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadLookups = async () => {
      setLoadingLookups(true);
      try {
        const [studentList, userList] = await Promise.all([
          academicApi.getStudents().catch(() => []),
          authApi.getUsers().catch(() => []),
        ]);
        setStudents(studentList);
        setUsers(userList);
      } finally {
        setLoadingLookups(false);
      }
    };

    loadLookups();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      if (!title) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setError(null);
      if (!title) {
        const cleanName = dropped.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }
    if (!file) {
      setError('Please choose a document file to upload via Media module.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await documentsApi.upload({
        title: title.trim(),
        document_type: documentType,
        description: description.trim() || undefined,
        status,
        file,
        student_id: associationType === 'student' ? selectedStudentId : undefined,
        user_id: associationType === 'user' ? selectedUserId : undefined,
      });

      setSuccess('Document successfully uploaded and archived in Media storage!');
      setTimeout(() => {
        navigate('/documents');
      }, 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.file?.[0] || 'Failed to upload document.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const p = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, p)).toFixed(1)} ${units[p]}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Back button and page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/documents"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documents List
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderOpen className="h-7 w-7 text-indigo-600" />
            Upload New Document
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store useful student, staff, or general school documents with automatic Media module storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Media Module Backed
          </span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-medium">{success} Redirecting to documents list...</span>
        </div>
      )}

      {/* Main Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          {/* Document Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Birth Registration Certificate, Grade 10 Marksheet, Transfer Certificate"
              className="w-full px-4 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium transition-all"
              required
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Document Category
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Verification Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              >
                <option value="active">Active (Standard)</option>
                <option value="verified">Verified Official</option>
                <option value="archived">Archived / Legacy</option>
              </select>
            </div>
          </div>

          {/* Association Segment */}
          <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/50 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="h-4 w-4 text-indigo-600" />
                  Target Association <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Point this document to a specific student or user profile, or keep as a general school document.
                </p>
              </div>

              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs shrink-0 self-start sm:self-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => setAssociationType('none')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    associationType === 'none'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" /> General
                </button>
                <button
                  type="button"
                  onClick={() => setAssociationType('student')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    associationType === 'student'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setAssociationType('user')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    associationType === 'user'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <User className="h-3.5 w-3.5" /> User
                </button>
              </div>
            </div>

            {associationType === 'student' && (
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Enrolled Student:
                </label>
                <select
                  value={selectedStudentId || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.student_id} - Roll: {s.roll_number}{s.class_level?.name ? ` | ${s.class_level.name}` : ''})
                    </option>
                  ))}
                </select>
                {loadingLookups && <span className="text-[10px] text-slate-400 mt-1 block">Loading students list...</span>}
              </div>
            )}

            {associationType === 'user' && (
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select System User:
                </label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  <option value="">-- Choose User Account --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - Role: {u.role || 'User'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {associationType === 'none' && (
              <p className="text-[11px] text-slate-500 italic">
                General institution document: visible to all school administrators and not linked to any single student.
              </p>
            )}
          </div>

          {/* File Upload Dropzone (Media Module) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              File Attachment <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : file
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
              }`}
            >
              <input
                type="file"
                id="page-doc-file-input"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif,.svg,.csv,.xls,.xlsx,.txt"
                className="hidden"
              />

              {file ? (
                <div className="max-w-md mx-auto flex items-center justify-between bg-white border border-emerald-200 rounded-xl p-3.5 shadow-xs">
                  <div className="flex items-center gap-3 overflow-hidden text-left">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="page-doc-file-input" className="cursor-pointer block">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shadow-2xs">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    <span className="text-indigo-600 hover:underline">Click to browse file</span> or drag and drop here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PDF, DOC, DOCX, JPG, PNG, WEBP, Excel, TXT (Maximum 25MB)
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-500 bg-slate-100">
                    <FileText className="h-3 w-3" />
                    Managed via Media Module
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Administrative Description & Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include issuance details, verification comments, registration reference number..."
              className="w-full px-4 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition-all resize-none"
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/documents"
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !file || !title.trim()}
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading via Media Module...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload & Save Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDocumentPage;
