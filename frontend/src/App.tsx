import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Classes } from './pages/Classes';
import { Teachers } from './pages/Teachers';
import { Attendance } from './pages/Attendance';
import { Finance } from './pages/Finance';
import { FinanceInvoices } from './pages/FinanceInvoices';
import { FinancePayments } from './pages/FinancePayments';
import { FinanceFundCollections } from './pages/FinanceFundCollections';
import { Examinations } from './pages/Examinations';
import { SuperAdmin } from './pages/SuperAdmin';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/finance/invoices" element={<FinanceInvoices />} />
              <Route path="/finance/payments" element={<FinancePayments />} />
              <Route path="/finance/fund-collections" element={<FinanceFundCollections />} />
              <Route path="/finance/categories" element={<Navigate to="/finance/fund-collections" replace />} />
              <Route path="/exams" element={<Examinations />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
