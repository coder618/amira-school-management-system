import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  BookmarkPlus,
  RotateCcw,
  MapPin,
  Barcode,
  Layers,
  Calendar,
  Building,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  RefreshCw,
} from 'lucide-react';
import { BookItem, BookIssueItem } from '../types';
import { libraryApi } from '../services/api';
import { ReturnBookModal } from '../features/library';

export const ViewBookPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<BookItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Return modal state
  const [selectedIssueForReturn, setSelectedIssueForReturn] = useState<BookIssueItem | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<BookItem>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  const fetchBook = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await libraryApi.getBook(parseInt(id, 10));
      setBook(res.data);
      setEditFormData({
        title: res.data.title,
        author: res.data.author,
        isbn: res.data.isbn || '',
        category: res.data.category || '',
        publisher: res.data.publisher || '',
        edition: res.data.edition || '',
        publication_year: res.data.publication_year || '',
        total_copies: res.data.total_copies,
        rack_number: res.data.rack_number || '',
        description: res.data.description || '',
        status: res.data.status,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load book details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      await libraryApi.updateBook(book.id, editFormData);
      setIsEditModalOpen(false);
      fetchBook();
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Failed to update book.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!book) return;
    if (!window.confirm(`Are you sure you want to delete "${book.title}"?`)) return;
    try {
      setDeleting(true);
      await libraryApi.deleteBook(book.id);
      navigate('/library/books');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete book.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 text-center">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading book details & borrowing history...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-3 bg-rose-50 text-rose-700 rounded-2xl max-w-md mx-auto text-xs">
          {error || 'Book not found.'}
        </div>
        <Link
          to="/library/books"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Books
        </Link>
      </div>
    );
  }

  const isAvailable = book.available_copies > 0 && book.status === 'available';
  const issues = book.book_issues || [];
  const activeIssues = issues.filter((i) => i.status === 'issued');

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Navigation bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/library/books"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {book.category || 'General'}
              </span>
              <span className="text-slate-300">•</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {isAvailable ? 'Available for Loan' : 'Out of Stock'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{book.title}</h1>
            <p className="text-xs text-slate-500">
              by <span className="font-semibold text-slate-700">{book.author}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAvailable ? (
            <Link
              to={`/library/issue?book_id=${book.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <BookmarkPlus className="h-4 w-4" />
              Issue This Book
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed"
            >
              <BookmarkPlus className="h-4 w-4" /> Out of Stock
            </button>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-xs transition-colors"
          >
            <Edit className="h-4 w-4 text-slate-500" />
            Edit Book
          </button>

          <button
            onClick={handleDeleteBook}
            disabled={deleting}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors"
            title="Delete Book"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Details + Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Book Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-22 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="space-y-1 flex-1">
                <h2 className="text-xl font-bold text-slate-900">{book.title}</h2>
                <div className="text-xs text-slate-600">
                  Author: <span className="font-semibold text-slate-800">{book.author}</span>
                </div>
                {book.description ? (
                  <p className="text-xs text-slate-600 pt-2 leading-relaxed whitespace-pre-line border-t border-slate-100 mt-2">
                    {book.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-100 mt-2">
                    No summary or description provided for this book.
                  </p>
                )}
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2">
                <Barcode className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">ISBN</span>
                  <span className="text-xs font-mono font-semibold text-slate-800">
                    {book.isbn || 'None'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-indigo-500 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">Shelf / Rack</span>
                  <span className="text-xs font-semibold text-indigo-700">
                    {book.rack_number || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">Publisher</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {book.publisher || 'Not specified'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">Edition</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {book.edition || '1st Edition'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">Year</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {book.publication_year || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">Status</span>
                  <span className="text-xs font-semibold capitalize text-slate-800">
                    {book.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inventory Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Inventory & Availability
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-600">Total Physical Copies</span>
                <span className="text-sm font-bold text-slate-900">{book.total_copies}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <span className="text-xs text-emerald-800 font-medium">Available in Stock</span>
                <span className="text-sm font-bold text-emerald-700">{book.available_copies}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <span className="text-xs text-amber-800 font-medium">Currently Borrowed</span>
                <span className="text-sm font-bold text-amber-700">
                  {book.borrowed_copies || Math.max(0, book.total_copies - book.available_copies)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Availability Ratio</span>
                <span className="font-semibold">
                  {book.total_copies > 0
                    ? Math.round((book.available_copies / book.total_copies) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${
                      book.total_copies > 0
                        ? Math.round((book.available_copies / book.total_copies) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Borrowing / Issue History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              Borrowing & Issue History
            </h3>
            <p className="text-xs text-slate-500">
              Track student checkouts, due dates, return statuses, and late return fees
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-100 text-amber-800">
              {activeIssues.length} Currently Checked Out
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
              {issues.length} Total Issues
            </span>
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No borrowing records found for this book yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((iss) => {
                  const student = iss.student;
                  const isIssued = iss.status === 'issued';
                  const isOverdue = iss.is_overdue || (isIssued && new Date(iss.due_date) < new Date());

                  return (
                    <tr key={iss.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-bold text-xs">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {student?.student_id || 'N/A'} {student?.roll_number ? `• Roll: ${student.roll_number}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-medium">
                          {student?.class_level?.name || 'Class N/A'}
                        </span>
                        {student?.section && (
                          <span className="text-slate-500 text-[11px]"> ({student.section.name})</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700">{iss.issue_date}</td>

                      <td className="py-3 px-4">
                        <span className={`font-medium ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                          {iss.due_date}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {iss.return_date || <span className="text-slate-400 italic">Pending return</span>}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {iss.status === 'returned' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="h-3 w-3" /> Returned
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                            <Clock className="h-3 w-3" /> Issued
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isIssued ? (
                          <button
                            onClick={() => setSelectedIssueForReturn(iss)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Return
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {selectedIssueForReturn && (
        <ReturnBookModal
          issue={selectedIssueForReturn}
          isOpen={!!selectedIssueForReturn}
          onClose={() => setSelectedIssueForReturn(null)}
          onSuccess={() => {
            fetchBook();
          }}
        />
      )}

      {/* Edit Book Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Book Information</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateBook} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Author</label>
                <input
                  type="text"
                  required
                  value={editFormData.author || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editFormData.category || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={editFormData.isbn || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, isbn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Copies</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editFormData.total_copies || 1}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        total_copies: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rack / Shelf</label>
                  <input
                    type="text"
                    value={editFormData.rack_number || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, rack_number: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editFormData.description || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBookPage;
