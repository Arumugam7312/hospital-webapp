/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDirectory } from './pages/DoctorDirectory';
import { BookingFlow } from './pages/BookingFlow';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { DoctorSchedulePage } from './pages/DoctorSchedulePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminDoctorManagement } from './pages/AdminDoctorManagement';
import { ReportsPage } from './pages/ReportsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutUs } from './pages/AboutUs';
import { Contact } from './pages/Contact';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;

  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        user ? (
          <Layout>
            {user.role === 'patient' && <PatientDashboard />}
            {user.role === 'doctor' && <DoctorDashboard />}
            {user.role === 'admin' && <AdminDashboard />}
          </Layout>
        ) : <Navigate to="/login" />
      } />

      <Route path="/reports" element={
        user ? (
          <Layout>
            <ReportsPage />
          </Layout>
        ) : <Navigate to="/login" />
      } />

      <Route path="/medical-records" element={
        user?.role === 'patient' ? (
          <Layout>
            <MedicalRecordsPage />
          </Layout>
        ) : <Navigate to="/login" />
      } />

      <Route path="/profile" element={
        user ? (
          <Layout>
            <ProfilePage />
          </Layout>
        ) : <Navigate to="/login" />
      } />

      <Route path="/doctor/schedule" element={
        user?.role === 'doctor' ? (
          <Layout>
            <DoctorSchedulePage />
          </Layout>
        ) : <Navigate to="/dashboard" />
      } />

      <Route path="/doctors" element={
        <Layout>
          <DoctorDirectory />
        </Layout>
      } />

      <Route path="/about" element={
        <Layout>
          <AboutUs />
        </Layout>
      } />

      <Route path="/contact" element={
        <Layout>
          <Contact />
        </Layout>
      } />

      <Route path="/book/:doctorId" element={
        user ? (
          <Layout>
            <BookingFlow />
          </Layout>
        ) : <Navigate to="/login" />
      } />

      <Route path="/admin/doctors" element={
        user?.role === 'admin' ? (
          <Layout>
            <AdminDoctorManagement />
          </Layout>
        ) : <Navigate to="/dashboard" />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>
          <Router>
            <AppRoutes />
          </Router>
        </SocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

