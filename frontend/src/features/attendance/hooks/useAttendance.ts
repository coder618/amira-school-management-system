import { useState, useEffect, useCallback } from 'react';
import { attendanceApi } from '../api';
import { academicApi } from '../../academic/api';
import { AttendanceStatus } from '../types';
import { Section, Student } from '../../academic/types';

export interface StudentAttendanceRow {
  student: Student;
  status: AttendanceStatus;
  remarks: string;
  in_time_formatted?: string | null;
  out_time_formatted?: string | null;
  punch_count?: number;
}

export const useAttendance = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<StudentAttendanceRow[]>([]);
  const [sendSms, setSendSms] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [holidayInfo, setHolidayInfo] = useState<{ isHoliday: boolean; title?: string; type?: string } | null>(null);

  // Check if selected date is a holiday
  useEffect(() => {
    if (!selectedDate) {
      setHolidayInfo(null);
      return;
    }
    attendanceApi
      .checkDateHoliday(selectedDate)
      .then((res) => {
        if (res.is_holiday && res.holiday) {
          setHolidayInfo({ isHoliday: true, title: res.holiday.title, type: res.holiday.type });
        } else {
          setHolidayInfo(null);
        }
      })
      .catch(() => setHolidayInfo(null));
  }, [selectedDate]);

  // Load sections initially
  useEffect(() => {
    academicApi.getSections().then((data) => {
      setSections(data);
      if (data.length > 0) {
        setSelectedSectionId(data[0].id);
      }
    });
  }, []);

  // Fetch students for section and existing attendance for date
  const loadSectionAttendance = useCallback(async () => {
    if (!selectedSectionId) return;
    setLoading(true);
    setFeedback(null);
    try {
      const [studentsData, existingData] = await Promise.all([
        academicApi.getStudents({ section_id: selectedSectionId }),
        attendanceApi.getAttendanceList({ section_id: selectedSectionId, date: selectedDate }),
      ]);

      const attendanceMap = new Map<number, {
        status: AttendanceStatus;
        remarks: string;
        in_time_formatted?: string | null;
        out_time_formatted?: string | null;
        punch_count?: number;
      }>();
      existingData.forEach((a) => {
        attendanceMap.set(a.student_id, {
          status: a.status,
          remarks: a.remarks || '',
          in_time_formatted: a.in_time_formatted,
          out_time_formatted: a.out_time_formatted,
          punch_count: a.punch_count,
        });
      });

      const initialRows: StudentAttendanceRow[] = studentsData.map((s) => {
        const existing = attendanceMap.get(s.id);
        return {
          student: s,
          status: existing ? existing.status : 'Present',
          remarks: existing ? existing.remarks : '',
          in_time_formatted: existing?.in_time_formatted,
          out_time_formatted: existing?.out_time_formatted,
          punch_count: existing?.punch_count ?? 0,
        };
      });

      setRows(initialRows);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load students for this section.' });
    } finally {
      setLoading(false);
    }
  }, [selectedSectionId, selectedDate]);

  useEffect(() => {
    loadSectionAttendance();
  }, [loadSectionAttendance]);

  const setStudentStatus = (studentId: number, status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) => (r.student.id === studentId ? { ...r, status } : r))
    );
  };

  const setStudentRemarks = (studentId: number, remarks: string) => {
    setRows((prev) =>
      prev.map((r) => (r.student.id === studentId ? { ...r, remarks } : r))
    );
  };

  const markAll = (status: AttendanceStatus) => {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
  };

  const saveAttendance = async () => {
    if (!selectedSectionId || rows.length === 0) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        section_id: selectedSectionId,
        date: selectedDate,
        send_absent_sms: sendSms,
        attendances: rows.map((r) => ({
          student_id: r.student.id,
          status: r.status,
          remarks: r.remarks,
        })),
      };

      const res = await attendanceApi.submitBulkAttendance(payload);
      setFeedback({
        type: 'success',
        message: `${res.message} ${sendSms ? '(SMS alert triggered for absentees)' : ''}`,
      });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to submit attendance.' });
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: rows.length,
    present: rows.filter((r) => r.status === 'Present').length,
    absent: rows.filter((r) => r.status === 'Absent').length,
    late: rows.filter((r) => r.status === 'Late').length,
    percentage:
      rows.length > 0
        ? Math.round((rows.filter((r) => r.status === 'Present').length / rows.length) * 100)
        : 0,
  };

  return {
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
    holidayInfo,
    setStudentStatus,
    setStudentRemarks,
    markAll,
    saveAttendance,
  };
};

