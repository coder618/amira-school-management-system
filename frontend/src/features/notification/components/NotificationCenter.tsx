import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  Plus,
  Award,
  CreditCard,
  CalendarCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import { NotificationType, NotificationFilter } from '../types';

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    archivedCount,
    loading,
    error,
    filter,
    setFilter,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    restoreNotification,
    forceDeleteNotification,
    emptyTrash,
    sendNotification,
  } = useNotifications('all');

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<NotificationType>('info');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    setSending(true);
    setSendSuccess(null);
    try {
      await sendNotification({
        title: newTitle.trim(),
        message: newMessage.trim(),
        type: newType,
      });
      setSendSuccess('Notification sent successfully!');
      setNewTitle('');
      setNewMessage('');
      setTimeout(() => {
        setIsSendModalOpen(false);
        setSendSuccess(null);
      }, 1200);
    } catch {
      // handled
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'exam':
        return <Award className="h-5 w-5 text-amber-600" />;
      case 'finance':
        return <CreditCard className="h-5 w-5 text-emerald-600" />;
      case 'attendance':
        return <CalendarCheck className="h-5 w-5 text-blue-600" />;
      case 'urgent':
        return <AlertTriangle className="h-5 w-5 text-rose-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      default:
        return <Info className="h-5 w-5 text-indigo-600" />;
    }
  };

  const getTypeBadgeClass = (type: NotificationType) => {
    switch (type) {
      case 'exam':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'finance':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'attendance':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      case 'warning':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const tabs: { key: NotificationFilter; label: string; badge?: number }[] = [
    { key: 'all', label: 'All Notifications' },
    { key: 'unread', label: 'Unread', badge: unreadCount },
    { key: 'read', label: 'Read' },
    { key: 'archived', label: 'Trash / Archived', badge: archivedCount },
  ];

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="h-7 w-7 text-indigo-600" />
            User Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Personal and institutional alert feed. Manage read status, unread markers, and soft delete into trash.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchNotifications()}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Refresh feed"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {unreadCount > 0 && filter !== 'archived' && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark All Read</span>
            </button>
          )}

          {filter === 'archived' && archivedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Permanently delete all notifications in trash?')) {
                  emptyTrash();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Empty Trash</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSendModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Create Alert</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-4 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    tab.key === 'archived'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or notification message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-hidden cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="exam">Exams & Results</option>
            <option value="finance">Finance & Fees</option>
            <option value="attendance">Attendance</option>
            <option value="urgent">Urgent Alerts</option>
            <option value="warning">Warnings</option>
            <option value="info">General Info</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-500 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="text-xs font-medium">Loading notifications...</span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <Bell className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            {filter === 'archived'
              ? 'Trash is empty'
              : filter === 'unread'
              ? 'No unread notifications'
              : 'No notifications found'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {filter === 'archived'
              ? 'Soft-deleted notifications will appear here. You can restore them anytime.'
              : 'When attendance events, exam results, or fee schedules trigger, alerts will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const isUnread = !notif.read_at;
            const isArchived = filter === 'archived';

            return (
              <div
                key={notif.id}
                className={`rounded-2xl border p-4.5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  isArchived
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : isUnread
                    ? 'border-indigo-200 bg-indigo-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-xs">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${getTypeBadgeClass(
                          notif.type
                        )}`}
                      >
                        {notif.type}
                      </span>

                      {isUnread && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                          Unread
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        {formatTimestamp(notif.created_at)}
                      </span>
                    </div>

                    <h3
                      className={`text-sm ${
                        isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                      }`}
                    >
                      {notif.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {!isArchived ? (
                    <>
                      {notif.read_at ? (
                        <button
                          type="button"
                          onClick={() => markAsUnread(notif.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                          title="Mark as unread"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Mark Unread</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markAsRead(notif.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Mark Read</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteNotification(notif.id)}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
                        title="Move to Trash (Soft Delete)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => restoreNotification(notif.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
                        title="Restore notification"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Permanently delete this notification?')) {
                            forceDeleteNotification(notif.id);
                          }
                        }}
                        className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition-colors shadow-xs cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Notification Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Create Personal Alert</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSend} className="p-6 space-y-4">
              {sendSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{sendSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alert Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Fair Registration Open"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as NotificationType)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="info">General Info</option>
                  <option value="exam">Exam & Results</option>
                  <option value="finance">Finance & Collections</option>
                  <option value="attendance">Attendance Alert</option>
                  <option value="urgent">Urgent Warning</option>
                  <option value="success">Success / Confirmation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type the notification details here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Publish Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
