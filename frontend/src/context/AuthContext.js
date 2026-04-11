// frontend/src/context/AuthContext.js

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, getProfile, signInWithGoogle, signOut } from '../supabase';

const AuthContext = createContext(null);

const DEFAULT_PROFILE_FALLBACK = (user) => ({
  id: user.id,
  role: 'parent',
  full_name: user.user_metadata?.full_name ?? user.email ?? 'User',
  email: user.email,
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ─────────────────────────────────────────────
  // Core bootstrap: called on every session change
  // ─────────────────────────────────────────────
  const bootstrap = useCallback(async (session) => {
    try {
      setAuthError(null);

      if (!session?.user) {
        setUser(null);
        setProfile(null);
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      // ── Fetch profile with retry ──
      let prof = null;
      let fetchAttempts = 0;
      const MAX_ATTEMPTS = 3;

      while (!prof && fetchAttempts < MAX_ATTEMPTS) {
        fetchAttempts++;
        try {
          prof = await getProfile(currentUser.id);
        } catch (err) {
          console.warn(`Profile fetch attempt ${fetchAttempts} failed:`, err?.message ?? err);
          if (fetchAttempts < MAX_ATTEMPTS) {
            // Brief back-off between retries (handles race condition after signup)
            await new Promise((r) => setTimeout(r, 600 * fetchAttempts));
          }
        }
      }

      console.log('[Auth] Profile result:', prof);

      // ── Profile missing entirely → create it ──
      if (!prof) {
        console.warn('[Auth] Profile not found after retries. Creating default profile…');
        const fallback = DEFAULT_PROFILE_FALLBACK(currentUser);

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(fallback, { onConflict: 'id' });

        if (upsertError) {
          console.error('[Auth] Failed to create fallback profile:', upsertError.message);
          // Still set a client-side profile so the UI doesn't break
          setProfile(fallback);
        } else {
          console.log('[Auth] Fallback profile created successfully.');
          setProfile(fallback);
        }
        return;
      }

      // ── Profile exists but role missing → patch it ──
      if (!prof.role) {
        console.warn('[Auth] Profile has no role. Patching to "parent"…');
        const { error: patchError } = await supabase
          .from('profiles')
          .update({ role: 'parent' })
          .eq('id', currentUser.id);

        if (patchError) {
          console.error('[Auth] Role patch failed:', patchError.message);
        }
        prof = { ...prof, role: 'parent' };
      }

      setProfile(prof);
    } catch (err) {
      console.error('[Auth] Unexpected bootstrap error:', err);
      setAuthError(err?.message ?? 'Authentication error');
      // Do NOT sign out or clear the user on generic errors
    } finally {
      setLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────
  // Initialise on mount
  // ─────────────────────────────────────────────
  useEffect(() => {
    console.log('[Auth] Initialising…');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('[Auth] getSession error:', error.message);
      bootstrap(session);
    });

    // Listen to subsequent auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] State change:', event);
        bootstrap(session);
      }
    );

    // Safety fallback — prevents infinite loading spinner
    const timeout = setTimeout(() => {
      console.warn('[Auth] ⚠️ Timeout reached — forcing loading to false');
      setLoading(false);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [bootstrap]);

  // ─────────────────────────────────────────────
  // Email / password login
  // ─────────────────────────────────────────────
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Profile will be loaded by onAuthStateChange → bootstrap
    // Return a minimal shape so the calling component can act immediately
    const prof = await getProfile(data.user.id).catch(() => null);
    return {
      ...data.user,
      role: prof?.role ?? 'parent',
    };
  }

  // ─────────────────────────────────────────────
  // Registration
  // ─────────────────────────────────────────────
  async function register(email, password, fullName, role = 'parent') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { id: data.user.id, role, full_name: fullName, email },
          { onConflict: 'id' }
        );

      if (profileError) {
        console.error('[Auth] Profile upsert failed on register:', profileError.message);
      }
    }

    return data.user;
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return session
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }

  /** Force-refresh the profile from the DB (e.g. after profile edit) */
  async function refreshProfile() {
    if (!user) return;
    try {
      const prof = await getProfile(user.id);
      if (prof) setProfile(prof);
    } catch (err) {
      console.error('[Auth] refreshProfile error:', err);
    }
  }

  // ─────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────
  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    authError,
    login,
    register,
    signOut,
    signInWithGoogle,
    getAuthHeader,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'sans-serif',
            fontSize: '1rem',
            color: '#888',
          }}
        >
          Loading…
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);