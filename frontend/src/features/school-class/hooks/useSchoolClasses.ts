import { useState, useEffect, useCallback } from 'react';
import { schoolClassApi } from '../api';
import { ClassLevel, ClassLevelPayload, SectionPayload } from '../types';

export const useSchoolClasses = () => {
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await schoolClassApi.getClasses();
      setClasses(data);
    } catch {
      setError('Could not retrieve school classes roster.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const addClass = async (payload: ClassLevelPayload) => {
    const res = await schoolClassApi.createClass(payload);
    await fetchClasses();
    return res;
  };

  const updateClass = async (id: number, payload: Partial<ClassLevelPayload>) => {
    const res = await schoolClassApi.updateClass(id, payload);
    await fetchClasses();
    return res;
  };

  const removeClass = async (id: number) => {
    const res = await schoolClassApi.deleteClass(id);
    await fetchClasses();
    return res;
  };

  const addSection = async (payload: SectionPayload) => {
    const res = await schoolClassApi.createSection(payload);
    await fetchClasses();
    return res;
  };

  const removeSection = async (id: number) => {
    const res = await schoolClassApi.deleteSection(id);
    await fetchClasses();
    return res;
  };

  const filteredClasses = classes.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.numeric_value !== undefined && String(c.numeric_value).includes(q))
    );
  });

  return {
    classes: filteredClasses,
    allClasses: classes,
    loading,
    error,
    search,
    setSearch,
    fetchClasses,
    addClass,
    updateClass,
    removeClass,
    addSection,
    removeSection,
  };
};

