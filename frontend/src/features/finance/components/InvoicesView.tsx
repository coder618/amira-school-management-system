import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { EditInvoiceModal } from './EditInvoiceModal';
import { PayInvoiceModal } from './PayInvoiceModal';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { Invoice } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import {
  Receipt,
  Plus,
  TrendingUp,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  Eye,
  CreditCard,
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const {
    invoices,
    fundCollections,
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
    updateInvoice,
    payInvoice,
    deleteInvoice,
    totalInvoiced,
    totalInvoiceCollected,
    totalInvoiceDue,
  } = useFinance();

  // Modals state
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<Invoice | null>(null);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);

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

  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!window.confirm(`Delete invoice #${inv.invoice_no}?`)) return;
    try {
      await deleteInvoice(inv.id);
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
            <Receipt className="h-7 w-7 text-indigo-600" />
            Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            User-attached billing invoices, fee statements, partial payments & due tracking
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
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Invoiced
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {formatBdtCurrency(totalInvoiced)}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            Total billed volume across users
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
            {formatBdtCurrency(totalInvoiceCollected)}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
            Realized cash, bKash & Nagad payments
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
            {formatBdtCurrency(totalInvoiceDue)}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
            Pending student & user invoice dues
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Invoices
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {invoices.length}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            Issued billing records
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="text-xs font-bold text-slate-600">
          Showing {invoices.length} Invoice{invoices.length === 1 ? '' : 's'}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice #, user, TrxID..."
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

      {/* Invoices Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">User Invoices Ledger</h3>
            <p className="text-xs text-slate-500">
              View, edit, settle, and track all student and user attached invoices
            </p>
          </div>
          <button
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
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
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer"
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
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForEdit(inv)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Invoice Details"
                        >
                          <Edit2 className="h-4 w-4" />
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

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSubmit={addInvoice}
        users={users}
        fundCollections={fundCollections}
      />

      <EditInvoiceModal
        isOpen={!!selectedInvoiceForEdit}
        onClose={() => setSelectedInvoiceForEdit(null)}
        onSubmit={updateInvoice}
        invoice={selectedInvoiceForEdit}
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
    </div>
  );
};
