import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { CreatePaymentModal } from './CreatePaymentModal';
import { SettlePaymentModal } from './SettlePaymentModal';
import { FundCollectionModal } from './FundCollectionModal';
import { Payment, FundCollectionName } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import {
  CreditCard,
  Plus,
  TrendingUp,
  AlertCircle,
  Receipt,
  Loader2,
  Calendar,
  Layers,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  DollarSign,
} from 'lucide-react';

export const InvoiceList: React.FC = () => {
  const {
    payments,
    fundCollections,
    students,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    collectionFilter,
    setCollectionFilter,
    searchQuery,
    setSearchQuery,
    totalBilled,
    totalCollected,
    totalDue,
    transactionCount,
    addPayment,
    settlePayment,
    deletePayment,
    addFundCollection,
    updateFundCollection,
    deleteFundCollection,
  } = useFinance();

  // Active Tab: 'payments' or 'collections'
  const [activeTab, setActiveTab] = useState<'payments' | 'collections'>('payments');

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentForSettle, setSelectedPaymentForSettle] = useState<Payment | null>(null);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [selectedCollectionToEdit, setSelectedCollectionToEdit] = useState<FundCollectionName | null>(null);

  const getStatusBadge = (status: Payment['status']) => {
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

  const getStatusLabel = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'Paid in Full';
      case 'partially_paid':
        return 'Partially Paid';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Payment Due';
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

  const handleDeleteCollection = async (col: FundCollectionName) => {
    if (!window.confirm(`Delete collection head "${col.name}"?`)) return;
    try {
      await deleteFundCollection(col.id);
    } catch {
      // error is handled by hook
    }
  };

  const handleDeletePayment = async (p: Payment) => {
    if (!window.confirm(`Delete payment transaction "${p.receipt_no}"?`)) return;
    try {
      await deletePayment(p.id);
    } catch {
      // error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-indigo-600" />
            Fees, Collections & Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Tenant-scoped Fund Collection Names and Student Payments ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedCollectionToEdit(null);
              setIsCollectionModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>Manage Collection Heads</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record New Payment</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Billed
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">
            {formatBdtCurrency(totalBilled)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{transactionCount} total payment vouchers</p>
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
          <p className="text-xs text-emerald-600 mt-0.5">Realized in bank/MFS/cash</p>
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

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Collection Heads
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">
            {fundCollections.length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Active categories & intervals</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/60 px-6 pt-3 flex gap-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Student Payments & Dues ({payments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'collections'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Fund Collection Names ({fundCollections.length})</span>
          </button>
        </div>

        {/* TAB 1: Payments & Student Billing */}
        {activeTab === 'payments' && (
          <div className="p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt, student name, roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Collection Filter */}
                <select
                  value={collectionFilter || ''}
                  onChange={(e) => setCollectionFilter(e.target.value ? Number(e.target.value) : null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="">All Collection Heads</option>
                  {fundCollections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid in Full</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="due">Payment Due</option>
                </select>
              </div>
            </div>

            {/* Payments Table */}
            {loading ? (
              <div className="flex items-center justify-center p-16 text-slate-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Fetching payment vouchers...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                <Receipt className="mx-auto h-9 w-9 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No payment records found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click "Record New Payment" to create student billing vouchers based on a Fund Collection Name.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Receipt / Date</th>
                      <th className="py-3 px-4">Student Details</th>
                      <th className="py-3 px-4">Fund Collection Head</th>
                      <th className="py-3 px-4 text-right">Amount (BDT)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{p.receipt_no}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {p.payment_date || p.due_date || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {p.student ? (
                            <div>
                              <span className="font-bold text-slate-800 block">
                                {p.student.first_name} {p.student.last_name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Roll: {p.student.roll_number ?? 'N/A'} • {p.student.student_id}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">Student #{p.student_id}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">
                            {p.fund_collection_name?.name || 'General Fee'}
                          </span>
                          {p.fund_collection_name?.interval && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-0.5 ${getIntervalBadge(
                                p.fund_collection_name.interval
                              )}`}
                            >
                              {p.fund_collection_name.interval}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-extrabold text-slate-900 block">
                            {formatBdtCurrency(Number(p.amount))}
                          </span>
                          <span className="text-[11px] block mt-0.5">
                            Paid: <strong className="text-emerald-600">{formatBdtCurrency(Number(p.paid_amount))}</strong>
                          </span>
                          {Number(p.due_amount) > 0 && (
                            <span className="text-[11px] text-rose-600 font-semibold block">
                              Due: {formatBdtCurrency(Number(p.due_amount))}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusBadge(
                              p.status
                            )}`}
                          >
                            {p.status === 'paid' && <CheckCircle className="h-3 w-3" />}
                            {p.status === 'partially_paid' && <Clock className="h-3 w-3" />}
                            {p.status === 'due' && <AlertCircle className="h-3 w-3" />}
                            {getStatusLabel(p.status)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {p.payment_method}
                          </span>
                          {p.transaction_id && (
                            <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                              {p.transaction_id}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {Number(p.due_amount) > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedPaymentForSettle(p)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                              >
                                <span>Settle Due</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Fund Collection Names */}
        {activeTab === 'collections' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Institutional Fund Collection Heads
                </h3>
                <p className="text-xs text-slate-500">
                  Define school fee categories and billing frequency (Monthly, 6 Months, Yearly, One-Time).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCollectionToEdit(null);
                  setIsCollectionModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Collection Head</span>
              </button>
            </div>

            {fundCollections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <Layers className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No collection heads defined yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Click "Add Collection Head" to register fee categories.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Collection Name</th>
                      <th className="py-3 px-4">Billing Interval</th>
                      <th className="py-3 px-4 text-right">Standard Amount</th>
                      <th className="py-3 px-4 text-center">Transactions</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fundCollections.map((col) => (
                      <tr key={col.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {col.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getIntervalBadge(
                              col.interval
                            )}`}
                          >
                            {col.interval}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                          {formatBdtCurrency(Number(col.default_amount || 0))}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-semibold text-slate-700">
                            {col.payments_count ?? 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              col.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {col.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {col.description || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCollectionToEdit(col);
                                setIsCollectionModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Edit Collection Head"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCollection(col)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Collection Head"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreatePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={addPayment}
        students={students}
        fundCollections={fundCollections}
      />

      <SettlePaymentModal
        payment={selectedPaymentForSettle}
        onClose={() => setSelectedPaymentForSettle(null)}
        onSubmit={settlePayment}
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
