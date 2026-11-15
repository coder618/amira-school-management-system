import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Trash2,
  FileText,
  User,
  GraduationCap,
  CheckCircle2,
  Clock,
  Archive,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { DocumentItem } from '../../../types';
import { documentsApi } from '../../../services/api';

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const isImage = document.mime_type?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(document.file_name || '') ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(document.file_url || '');

  const isPdf = document.mime_type === 'application/pdf' ||
    /\.pdf$/i.test(document.file_name || '') ||
    /\.pdf$/i.test(document.file_url || '');

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete document "${document.title}" and remove the underlying file from Media storage?`)) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await documentsApi.delete(document.id);
      onDeleted(document.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete document.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    // Open download endpoint or media url
    if (document.file_url) {
      const downloadUrl = documentsApi.getDownloadUrl(document.id);
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 truncate max-w-md">{document.title}</h3>
              <p className="text-xs text-slate-500 capitalize">{document.document_type} Document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Visual Preview Box */}
          <div className="bg-slate-950/5 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px]">
            {isImage && document.file_url ? (
              <img
                src={document.file_url}
                alt={document.title}
                className="max-h-72 max-w-full rounded-xl object-contain shadow-xs border border-slate-200 bg-white"
              />
            ) : isPdf && document.file_url ? (
              <div className="w-full flex flex-col items-center gap-3 py-6">
                <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800">{document.file_name || 'Document.pdf'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">PDF Document • {document.formatted_file_size}</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open PDF in New Tab
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{document.file_name || document.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{document.formatted_file_size} • {document.mime_type || 'File'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Association Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Associated User / Student
              </span>
              {document.student ? (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {document.student.first_name} {document.student.last_name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ID: {document.student.student_id} • Roll: {document.student.roll_number}
                      {document.student.class_level?.name ? ` • ${document.student.class_level.name}` : ''}
                    </p>
                  </div>
                </div>
              ) : document.user ? (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{document.user.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{document.user.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">General Institutional Document (No specific user assigned)</p>
              )}
            </div>

            <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                  document.status === 'verified'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : document.status === 'archived'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  {document.status === 'verified' && <CheckCircle2 className="h-3 w-3" />}
                  {document.status === 'archived' && <Archive className="h-3 w-3" />}
                  {document.status === 'active' && <Clock className="h-3 w-3" />}
                  {document.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Size:</span>
                <span className="font-semibold text-slate-800">{document.formatted_file_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Upload Date:</span>
                <span className="font-medium text-slate-700">
                  {new Date(document.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {document.uploader && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Uploaded By:</span>
                  <span className="font-medium text-slate-700">{document.uploader.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <div className="bg-slate-50/40 border border-slate-200 rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Administrative Notes
              </span>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{document.description}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete Document
          </button>

          <div className="flex items-center gap-2">
            {document.file_url && (
              <a
                href={document.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors border border-slate-200 bg-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open File
              </a>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-200"
            >
              <Download className="h-3.5 w-3.5" />
              Download via Media
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
