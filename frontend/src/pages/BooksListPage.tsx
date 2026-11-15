import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  BookmarkPlus,
  Trash2,
  MapPin,
  Barcode,
  ArrowUpDown,
  BookCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { BookItem, LibraryStats } from '../types';
import { libraryApi } from '../services/api';
import { LibraryStatsCards } from '../features/library';

export const BooksListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState<BookItem[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalBooks, setTotalBooks] = useState<number>(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>(
    searchParams.get('availability') || 'all'
  );
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort_by') || 'created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
  );

  // Delete modal state
  const [bookToDelete, setBookToDelete] = useState<BookItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await libraryApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load library stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await libraryApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setActionError(null);

      const params: any = {
        page: currentPage,
        per_page: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedAvailability !== 'all') params.availability = selectedAvailability;

      const response = await libraryApi.getBooks(params);
      setBooks(response.data || []);
      setTotalPages(response.last_page || 1);
      setTotalBooks(response.total || 0);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to fetch library books.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, selectedAvailability, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Sync state to search params
  const handleFilterChange = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'all') {
        newParams.delete(key);
      } else {
        newParams.set(key, val);
      }
    });
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedAvailability('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setSearchParams(new URLSearchParams());
    setCurrentPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await libraryApi.deleteBook(bookToDelete.id);
      setActionSuccess(`"${bookToDelete.title}" was removed successfully.`);
      setBookToDelete(null);
      fetchBooks();
      fetchStats();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to delete book.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library Books</h1>
              <p className="text-sm text-slate-500">
                Browse, search, and manage books, inventory copies, and loan availability
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/library/return"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            Return Book
          </Link>
          <Link
            to="/library/issue"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 shadow-xs transition-colors"
          >
            <BookmarkPlus className="h-4 w-4" />
            Issue a Book
          </Link>
          <Link
            to="/library/books/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Book
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <LibraryStatsCards stats={stats} loading={statsLoading} />

      {/* Alerts */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="h-4 w-4 text-indigo-600" />
            Book Catalog Filters
          </div>
          {(searchTerm || selectedCategory !== 'all' || selectedAvailability !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, author, ISBN, rack..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange({ search: e.target.value });
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                handleFilterChange({ category: e.target.value });
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              {!categories.includes('Science') && <option value="Science">Science</option>}
              {!categories.includes('Bangla Literature') && (
                <option value="Bangla Literature">Bangla Literature</option>
              )}
              {!categories.includes('Computer Science') && (
                <option value="Computer Science">Computer Science</option>
              )}
              {!categories.includes('English') && <option value="English">English</option>}
              {!categories.includes('History') && <option value="History">History</option>}
              {!categories.includes('Mathematics') && <option value="Mathematics">Mathematics</option>}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <select
              value={selectedAvailability}
              onChange={(e) => {
                setSelectedAvailability(e.target.value);
                handleFilterChange({ availability: e.target.value });
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">All Stock Status</option>
              <option value="available">Available in Stock</option>
              <option value="out_of_stock">Out of Stock / Fully Borrowed</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                handleFilterChange({ sort_by: e.target.value });
              }}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="created_at">Recently Added</option>
              <option value="title">Book Title</option>
              <option value="author">Author</option>
              <option value="available_copies">Available Copies</option>
              <option value="total_copies">Total Copies</option>
            </select>
            <button
              onClick={() => {
                const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                setSortOrder(newOrder);
                handleFilterChange({ sort_order: newOrder });
              }}
              title="Toggle sort direction"
              className="p-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Books Table / Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading library books catalog...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No books found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchTerm || selectedCategory !== 'all' || selectedAvailability !== 'all'
                  ? 'No books match the active search filters. Try broadening your criteria or reset filters.'
                  : 'Your school library catalog is currently empty. Add your first book to begin tracking.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              {(searchTerm || selectedCategory !== 'all' || selectedAvailability !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Clear Filters
                </button>
              )}
              <Link
                to="/library/books/create"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
              >
                + Add New Book
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Book Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">ISBN / Shelf</th>
                  <th className="py-3.5 px-4 text-center">Stock Availability</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {books.map((book) => {
                  const isAvailable = book.available_copies > 0 && book.status === 'available';
                  const percentAvailable =
                    book.total_copies > 0
                      ? Math.round((book.available_copies / book.total_copies) * 100)
                      : 0;

                  return (
                    <tr
                      key={book.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/library/books/${book.id}`)}
                    >
                      {/* Book Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-13 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {book.title}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              by <span className="font-medium text-slate-700">{book.author}</span>
                              {book.edition && <span> • {book.edition}</span>}
                              {book.publication_year && <span> ({book.publication_year})</span>}
                            </div>
                            {book.publisher && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Pub: {book.publisher}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {book.category || 'General'}
                        </span>
                      </td>

                      {/* ISBN / Shelf Location */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {book.isbn ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-600">
                              <Barcode className="h-3 w-3 text-slate-400" />
                              <span className="font-mono">{book.isbn}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No ISBN</span>
                          )}
                          {book.rack_number && (
                            <div className="flex items-center gap-1 text-[11px] text-indigo-700 font-medium">
                              <MapPin className="h-3 w-3 text-indigo-500" />
                              <span>{book.rack_number}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Stock Availability */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span
                              className={`text-sm ${
                                isAvailable ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {book.available_copies}
                            </span>
                            <span className="text-slate-400 text-xs">/ {book.total_copies}</span>
                          </div>
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${percentAvailable}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {book.borrowed_copies || Math.max(0, book.total_copies - book.available_copies)} borrowed
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <BookCheck className="h-3 w-3" /> Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                            <AlertCircle className="h-3 w-3" /> Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/library/books/${book.id}`)}
                            title="View Book Details"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {isAvailable ? (
                            <button
                              onClick={() => navigate(`/library/issue?book_id=${book.id}`)}
                              title="Issue this Book"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                              <BookmarkPlus className="h-3.5 w-3.5" />
                              Issue
                            </button>
                          ) : (
                            <span className="px-2 py-1 text-[10px] text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed">
                              Unavailable
                            </span>
                          )}

                          <button
                            onClick={() => setBookToDelete(book)}
                            title="Delete Book"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && books.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{books.length}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalBooks}</span> books in catalog
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Book</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">"{bookToDelete.title}"</strong>? If there are any
              active borrowed copies, the deletion will be protected.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksListPage;
