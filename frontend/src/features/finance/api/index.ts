import { apiClient } from '../../../shared/services/apiClient';
import {
  Payment,
  FundCollectionName,
  CreatePaymentPayload,
  SettlePaymentPayload,
  CreateFundCollectionNamePayload,
  Invoice,
  CreateInvoicePayload,
  PayInvoicePayload,
  UserSummary,
} from '../types';

export const financeApi = {
  // Invoices Module APIs
  getInvoices: async (params?: { user_id?: number; status?: string; fund_collection_name_id?: number; search?: string }): Promise<Invoice[]> => {
    const res = await apiClient.get<Invoice[]>('/invoices', { params });
    return res.data;
  },

  getInvoiceById: async (id: number): Promise<Invoice> => {
    const res = await apiClient.get<Invoice>(`/invoices/${id}`);
    return res.data;
  },

  createInvoice: async (payload: CreateInvoicePayload): Promise<Invoice> => {
    const res = await apiClient.post<Invoice>('/invoices', payload);
    return res.data;
  },

  updateInvoice: async (id: number, payload: Partial<CreateInvoicePayload>): Promise<Invoice> => {
    const res = await apiClient.put<Invoice>(`/invoices/${id}`, payload);
    return res.data;
  },

  payInvoice: async (
    invoiceId: number,
    payload: PayInvoicePayload
  ): Promise<{ message: string; invoice: Invoice; payment: Payment }> => {
    const res = await apiClient.post<{ message: string; invoice: Invoice; payment: Payment }>(
      `/invoices/${invoiceId}/pay`,
      payload
    );
    return res.data;
  },

  deleteInvoice: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/invoices/${id}`);
    return res.data;
  },

  getInvoiceStats: async () => {
    const res = await apiClient.get('/invoices-stats');
    return res.data;
  },

  getUsers: async (params?: { role?: string; search?: string }): Promise<UserSummary[]> => {
    const res = await apiClient.get<UserSummary[]>('/users', { params });
    return res.data;
  },

  // Payments Module APIs
  getPayments: async (params?: { fund_collection_name_id?: number; student_id?: number; status?: string; payment_method?: string; search?: string }): Promise<Payment[]> => {
    const res = await apiClient.get<Payment[]>('/payments', { params });
    return res.data;
  },

  getPaymentById: async (id: number): Promise<Payment> => {
    const res = await apiClient.get<Payment>(`/payments/${id}`);
    return res.data;
  },

  createPayment: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const res = await apiClient.post<Payment>('/payments', payload);
    return res.data;
  },

  updatePayment: async (id: number, payload: Partial<CreatePaymentPayload>): Promise<Payment> => {
    const res = await apiClient.put<Payment>(`/payments/${id}`, payload);
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

  downloadPaymentPdf: async (paymentId: number, receiptNo: string): Promise<void> => {
    const res = await apiClient.get(`/payments/${paymentId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Receipt-${receiptNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
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
