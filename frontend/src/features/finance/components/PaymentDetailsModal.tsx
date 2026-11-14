import React from 'react';
import { Payment } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import { X, CreditCard, CheckCircle, Clock, AlertCircle, User, Calendar, Tag, Printer } from 'lucide-react';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onSettleClick?: (payment: Payment) => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  payment,
  onSettleClick,
}) => {
  if (!isOpen || !payment) return null;

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Partially Paid
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      case 'due':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            Due
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">Receipt #{payment.receipt_no}</h3>
                {getStatusBadge(payment.status)}
              </div>
              <p className="text-xs text-slate-500">Official Payment Transaction Voucher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* User / Student Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-2">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              Payee Information
            </span>
            {payment.student ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  {payment.student.first_name} {payment.student.last_name || ''}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span>Student ID: <strong className="text-slate-700 font-mono">{payment.student.student_id}</strong></span>
                  {payment.student.roll_number && (
                    <span>Roll: <strong className="text-slate-700 font-mono">{payment.student.roll_number}</strong></span>
                  )}
                  {payment.student.class_level?.name && (
                    <span>Class: <strong className="text-slate-700">{payment.student.class_level.name}</strong></span>
                  )}
                </div>
              </div>
            ) : payment.user ? (
              <div>
                <p className="text-sm font-bold text-slate-900">{payment.user.name}</p>
                <p className="text-xs text-slate-500">{payment.user.email} • {payment.user.role}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">General Payee</p>
            )}
          </div>

          {/* Amount Overview Card */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 text-white shadow-sm">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Total Bill</span>
              <p className="text-lg font-bold font-mono text-white mt-0.5">
                {formatBdtCurrency(Number(payment.amount))}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400">Paid Amount</span>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {formatBdtCurrency(Number(payment.paid_amount))}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-rose-400">Outstanding Due</span>
              <p className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                {formatBdtCurrency(Number(payment.due_amount))}
              </p>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1">
                <Tag className="h-3 w-3 text-indigo-500" />
                Collection Category
              </span>
              <p className="text-xs font-semibold text-slate-900">
                {payment.fund_collection_name?.name || 'General Tuition / Fee'}
              </p>
              {payment.fund_collection_name?.interval && (
                <span className="text-[11px] text-slate-500">Interval: {payment.fund_collection_name.interval}</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1">
                <CreditCard className="h-3 w-3 text-indigo-500" />
                Payment Gateway & TrxID
              </span>
              <p className="text-xs font-semibold text-slate-900">
                Method: <span className="text-indigo-600 font-bold">{payment.payment_method}</span>
              </p>
              {payment.transaction_id && (
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  TrxID: {payment.transaction_id}
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-indigo-500" />
                Payment Date
              </span>
              <p className="text-xs font-semibold text-slate-900">
                {payment.payment_date || (payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '—')}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-rose-500" />
                Due Date
              </span>
              <p className="text-xs font-semibold text-slate-900">
                {payment.due_date || '—'}
              </p>
            </div>
          </div>

          {/* Notes / Remarks */}
          {payment.notes && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block mb-1">
                Remarks / Notes
              </span>
              <p className="text-xs text-amber-900 leading-relaxed">{payment.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Receipt</span>
          </button>

          <div className="flex items-center gap-2">
            {payment.status !== 'paid' && Number(payment.due_amount) > 0 && onSettleClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSettleClick(payment);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Settle Due Balance</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
