import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AttendanceSheet, HolidayCalendar } from '../features/attendance';
import { CalendarCheck, CalendarDays, Cpu, ExternalLink } from 'lucide-react';

export const Attendance: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'sheet';

  const setTab = (tab: 'sheet' | 'holidays') => {
    setSearchParams({ tab });
  };

  return (
    <div className="py-2 space-y-4">
      {/* Top Banner linking to Device Settings & Hardware */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-slate-50 border border-slate-200/90 px-4 py-2.5 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-xs text-slate-600 font-medium">
            Hardware RFID scanners & biometric terminals can be configured under Settings.
          </span>
        </div>
        <Link
          to="/settings?tab=devices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 transition-colors shrink-0"
        >
          <span>Device Settings</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setTab('sheet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            currentTab === 'sheet'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Daily Attendance Sheet</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('holidays')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            currentTab === 'holidays'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Holiday Calendar</span>
        </button>
      </div>

      {/* Tab Panels */}
      {currentTab === 'holidays' ? <HolidayCalendar /> : <AttendanceSheet />}
    </div>
  );
};
