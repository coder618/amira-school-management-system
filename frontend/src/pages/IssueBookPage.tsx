import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  BookmarkPlus,
  ArrowLeft,
  BookOpen,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Search,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { BookItem } from '../types';
import { libraryApi, studentsApi } from '../services/api';

export const IssueBookPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBookId = searchParams.get('book_id');
  const initialStudentId = searchParams.get('student_id');

  // Books list & selection
  const [books, setBooks] = useState<BookItem[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(
    initialBookId ? parseInt(initialBookId, 10) : null
  );
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [bookSearch, setBookSearch] = useState<string>('');

  // Students list & selection
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    initialStudentId ? parseInt(initialStudentId, 10) : null
  );
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const [issueDate, setIssueDate] = useState<string>(todayStr);

  // Default due date: +14 days
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);

  // Notes
  const [notes, setNotes] = useState<string>('');

  // Status & loading
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [booksRes, studentsRes] = await Promise.all([
          libraryApi.getBooks({ per_page: 100 }),
          studentsApi.getAll(),
        ]);

        const allBooks = booksRes.data || [];
        setBooks(allBooks);
        setStudents(studentsRes || []);

        if (initialBookId) {
          const matchedBook = allBooks.find((b) => b.id === parseInt(initialBookId, 10));
          if (matchedBook) {
            setSelectedBookId(matchedBook.id);
            setSelectedBook(matchedBook);
          }
        }

        if (initialStudentId) {
          const matchedStudent = (studentsRes || []).find(
            (s: any) => s.id === parseInt(initialStudentId, 10)
          );
          if (matchedStudent) {
            setSelectedStudentId(matchedStudent.id);
            setSelectedStudent(matchedStudent);
          }
        }
      } catch (err: any) {
        console.error('Error fetching initial data', err);
        setError('Failed to load books and students list.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [initialBookId, initialStudentId]);

  const handleBookSelect = (bId: number) => {
    setSelectedBookId(bId);
    const b = books.find((x) => x.id === bId) || null;
    setSelectedBook(b);
  };

  const handleStudentSelect = (sId: number) => {
    setSelectedStudentId(sId);
    const s = students.find((x) => x.id === sId) || null;
    setSelectedStudent(s);
  };

  const setDueDaysPreset = (days: number) => {
    const base = new Date(issueDate || todayStr);
    base.setDate(base.getDate() + days);
    setDueDate(base.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!selectedBookId) {
      setError('Please select a book to issue.');
      return;
    }
    if (!selectedStudentId) {
      setError('Please select a student borrower.');
      return;
    }
    if (selectedBook && selectedBook.available_copies < 1) {
      setError('Selected book is out of stock and cannot be issued.');
      return;
    }
    if (!dueDate || dueDate < issueDate) {
      setError('Due date must be on or after the issue date.');
      return;
    }

    try {
      setSubmitting(true);
      await libraryApi.issueBook({
        book_id: selectedBookId,
        student_id: selectedStudentId,
        issue_date: issueDate,
        due_date: dueDate,
        notes: notes.trim() || undefined,
      });

      setSuccessMessage('Book issued successfully!');
      setTimeout(() => {
        navigate('/library/return');
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to issue book.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered lists for selection
  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(bookSearch.toLowerCase()))
  );

  const filteredStudents = students.filter((s: any) => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    const query = studentSearch.toLowerCase();
    return (
      fullName.includes(query) ||
      (s.student_id && s.student_id.toLowerCase().includes(query)) ||
      (s.roll_number && String(s.roll_number).includes(query))
    );
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading library inventory and student registry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/library/books"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookmarkPlus className="h-6 w-6 text-indigo-600" />
              Issue Book to Student
            </h1>
            <p className="text-xs text-slate-500">
              Loan a library book to an enrolled student and set return due date expectations
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Book Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              1. Select Book
            </div>
            {selectedBook && (
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  selectedBook.available_copies > 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {selectedBook.available_copies} of {selectedBook.total_copies} Copies Available
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog by title, author, or ISBN..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Choose Book <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedBookId || ''}
                onChange={(e) => handleBookSelect(parseInt(e.target.value, 10))}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Choose a book from library catalog --</option>
                {filteredBooks.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={b.available_copies < 1}
                  >
                    {b.title} — by {b.author} ({b.available_copies} avail / {b.total_copies} total)
                    {b.available_copies < 1 ? ' [OUT OF STOCK]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedBook && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <div className="w-10 h-14 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="text-xs space-y-0.5 flex-1">
                  <h4 className="font-bold text-slate-900">{selectedBook.title}</h4>
                  <p className="text-slate-500">by {selectedBook.author}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                      Category: {selectedBook.category || 'General'}
                    </span>
                    {selectedBook.rack_number && (
                      <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">
                        <MapPin className="h-3 w-3" /> {selectedBook.rack_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Student Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <User className="h-4 w-4 text-indigo-600" />
              2. Select Student Borrower
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students by name, ID, or roll number..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Choose Student <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => handleStudentSelect(parseInt(e.target.value, 10))}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Choose student borrower --</option>
                {filteredStudents.map((s: any) => {
                  const name = `${s.first_name || ''} ${s.last_name || ''}`.trim();
                  const classInfo = s.class_level?.name ? `Class: ${s.class_level.name}` : '';
                  const sectionInfo = s.section?.name ? `(${s.section.name})` : '';
                  const rollInfo = s.roll_number ? `Roll: ${s.roll_number}` : '';
                  return (
                    <option key={s.id} value={s.id}>
                      {name} — ID: {s.student_id || s.id} {classInfo} {sectionInfo} {rollInfo}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedStudent && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedStudent.first_name?.[0] || 'S'}
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Student ID: <span className="font-mono font-semibold">{selectedStudent.student_id || selectedStudent.id}</span>
                    {selectedStudent.class_level?.name && ` • Class: ${selectedStudent.class_level.name}`}
                    {selectedStudent.section?.name && ` (${selectedStudent.section.name})`}
                    {selectedStudent.roll_number && ` • Roll: ${selectedStudent.roll_number}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Loan Dates & Remarks */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Calendar className="h-4 w-4 text-indigo-600" />
            3. Loan Duration & Dates
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                min={issueDate}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => setDueDaysPreset(7)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDueDaysPreset(14)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-semibold"
                >
                  14 Days (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setDueDaysPreset(21)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                >
                  21 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDueDaysPreset(30)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                >
                  30 Days
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Loan Remarks / Course Assignment (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Coursework preparation, semester project assignment, book condition notes..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/library/books"
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-white rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || (selectedBook ? selectedBook.available_copies < 1 : false)}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <BookmarkPlus className="h-4 w-4" />
            {submitting ? 'Issuing Book...' : 'Confirm Book Issue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueBookPage;
