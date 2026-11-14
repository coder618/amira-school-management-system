import { apiClient } from '../../../shared/services/apiClient';
import { Invoice, Payment, FeeCategory, CreateInvoicePayload, RecordPaymentPayload } from '../types';

export const financeApi = {
  getInvoices: async (params?: { student_id?: number; status?: string }): Promise<Invoice[]> => {
    const res = await apiClient.get<Invoice[]>('/invoices', { params });
    return res.data;
  },

  createInvoice: async (payload: CreateInvoicePayload): Promise<Invoice> => {
    const res = await apiClient.post<Invoice>('/invoices', payload);
    return res.data;
  },

  recordPayment: async (payload: RecordPaymentPayload): Promise<Payment> => {
    const res = await apiClient.post<Payment>('/payments', payload);
    return res.data;
  },

  getFeeCategories: async (): Promise<FeeCategory[]> => {
    const res = await apiClient.get<FeeCategory[]>('/fee-categories');
    return res.data;
  },
};

