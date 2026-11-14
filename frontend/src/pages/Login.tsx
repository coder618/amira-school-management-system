import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { School, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Invalid credentials. Please try again.');
      } else {
        setError('Network error or server unavailable. Please ensure the backend is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = (role: 'admin' | 'superadmin' = 'admin') => {
    if (role === 'superadmin') {
      setEmail('superadmin@school.com');
      setPassword('password');
    } else {
      setEmail('admin@school.com');
      setPassword('password');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Left side brand banner (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 border-r border-indigo-900/30">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <School className="h-7 w-7" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block">EduCore</span>
            <span className="text-xs font-medium text-indigo-400">Enterprise School Management</span>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Streamline campus operations & student records
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed text-sm">
            Complete API-first architecture designed for fast, secure, and modern institutional management.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-indigo-800/50 bg-indigo-950/40 p-4">
              <span className="text-2xl font-bold text-white">99.9%</span>
              <p className="text-xs text-indigo-300 mt-1">Uptime SLA & Reliability</p>
            </div>
            <div className="rounded-xl border border-indigo-800/50 bg-indigo-950/40 p-4">
              <span className="text-2xl font-bold text-white">REST API</span>
              <p className="text-xs text-indigo-300 mt-1">Decoupled Architecture</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} EduCore System. Pure React SPA + Laravel API.
        </p>
      </div>

      {/* Right side form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <School className="h-6 w-6" />
            </div>
            <span className="text-lg font-bold text-slate-900">EduCore</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-slate-600">
              Welcome back. Enter your credentials to access the administrative dashboard.
            </p>
          </div>

          {/* Demo helper */}
          <div className="mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold block">SuperAdmin (Global Tenant Root)</span>
                <span className="text-[11px] text-slate-500">superadmin@school.com</span>
              </div>
              <button
                type="button"
                onClick={() => handleDemoFill('superadmin')}
                className="px-2.5 py-1 rounded bg-indigo-700 text-white font-medium hover:bg-indigo-800 transition-colors cursor-pointer"
              >
                SuperAdmin
              </button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
              <div>
                <span className="font-semibold block">School Admin (Headmaster)</span>
                <span className="text-[11px] text-slate-500">admin@school.com</span>
              </div>
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="px-2.5 py-1 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                School Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.com"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-4">
              Register new account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

