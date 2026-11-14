import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { DashboardStats } from '../types';
import {
  Users,
  BookOpen,
  UserCheck,
  Award,
  TrendingUp,
  Clock,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SchoolExamsAndResultsSection } from '../components/dashboard/SchoolExamsAndResultsSection';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch {
      setError('Failed to fetch dashboard statistics from Laravel API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-linear-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200 backdrop-blur-xs mb-3 border border-indigo-400/20">
            Active Academic Term 2026-2027
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Administrator'}!
          </h1>
          <p className="mt-1 text-indigo-200 text-sm max-w-xl">
            Here is a live summary of institutional metrics, enrollment counts, and recent faculty activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-700/60 hover:bg-indigo-700 px-4 py-2.5 text-xs font-medium text-white transition-colors border border-indigo-500/30 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/students"
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-indigo-950 shadow-sm hover:bg-indigo-50 transition-colors"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            <span>Manage Students</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Students */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : stats?.totalStudents ?? 0}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> +12% YoY
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Active profiles in database</p>
        </div>

        {/* Card 2: Courses */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Courses
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : stats?.activeCourses ?? 0}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> 100% Filled
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Across STEM & Humanities</p>
        </div>

        {/* Card 3: Attendance */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Average Attendance
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : `${stats?.attendanceRate ?? 96.4}%`}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> +2.1%
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Above national benchmarks</p>
        </div>

        {/* Card 4: Faculty */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Faculty & Staff
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : stats?.totalFaculty ?? 15}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-slate-500">
              Full-time & adjunct
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Certified educators</p>
        </div>
      </div>

      {/* SchoolExams & SchoolExamResults Interactive Management Section */}
      <SchoolExamsAndResultsSection />

      {/* Lower Section: Recent Activity + Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Activities (2 cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Institutional Activity Feed</h2>
              <p className="text-xs text-slate-500">Real-time log of administrative events</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
              <Clock className="h-3.5 w-3.5" /> Auto-synced
            </span>
          </div>

          <div className="divide-y divide-slate-100 p-2">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-lg transition-colors">
                  <div
                    className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${
                      act.type === 'success'
                        ? 'bg-emerald-500 ring-4 ring-emerald-50'
                        : act.type === 'warning'
                        ? 'bg-amber-500 ring-4 ring-amber-50'
                        : 'bg-indigo-500 ring-4 ring-indigo-50'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{act.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Initiated by {act.user_name}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 shrink-0">{act.time}</span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                {loading ? 'Loading activities...' : 'No recent activities recorded.'}
              </div>
            )}
          </div>
        </div>

        {/* Architecture & Decoupled Monorepo Card (1 col) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">System Architecture</h2>
            <p className="text-xs text-slate-500 mt-0.5">Decoupled Full-Stack Overview</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Backend (/backend)</span>
                  <span className="text-indigo-600 font-mono">Laravel API</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pure REST JSON responses, no Blade templates, Laravel Sanctum token auth.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Frontend (/frontend)</span>
                  <span className="text-indigo-600 font-mono">React SPA (Vite)</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Vite + Tailwind CSS + TypeScript. Client-side routed with Bearer auth interceptors.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Communication</span>
                  <span className="text-emerald-600 font-mono">REST JSON</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  CORS-enabled REST endpoints; protected by Sanctum personal access tokens.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Environment</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> Production Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

