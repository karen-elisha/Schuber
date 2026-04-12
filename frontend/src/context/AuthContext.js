/**
 * AuthContext — Simple, bulletproof auth with role-based routing
 *
 * Role resolution order (most → least reliable):
 *   1. profiles table in DB        (most reliable, set by seed/admin)
 *   2. user_metadata.role          (set in Supabase Auth on signup)
 *   3. KNOWN_ROLES email map       (hardcoded for demo accounts)
 *   4. 'parent'                    (safe default)
 *
 * Key design:  login() sets profile immediately in React state.
 *              A ref guards against bootstrap() overwriting it.
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, signInWithGoogle, signOut } from '../supabase';

const AuthContext = createContext(null);

// ── Demo accounts (local fallback when Supabase auth is unavailable) ──────────
const DEMO_ACCOUNTS = {
  'priya@example.com':  { password:'parent123', role:'parent', full_name:'Priya Sharma',   id:'demo-parent-001', email:'priya@example.com',  phone:'+91 98765 43210' },
  'suresh@example.com': { password:'driver123', role:'driver', full_name:'Suresh Kumar',   id:'demo-driver-001', email:'suresh@example.com', phone:'+91 98765 99999' },
  'admin@schuber.com':  { password:'admin123',  role:'admin',  full_name:'Schuber Admin',  id:'demo-admin-001',  email:'admin@schuber.com',  phone:'+91 98765 00000' },
};

// Guaranteed role for known e-mails — bypasses all DB / metadata issues
const KNOWN_ROLES = {
  'priya@example.com':  'parent',
  'suresh@example.com': 'driver',
  'admin@schuber.com':  'admin',
};

async function fetchProfileRole(userId, email) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name, phone, avatar_url')
      .eq('id', userId)
      .single();
    if (data?.role) return data;
  } catch (_) {}
  return null;
}

function bestRole(dbRole, metaRole, email) {
  if (dbRole)   return dbRole;
  if (metaRole) return metaRole;
  if (email && KNOWN_ROLES[email?.toLowerCase()]) return KNOWN_ROLES[email.toLowerCase()];
  return 'parent';
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [isDemoUser,setIsDemoUser]= useState(false);

  // When login() sets profile, block bootstrap() from overwriting it
  const loginSetRef = useRef(false);

  // ── Bootstrap: run on page load / auth state change ────────────────────────
  async function bootstrap(session) {
    try {
      // ── No session → check demo localStorage ──────────────────────────────
      if (!session?.user) {
        const raw = localStorage.getItem('schuber-demo-session');
        if (raw) {
          try {
            const demo = JSON.parse(raw);
            setUser({ id: demo.id, email: demo.email });
            setProfile(demo);
            setIsDemoUser(true);
            return;
          } catch { localStorage.removeItem('schuber-demo-session'); }
        }
        if (!loginSetRef.current) { setUser(null); setProfile(null); }
        return;
      }

      // ── We have a real Supabase session ────────────────────────────────────
      setUser(session.user);
      setIsDemoUser(false);

      // If login() already set a correct profile, trust it — skip re-fetch
      if (loginSetRef.current) {
        loginSetRef.current = false;
        return;
      }

      // Build profile from DB + metadata
      const meta   = session.user.user_metadata ?? {};
      const email  = session.user.email ?? '';
      const dbProf = await fetchProfileRole(session.user.id, email);
      const role   = bestRole(dbProf?.role, meta.role, email);

      setProfile({
        id:         session.user.id,
        email,
        role,
        full_name:  dbProf?.full_name ?? meta.full_name ?? email,
        phone:      dbProf?.phone     ?? meta.phone     ?? null,
        avatar_url: dbProf?.avatar_url ?? meta.avatar_url ?? null,
      });
    } finally {
      setLoading(false);
    }
  }

  // ── Initialise on mount ────────────────────────────────────────────────────
  useEffect(() => {
    // Fast path: demo session already in localStorage
    const raw = localStorage.getItem('schuber-demo-session');
    if (raw) {
      try {
        const demo = JSON.parse(raw);
        setUser({ id: demo.id, email: demo.email });
        setProfile(demo);
        setIsDemoUser(true);
        setLoading(false);
        return;
      } catch { localStorage.removeItem('schuber-demo-session'); }
    }

    // Real Supabase session
    supabase.auth.getSession()
      .then(({ data: { session } }) => bootstrap(session))
      .catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      bootstrap(session);
    });

    // Safety timeout
    const t = setTimeout(() => setLoading(false), 6000);
    return () => { subscription.unsubscribe(); clearTimeout(t); };
  }, []); // intentionally empty — bootstrap is stable via useCallback pattern

  // ── login() ────────────────────────────────────────────────────────────────
  async function login(emailRaw, password) {
    const email = emailRaw?.trim().toLowerCase();
    loginSetRef.current = false;
    localStorage.removeItem('schuber-demo-session');

    // ── 1. Try real Supabase auth ──────────────────────────────────────────
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        const meta   = data.user.user_metadata ?? {};
        const dbProf = await fetchProfileRole(data.user.id, email);
        const role   = bestRole(dbProf?.role, meta.role, email);

        const fullProfile = {
          id:         data.user.id,
          email,
          role,
          full_name:  dbProf?.full_name ?? meta.full_name ?? email,
          phone:      dbProf?.phone     ?? meta.phone     ?? null,
          avatar_url: dbProf?.avatar_url ?? meta.avatar_url ?? null,
        };

        console.log('[Auth] ✅ login:', email, '→ role:', role);

        loginSetRef.current = true;       // block bootstrap from overwriting
        setUser(data.user);
        setProfile(fullProfile);
        setIsDemoUser(false);
        setLoading(false);
        return { ...data.user, role };
      }
      // If Supabase returned an error, fall through to demo
      console.warn('[Auth] Supabase login error:', error?.message);
    } catch (e) {
      console.warn('[Auth] Supabase unreachable:', e.message);
    }

    // ── 2. Demo account fallback ───────────────────────────────────────────
    const demo = DEMO_ACCOUNTS[email];
    if (demo && demo.password === password) {
      console.log('[Auth] 🎭 demo login:', email, '→ role:', demo.role);
      const demoProfile = { ...demo };
      localStorage.setItem('schuber-demo-session', JSON.stringify(demoProfile));
      loginSetRef.current = true;
      setUser({ id: demo.id, email: demo.email });
      setProfile(demoProfile);
      setIsDemoUser(true);
      setLoading(false);
      return { ...demo, role: demo.role };
    }

    throw new Error('Invalid email or password.');
  }

  // ── register() ─────────────────────────────────────────────────────────────
  // Calls the backend which uses admin.createUser — email auto-confirmed,
  // no confirmation email sent, no rate limits, works even when
  // "Enable email signups" appears disabled in Supabase dashboard.
  async function register(email, password, fullName, role = 'parent', phone = '') {
    const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

    const res = await fetch(`${API}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password, full_name: fullName, role, phone }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');

    // Backend returns a token — set Supabase session so auth state fires
    if (data.token) {
      const { data: sessionData } = await supabase.auth.setSession({
        access_token:  data.token,
        refresh_token: data.token, // backend only returns access_token; refresh handled by Supabase
      });

      const supaUser = sessionData?.user || data.user;
      const prof = { id: supaUser?.id || data.user.id, role, full_name: fullName, email, phone };
      loginSetRef.current = true;
      setUser(supaUser || data.user);
      setProfile({ ...prof, role });
      setIsDemoUser(false);
      setLoading(false);
      return { ...(supaUser || data.user), role };
    }

    // No token (unlikely) — return user so caller can show "please sign in"
    return null;
  }

  // ── logout() ───────────────────────────────────────────────────────────────
  async function logout() {
    loginSetRef.current = false;
    localStorage.removeItem('schuber-demo-session');
    setUser(null);
    setProfile(null);
    setIsDemoUser(false);
    if (!isDemoUser) await signOut().catch(() => {});
  }

  async function getAuthHeader() {
    if (isDemoUser) {
      return {
        'Content-Type':   'application/json',
        'X-Demo-Role':    profile?.role || 'parent',
        'X-Demo-User':    profile?.id   || 'demo',
      };
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session
      ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }

  async function refreshProfile() {
    if (isDemoUser || !user) return;
    const dbProf = await fetchProfileRole(user.id, user.email).catch(() => null);
    if (dbProf) setProfile(p => ({ ...p, ...dbProf }));
  }

  return (
    <AuthContext.Provider value={{
      user, profile,
      role: profile?.role ?? null,
      loading, isDemoUser,
      login, register,
      logout, signOut: logout,
      signInWithGoogle,
      getAuthHeader, refreshProfile,
    }}>
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#FFFBF0', flexDirection:'column', gap:'1rem' }}>
          <div style={{ width:40, height:40, border:'3px solid #FDE68A', borderTopColor:'#F59E0B', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          <div style={{ color:'#D97706', fontWeight:600, fontFamily:'DM Sans,sans-serif' }}>Loading Schuber…</div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
