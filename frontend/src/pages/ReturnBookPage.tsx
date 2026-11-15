import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  BookOpen,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookmarkPlus,
  RefreshCw,
} from 'lucide-react';
import { BookIssueItem, LibraryStats } from '../types';
import { libraryApi } from '../services/api';
import { ReturnBookModal } from '../features/library';

export const ReturnBookPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [issues, setIssues] = useState<BookIssueItem[]>([]);
  const [historyIssues, setHistoryIssues] = useState<BookIssueItem[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState<boolean>(false);

  // Return modal state
  const [selectedIssue, setSelectedIssue] = useState<BookIssueItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const data = await libraryApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchActiveIssues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await libraryApi.getIssues({
        status: filterOverdueOnly ? 'overdue' : 'issued',
        search: searchTerm.trim() || undefined,
        per_page: 50,
      });
      setIssues(res.data || []);
    } catch (err) {
      console.error('Failed to fetch active issues', err);
    } finally {
      setLoading(false);
    }
  }, [filterOverdueOnly, searchTerm]);

  const fetchHistoryIssues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await libraryApi.getIssues({
        status: 'returned',
        search: searchTerm.trim() || undefined,
        per_page: 50,
      });
      setHistoryIssues(res.data || []);
    } catch (err) {
      console.error('Failed to fetch history issues', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'active') {
      fetchActiveIssues();
    } else {
      fetchHistoryIssues();
    }
  }, [activeTab, fetchActiveIssues, fetchHistoryIssues]);

  const handleReturnSuccess = () => {
    setSuccessMessage('Book returned successfully! Inventory stock has been updated.');
    fetchStats();
    if (activeTab === 'active') {
      fetchActiveIssues();
    } else {
      fetchHistoryIssues();
    }
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
            <RotateCcw className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Return Book from Student</h1>
            <p className="text-sm text-slate-500">
              Collect borrowed books, calculate overdue fines, and replenish library copy availability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/library/books"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs transition-colors"
          >
            List Books (Catalog)
          </Link>
          <Link
            to="/library/issue"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <BookmarkPlus className="h-4 w-4" />
            Issue a Book
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Currently Checked Out
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">
              {stats ? stats.active_issues : '0'}
            </span>
            <span className="text-[11px] text-slate-400">Books awaiting student return</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Overdue Returns
            </span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">
              {stats ? stats.overdue_issues : '0'}
            </span>
            <span className="text-[11px] text-rose-400 font-medium">Exceeded due return dates</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Successfully Returned
            </span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {stats ? stats.total_returned : '0'}
            </span>
            <span className="text-[11px] text-slate-400">Completed return transactions</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="font-bold text-emerald-600">
            ×
          </button>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                activeTab === 'active'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active Issued Books ({stats?.active_issues || 0})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Return History ({stats?.total_returned || 0})
            </button>
          </div>

          {/* Search & Overdue Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or book..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {activeTab === 'active' && (
              <button
                onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                  filterOverdueOnly
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                Overdue Only
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Active Issued Books */}
        {activeTab === 'active' && (
          <div>
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading active book loans...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No active book loans pending return</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {filterOverdueOnly
                    ? 'No overdue books found. All student borrowers are currently within schedule.'
                    : 'There are currently no books issued to students.'}
                </p>
                <div className="pt-2">
                  <Link
                    to="/library/issue"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                  >
                    + Issue a Book Now
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Student Borrower</th>
                      <th className="py-3 px-4">Class & Roll</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-center">Return Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {issues.map((issue) => {
                      const student = issue.student;
                      const book = issue.book;
                      const isOverdue = issue.is_overdue || new Date(issue.due_date) < new Date();

                      return (
                        <tr key={issue.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Book */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                                <BookOpen className="h-4 w-4" />
                              </div>
                              <div>
                                <Link
                                  to={`/library/books/${book?.id}`}
                                  className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block line-clamp-1"
                                >
                                  {book?.title}
                                </Link>
                                <span className="text-[11px] text-slate-500">by {book?.author}</span>
                              </div>
                            </div>
                          </td>

                          {/* Student */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">
                              {student ? `${student.first_name} ${student.last_name}` : 'Unknown'}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {student?.student_id || 'N/A'}
                            </span>
                          </td>

                          {/* Class */}
                          <td className="py-3 px-4">
                            <div className="text-slate-700">
                              {student?.class_level?.name || 'Class N/A'}
                              {student?.section && (
                                <span className="text-slate-500 text-[11px]"> ({student.section.name})</span>
                              )}
                            </div>
                            {student?.roll_number && (
                              <span className="text-[10px] text-slate-400">Roll: {student.roll_number}</span>
                            )}
                          </td>

                          {/* Issue Date */}
                          <td className="py-3 px-4 text-slate-600">{issue.issue_date}</td>

                          {/* Due Date */}
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                              {issue.due_date}
                            </span>
                          </td>

                          {/* Return Status Badge */}
                          <td className="py-3 px-4 text-center">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                                <AlertTriangle className="h-3 w-3" />
                                {issue.days_overdue ? `${issue.days_overdue} days overdue` : 'Overdue'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                <Clock className="h-3 w-3" />
                                {issue.days_remaining ? `${issue.days_remaining} days left` : 'Due soon'}
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedIssue(issue)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Return Book
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Return History */}
        {activeTab === 'history' && (
          <div>
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading return history...</p>
              </div>
            ) : historyIssues.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No past return history records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Return Date</th>
                      <th className="py-3 px-4">Fine / Late Fee</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyIssues.map((issue) => {
                      const student = issue.student;
                      const book = issue.book;
                      const fine = parseFloat(String(issue.fine_amount || 0));

                      return (
                        <tr key={issue.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-bold text-slate-900">{book?.title}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">
                              {student ? `${student.first_name} ${student.last_name}` : 'Unknown'}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ID: {student?.student_id || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{issue.issue_date}</td>
                          <td className="py-3 px-4 text-slate-600">{issue.due_date}</td>
                          <td className="py-3 px-4 font-medium text-emerald-700">{issue.return_date}</td>
                          <td className="py-3 px-4">
                            {fine > 0 ? (
                              <span className="font-semibold text-slate-800">
                                {fine} ৳{' '}
                                <span className="text-[10px] uppercase font-bold text-indigo-600">
                                  ({issue.fine_status})
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="h-3 w-3" /> Returned
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Return Modal */}
      {selectedIssue && (
        <ReturnBookModal
          issue={selectedIssue}
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
};

export default ReturnBookPage;
