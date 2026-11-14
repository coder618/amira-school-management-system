import { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api';
import { academicApi } from '../../academic/api';
import {
  Payment,
  FundCollectionName,
  CreatePaymentPayload,
  SettlePaymentPayload,
  CreateFundCollectionNamePayload,
} from '../types';
import { Student } from '../../academic/types';

export const useFinance = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fundCollections, setFundCollections] = useState<FundCollectionName[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [collectionFilter, setCollectionFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [payData, colData, stuData] = await Promise.all([
        financeApi.getPayments({
          status: statusFilter || undefined,
          fund_collection_name_id: collectionFilter || undefined,
          search: searchQuery || undefined,
        }),
        financeApi.getFundCollections(),
        academicApi.getStudents(),
      ]);
      setPayments(payData);
      setFundCollections(colData);
      setStudents(stuData);
    } catch {
      setError('Failed to fetch collections and payment records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, collectionFilter, searchQuery]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Payment CRUD
  const addPayment = async (payload: CreatePaymentPayload) => {
    const res = await financeApi.createPayment(payload);
    await fetchFinanceData();
    return res;
  };

  const settlePayment = async (paymentId: number, payload: SettlePaymentPayload) => {
    const res = await financeApi.settlePayment(paymentId, payload);
    await fetchFinanceData();
    return res;
  };

  const deletePayment = async (paymentId: number) => {
    const res = await financeApi.deletePayment(paymentId);
    await fetchFinanceData();
    return res;
  };

  // FundCollectionName CRUD
  const addFundCollection = async (payload: CreateFundCollectionNamePayload) => {
    const res = await financeApi.createFundCollection(payload);
    await fetchFinanceData();
    return res;
  };

  const updateFundCollection = async (id: number, payload: Partial<CreateFundCollectionNamePayload>) => {
    const res = await financeApi.updateFundCollection(id, payload);
    await fetchFinanceData();
    return res;
  };

  const deleteFundCollection = async (id: number) => {
    const res = await financeApi.deleteFundCollection(id);
    await fetchFinanceData();
    return res;
  };

  // Financial Aggregate Metrics
  const totalBilled = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
  const totalDue = payments.reduce((sum, p) => sum + Number(p.due_amount || 0), 0);
  const transactionCount = payments.length;

  return {
    payments,
    fundCollections,
    students,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    collectionFilter,
    setCollectionFilter,
    searchQuery,
    setSearchQuery,
    totalBilled,
    totalCollected,
    totalDue,
    transactionCount,
    fetchFinanceData,
    addPayment,
    settlePayment,
    deletePayment,
    addFundCollection,
    updateFundCollection,
    deleteFundCollection,

    // Backward compatibility aliases
    invoices: payments,
    categories: fundCollections,
    addInvoice: addPayment,
  };
};
