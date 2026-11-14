import { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api';
import { academicApi } from '../../academic/api';
import { Invoice, FeeCategory, CreateInvoicePayload, RecordPaymentPayload } from '../types';
import { Student } from '../../academic/types';

export const useFinance = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invData, catData, stuData] = await Promise.all([
        financeApi.getInvoices(statusFilter ? { status: statusFilter } : undefined),
        financeApi.getFeeCategories(),
        academicApi.getStudents(),
      ]);
      setInvoices(invData);
      setCategories(catData);
      setStudents(stuData);
    } catch {
      setError('Failed to fetch billing and invoice records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const addInvoice = async (payload: CreateInvoicePayload) => {
    const res = await financeApi.createInvoice(payload);
    await fetchFinanceData();
    return res;
  };

  const addPayment = async (payload: RecordPaymentPayload) => {
    const res = await financeApi.recordPayment(payload);
    await fetchFinanceData();
    return res;
  };

  // Financial Aggregate KPIs
  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.paid_amount), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.due_amount), 0);

  return {
    invoices,
    categories,
    students,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    totalBilled,
    totalCollected,
    totalDue,
    fetchFinanceData,
    addInvoice,
    addPayment,
  };
};

