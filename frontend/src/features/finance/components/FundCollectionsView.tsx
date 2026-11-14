import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { FundCollectionModal } from './FundCollectionModal';
import { FundCollectionName } from '../types';
import { formatBdtCurrency } from '../../../shared/utils/validation';
import {
  Layers,
  Plus,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle,
  Search,
} from 'lucide-react';

export const FundCollectionsView: React.FC = () => {
  const {
    fundCollections,
    loading,
    error,
    addFundCollection,
    updateFundCollection,
    deleteFundCollection,
  } = useFinance();

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [selectedCollectionToEdit, setSelectedCollectionToEdit] = useState<FundCollectionName | null>(null);
  const [search, setSearch] = useState('');
  const [intervalFilter, setIntervalFilter] = useState('');

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
      // Handled in hook
    }
  };

  const filteredCollections = fundCollections.filter((col) => {
    const matchesSearch =
      col.name.toLowerCase().includes(search.toLowerCase()) ||
      (col.description && col.description.toLowerCase().includes(search.toLowerCase()));
    const matchesInterval = intervalFilter ? col.interval === intervalFilter : true;
    return matchesSearch && matchesInterval;
  });

  const monthlyCount = fundCollections.filter((c) => c.interval === 'Monthly').length;
  const yearlyCount = fundCollections.filter((c) => c.interval === 'Yearly' || c.interval === '6 Months').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="h-7 w-7 text-indigo-600" />
            Fund Collection Names
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Define, view, and configure school fee collection types (Monthly tuition, Exam fee, Admission, Lab, Library)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedCollectionToEdit(null);
              setIsCollectionModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Collection Head</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Fee Heads
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {fundCollections.length}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            Configured fee collection categories
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Monthly Collections
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-blue-600 font-mono tracking-tight">
            {monthlyCount}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-blue-600">
            Recurring monthly tuition & transport
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Term & Yearly Heads
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-purple-600 font-mono tracking-tight">
            {yearlyCount}
          </p>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-purple-600">
            Session, admission & semester exam fees
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="text-xs font-bold text-slate-600">
          Showing {filteredCollections.length} Collection Head{filteredCollections.length === 1 ? '' : 's'}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by collection name..."
              className="w-56 sm:w-64 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden shadow-xs"
            />
          </div>

          <select
            value={intervalFilter}
            onChange={(e) => setIntervalFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden shadow-xs"
          >
            <option value="">All Intervals</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="6 Months">6 Months</option>
            <option value="Yearly">Yearly</option>
            <option value="One-Time">One-Time</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Fund Collection Cards Grid */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Fund Collection Heads Catalog</h3>
            <p className="text-xs text-slate-500">
              Manage billing frequencies, descriptions, and default rate benchmarks
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCollectionToEdit(null);
              setIsCollectionModalOpen(true);
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Collection Head</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading collection heads...</span>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Layers className="h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-700">No collection heads found</p>
            <p className="text-xs text-slate-400">
              Create a new fee collection head or reset your search filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCollectionToEdit(null);
                setIsCollectionModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Fee Head</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredCollections.map((col) => (
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
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                        title="Edit collection head"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(col)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete collection head"
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
        )}
      </div>

      {/* Modal */}
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
