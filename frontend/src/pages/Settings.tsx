import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Key, Database, Globe } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings & Account</h1>
        <p className="text-sm text-slate-500">Manage your administrative profile and review system connections</p>
      </div>

      {/* Account Info Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xl font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/50 uppercase">
              <Shield className="h-3 w-3" />
              {user?.role || 'Administrator'}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account ID</span>
            <p className="mt-1 text-sm font-semibold text-slate-900 font-mono">#{user?.id}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security Standard</span>
            <p className="mt-1 text-sm font-semibold text-slate-900">Laravel Sanctum Bearer Auth</p>
          </div>
        </div>
      </div>

      {/* Monorepo Architecture Specs */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-600" />
          Monorepo Environment Parameters
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Detailed connectivity parameters between decoupled frontend and backend
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-400" />
              API Base URL
            </span>
            <code className="bg-white px-2 py-1 rounded border border-slate-200 text-indigo-700 font-mono">
              {import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}
            </code>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <Key className="h-4 w-4 text-slate-400" />
              Frontend Rendering Mode
            </span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              Static SPA (Vite + React, No SSR)
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              Backend Framework
            </span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
              Laravel API Only (No Blade)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

