import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../hooks/useFinance';
import { EditPaymentModal } from './EditPaymentModal';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { Payment } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  Receipt,
  Loader2,
  Search,
  CheckCircle,
  Trash2,
  Edit2,
  Eye,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const navigate = useNavigate();
  const {
    payments,
    fundCollections,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    collectionFilter,
    setCollectionFilter,
    searchQuery,
    setSearchQuery,
    updatePayment,
    deletePayment,
    totalBilled,
    totalCollected,
    totalDue,
    transactionCount,
  } = useFinance();

  // Modals state
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState<Payment | null>(null);
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<Payment | null>(null);

  const getPaymentStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partially_paid':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const handleDeletePayment = async (p: Payment) => {
    if (!window.confirm(`Delete payment transaction "${p.receipt_no}"?`)) return;
    try {
      await deletePayment(p.id);
    } catch {
      // Handled in hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-indigo-600" />
            Payments Module
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Official transaction slips, payment gateway receipts, and verified records
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/finance/invoices')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Receipt className="h-4 w-4" />
            <span>Pay via Invoices</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Billed
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {formatBdtCurrency(totalBilled)}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            {transactionCount} total payment transactions
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Total Realized
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-emerald-600 font-mono tracking-tight">
            {formatBdtCurrency(totalCollected)}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
            Cash, bKash & Nagad collected revenue
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
              Outstanding Due
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-rose-600 font-mono tracking-tight">
            {formatBdtCurrency(totalDue)}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
            Pending student fee balances
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payment Slips
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {payments.length}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            Verified payment vouchers
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="text-xs font-bold text-slate-600">
          Showing {payments.length} Payment Record{payments.length === 1 ? '' : 's'}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipt #, student, TrxID..."
              className="w-56 sm:w-64 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden shadow-xs"
            />
          </div>

          <select
            value={collectionFilter || ''}
            onChange={(e) => setCollectionFilter(e.target.value ? Number(e.target.value) : null)}
            className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden shadow-xs"
          >
            <option value="">All Collection Heads</option>
            {fundCollections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="due">Due</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payments Ledger Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payments Module Ledger</h3>
            <p className="text-xs text-slate-500">
              Official transaction slips and payment transaction records
            </p>
          </div>
          <button
            onClick={() => navigate('/finance/invoices')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Pay via Invoices</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Receipt # & Date</th>
                <th className="py-3 px-4">Student / User</th>
                <th className="py-3 px-4">Collection Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Paid / Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Method & TrxID</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                      <span className="text-xs font-medium">Loading payment records...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <CreditCard className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No payment records found</p>
                    <p className="text-xs text-slate-400">
                      Payment records will automatically appear here when invoices are paid.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/finance/invoices')}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>Go to Invoices</span>
                    </button>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-slate-900">{p.receipt_no}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {p.payment_date || (p.created_at ? new Date(p.created_at).toLocaleDateString() : '—')}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">
                        {p.student ? `${p.student.first_name} ${p.student.last_name || ''}` : p.user?.name || 'User'}
                      </p>
                      {p.student && (
                        <span className="text-[10px] text-slate-400">
                          ID: {p.student.student_id} • Roll: {p.student.roll_number}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                        {p.fund_collection_name?.name || 'General Tuition'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatBdtCurrency(Number(p.amount))}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <p className="text-emerald-600 font-semibold">{formatBdtCurrency(Number(p.paid_amount))}</p>
                      {Number(p.due_amount) > 0 && (
                        <p className="text-rose-600">Due: {formatBdtCurrency(Number(p.due_amount))}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPaymentStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{p.payment_method}</span>
                      {p.transaction_id && (
                        <p className="text-slate-400 font-mono text-[10px]">Trx: {p.transaction_id}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentForView(p)}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          title="View Payment Receipt Voucher"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentForEdit(p)}
                          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          title="Edit Payment Details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(p)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Payment Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <EditPaymentModal
        isOpen={!!selectedPaymentForEdit}
        onClose={() => setSelectedPaymentForEdit(null)}
        onSubmit={updatePayment}
        payment={selectedPaymentForEdit}
        fundCollections={fundCollections}
      />

      <PaymentDetailsModal
        isOpen={!!selectedPaymentForView}
        onClose={() => setSelectedPaymentForView(null)}
        payment={selectedPaymentForView}
      />
    </div>
  );
};
