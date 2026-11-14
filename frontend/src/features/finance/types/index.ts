import { TenantEntity, BaseEntity } from '../../../shared/types';
import { Student } from '../../academic/types';

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Rocket';
export type PaymentStatus = 'paid' | 'due' | 'partially_paid' | 'cancelled';
export type CollectionInterval = 'Monthly' | 'Quarterly' | '6 Months' | 'Yearly' | 'One-Time';

export interface FundCollectionName extends BaseEntity {
  school_id: number;
  academic_year_id?: number | null;
  name: string;
  interval: CollectionInterval;
  default_amount: number;
  description?: string | null;
  is_active: boolean;
  payments_count?: number;
}

export interface Payment extends TenantEntity {
  fund_collection_name_id: number;
  student_id: number;
  receipt_no: string;
  amount: number;
  paid_amount: number;
  due_amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  transaction_id?: string | null;
  payment_date?: string | null;
  due_date?: string | null;
  received_by?: string | null;
  notes?: string | null;
  student?: Student;
  fund_collection_name?: FundCollectionName;
}

export interface CreatePaymentPayload {
  fund_collection_name_id: number;
  student_id: number;
  amount: number;
  paid_amount?: number;
  status?: PaymentStatus;
  payment_method: PaymentMethod;
  transaction_id?: string;
  payment_date?: string;
  due_date?: string;
  notes?: string;
}

export interface SettlePaymentPayload {
  payment_amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
  notes?: string;
}

export interface CreateFundCollectionNamePayload {
  name: string;
  interval: CollectionInterval;
  default_amount?: number;
  description?: string;
  is_active?: boolean;
}

// Backward Compatibility Aliases
export type FeeCategory = FundCollectionName;
export type Invoice = Payment;
export type InvoiceStatus = PaymentStatus;
export type CreateInvoicePayload = CreatePaymentPayload;
export type RecordPaymentPayload = SettlePaymentPayload;
