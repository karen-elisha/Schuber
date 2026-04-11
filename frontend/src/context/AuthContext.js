// frontend/src/context/AuthContext.js

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getProfile, signInWithGoogle, signOut } from '../supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Auth init...");

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      bootstrap(session);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => bootstrap(session)
    );

    // 🔥 Safety fallback (prevents infinite loading)
    const timeout = setTimeout(() => {
      console.warn("⚠️ Force stopping loading");
      setLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // ✅ FINAL FIXED BOOTSTRAP
  async function bootstrap(session) {
    try {
      if (session?.user) {
        setUser(session.user);

        const prof = await getProfile(session.user.id).catch((err) => {
          console.error("Profile fetch error:", err);
          return null;
        });

        console.log("PROFILE:", prof);

        // ✅ PRODUCTION FIX: handle broken session
        if (!prof || !prof.role) {
          console.warn("⚠️ Invalid profile → logging out user");

          await supabase.auth.signOut();

          setUser(null);
          setProfile(null);
          return;
        }

        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  // ── Auth methods ──

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const prof = await getProfile(data.user.id).catch(() => null);

    return {
      ...data.user,
      role: prof?.role ?? 'parent',
    };
  }

  async function register(email, password, fullName, role = 'parent') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) throw error;

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

    return session
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    login,
    register,
    signOut,
    signInWithGoogle,
    getAuthHeader,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* ✅ FIX: never render blank screen */}
      {loading ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          Loading...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);