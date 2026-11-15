import { useState, useEffect, useCallback } from 'react';
import { hrApi } from '../api';
import { Teacher, TeacherPayload } from '../types';

export const useTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [department, setDepartment] = useState<string>('');

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hrApi.getTeachers();
      let filtered = data;
      if (search.trim()) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.user?.name.toLowerCase().includes(query) ||
            t.employee_id.toLowerCase().includes(query) ||
            t.designation.toLowerCase().includes(query) ||
            (t.phone_number && t.phone_number.includes(query))
        );
      }
      if (department) {
        filtered = filtered.filter((t) => t.department === department);
      }
      setTeachers(filtered);
    } catch {
      setError('Could not retrieve faculty roster.');
    } finally {
      setLoading(false);
    }
  }, [search, department]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const addTeacher = async (payload: TeacherPayload | FormData) => {
    const res = await hrApi.createTeacher(payload);
    await fetchTeachers();
    return res;
  };

  const updateTeacher = async (id: number, payload: Partial<TeacherPayload> | FormData) => {
    const res = await hrApi.updateTeacher(id, payload);
    await fetchTeachers();
    return res;
  };

  const removeTeacher = async (id: number) => {
    await hrApi.deleteTeacher(id);
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    teachers,
    loading,
    error,
    search,
    setSearch,
    department,
    setDepartment,
    fetchTeachers,
    addTeacher,
    updateTeacher,
    removeTeacher,
  };
};

