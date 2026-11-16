import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TeacherAttendanceHistoryItem,
  TeacherGivenNoteItem,
} from '../types';
import {
  CalendarCheck,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Tag,
  Eye,
  X,
} from 'lucide-react';

interface TeacherDetailTablesProps {
  attendance: {
    total: number;
    data: TeacherAttendanceHistoryItem[];
  };
  teacherNotes: {
    total: number;
    data: TeacherGivenNoteItem[];
  };
  teacherName: string;
  onRefresh?: () => void;
}

type TabType = 'all' | 'attendance' | 'teacher_notes';

export const TeacherDetailTables: React.FC<TeacherDetailTablesProps> = ({
  attendance,
  teacherNotes,
  teacherName,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedNote, setSelectedNote] = useState<TeacherGivenNoteItem | null>(null);

  // Pagination states (10 items per page)
  const [pageAttendance, setPageAttendance] = useState(1);
  const [pageNotes, setPageNotes] = useState(1);

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 border-t border-slate-200/80 text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-700">{total}</span> records (10 per page)
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>
          <span className="px-2 font-mono font-semibold text-slate-600">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'all' as TabType, label: 'All Tables', icon: FileText, count: attendance.total + teacherNotes.total },
    { id: 'attendance' as TabType, label: 'Last 10 Days Attendance', icon: CalendarCheck, count: attendance.total },
    { id: 'teacher_notes' as TabType, label: 'Given Student Notes', icon: MessageSquare, count: teacherNotes.total },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
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
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. LAST 10 DAYS ATTENDANCE TABLE */}
      {(activeTab === 'all' || activeTab === 'attendance') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
          <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-indigo-600" />
                <span>Last 10 Days Attendance Record</span>
                <span className="text-[11px] font-normal text-slate-500 font-mono">
                  (Includes device punches & holiday calendar)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays punch-in/out times. Unmarked days are flagged as Absent unless recorded on the academic holiday calendar.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Present: {attendance.data.filter((a) => a.status === 'Present').length}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                <XCircle className="w-3 h-3 text-rose-600" />
                Absent: {attendance.data.filter((a) => a.status === 'Absent').length}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                <Sparkles className="w-3 h-3 text-purple-600" />
                Holiday: {attendance.data.filter((a) => a.status === 'Holiday').length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">In Time (First Punch)</th>
                  <th className="py-3 px-4">Out Time (Last Punch)</th>
                  <th className="py-3 px-4">Remarks / Calendar Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginate(attendance.data, pageAttendance).map((att) => {
                  const isPresent = att.status === 'Present';
                  const isAbsent = att.status === 'Absent';
                  const isHoliday = att.status === 'Holiday';
                  const isLate = att.status === 'Late';

                  return (
                    <tr
                      key={att.id + att.date}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isHoliday ? 'bg-purple-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {att.date}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                        {att.day}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPresent && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            Present
                          </span>
                        )}
                        {isAbsent && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="h-3 w-3 text-rose-600" />
                            Absent
                          </span>
                        )}
                        {isHoliday && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Sparkles className="h-3 w-3 text-purple-600" />
                            Holiday
                          </span>
                        )}
                        {isLate && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3 text-amber-600" />
                            Late
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        {att.in_time ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold text-[11px]">
                            <Clock className="h-3 w-3 text-emerald-600" />
                            {att.in_time}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        {att.out_time ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold text-[11px]">
                            <Clock className="h-3 w-3 text-indigo-600" />
                            {att.out_time}
                            {att.punch_count && att.punch_count > 2 && (
                              <span
                                className="text-[10px] text-indigo-400 ml-0.5"
                                title={`Total ${att.punch_count} punches recorded`}
                              >
                                ({att.punch_count}x)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {isHoliday ? (
                          <span className="font-semibold text-purple-700 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                            <span>{att.remarks || 'Academic Holiday Calendar'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">{att.remarks || '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {renderPaginationFooter(attendance.total, pageAttendance, setPageAttendance)}
        </div>
      )}

      {/* 2. GIVEN TEACHER NOTES LIST TABLE */}
      {(activeTab === 'all' || activeTab === 'teacher_notes') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
          <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                <span>Given Student Notes & Academic Remarks</span>
                <span className="text-[11px] font-normal text-slate-500 font-mono">
                  ({teacherNotes.total} total)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation remarks, behavioral feedback, and guidance notes authored by {teacherName}.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Click student name to view student profile
            </div>
          </div>

          {teacherNotes.data.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">No notes given yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Notes authored for students will be listed here with clickable student links.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Student Name (Profile Link)</th>
                      <th className="py-3 px-4">Class & Roll</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Note Title & Content</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginate(teacherNotes.data, pageNotes).map((note) => {
                      const student = note.student;
                      const studentName = student
                        ? `${student.first_name} ${student.last_name}`
                        : `Student #${note.student_id}`;

                      return (
                        <tr key={note.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                            {note.date}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Link
                              to={`/students/${note.student_id}`}
                              className="group inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                              title="Open student profile"
                            >
                              <User className="h-3.5 w-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                              <span className="underline decoration-indigo-200 group-hover:decoration-indigo-600">
                                {studentName}
                              </span>
                              <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                            </Link>
                            {student?.student_id && (
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                {student.student_id}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                            {student?.class_level?.name ? (
                              <div className="font-medium text-slate-700">
                                {student.class_level.name}
                                {student.section?.name ? ` - Sec ${student.section.name}` : ''}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Class info</span>
                            )}
                            {student?.roll_number && (
                              <div className="text-[10px] font-mono text-slate-400">
                                Roll: #{student.roll_number}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              <Tag className="h-3 w-3 text-indigo-500" />
                              {note.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs sm:max-w-md">
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {note.title}
                            </div>
                            <div className="text-slate-500 line-clamp-2 mt-0.5 text-[11px] leading-relaxed">
                              {note.note}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedNote(note)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer text-[11px]"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {renderPaginationFooter(teacherNotes.total, pageNotes, setPageNotes)}
            </>
          )}
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedNote(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                <Tag className="h-3 w-3 text-indigo-500" />
                {selectedNote.category || 'General'}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {selectedNote.date}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-3">
              {selectedNote.title}
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">
              {selectedNote.note}
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
              <div>
                <span className="text-slate-400">Student: </span>
                <Link
                  to={`/students/${selectedNote.student_id}`}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  {selectedNote.student
                    ? `${selectedNote.student.first_name} ${selectedNote.student.last_name}`
                    : `Student #${selectedNote.student_id}`}
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
