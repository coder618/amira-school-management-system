import { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api';
import { academicApi } from '../../academic/api';
import {
  Payment,
  FundCollectionName,
  Invoice,
  CreateInvoicePayload,
  PayInvoicePayload,
  CreatePaymentPayload,
  SettlePaymentPayload,
  CreateFundCollectionNamePayload,
  UserSummary,
} from '../types';
import { Student } from '../../academic/types';

export const useFinance = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fundCollections, setFundCollections] = useState<FundCollectionName[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
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
      const [invData, payData, colData, stuData, userData] = await Promise.all([
        financeApi.getInvoices({
          status: statusFilter || undefined,
          fund_collection_name_id: collectionFilter || undefined,
          search: searchQuery || undefined,
        }),
        financeApi.getPayments({
          status: statusFilter || undefined,
          fund_collection_name_id: collectionFilter || undefined,
          search: searchQuery || undefined,
        }),
        financeApi.getFundCollections(),
        academicApi.getStudents(),
        financeApi.getUsers().catch(() => []),
      ]);
      setInvoices(invData);
      setPayments(payData);
      setFundCollections(colData);
      setStudents(stuData);
      setUsers(userData);
    } catch {
      setError('Failed to fetch finance records and invoices.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, collectionFilter, searchQuery]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Invoice Actions
  const addInvoice = async (payload: CreateInvoicePayload) => {
    const res = await financeApi.createInvoice(payload);
    await fetchFinanceData();
    return res;
  };

  const updateInvoice = async (id: number, payload: Partial<CreateInvoicePayload>) => {
    const res = await financeApi.updateInvoice(id, payload);
    await fetchFinanceData();
    return res;
  };

  const payInvoice = async (invoiceId: number, payload: PayInvoicePayload) => {
    const res = await financeApi.payInvoice(invoiceId, payload);
    await fetchFinanceData();
    return res;
  };

  const deleteInvoice = async (id: number) => {
    const res = await financeApi.deleteInvoice(id);
    await fetchFinanceData();
    return res;
  };

  // Payment Actions
  const addPayment = async (payload: CreatePaymentPayload) => {
    const res = await financeApi.createPayment(payload);
    await fetchFinanceData();
    return res;
  };

  const updatePayment = async (paymentId: number, payload: Partial<CreatePaymentPayload>) => {
    const res = await financeApi.updatePayment(paymentId, payload);
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

  // Fund Collection Head Actions
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

  // Computed Totals for Invoices
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalInvoiceCollected = invoices.reduce((sum, inv) => sum + Number(inv.paid_amount), 0);
  const totalInvoiceDue = invoices.reduce((sum, inv) => sum + Number(inv.due_amount), 0);

  // Computed Totals for Direct Payments
  const totalBilled = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
  const totalCollected = payments.reduce((sum, pay) => sum + Number(pay.paid_amount), 0);
  const totalDue = payments.reduce((sum, pay) => sum + Number(pay.due_amount), 0);

  return {
    invoices,
    payments,
    fundCollections,
    students,
    users,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    collectionFilter,
    setCollectionFilter,
    searchQuery,
    setSearchQuery,
    fetchFinanceData,
    // Invoice methods & metrics
    addInvoice,
    updateInvoice,
    payInvoice,
    deleteInvoice,
    totalInvoiced,
    totalInvoiceCollected,
    totalInvoiceDue,
    // Payment methods & metrics
    addPayment,
    updatePayment,
    settlePayment,
    deletePayment,
    totalBilled,
    totalCollected,
    totalDue,
    transactionCount: payments.length,
    // Fund Collection methods
    addFundCollection,
    updateFundCollection,
    deleteFundCollection,
  };
};
