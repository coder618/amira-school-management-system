import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from '../features/notification';
import { UserProfileDropdown } from './UserProfileDropdown';
import { schoolApi } from '../services/api';
import {
  LayoutDashboard,
  GraduationCap,
  Layers,
  Users,
  CalendarCheck,
  CreditCard,
  Award,
  Settings,
  ShieldCheck,
  Menu,
  X,
  Bell,
  Search,
  School,
  ChevronDown,
  Receipt,
  FileSpreadsheet,
  Edit2,
  BookOpen,
  UserPlus,
  List,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tenantName, setTenantName] = useState<string>(() => {
    return localStorage.getItem('educore_school_name') || 'Dhaka Ideal High School & College';
  });

  useEffect(() => {
    const fetchCurrentSchool = async () => {
      try {
        const schoolData = await schoolApi.getCurrent();
        if (schoolData?.name) {
          setTenantName(schoolData.name);
          localStorage.setItem('educore_school_name', schoolData.name);
        }
      } catch {
        // Fallback silently if offline or unauthenticated
      }
    };

    fetchCurrentSchool();

    const handleSchoolUpdated = (e: any) => {
      if (e.detail?.name) {
        setTenantName(e.detail.name);
        localStorage.setItem('educore_school_name', e.detail.name);
      }
    };

    window.addEventListener('school-updated', handleSchoolUpdated);
    return () => window.removeEventListener('school-updated', handleSchoolUpdated);
  }, []);

  const isStudentsActive = location.pathname.startsWith('/students');
  const isClassesActive = location.pathname.startsWith('/classes');
  const isFinanceActive = location.pathname.startsWith('/finance');
  const isExamsActive = location.pathname.startsWith('/exams');

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    '/students': isStudentsActive,
    '/classes': isClassesActive,
    '/finance': isFinanceActive,
    '/exams': isExamsActive,
  });

  useEffect(() => {
    if (isStudentsActive) {
      setOpenMenus((prev) => ({ ...prev, '/students': true }));
    }
    if (isClassesActive) {
      setOpenMenus((prev) => ({ ...prev, '/classes': true }));
    }
    if (isFinanceActive) {
      setOpenMenus((prev) => ({ ...prev, '/finance': true }));
    }
    if (isExamsActive) {
      setOpenMenus((prev) => ({ ...prev, '/exams': true }));
    }
  }, [isStudentsActive, isClassesActive, isFinanceActive, isExamsActive]);

  const toggleSubmenu = (menuPath: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuPath]: !prev[menuPath],
    }));
  };

  const navItems: NavItem[] = [
    ...(user?.role === 'SuperAdmin'
      ? [{ label: 'SuperAdmin Console', path: '/super-admin', icon: ShieldCheck }]
      : []),
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Students (SIS)',
      path: '/students',
      icon: GraduationCap,
      children: [
        { label: 'Add Student', path: '/students/create', icon: UserPlus },
        { label: 'List Student', path: '/students', icon: List },
      ],
    },
    {
      label: 'Classes',
      path: '/classes',
      icon: Layers,
      children: [
        { label: 'Manage Classes', path: '/classes/manage', icon: Layers },
        { label: 'Class Subjects', path: '/classes/subjects', icon: BookOpen },
      ],
    },
    { label: 'Teachers & HR', path: '/teachers', icon: Users },
    { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
    {
      label: 'Finance & Fees',
      path: '/finance',
      icon: CreditCard,
      children: [
        { label: 'Invoices', path: '/finance/invoices', icon: Receipt },
        { label: 'Payments Module', path: '/finance/payments', icon: CreditCard },
        { label: 'Fund Collection Names', path: '/finance/fund-collections', icon: Layers },
      ],
    },
    {
      label: 'Exam and Results',
      path: '/exams',
      icon: Award,
      children: [
        { label: 'Manage Exams', path: '/exams/manage', icon: CalendarCheck },
        { label: 'Exam Marks', path: '/exams/marks', icon: Edit2 },
        { label: 'Exam Results', path: '/exams/results', icon: FileSpreadsheet },
      ],
    },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <School className="h-6 w-6" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block">EduCore BD</span>
              <span className="text-[11px] font-medium text-indigo-400 block -mt-0.5">School Management</span>
            </div>
          </div>
          <button
            type="button"
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.children && item.children.length > 0) {
              const isChildActive = item.children.some(
                (c) =>
                  location.pathname === c.path ||
                  (c.path !== '/students' && location.pathname.startsWith(c.path))
              );

              const isOpen = Boolean(openMenus[item.path]);

              return (
                <div key={item.path} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isChildActive
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 ${isChildActive ? 'text-indigo-400' : ''}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''
                        }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="pl-3.5 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-4">
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            end={sub.path === '/students'}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive
                                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                              }`
                            }
                          >
                            <SubIcon className="h-3.5 w-3.5 shrink-0" />
                            <span>{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search across students, teachers..."
                className="w-72 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200/60 max-w-[260px] truncate" title={tenantName}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="truncate">Tenant: {tenantName}</span>
              </span>
              <NotificationDropdown />
              <UserProfileDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
