import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { PayInvoiceModal } from './PayInvoiceModal';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { CreatePaymentModal } from './CreatePaymentModal';
import { FundCollectionModal } from './FundCollectionModal';
import { Invoice, Payment, FundCollectionName } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import {
  CreditCard,
  Plus,
  TrendingUp,
  AlertCircle,
  Receipt,
  Loader2,
  Layers,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  Eye,
} from 'lucide-react';

export const InvoiceList: React.FC = () => {
  const {
    invoices,
    payments,
    fundCollections,
    students,
    users,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    collectionFilter,
    setCollectionFilter,
    searchQuery,
    setSearchQuery,
    addInvoice,
    payInvoice,
    deleteInvoice,
    totalInvoiced,
    totalInvoiceCollected,
    totalInvoiceDue,
    addPayment,
    deletePayment,
    totalBilled,
    totalCollected,
    totalDue,
    transactionCount,
    addFundCollection,
    updateFundCollection,
    deleteFundCollection,
  } = useFinance();

  // Active Tab: 'invoices', 'payments', or 'collections'
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'collections'>('invoices');

  // Modals state
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [selectedCollectionToEdit, setSelectedCollectionToEdit] = useState<FundCollectionName | null>(null);

  const getInvoiceStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Partially Paid
          </span>
        );
      case 'due':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            Due
          </span>
        );
    }
  };

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

  const getIntervalBadge = (interval: string) => {
    switch (interval) {
      case 'Monthly':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '6 Months':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Yearly':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Quarterly':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!window.confirm(`Delete invoice #${inv.invoice_no}?`)) return;
    try {
      await deleteInvoice(inv.id);
    } catch {
      // Handled in hook
    }
  };

  const handleDeleteCollection = async (col: FundCollectionName) => {
    if (!window.confirm(`Delete collection head "${col.name}"?`)) return;
    try {
      await deleteFundCollection(col.id);
    } catch {
      // Handled in hook
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
            Billing, Invoices & Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            User-attached invoices, gateway payments, partial payments & tenant fee collections
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Issue New Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Receipt className="h-4 w-4 text-emerald-600" />
            <span>Direct Payment</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCollectionToEdit(null);
              setIsCollectionModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>Collection Heads</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {activeTab === 'invoices' ? 'Total Invoiced' : 'Total Billed'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {formatBdtCurrency(activeTab === 'invoices' ? totalInvoiced : totalBilled)}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            {activeTab === 'invoices' ? `${invoices.length} user invoices issued` : `${transactionCount} total records`}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Total Collected
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-emerald-600 font-mono tracking-tight">
            {formatBdtCurrency(activeTab === 'invoices' ? totalInvoiceCollected : totalCollected)}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
            Realized cash, bKash & Nagad revenue
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
            {formatBdtCurrency(activeTab === 'invoices' ? totalInvoiceDue : totalDue)}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
            Pending student & user payments
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Collection Heads
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {fundCollections.length}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            Active fee heads & collection plans
          </span>
        </div>
      </div>

      {/* Tabs & Search Filter Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>User Invoices ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Payments Module ({payments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'collections'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Fund Collection Names ({fundCollections.length})</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, user, TrxID..."
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

      {/* TAB 1: USER INVOICES */}
      {activeTab === 'invoices' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Invoices Ledger</h3>
              <p className="text-xs text-slate-500">
                Invoices attached to individual users. Partial payments generate verified transaction slips in Payments.
              </p>
            </div>
            <button
              onClick={() => setIsCreateInvoiceOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Invoice</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Invoice # & Purpose</th>
                  <th className="py-3 px-4">Attached User</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid / Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment System / TrxID</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        <span className="text-xs font-medium">Loading user invoices...</span>
                      </div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Receipt className="h-8 w-8 text-slate-300" />
                        <p className="font-semibold text-slate-700">No invoices found</p>
                        <p className="text-xs text-slate-400">
                          Issue a new invoice to a user or adjust your search filter.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsCreateInvoiceOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Issue First Invoice</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{inv.invoice_no}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">{inv.title}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                            {inv.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 truncate max-w-[150px]">
                              {inv.user?.name || 'Attached User'}
                            </p>
                            <span className="text-[10px] text-slate-400">{inv.user?.role || 'User'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 font-mono">
                          {formatBdtCurrency(Number(inv.amount))}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <p className="text-emerald-600 font-semibold">
                            Paid: {formatBdtCurrency(Number(inv.paid_amount))}
                          </p>
                          <p className="text-rose-600 font-semibold">
                            Due: {formatBdtCurrency(Number(inv.due_amount))}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getInvoiceStatusBadge(inv.status)}</td>
                      <td className="py-3 px-4">
                        {inv.payment_method ? (
                          <div className="text-[11px]">
                            <span className="font-semibold text-slate-800">{inv.payment_method}</span>
                            {inv.transaction_id && (
                              <p className="text-slate-400 font-mono text-[10px] truncate max-w-[120px]">
                                Trx: {inv.transaction_id}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Unsettled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {inv.due_date || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status !== 'paid' && Number(inv.due_amount) > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceForPay(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                              title="Record payment via bKash, Nagad, Bank, etc."
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Pay</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="View Invoice & Payment Slips"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {inv.payments?.length === 0 && Number(inv.paid_amount) === 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(inv)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT PAYMENTS MODULE */}
      {activeTab === 'payments' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payments Module Ledger</h3>
              <p className="text-xs text-slate-500">
                Official transaction slips, gateway collections, and fee settlements
              </p>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Direct Payment</span>
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
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <CreditCard className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No payment records found</p>
                      <p className="text-xs text-slate-400">Payments will appear here when recorded or when invoices are paid.</p>
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
                            onClick={() => handleDeletePayment(p)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
      )}

      {/* TAB 3: FUND COLLECTION HEADS */}
      {activeTab === 'collections' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fund Collection Heads</h3>
              <p className="text-xs text-slate-500">
                School-wide collection types (Monthly tuition, Exam fee, Admission, Lab, Library)
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCollectionToEdit(null);
                setIsCollectionModalOpen(true);
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Collection Head</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {fundCollections.map((col) => (
              <div
                key={col.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getIntervalBadge(col.interval)}`}>
                      {col.interval}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedCollectionToEdit(col);
                          setIsCollectionModalOpen(true);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(col)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{col.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {col.description || 'General fee collection parameter'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Standard Rate</span>
                  <span className="text-sm font-extrabold text-indigo-600 font-mono">
                    {formatBdtCurrency(Number(col.default_amount))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSubmit={addInvoice}
        users={users}
        fundCollections={fundCollections}
      />

      <PayInvoiceModal
        isOpen={!!selectedInvoiceForPay}
        onClose={() => setSelectedInvoiceForPay(null)}
        onSubmit={payInvoice}
        invoice={selectedInvoiceForPay}
      />

      <InvoiceDetailsModal
        isOpen={!!selectedInvoiceForView}
        onClose={() => setSelectedInvoiceForView(null)}
        invoice={selectedInvoiceForView}
        onPayClick={(inv) => setSelectedInvoiceForPay(inv)}
      />

      <CreatePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={addPayment}
        fundCollections={fundCollections}
        students={students}
      />

      <FundCollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onSubmit={async (payload) => {
          if (selectedCollectionToEdit) {
            await updateFundCollection(selectedCollectionToEdit.id, payload);
          } else {
            await addFundCollection(payload);
          }
        }}
        collectionToEdit={selectedCollectionToEdit}
      />
    </div>
  );
};
