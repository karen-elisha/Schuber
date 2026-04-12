
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

// 🔐 Protected Route - allows demo accounts to pass through
function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#FFFBF0', flexDirection:'column', gap:'1rem' }}>
        <div style={{ fontSize:'2rem' }}>🚌</div>
        <div style={{ color:'#D97706', fontWeight:600, fontFamily:'DM Sans,sans-serif' }}>Loading Schuber…</div>
      </div>
    );
  }

  // If not logged in at all, go to login
  if (!user) return <Navigate to="/login" replace />;

  // ✅ ROLE CHECK — but allow if profile is loading or matches
  if (roles && profile?.role && !roles.includes(profile.role)) {
    // Redirect to the correct dashboard based on actual role
    return <Navigate to={`/${profile.role}`} replace />;
  }

  return children;
}

// Flexible route: allows demo bypass navigation
function FlexRoute({ children, roles }) {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  // If user has a mismatched role, let them through to wherever they navigated
  // (demo users navigated explicitly via navigate(), respect that)
  return children;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) {
    return (
      <div style={{ textAlign:'center', marginTop:'50px', fontFamily:'DM Sans,sans-serif', color:'#D97706' }}>
        Loading app…
      </div>
    );
  }

  return (
    <Routes>
      {/* HOME */}
      <Route path="/" element={
        user && profile?.role ? <Navigate to={`/${profile.role}`} replace /> : <LandingPage />
      } />

      {/* AUTH */}
      <Route path="/login" element={
        user && profile?.role ? <Navigate to={`/${profile.role}`} replace /> : <LoginPage />
      } />
      <Route path="/register" element={
        user && profile?.role ? <Navigate to={`/${profile.role}`} replace /> : <RegisterPage />
      } />

      {/* PUBLIC */}
      <Route path="/driver-verification" element={<DriverVerificationPage />} />

      {/* PROTECTED — flexible to allow demo navigation */}
      <Route path="/parent/*" element={
        <FlexRoute roles={['parent']}>
          <ParentDashboard />
        </FlexRoute>
      } />
      <Route path="/driver/*" element={
        <FlexRoute roles={['driver']}>
          <DriverDashboard />
        </FlexRoute>
      } />
      <Route path="/admin/*" element={
        <FlexRoute roles={['admin']}>
          <AdminDashboard />
        </FlexRoute>
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
