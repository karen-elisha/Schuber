
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

// 🔐 Protected Route — strict role enforcement
function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#FFFBF0', flexDirection:'column', gap:'1rem' }}>
        <div style={{ width:40, height:40, border:'3px solid #FDE68A', borderTopColor:'#F59E0B', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color:'#D97706', fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading Schuber…</div>
      </div>
    );
  }

  // If not logged in at all, go to login
  if (!user) return <Navigate to="/login" replace />;

  // ✅ ROLE CHECK — redirect to correct dashboard if role mismatch
  if (roles && profile?.role && !roles.includes(profile.role)) {
    return <Navigate to={`/${profile.role}`} replace />;
  }

  // ✅ DRIVER SETUP CHECK — redirect if driver profile missing
  if (profile?.role === 'driver' && !profile.has_driver_profile) {
    return <Navigate to="/driver-verification" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) {
    return (
      <div style={{ textAlign:'center', marginTop:'50px', fontFamily:"'Plus Jakarta Sans',sans-serif", color:'#D97706' }}>
        Loading app…
      </div>
    );
  }

  return (
    <Routes>
      {/* HOME */}
      <Route path="/" element={
        user && profile?.role
          ? (profile.role === 'driver' && !profile.has_driver_profile
              ? <Navigate to="/driver-verification" replace />
              : <Navigate to={`/${profile.role}`} replace />)
          : <LandingPage />
      } />

      {/* AUTH */}
      <Route path="/login" element={
        user && profile?.role ? (
          profile.role === 'driver' && !profile.has_driver_profile 
            ? <Navigate to="/driver-verification" replace />
            : <Navigate to={`/${profile.role}`} replace />
        ) : <LoginPage />
      } />
      <Route path="/register" element={
        user && profile?.role ? (
          profile.role === 'driver' && !profile.has_driver_profile 
            ? <Navigate to="/driver-verification" replace />
            : <Navigate to={`/${profile.role}`} replace />
        ) : <RegisterPage />
      } />

      {/* PUBLIC */}
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
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
