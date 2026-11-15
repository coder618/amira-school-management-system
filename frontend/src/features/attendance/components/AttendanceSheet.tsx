import React from 'react';
import { useAttendance } from '../hooks/useAttendance';
import {
  CalendarCheck,
  Save,
  MessageSquare,
  Check,
  X,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  Cpu,
} from 'lucide-react';

export const AttendanceSheet: React.FC = () => {
  const {
    sections,
    selectedSectionId,
    setSelectedSectionId,
    selectedDate,
    setSelectedDate,
    rows,
    stats,
    sendSms,
    setSendSms,
    loading,
    saving,
    feedback,
    setStudentStatus,
    setStudentRemarks,
    markAll,
    saveAttendance,
  } = useAttendance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarCheck className="h-7 w-7 text-indigo-600" />
            Daily Attendance & SMS Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Rapid batch attendance marking with automated guardian SMS notifications
          </p>
        </div>

        <button
          type="button"
          onClick={saveAttendance}
          disabled={saving || loading || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Attendance Sheet</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-sm border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Control bar: Section, Date, Bulk Action & SMS Checkbox */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs items-center">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Section / Class
          </label>
          <select
            value={selectedSectionId || ''}
            onChange={(e) => setSelectedSectionId(parseInt(e.target.value))}
            className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.class_level?.name || 'Class'} - Section {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Quick Actions
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => markAll('Present')}
              className="flex-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-1.5 px-2 text-xs border border-emerald-200 transition-colors cursor-pointer"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('Absent')}
              className="flex-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-1.5 px-2 text-xs border border-rose-200 transition-colors cursor-pointer"
            >
              All Absent
            </button>
          </div>
        </div>

        <div className="pt-3 sm:pt-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              Send Absentee SMS (BulkSMSBD)
            </span>
          </label>
        </div>
      </div>

      {/* Aggregate Stats Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Total Enrolled</span>
          <span className="text-xl font-bold text-slate-900">{stats.total}</span>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-700">Present</span>
          <span className="text-xl font-bold text-emerald-700">{stats.present}</span>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs flex items-center justify-between">
          <span className="text-xs font-medium text-rose-700">Absent</span>
          <span className="text-xl font-bold text-rose-700">{stats.absent}</span>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs flex items-center justify-between">
          <span className="text-xs font-medium text-amber-700">Late Arrival</span>
          <span className="text-xl font-bold text-amber-700">{stats.late}</span>
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Loading student list for selected date...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No students found in this section</p>
            <p className="text-xs text-slate-400 mt-1">Please select another section or enroll students.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Guardian Phone</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      #{row.student.roll_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {row.student.first_name} {row.student.last_name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-400 font-mono">
                          {row.student.student_id}
                        </span>
                        {row.remarks && (row.remarks.toLowerCase().includes('device') || row.remarks.toLowerCase().includes('auto-recorded')) && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded-md"
                            title={row.remarks}
                          >
                            <Cpu className="w-3 h-3 text-indigo-500" />
                            Device Recorded
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {row.student.phone_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStudentStatus(row.student.id, 'Present')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            row.status === 'Present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Present</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(row.student.id, 'Absent')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            row.status === 'Absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Absent</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(row.student.id, 'Late')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            row.status === 'Late'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Late</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. sick)"
                        value={row.remarks}
                        onChange={(e) => setStudentRemarks(row.student.id, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

