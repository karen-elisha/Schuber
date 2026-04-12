
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';


import ErrorBoundary from './components/ErrorBoundary';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ParentDashboard from './pages/ParentDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DriverVerificationPage from './pages/DriverVerificationPage';

function LoadingScreen({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FFFBF0', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 44, height: 44, border: '4px solid #FDE68A', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: '#D97706', fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        {text || 'Schuber is loading...'}
      </div>
    </div>
  );
}

// 🔐 Protected Route — strict role enforcement
function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen text="Verifying access..." />;

  // If not logged in at all, go to login
  if (!user) return <Navigate to="/login" replace />;

  const role = profile?.role;

  // ✅ ROLE CHECK — redirect to correct dashboard if role mismatch
  if (roles && role && !roles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }

  // ✅ DRIVER SETUP CHECK — redirect if driver profile missing
  if (role === 'driver' && !profile.has_driver_profile) {
    return <Navigate to="/driver-verification" replace />;
  }

  return children;
}

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* PARENT */}
      <Route
        path="/parent/*"
        element={
          user && profile?.role === 'parent'
            ? <ParentDashboard />
            : <Navigate to="/login" />
        }
      />

      {/* DRIVER VERIFICATION */}
      <Route
        path="/driver-verification"
        element={
          user && profile?.role === 'driver' && !profile?.driver_profile_exists
            ? <DriverVerificationPage />
            : <Navigate to="/driver" />
        }
      />

      {/* DRIVER DASHBOARD */}
      <Route
        path="/driver/*"
        element={
          user && profile?.role === 'driver'
            ? (
              profile?.driver_profile_exists
                ? <DriverDashboard />
                : <Navigate to="/driver-verification" />
            )
            : <Navigate to="/login" />
        }
      />

    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
