// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getProfile, signInWithGoogle, signOut } from '../supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      bootstrap(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => bootstrap(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  async function bootstrap(session) {
    if (session?.user) {
      setUser(session.user);
      const prof = await getProfile(session.user.id).catch(() => null);
      setProfile(prof);
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  }

  // ── Kept for backward compatibility with existing components ──

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    // Return shape that your old code expects: { role, ... }
    const prof = await getProfile(data.user.id).catch(() => null);
    return { ...data.user, role: prof?.role ?? 'parent' };
  }

  async function register(email, password, fullName, role = 'parent') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    // Set role in profiles table after sign up
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ role, full_name: fullName })
        .eq('id', data.user.id);
    }
    return data.user;
  }

  async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  const value = {
    // State
    user,
    profile,
    role: profile?.role ?? null,
    loading,

    // Auth methods (same names your old code used)
    login,
    register,
    signOut,
    signInWithGoogle,
    getAuthHeader,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);