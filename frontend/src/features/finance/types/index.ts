import { TenantEntity, BaseEntity } from '../../../shared/types';
import { Student } from '../../academic/types';

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank';
export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface FeeCategory extends BaseEntity {
  school_id: number;
  name: string; // Tuition, Exam, Admission, Session Fee
  description?: string;
}

export interface Invoice extends TenantEntity {
  student_id: number;
  fee_category_id?: number | null;
  invoice_number: string;
  title: string;
  amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string;
  status: InvoiceStatus;
  student?: Student;
  fee_category?: FeeCategory;
  payments?: Payment[];
}

export interface Payment extends BaseEntity {
  school_id: number;
  invoice_id: number;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string | null;
  payment_date: string;
  received_by?: string;
  notes?: string;
}

export interface CreateInvoicePayload {
  student_id: number;
  fee_category_id: number;
  title: string;
  amount: number;
  due_date: string;
}

export interface RecordPaymentPayload {
  invoice_id: number;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
  notes?: string;
}

