
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#FFFBF0', flexDirection:'column', gap:'1rem' }}>
      <div style={{ width:44, height:44, border:'4px solid #FDE68A', borderTopColor:'#F59E0B', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color:'#D97706', fontWeight:700, fontSize:'1.1rem', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
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

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const role = profile?.role;

  console.log('[App] 🧭 Routing State:', { user: user?.email, role, hasProfile: !!profile, loading });

  // 1. Initial global loading (still show spinner while fetching user session)
  if (loading && !user) {
    return <LoadingScreen text="Entering Schuber..." />;
  }

  return (
    <Routes>
      {/* HOME */}
      <Route path="/" element={
        !user ? <LandingPage /> : (
          !role ? <LoadingScreen text="Finalizing session..." /> : (
            role === 'driver' && !profile.has_driver_profile
              ? <Navigate to="/driver-verification" replace />
              : <Navigate to={`/${role}`} replace />
          )
        )
      } />

      {/* AUTH */}
      <Route path="/login" element={
        !user ? <LoginPage /> : (
          // If logged in but role still loading, show a better transition
          !role ? <LoadingScreen text="Signing you in..." /> : (
            role === 'driver' && !profile.has_driver_profile 
              ? <Navigate to="/driver-verification" replace />
              : <Navigate to={`/${role}`} replace />
          )
        )
      } />
      <Route path="/register" element={
        !user ? <RegisterPage /> : (
          !role ? <LoadingScreen text="Creating account..." /> : (
            role === 'driver' && !profile.has_driver_profile 
              ? <Navigate to="/driver-verification" replace />
              : <Navigate to={`/${role}`} replace />
          )
        )
      } />

      {/* PUBLIC / SETUP */}
      <Route path="/driver-verification" element={<DriverVerificationPage />} />

      {/* PROTECTED — strict role enforcement */}
      <Route path="/parent/*" element={
        <ProtectedRoute roles={['parent']}>
          <ParentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/driver/*" element={
        <ProtectedRoute roles={['driver']}>
          <DriverDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute roles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
