import { useState, useEffect, useCallback } from 'react';
import { schoolsApi } from '../api';
import { OnboardedSchool, CreateSchoolPayload, CreateSchoolResponse } from '../types';

export const useSchools = () => {
  const [schools, setSchools] = useState<OnboardedSchool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await schoolsApi.getSchools();
      setSchools(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { status?: number; data?: { message?: string } } };
        if (ax.response?.status === 403) {
          setError('SuperAdmin privileges required. Access denied for standard administrative accounts.');
        } else {
          setError(ax.response?.data?.message || 'Failed to fetch onboarded schools.');
        }
      } else {
        setError('Network error communicating with multi-tenant controller.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const addSchool = async (payload: CreateSchoolPayload): Promise<CreateSchoolResponse> => {
    const res = await schoolsApi.createSchool(payload);
    await fetchSchools();
    return res;
  };

  const filteredSchools = schools.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.eiin && s.eiin.includes(q)) ||
      (s.board && s.board.toLowerCase().includes(q)) ||
      s.address.toLowerCase().includes(q) ||
      (s.users && s.users.some((u) => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)))
    );
  });

  return {
    schools: filteredSchools,
    totalCount: schools.length,
    loading,
    error,
    search,
    setSearch,
    fetchSchools,
    addSchool,
  };
};

