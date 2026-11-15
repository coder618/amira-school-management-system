import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  Search,
  RefreshCw,
  Eye,
  Download,
  Trash2,
  FolderArchive,
  User,
  GraduationCap,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { documentsApi } from '../../../services/api';
import { DocumentItem, DocumentStats } from '../../../types';
import { UploadDocumentModal } from './UploadDocumentModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'identification', label: 'Identity / NID' },
  { value: 'academic', label: 'Academic & Transcripts' },
  { value: 'admission', label: 'Admission & Transfer' },
  { value: 'medical', label: 'Medical & Immunization' },
  { value: 'financial', label: 'Financial Receipts' },
  { value: 'general', label: 'General Institution' },
];

export const DocumentListView: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  }>({
    page: 1,
    perPage: 12,
    total: 0,
    lastPage: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [associationFilter, setAssociationFilter] = useState<'all' | 'user_attached' | 'general'>('all');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, statsRes] = await Promise.all([
        documentsApi.getAll({
          search: search.trim() || undefined,
          document_type: selectedCategory !== 'all' ? selectedCategory : undefined,
          page: pagination.page,
          per_page: pagination.perPage,
        }),
        documentsApi.getStats().catch(() => null),
      ]);

      let docs = docRes.data || [];
      if (associationFilter === 'user_attached') {
        docs = docs.filter((d) => d.user_id || d.student_id);
      } else if (associationFilter === 'general') {
        docs = docs.filter((d) => !d.user_id && !d.student_id);
      }

      setDocuments(docs);
      setPagination((prev) => ({
        ...prev,
        total: docRes.total,
        lastPage: docRes.last_page,
      }));

      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load documents list.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, associationFilter, pagination.page, pagination.perPage]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDocumentUploaded = () => {
    fetchDocuments();
  };

  const handleDocumentDeleted = (deletedId: number) => {
    setDocuments((prev) => prev.filter((d) => d.id !== deletedId));
    if (stats) {
      setStats({
        ...stats,
        total_documents: Math.max(0, stats.total_documents - 1),
      });
    }
  };

  const getFileIcon = (mimeType?: string | null, fileName?: string | null) => {
    if (mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName || '')) {
      return <ImageIcon className="h-5 w-5 text-emerald-600" />;
    }
    if (mimeType === 'application/pdf' || /\.pdf$/i.test(fileName || '')) {
      return <FileText className="h-5 w-5 text-rose-600" />;
    }
    if (/\.(xls|xlsx|csv)$/i.test(fileName || '')) {
      return <FileSpreadsheet className="h-5 w-5 text-teal-600" />;
    }
    return <FileText className="h-5 w-5 text-indigo-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <FolderArchive className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Documents</h1>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Media Module Backed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely store, organize, and retrieve user and student documents across the institution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDocuments()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
            title="Refresh documents"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-indigo-500/20 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Documents</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_documents ?? pagination.total}</p>
            <span className="text-[11px] text-slate-500">In institutional registry</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <FolderArchive className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">User / Student Linked</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats?.user_documents_count ?? '-'}</p>
            <span className="text-[11px] text-slate-500">Attached to specific profiles</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">General Documents</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.unassigned_documents_count ?? '-'}</p>
            <span className="text-[11px] text-slate-500">School-wide files</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Media Storage Used</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.formatted_total_size ?? '0 B'}</p>
            <span className="text-[11px] text-slate-500">Via tenant Media storage</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <HardDrive className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            placeholder="Search by title, description, user name, student roll or ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium"
          />
        </div>

        {/* Category & Association Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={associationFilter}
            onChange={(e) => {
              setAssociationFilter(e.target.value as any);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
          >
            <option value="all">All Associations</option>
            <option value="user_attached">User/Student Linked Only</option>
            <option value="general">General Institution Only</option>
          </select>
        </div>
      </div>

      {/* Documents Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading institutional documents...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-600 p-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-500" />
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={() => fetchDocuments()}
              className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="h-16 w-16 mx-auto mb-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center">
              <FolderArchive className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No documents found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || selectedCategory !== 'all'
                ? 'Try adjusting your search criteria or category filter.'
                : 'Upload identity proofs, birth certificates, academic records, and institutional files via the Media module.'}
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Document</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Associated With</th>
                  <th className="py-3.5 px-4">Size & Format</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Uploaded</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => setPreviewDocument(doc)}
                  >
                    {/* Document Title & Icon */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                          {getFileIcon(doc.mime_type, doc.file_name)}
                        </div>
                        <div className="truncate max-w-xs">
                          <p className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate font-mono">
                            {doc.file_name || 'Attached file'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {doc.document_type}
                      </span>
                    </td>

                    {/* Associated With (User / Student) */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {doc.student ? (
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                            <GraduationCap className="h-3.5 w-3.5" />
                          </div>
                          <div className="truncate max-w-[170px]">
                            <p className="font-semibold text-slate-800 truncate">
                              {doc.student.first_name} {doc.student.last_name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Roll: {doc.student.roll_number} {doc.student.class_level?.name ? `• ${doc.student.class_level.name}` : ''}
                            </span>
                          </div>
                        </div>
                      ) : doc.user ? (
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div className="truncate max-w-[170px]">
                            <p className="font-semibold text-slate-800 truncate">{doc.user.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">{doc.user.email}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">General Document</span>
                      )}
                    </td>

                    {/* Size & Format */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      <span>{doc.formatted_file_size || '0 B'}</span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                          doc.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : doc.status === 'archived'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {doc.status === 'verified' && <CheckCircle2 className="h-3 w-3" />}
                        {doc.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Upload Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(doc.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewDocument(doc)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Preview details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <a
                          href={documentsApi.getDownloadUrl(doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Download via Media module"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete document "${doc.title}"?`)) {
                              await documentsApi.delete(doc.id);
                              handleDocumentDeleted(doc.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.lastPage > 1 && (
          <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {pagination.page} of {pagination.lastPage} ({pagination.total} documents)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.lastPage}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleDocumentUploaded}
      />

      {/* Preview Modal */}
      <DocumentPreviewModal
        document={previewDocument}
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        onDeleted={handleDocumentDeleted}
      />
    </div>
  );
};
