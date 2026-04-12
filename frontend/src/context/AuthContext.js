
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, getProfile, signInWithGoogle, signOut } from '../supabase';

const AuthContext = createContext(null);

const DEFAULT_PROFILE_FALLBACK = (user) => ({
  id: user.id,
  role: 'parent',
  full_name: user.user_metadata?.full_name ?? user.email ?? 'User',
  email: user.email,
  avatar_url: user.user_metadata?.avatar_url ?? null,
  phone: user.user_metadata?.phone ?? null,
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ─── Bootstrap: loads profile after session is confirmed ──────────────────
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

      // Fetch profile with retry (handles race condition after signup)
      let prof = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          prof = await getProfile(currentUser.id);
          break;
        } catch (err) {
          console.warn(`[Auth] Profile fetch attempt ${attempt} failed:`, err?.message);
          if (attempt < 3) await new Promise(r => setTimeout(r, 600 * attempt));
        }
      }

      // Profile missing → create default
      if (!prof) {
        console.warn('[Auth] Profile not found. Creating fallback…');
        const fallback = DEFAULT_PROFILE_FALLBACK(currentUser);
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(fallback, { onConflict: 'id' });
        if (upsertError) console.error('[Auth] Fallback upsert failed:', upsertError.message);
        setProfile(fallback);
        return;
      }

      // Role missing → patch to parent
      if (!prof.role) {
        await supabase.from('profiles').update({ role: 'parent' }).eq('id', currentUser.id);
        prof = { ...prof, role: 'parent' };
      }

      // Merge OAuth avatar if not yet set
      if (!prof.avatar_url && currentUser.user_metadata?.avatar_url) {
        prof = { ...prof, avatar_url: currentUser.user_metadata.avatar_url };
      }

      setProfile(prof);
    } catch (err) {
      console.error('[Auth] Bootstrap error:', err);
      setAuthError(err?.message ?? 'Authentication error');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Initialise on mount ──────────────────────────────────────────────────
  useEffect(() => {
    // Get initial session (handles page refresh + OAuth redirect)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('[Auth] getSession error:', error.message);
      bootstrap(session);
    });

    // Listen to auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Event:', event);
      bootstrap(session);
    });

    // Safety timeout — prevents infinite loading
    const timeout = setTimeout(() => {
      console.warn('[Auth] Timeout — forcing loading off');
      setLoading(false);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [bootstrap]);

  // ─── Email/password login ─────────────────────────────────────────────────
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const prof = await getProfile(data.user.id).catch(() => null);
    return { ...data.user, role: prof?.role ?? 'parent' };
  }

  // ─── Registration ─────────────────────────────────────────────────────────
  async function register(email, password, fullName, role = 'parent', phone = '') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { id: data.user.id, role, full_name: fullName, email, phone },
          { onConflict: 'id' }
        );
      if (profileError) console.error('[Auth] Profile upsert failed:', profileError.message);
    }

    return data.user;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  async function getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  async function refreshProfile() {
    if (!user) return;
    try {
      const prof = await getProfile(user.id);
      if (prof) setProfile(prof);
    } catch (err) {
      console.error('[Auth] refreshProfile error:', err);
    }
  }

  // ─── Context value ────────────────────────────────────────────────────────
  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    authError,
    login,
    register,
    signOut,
    logout: signOut,          // alias so Layout.js works unchanged
    signInWithGoogle,
    getAuthHeader,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#FFFBF0', flexDirection: 'column', gap: '1rem',
        }}>
          <div style={{ width: 40, height: 40, border: '3px solid #FDE68A', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ color: '#D97706', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>Loading Schuber…</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
