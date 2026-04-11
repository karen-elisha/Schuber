import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ParentDashboard from './pages/ParentDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DriverVerificationPage from './pages/DriverVerificationPage';

// 🔐 Protected Route
function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#FFFBF0',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <img src="/logo.png" alt="Schuber" style={{ height: 80, opacity: 0.8 }} />
        <div style={{ color: '#D97706', fontWeight: 600 }}>
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // ✅ SAFE ROLE CHECK
  if (roles && (!profile?.role || !roles.includes(profile.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 🌐 Routes
function AppRoutes() {
  const { user, profile, loading } = useAuth();

  // ✅ WAIT until profile is ready
  if (loading || (user && !profile)) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Loading app...
      </div>
    );
  }

  return (
    <Routes>

      {/* HOME */}
      <Route
        path="/"
        element={
          user && profile?.role
            ? <Navigate to={`/${profile.role}`} replace />
            : <LandingPage />
        }
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          user && profile?.role
            ? <Navigate to={`/${profile.role}`} replace />
            : <LoginPage />
        }
      />

      {/* REGISTER */}
      <Route
        path="/register"
        element={
          user && profile?.role
            ? <Navigate to={`/${profile.role}`} replace />
            : <RegisterPage />
        }
      />

      {/* PUBLIC */}
      <Route path="/driver-verification" element={<DriverVerificationPage />} />

      {/* PROTECTED */}
      <Route
        path="/parent/*"
        element={
          <ProtectedRoute roles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/*"
        element={
          <ProtectedRoute roles={['driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// 🚀 Main App
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}