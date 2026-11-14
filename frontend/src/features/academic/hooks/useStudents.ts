import { useState, useEffect, useCallback } from 'react';
import { academicApi } from '../api';
import {
  Student,
  StudentFilterParams,
  ClassLevel,
  ClassLevelPayload,
  Section,
  Shift,
} from '../types';

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<StudentFilterParams>({
    search: '',
    class_level_id: undefined,
    section_id: undefined,
    shift_id: undefined,
    status: undefined,
  });

  const fetchClassLevels = useCallback(async () => {
    try {
      const classesData = await academicApi.getClassLevels();
      setClassLevels(classesData);
    } catch {
      // non-fatal
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [classesData, sectionsData, shiftsData] = await Promise.all([
        academicApi.getClassLevels(),
        academicApi.getSections(),
        academicApi.getShifts(),
      ]);
      setClassLevels(classesData);
      setSections(sectionsData);
      setShifts(shiftsData);
    } catch {
      // Non-fatal if metadata fails initially
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await academicApi.getStudents(filters);
      setStudents(data);
    } catch (err: unknown) {
      setError('Failed to fetch students. Please check your network or credentials.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  const addStudent = async (payload: FormData | Omit<Student, 'id' | 'created_at' | 'updated_at'> | any) => {
    const res = await academicApi.createStudent(payload);
    await fetchStudents();
    return res;
  };

  const removeStudent = async (id: number) => {
    await academicApi.deleteStudent(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStudent = async (id: number, payload: FormData | Partial<Student> | any) => {
    const res = await academicApi.updateStudent(id, payload);
    await fetchStudents();
    return res;
  };

  // Class Level CRUD
  const addClassLevel = async (payload: ClassLevelPayload) => {
    const res = await academicApi.createClassLevel(payload);
    await fetchClassLevels();
    return res;
  };

  const editClassLevel = async (id: number, payload: Partial<ClassLevelPayload>) => {
    const res = await academicApi.updateClassLevel(id, payload);
    await fetchClassLevels();
    return res;
  };

  const removeClassLevel = async (id: number) => {
    const res = await academicApi.deleteClassLevel(id);
    await fetchClassLevels();
    return res;
  };

  return {
    students,
    classLevels,
    sections,
    shifts,
    loading,
    error,
    filters,
    setFilters,
    fetchStudents,
    fetchClassLevels,
    fetchMetadata,
    addStudent,
    removeStudent,
    updateStudent,
    addClassLevel,
    editClassLevel,
    removeClassLevel,
  };
};

