import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileCheck,
  User,
  GraduationCap,
  AlertCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { documentsApi, authApi } from '../../../services/api';
import { academicApi } from '../../academic/api';
import { Student } from '../../academic/types';
import { DocumentItem, User as UserType } from '../../../types';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: DocumentItem) => void;
  initialStudentId?: number;
  initialUserId?: number;
}

const DOCUMENT_TYPES = [
  { value: 'identification', label: 'Identity / NID / Birth Cert' },
  { value: 'academic', label: 'Academic Transcript / Certificate' },
  { value: 'admission', label: 'Admission & Transfer Records' },
  { value: 'medical', label: 'Medical & Immunization' },
  { value: 'financial', label: 'Financial & Fee Receipts' },
  { value: 'general', label: 'General Institution Document' },
  { value: 'other', label: 'Other Document' },
];

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStudentId,
  initialUserId,
}) => {
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('identification');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'verified' | 'archived'>('active');
  
  // Association selection
  const [associationType, setAssociationType] = useState<'none' | 'student' | 'user'>(
    initialStudentId ? 'student' : initialUserId ? 'user' : 'none'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(initialStudentId);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(initialUserId);

  // Lists for dropdown
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialStudentId) {
      setAssociationType('student');
      setSelectedStudentId(initialStudentId);
    } else if (initialUserId) {
      setAssociationType('user');
      setSelectedUserId(initialUserId);
    }

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
  }, [isOpen, initialStudentId, initialUserId]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      if (!title) {
        // Auto-fill title from clean filename
        const cleanName = e.target.files[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      if (!title) {
        const cleanName = e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
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
      setError('Please select a document file to upload via Media module.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await documentsApi.upload({
        title: title.trim(),
        document_type: documentType,
        description: description.trim() || undefined,
        status,
        file,
        student_id: associationType === 'student' ? selectedStudentId : undefined,
        user_id: associationType === 'user' ? selectedUserId : undefined,
      });

      onSuccess(res.data);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      setError(null);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload New Document</h3>
              <p className="text-xs text-slate-500">Files are safely archived through tenant Media module storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Birth Registration Certificate, Grade 10 Marksheet"
              className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-900"
              required
            />
          </div>

          {/* Document Type & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Category</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Verification Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
              >
                <option value="active">Active (Standard)</option>
                <option value="verified">Verified Official</option>
                <option value="archived">Archived / Legacy</option>
              </select>
            </div>
          </div>

          {/* User / Student Pointing (Optional) */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                Point to User / Student <span className="text-slate-400 font-normal">(Optional)</span>
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAssociationType('none')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    associationType === 'none' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setAssociationType('student')}
                  className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    associationType === 'student' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="h-3 w-3" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setAssociationType('user')}
                  className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    associationType === 'user' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="h-3 w-3" /> User Account
                </button>
              </div>
            </div>

            {associationType === 'student' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Enrolled Student:
                </label>
                <select
                  value={selectedStudentId || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.student_id} - Roll: {s.roll_number}{s.class_level?.name ? ` | ${s.class_level.name}` : ''})
                    </option>
                  ))}
                </select>
                {loadingLookups && <span className="text-[10px] text-slate-400 mt-1 block">Loading enrolled student list...</span>}
              </div>
            )}

            {associationType === 'user' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select System User:
                </label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
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
                This document will be saved as a school-wide general institutional document accessible to administrators.
              </p>
            )}
          </div>

          {/* File Upload Area (via Media Module) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              File Attachment <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : file
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
              }`}
            >
              <input
                type="file"
                id="doc-file-input"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif,.svg,.csv,.xls,.xlsx,.txt"
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl p-3">
                  <div className="flex items-center gap-3 overflow-hidden text-left">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                      <p className="text-[11px] text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="doc-file-input" className="cursor-pointer block">
                  <div className="mx-auto h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    <span className="text-indigo-600 hover:underline">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PDF, DOC, DOCX, JPG, PNG, WEBP (Max 25MB)
                  </p>
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide administrative notes, issuance date, verification details..."
              className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file || !title.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading via Media...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
