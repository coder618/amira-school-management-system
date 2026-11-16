import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { attendanceApi } from '../api';
import { Holiday, HolidayPayload } from '../types';
import { HolidayModal } from './HolidayModal';
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  List,
  LayoutGrid,
} from 'lucide-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HolidayCalendar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed (0 = Jan)

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // View state: 'calendar' or 'agenda'
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | undefined>(undefined);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getHolidays({
        year: currentYear,
      });
      setHolidays(res.data);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load school holiday calendar.' });
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Helper: check if a date falls inside a holiday (single date or range)
  const getHolidaysForDate = (dateStr: string): Holiday[] => {
    return holidays.filter((h) => {
      const start = h.date ? h.date.split('T')[0] : '';
      const end = h.end_date ? h.end_date.split('T')[0] : start;
      return dateStr >= start && dateStr <= end;
    });
  };

  // Calendar matrix calculation for the selected month
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    interface DayCell {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      holidays: Holiday[];
    }

    const cells: DayCell[] = [];
    const todayStr = today.toISOString().split('T')[0];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonth = currentMonth === 0 ? 12 : currentMonth;
      const dateStr = `${prevMonthYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        holidays: getHolidaysForDate(dateStr),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        holidays: getHolidaysForDate(dateStr),
      });
    }

    // Next month padding days to complete 35 or 42 grid slots
    const remainingSlots = 42 - cells.length;
    const nextSlots = remainingSlots >= 7 ? remainingSlots - 7 : remainingSlots;
    for (let day = 1; day <= nextSlots; day++) {
      const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const nextMonth = currentMonth === 11 ? 1 : currentMonth + 2;
      const dateStr = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        holidays: getHolidaysForDate(dateStr),
      });
    }

    return cells;
  }, [currentYear, currentMonth, holidays, today]);

  // Filtered holidays for agenda list
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const matchesSearch =
        searchQuery === '' ||
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === 'all' || h.type.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [holidays, searchQuery, selectedType]);

  // Handle Create or Update submission
  const handleSaveHoliday = async (payload: HolidayPayload, id?: number) => {
    try {
      if (id) {
        const res = await attendanceApi.updateHoliday(id, payload);
        setFeedback({ type: 'success', message: res.message });
      } else {
        const res = await attendanceApi.createHoliday(payload);
        setFeedback({ type: 'success', message: res.message });
      }
      fetchHolidays();
    } catch (err: any) {
      throw err;
    }
  };

  // Handle Delete
  const handleDeleteHoliday = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the holiday '${title}'?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await attendanceApi.deleteHoliday(id);
      setFeedback({ type: 'success', message: res.message });
      fetchHolidays();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete holiday.' });
    } finally {
      setDeletingId(null);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'national':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'religious':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'academic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cultural':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-indigo-600" />
            Institutional Holiday Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Designate public holidays, religious vacations, and academic breaks for attendance management
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List / Agenda</span>
            </button>
          </div>

          {/* Admin Add Holiday Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingHoliday(null);
                setSelectedCalendarDate(undefined);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Holiday</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-sm border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Month Navigation & Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-slate-200/80 gap-3 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center rounded-lg border border-slate-300 bg-white shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer border-r border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer border-r border-slate-200"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1.5 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              {holidays.length} Holiday{holidays.length === 1 ? '' : 's'} recorded in {currentYear}
            </span>
          </div>
        </div>

        {/* View Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs font-medium">Loading holiday records...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          /* ================= CALENDAR VIEW ================= */
          <div className="p-4 sm:p-6">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {WEEK_DAYS.map((day, idx) => (
                <div
                  key={day}
                  className={`text-center py-1.5 text-xs font-bold uppercase tracking-wider ${
                    idx === 5 || idx === 6 ? 'text-rose-500' : 'text-slate-500'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, idx) => {
                const hasHoliday = cell.holidays.length > 0;
                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => {
                      if (isAdmin) {
                        if (hasHoliday) {
                          setEditingHoliday(cell.holidays[0]);
                        } else {
                          setEditingHoliday(null);
                        }
                        setSelectedCalendarDate(cell.dateStr);
                        setModalOpen(true);
                      }
                    }}
                    className={`min-h-[96px] sm:min-h-[110px] p-2 rounded-xl border transition-all flex flex-col justify-between group ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-50/50 border-slate-100 text-slate-400'
                        : cell.isToday
                        ? 'bg-indigo-50/30 border-indigo-200 text-slate-800 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs text-slate-800'
                    } ${isAdmin ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                          cell.isToday
                            ? 'bg-indigo-600 text-white'
                            : !cell.isCurrentMonth
                            ? 'text-slate-400'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {isAdmin && (
                        <span className="opacity-0 group-hover:opacity-100 text-indigo-600 transition-opacity p-0.5 rounded hover:bg-indigo-100">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Holiday Badges for Date */}
                    <div className="space-y-1 mt-1.5 overflow-hidden">
                      {cell.holidays.map((h) => (
                        <div
                          key={h.id}
                          title={`${h.title} (${h.type})`}
                          className={`truncate text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shadow-2xs flex items-center justify-between ${getBadgeColor(
                            h.type
                          )}`}
                        >
                          <span className="truncate">{h.title}</span>
                          {h.is_half_day && (
                            <Clock className="w-2.5 h-2.5 shrink-0 ml-1 text-slate-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= AGENDA / LIST VIEW ================= */
          <div className="p-4 sm:p-6 space-y-4">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search holidays by title..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-600"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['all', 'national', 'religious', 'academic', 'cultural', 'general'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                      selectedType === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Holidays Table / List */}
            {filteredHolidays.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No holidays found</p>
                <p className="text-xs text-slate-400">
                  {isAdmin
                    ? 'Click the "+ Add Holiday" button above to record a new holiday.'
                    : 'No holiday entries match your query.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date / Range</th>
                      <th className="py-3 px-4">Holiday Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Details</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredHolidays.map((holiday) => {
                      const startDate = holiday.date ? holiday.date.split('T')[0] : '';
                      const endDate = holiday.end_date ? holiday.end_date.split('T')[0] : null;

                      return (
                        <tr key={holiday.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{startDate}</span>
                              {endDate && (
                                <span className="text-slate-400">→ {endDate}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{holiday.title}</span>
                              {holiday.is_half_day && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800">
                                  Half-Day
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getBadgeColor(
                                holiday.type
                              )}`}
                            >
                              {holiday.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {holiday.description || '—'}
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingHoliday(holiday);
                                    setModalOpen(true);
                                  }}
                                  title="Edit Holiday"
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingId === holiday.id}
                                  onClick={() => handleDeleteHoliday(holiday.id, holiday.title)}
                                  title="Delete Holiday"
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {deletingId === holiday.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          )}
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

      {/* Holiday Creation & Editing Modal */}
      <HolidayModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingHoliday(null);
          setSelectedCalendarDate(undefined);
        }}
        onSubmit={handleSaveHoliday}
        holiday={editingHoliday}
        defaultDate={selectedCalendarDate}
      />
    </div>
  );
};
