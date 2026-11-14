import { TenantEntity, BaseEntity } from '../../../shared/types';
import { Student } from '../../academic/types';

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Rocket' | 'Upay';
export type PaymentStatus = 'paid' | 'due' | 'partially_paid' | 'cancelled';
export type InvoiceStatus = 'paid' | 'partially_paid' | 'due';
export type CollectionInterval = 'Monthly' | 'Quarterly' | '6 Months' | 'Yearly' | 'One-Time';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: string;
  phone_number?: string | null;
  profile_picture?: string | null;
}

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
  fund_collection_name_id?: number | null;
  student_id?: number | null;
  invoice_id?: number | null;
  user_id?: number | null;
  receipt_no: string;
  amount: number;
  paid_amount: number;
  due_amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod | string;
  transaction_id?: string | null;
  payment_date?: string | null;
  due_date?: string | null;
  received_by?: string | null;
  notes?: string | null;
  student?: Student;
  fund_collection_name?: FundCollectionName;
  user?: UserSummary;
}

export interface Invoice extends TenantEntity {
  user_id: number;
  student_id?: number | null;
  fund_collection_name_id?: number | null;
  invoice_no: string;
  title: string;
  amount: number;
  paid_amount: number;
  due_amount: number;
  status: InvoiceStatus;
  payment_method?: string | null;
  transaction_id?: string | null;
  due_date?: string | null;
  notes?: string | null;
  user?: UserSummary;
  student?: Student;
  fund_collection_name?: FundCollectionName;
  payments?: Payment[];
}

export interface CreateInvoicePayload {
  user_id: number;
  title: string;
  amount: number;
  fund_collection_name_id?: number;
  student_id?: number;
  due_date?: string;
  notes?: string;
}

export interface PayInvoicePayload {
  amount: number;
  payment_method: string;
  transaction_id: string;
  notes?: string;
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
  payment_method: PaymentMethod | string;
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
export type CreateFeeCategoryPayload = CreateFundCollectionNamePayload;
