import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { RecordPaymentModal } from './RecordPaymentModal';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { Invoice } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import {
  CreditCard,
  Plus,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Receipt,
  Loader2,
  Calendar,
} from 'lucide-react';

export const InvoiceList: React.FC = () => {
  const {
    invoices,
    categories,
    students,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    totalBilled,
    totalCollected,
    totalDue,
    addInvoice,
    addPayment,
  } = useFinance();

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partially_paid':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-indigo-600" />
            Fee Collection & Invoicing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Student tuition, examination fees, and MFS (bKash / Nagad) payment receipts
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInvoiceModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">
            {formatBdtCurrency(totalBilled)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Across all enrolled classes</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Collected Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-700">
            {formatBdtCurrency(totalCollected)}
          </div>
          <p className="text-xs text-emerald-600 mt-0.5">bKash, Nagad & Cash deposited</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Outstanding Dues
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-rose-700">
            {formatBdtCurrency(totalDue)}
          </div>
          <p className="text-xs text-rose-600 mt-0.5">Pending collection from students</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          All Student Bills ({invoices.length})
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:border-indigo-600 focus:outline-hidden"
        >
          <option value="">All Payment Statuses</option>
          <option value="unpaid">Unpaid Only</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Fully Paid</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Fetching invoices & payment receipts...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No invoices found</p>
            <p className="text-xs text-slate-400 mt-1">Generate a tuition or exam invoice to begin billing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Category & Title</th>
                  <th className="py-3 px-4">Billed Amount</th>
                  <th className="py-3 px-4">Paid (MFS/Cash)</th>
                  <th className="py-3 px-4">Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 text-xs">
                      {inv.invoice_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {inv.student?.first_name} {inv.student?.last_name}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {inv.student?.student_id} (Roll #{inv.student?.roll_number})
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{inv.title}</div>
                      <span className="text-xs text-slate-500">
                        {inv.fee_category?.name || 'General Fee'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatBdtCurrency(Number(inv.amount))}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-emerald-600">
                      {formatBdtCurrency(Number(inv.paid_amount))}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-rose-600">
                      {formatBdtCurrency(Number(inv.due_amount))}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize border ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {Number(inv.due_amount) > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForPayment(inv)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Collect</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        invoice={selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        onSubmit={addPayment}
      />

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSubmit={addInvoice}
        students={students}
        categories={categories}
      />
    </div>
  );
};

