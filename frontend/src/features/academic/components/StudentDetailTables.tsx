import React, { useState } from 'react';
import {
  StudentFullSummaryResponse,
  StudentAttendanceHistoryItem,
} from '../types';
import { AddTeacherNoteModal } from './AddTeacherNoteModal';
import {
  CalendarCheck,
  Receipt,
  CreditCard,
  MessageSquare,
  BookOpen,
  Award,
  FolderArchive,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  Check,
} from 'lucide-react';

interface StudentDetailTablesProps {
  summary: StudentFullSummaryResponse;
  studentId: number;
  studentName: string;
  onRefresh: () => void;
  onOpenUploadDoc: () => void;
  onPreviewDoc: (doc: any) => void;
  onAddTeacherNote: (payload: { title: string; category: string; note: string; date: string }) => Promise<void>;
  onDeleteTeacherNote: (noteId: number) => Promise<void>;
}

type TabType = 'all' | 'attendance' | 'invoices' | 'payments' | 'teacher_notes' | 'library' | 'exams' | 'documents';

export const StudentDetailTables: React.FC<StudentDetailTablesProps> = ({
  summary,
  studentName,
  onRefresh,
  onOpenUploadDoc,
  onPreviewDoc,
  onAddTeacherNote,
  onDeleteTeacherNote,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);

  // Pagination states (10 items per page)
  const [pageAttendance, setPageAttendance] = useState(1);
  const [pageInvoices, setPageInvoices] = useState(1);
  const [pagePayments, setPagePayments] = useState(1);
  const [pageNotes, setPageNotes] = useState(1);
  const [pageLibrary, setPageLibrary] = useState(1);
  const [pageExams, setPageExams] = useState(1);
  const [pageDocs, setPageDocs] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const paginate = <T,>(items: T[], page: number): T[] => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const renderPaginationFooter = (
    total: number,
    currentPage: number,
    setPage: (p: number) => void
  ) => {
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    const startItem = total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(total, currentPage * ITEMS_PER_PAGE);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500 gap-2">
        <div>
          Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-700">{total}</span> items
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 font-bold text-indigo-700 border border-indigo-100 text-[11px]">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const getAttendanceStatusBadge = (item: StudentAttendanceHistoryItem) => {
    switch (item.status) {
      case 'Present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Present</span>
          </span>
        );
      case 'Late':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Late</span>
          </span>
        );
      case 'Holiday':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Holiday</span>
          </span>
        );
      case 'Absent':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Absent</span>
          </span>
        );
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Paid
          </span>
        );
      case 'partial':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Partial
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Overdue
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            Pending
          </span>
        );
    }
  };

  const getLibraryStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'returned':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Returned
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Overdue
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Issued / Reading
          </span>
        );
    }
  };

  const tabs = [
    { id: 'all' as TabType, label: 'All Tables', icon: FileText, count: 7 },
    { id: 'attendance' as TabType, label: 'Last 10 Days Attendance', icon: CalendarCheck, count: summary.attendance.total },
    { id: 'invoices' as TabType, label: 'Invoices', icon: Receipt, count: summary.invoices.total },
    { id: 'payments' as TabType, label: 'Payments', icon: CreditCard, count: summary.payments.total },
    { id: 'teacher_notes' as TabType, label: 'Teacher Notes', icon: MessageSquare, count: summary.teacher_notes.total },
    { id: 'library' as TabType, label: 'Library Rents', icon: BookOpen, count: summary.library_rents.total },
    { id: 'exams' as TabType, label: 'Exam Results', icon: Award, count: summary.exam_results.total },
    { id: 'documents' as TabType, label: 'Documents', icon: FolderArchive, count: summary.documents.total },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Filter Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= 1. ATTENDANCE TABLE (LAST 10 DAYS) ================= */}
      {(activeTab === 'all' || activeTab === 'attendance') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-linear-to-r from-slate-50 to-indigo-50/20 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Last 10 Days Attendance Table
                </h3>
                <p className="text-[11px] text-slate-500">
                  Daily attendance logs (unrecorded days marked absent, respecting the school holiday calendar)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <span className="text-emerald-700 font-bold">
                {summary.attendance.data.filter((d) => d.status === 'Present').length} Present
              </span>
              <span>•</span>
              <span className="text-rose-700 font-bold">
                {summary.attendance.data.filter((d) => d.status === 'Absent').length} Absent
              </span>
              <span>•</span>
              <span className="text-indigo-700 font-bold">
                {summary.attendance.data.filter((d) => d.status === 'Holiday').length} Holiday
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Day</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Remarks / Calendar Event</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginate(summary.attendance.data, pageAttendance).map((att) => (
                  <tr key={att.date} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <span>{att.date}</span>
                      <span className="text-slate-400 font-normal ml-2">({att.day})</span>
                    </td>
                    <td className="py-3 px-4">{getAttendanceStatusBadge(att)}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {att.is_holiday ? (
                        <span className="font-semibold text-indigo-700">
                          {att.remarks}
                        </span>
                      ) : (
                        <span>{att.remarks}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {att.status === 'Present' ? (
                        <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Marked
                        </span>
                      ) : att.status === 'Holiday' ? (
                        <span className="text-[11px] text-indigo-600 font-semibold">
                          Gazetted Recess
                        </span>
                      ) : (
                        <span className="text-[11px] text-rose-600 font-semibold">
                          Absentee Flag
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPaginationFooter(summary.attendance.total, pageAttendance, setPageAttendance)}
        </div>
      )}

      {/* ================= 2. LAST INVOICES STATUS ================= */}
      {(activeTab === 'all' || activeTab === 'invoices') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-linear-to-r from-slate-50 to-emerald-50/20 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Last Invoices Status ({summary.invoices.total})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Recent tuition and fee invoices issued to this student
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {summary.invoices.data.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No invoices found for this student.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Fee Category</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginate(summary.invoices.data, pageInvoices).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoice_no}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {inv.fund_collection_name?.name || inv.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{inv.due_date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        ৳{Number(inv.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">{getInvoiceStatusBadge(inv.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {renderPaginationFooter(summary.invoices.total, pageInvoices, setPageInvoices)}
        </div>
      )}

      {/* ================= 3. LAST PAYMENTS RECORDS ================= */}
      {(activeTab === 'all' || activeTab === 'payments') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-linear-to-r from-slate-50 to-blue-50/20 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Last Payments Records ({summary.payments.total})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Settled transactions, receipts, and payment histories
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {summary.payments.data.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No payment receipts recorded for this student yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Fee Collection</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Transaction Ref</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginate(summary.payments.data, pagePayments).map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {pmt.receipt_no}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {pmt.fund_collection_name?.name || 'General Tuition'}
                      </td>
                      <td className="py-3 px-4 uppercase text-slate-600 font-semibold text-[11px]">
                        {pmt.payment_method}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {pmt.transaction_id || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        ৳{Number(pmt.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {pmt.status || 'Paid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {renderPaginationFooter(summary.payments.total, pagePayments, setPagePayments)}
        </div>
      )}

      {/* ================= 4. TEACHER NOTES ================= */}
      {(activeTab === 'all' || activeTab === 'teacher_notes') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-linear-to-r from-slate-50 to-amber-50/20 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Teacher Notes & Behavioral Records ({summary.teacher_notes.total})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Academic reviews, conduct reports, and teacher observations
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddNoteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            {summary.teacher_notes.data.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No teacher notes recorded for this student yet. Click "Add Note" to add one.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Title & Note</th>
                    <th className="py-3 px-4">Teacher / Author</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginate(summary.teacher_notes.data, pageNotes).map((note) => (
                    <tr key={note.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-semibold">
                        {note.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {note.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <span className="font-bold text-slate-900 block">{note.title}</span>
                        <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                          {note.note}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {note.author_name || note.author?.name || 'Faculty Member'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this teacher note?')) {
                              onDeleteTeacherNote(note.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {renderPaginationFooter(summary.teacher_notes.total, pageNotes, setPageNotes)}
        </div>
      )}

      {/* ================= 5. LIBRARY BOOK RENT STATUS ================= */}
      {(activeTab === 'all' || activeTab === 'library') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-linear-to-r from-slate-50 to-violet-50/20 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Library Book Rent Status ({summary.library_rents.total})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Borrowed titles, due dates, and return records from the Library module
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {summary.library_rents.data.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No book issues or borrow history on record for this student.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Book Title & Author</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Return Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginate(summary.library_rents.data, pageLibrary).map((rent) => (
                    <tr key={rent.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                        <span>{rent.book?.title || 'Library Book'}</span>
                        {rent.book?.author && (
                          <span className="text-[11px] text-slate-500 font-normal block truncate">
                            by {rent.book.author}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rent.issue_date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{rent.due_date}</td>
                      <td className="py-3 px-4 text-slate-600">{rent.return_date || '—'}</td>
                      <td className="py-3 px-4">{getLibraryStatusBadge(rent.status)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {rent.fine_amount ? `৳${rent.fine_amount}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {renderPaginationFooter(summary.library_rents.total, pageLibrary, setPageLibrary)}
        </div>
      )}

      {/* ================= 6. LAST EXAM RESULTS ================= */}
      {(activeTab === 'all' || activeTab === 'exams') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-linear-to-r from-slate-50 to-rose-50/20 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Last Exam Results ({summary.exam_results.total})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Subject scores, letter grades, and academic performance
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {summary.exam_results.data.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No exam marks published for this student yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Exam Name</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Grade & GPA</th>
                    <th className="py-3 px-4">Teacher Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginate(summary.exam_results.data, pageExams).map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {res.exam?.name || 'Term Exam'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {res.subject?.name || 'Subject'}
                        {res.subject?.code && (
                          <span className="text-[10px] text-slate-400 font-mono ml-1">
                            ({res.subject.code})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {res.total_mark}
                        {res.subject?.full_mark ? ` / ${res.subject.full_mark}` : ''}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <span>Grade: {res.grade || 'A'}</span>
                          {res.gpa !== undefined && res.gpa !== null && (
                            <span className="font-mono">({res.gpa.toFixed(2)})</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {res.note || 'Consistent academic performance.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {renderPaginationFooter(summary.exam_results.total, pageExams, setPageExams)}
        </div>
      )}

      {/* ================= 7. STUDENT DOCUMENTS LIST ================= */}
      {(activeTab === 'all' || activeTab === 'documents') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-linear-to-r from-slate-50 to-indigo-50/20 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <FolderArchive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Student Documents List ({summary.documents.total})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Transcripts, birth certificates, and registration documents
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenUploadDoc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            {summary.documents.data.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No documents uploaded for this student yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Category / Type</th>
                    <th className="py-3 px-4">File Size</th>
                    <th className="py-3 px-4">Uploaded At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginate(summary.documents.data, pageDocs).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>{doc.title}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {doc.document_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {doc.formatted_file_size || `${Math.round((doc.file_size || 0) / 1024)} KB`}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onPreviewDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {renderPaginationFooter(summary.documents.total, pageDocs, setPageDocs)}
        </div>
      )}

      {/* Add Teacher Note Modal */}
      <AddTeacherNoteModal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        onSubmit={async (payload) => {
          await onAddTeacherNote(payload);
          onRefresh();
        }}
        studentName={studentName}
      />
    </div>
  );
};
