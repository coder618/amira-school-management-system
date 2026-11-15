import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { AddStudentPage } from './pages/AddStudentPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { EditStudentPage } from './pages/EditStudentPage';
import { Classes } from './pages/Classes';
import { ClassSubjectsPage } from './pages/ClassSubjectsPage';
import { Teachers } from './pages/Teachers';
import { Attendance } from './pages/Attendance';
import { Finance } from './pages/Finance';
import { FinanceInvoices } from './pages/FinanceInvoices';
import { FinancePayments } from './pages/FinancePayments';
import { FinanceFundCollections } from './pages/FinanceFundCollections';
import { Examinations } from './pages/Examinations';
import { ManageExamsPage } from './pages/ManageExamsPage';
import { ExamMarksPage } from './pages/ExamMarksPage';
import { ManageResultsPage } from './pages/ManageResultsPage';
import { SuperAdmin } from './pages/SuperAdmin';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';
import { UserProfilePage } from './pages/UserProfilePage';

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
              <Route path="/students/create" element={<AddStudentPage />} />
              <Route path="/students/add" element={<AddStudentPage />} />
              <Route path="/students/:id" element={<StudentProfilePage />} />
              <Route path="/students/:id/edit" element={<EditStudentPage />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/classes/manage" element={<Classes />} />
              <Route path="/classes/subjects" element={<ClassSubjectsPage />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/finance/invoices" element={<FinanceInvoices />} />
              <Route path="/finance/payments" element={<FinancePayments />} />
              <Route path="/finance/fund-collections" element={<FinanceFundCollections />} />
              <Route path="/finance/categories" element={<Navigate to="/finance/fund-collections" replace />} />
              <Route path="/exams" element={<Examinations />} />
              <Route path="/exams/manage" element={<ManageExamsPage />} />
              <Route path="/exams/marks" element={<ExamMarksPage />} />
              <Route path="/exams/results" element={<ManageResultsPage />} />
              <Route path="/exams/marks-entry" element={<Navigate to="/exams/results" replace />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/profile/:id" element={<UserProfilePage />} />
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
