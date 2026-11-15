import React from 'react';
import { Invoice } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import { X, Receipt, CheckCircle, Clock, AlertCircle, Shield, User, Calendar, CreditCard, Hash } from 'lucide-react';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPayClick: (invoice: Invoice) => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPayClick,
}) => {
  if (!isOpen || !invoice) return null;

  const getStatusBadge = (status: Invoice['status']) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">Invoice #{invoice.invoice_no}</h3>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-xs text-slate-500">{invoice.title}</p>
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
          {/* User Info & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-2">
                <User className="h-3.5 w-3.5 text-indigo-500" />
                Attached User Profile
              </span>
              <p className="text-sm font-bold text-slate-900">{invoice.user?.name || 'Attached User'}</p>
              <p className="text-xs text-slate-500">{invoice.user?.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-indigo-100/70 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                <Shield className="h-3 w-3" />
                {invoice.user?.role || 'User'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Timestamps & Details
              </span>
              <div className="space-y-1 text-xs">
                <p className="flex justify-between">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="font-semibold text-slate-900">{invoice.due_date || 'No due date'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Created:</span>
                  <span className="font-semibold text-slate-900">
                    {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '—'}
                  </span>
                </p>
                {invoice.fund_collection_name && (
                  <p className="flex justify-between">
                    <span className="text-slate-500">Collection Head:</span>
                    <span className="font-semibold text-indigo-600">{invoice.fund_collection_name.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 text-center">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Billed</span>
              <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                {formatBdtCurrency(Number(invoice.amount))}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-600">Total Collected</span>
              <p className="text-base font-extrabold text-emerald-600 font-mono mt-0.5">
                {formatBdtCurrency(Number(invoice.paid_amount))}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-rose-600">Outstanding Due</span>
              <p className="text-base font-extrabold text-rose-600 font-mono mt-0.5">
                {formatBdtCurrency(Number(invoice.due_amount))}
              </p>
            </div>
          </div>

          {/* Linked Payment Transactions from Payment Module */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Payment Records ({invoice.payments?.length || 0})
              </h4>
              <span className="text-[11px] text-slate-500">Archived in Payment Records</span>
            </div>

            {(!invoice.payments || invoice.payments.length === 0) ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                No payment transactions recorded for this invoice yet.
              </div>
            ) : (
              <div className="space-y-2">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">{p.receipt_no}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.payment_method}
                        </span>
                        {p.transaction_id && (
                          <span className="font-mono text-slate-500 text-[11px] flex items-center gap-0.5">
                            <Hash className="h-3 w-3" />
                            {p.transaction_id}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {p.payment_date || (p.created_at ? new Date(p.created_at).toLocaleDateString() : '—')} — Received by {p.received_by || 'Gateway'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-600 font-mono">
                        +{formatBdtCurrency(Number(p.paid_amount))}
                      </span>
                      <p className="text-[10px] text-slate-400 capitalize">{p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          {invoice.status !== 'paid' && Number(invoice.due_amount) > 0 && (
            <button
              onClick={() => {
                onClose();
                onPayClick(invoice);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Record Payment ({formatBdtCurrency(Number(invoice.due_amount))})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
