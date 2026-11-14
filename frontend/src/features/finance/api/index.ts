import { apiClient } from '../../../shared/services/apiClient';
import {
  Payment,
  FundCollectionName,
  CreatePaymentPayload,
  SettlePaymentPayload,
  CreateFundCollectionNamePayload,
} from '../types';

export const financeApi = {
  // Payments Module APIs
  getPayments: async (params?: { fund_collection_name_id?: number; student_id?: number; status?: string; payment_method?: string; search?: string }): Promise<Payment[]> => {
    const res = await apiClient.get<Payment[]>('/payments', { params });
    return res.data;
  },

  createPayment: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const res = await apiClient.post<Payment>('/payments', payload);
    return res.data;
  },

  settlePayment: async (paymentId: number, payload: SettlePaymentPayload): Promise<{ message: string; payment: Payment }> => {
    const res = await apiClient.post<{ message: string; payment: Payment }>(`/payments/${paymentId}/settle`, payload);
    return res.data;
  },

  deletePayment: async (paymentId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/payments/${paymentId}`);
    return res.data;
  },

  getPaymentStats: async () => {
    const res = await apiClient.get('/payments-stats');
    return res.data;
  },

  // FundCollectionName Module APIs
  getFundCollections: async (params?: { interval?: string; is_active?: boolean; search?: string }): Promise<FundCollectionName[]> => {
    const res = await apiClient.get<FundCollectionName[]>('/fund-collection-names', { params });
    return res.data;
  },

  createFundCollection: async (payload: CreateFundCollectionNamePayload): Promise<FundCollectionName> => {
    const res = await apiClient.post<FundCollectionName>('/fund-collection-names', payload);
    return res.data;
  },

  updateFundCollection: async (id: number, payload: Partial<CreateFundCollectionNamePayload>): Promise<FundCollectionName> => {
    const res = await apiClient.put<FundCollectionName>(`/fund-collection-names/${id}`, payload);
    return res.data;
  },

  deleteFundCollection: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/fund-collection-names/${id}`);
    return res.data;
  },

  // Backward compatibility methods
  getInvoices: async (params?: { student_id?: number; status?: string }): Promise<Payment[]> => {
    const res = await apiClient.get<Payment[]>('/payments', { params });
    return res.data;
  },

  createInvoice: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const res = await apiClient.post<Payment>('/payments', payload);
    return res.data;
  },

  recordPayment: async (payload: SettlePaymentPayload & { invoice_id?: number }): Promise<Payment> => {
    if (payload.invoice_id) {
      const res = await apiClient.post<{ message: string; payment: Payment }>(`/payments/${payload.invoice_id}/settle`, payload);
      return res.data.payment;
    }
    throw new Error('Payment ID required to settle.');
  },

  getFeeCategories: async (): Promise<FundCollectionName[]> => {
    const res = await apiClient.get<FundCollectionName[]>('/fund-collection-names');
    return res.data;
  },
};
