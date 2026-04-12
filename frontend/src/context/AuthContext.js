/**
 * AuthContext — Role-based auth with strict security rules:
 *
 * 1. ADMIN_EMAIL is the ONLY account that can have admin role.
 *    No one else can be admin, even if they pick admin on login page.
 * 2. If a user already has a role in DB (parent/driver), they CANNOT
 *    switch to a different role—their DB role always wins.
 * 3. Role resolution priority:
 *    pendingRole (login picker) → resolvedRoleRef (session cache) → DB → metadata
 *
 * Key design:  login() sets profile immediately in React state.
 *              A ref guards against bootstrap() overwriting it.
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, signInWithGoogle, signOut } from '../supabase';

const AuthContext = createContext(null);

// ── The ONE admin email — only this account can have admin role ───────────────
const ADMIN_EMAIL = 'karenelisha0204@gmail.com';

// ── Demo accounts (testing only) ──────────────────────────────────────────────
const DEMO_ACCOUNTS = {
  'priya@example.com': { password: 'parent123', role: 'parent', full_name: 'Priya Sharma', id: 'demo-parent-001', email: 'priya@example.com', phone: '+91 98765 43210' },
  'suresh@example.com': { password: 'driver123', role: 'driver', full_name: 'Suresh Kumar', id: 'demo-driver-001', email: 'suresh@example.com', phone: '+91 98765 99999' },
  'admin@schuber.com': { password: 'admin123', role: 'admin', full_name: 'Schuber Admin', id: 'demo-admin-001', email: 'admin@schuber.com', phone: '+91 98765 00000' },
};

// Guaranteed role for known e-mails
const KNOWN_ROLES = {
  'priya@example.com': 'parent',
  'suresh@example.com': 'driver',
  'admin@schuber.com': 'admin',
  [ADMIN_EMAIL.toLowerCase()]: 'admin', // real admin always gets admin
};

async function fetchProfileRole(userId, email) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, phone, avatar_url')
      .eq('id', userId)
      .single();

    if (profile?.role === 'driver') {
      const { data: driver } = await supabase
        .from('drivers')
        .select('id, verified')
        .eq('user_id', userId)
        .maybeSingle();
      return { ...profile, driver_profile_exists: !!driver, is_verified: driver?.verified ?? false };
    }

    if (profile?.role) return profile;
  } catch (_) { }
  return null;
}

function bestRole(dbRole, metaRole, email) {
  if (dbRole) return dbRole;
  if (metaRole && ['parent', 'driver', 'admin'].includes(metaRole)) return metaRole;
  if (email && KNOWN_ROLES[email?.toLowerCase()]) return KNOWN_ROLES[email.toLowerCase()];
  return null; // no default — user must choose a role
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootStatus, setBootStatus] = useState('Initializing...');
  const [showBypass, setShowBypass] = useState(false);
  const [isDemoUser, setIsDemoUser] = useState(false);

  // When login() sets profile, block bootstrap() from overwriting it
  const loginSetRef = useRef(false);
  // Remembers the last successfully resolved role across multiple bootstrap() calls
  // (fixes OAuth double-fire race condition)
  const resolvedRoleRef = useRef(null);

  // ── Bootstrap: run on page load / auth state change ────────────────────────
  async function bootstrap(session) {
    console.log('[Auth] 🚀 Bootstrapping session...');
    setBootStatus('Checking local session...');

    // 10s Safety Timeout
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('[Auth] ⏱️ Bootstrap timeout! Forcing entry.');
        setBootStatus('Connection slow... proceeding anyway.');
        setLoading(false);
      }
    }, 10000);

    // Bypass link after 4s
    const bypassTimer = setTimeout(() => setShowBypass(true), 4000);

    try {
      // ── No session → check demo localStorage ──────────────────────────────
      if (!session?.user) {
        const raw = localStorage.getItem('schuber-demo-session');
        if (raw) {
          setBootStatus('Restoring demo session...');
          try {
            const demo = JSON.parse(raw);
            const dbProf = await fetchProfileRole(demo.id, demo.email);

            setUser({ id: demo.id, email: demo.email });
            setIsDemoUser(true);
            setProfile({
              ...demo,
              ...(dbProf || {}),
              has_driver_profile: dbProf?.driver_profile_exists ?? false,
              is_verified: dbProf?.is_verified ?? false,
            });
            setLoading(false);
            return;
          } catch { localStorage.removeItem('schuber-demo-session'); }
        }
        if (!loginSetRef.current) { setUser(null); setProfile(null); }
        setLoading(false);
        return;
      }

      // ── We have a real Supabase session ────────────────────────────────────
      setUser(session.user);
      setIsDemoUser(false);
      setBootStatus(`Hello, ${session.user.email}. Loading profile...`);

      // If login() already set a correct profile, trust it — skip re-fetch
      if (loginSetRef.current) {
        loginSetRef.current = false;
        return;
      }

      // Build profile from DB + metadata
      const meta = session.user.user_metadata ?? {};
      const email = session.user.email ?? '';
      const dbProf = await fetchProfileRole(session.user.id, email);

      const pendingRole = localStorage.getItem('schuber-pending-role');
      console.log('[Auth] 🔍 Bootstrap:', { email, dbProf: dbProf?.role, pendingRole });
      localStorage.removeItem('schuber-pending-role');


      // ── RULE 1: Admin-only email enforcement ──────────────────────────────
      const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // ── RULE 2: Role conflict — if user already has a DB role, respect it ─
      const existingRole = dbProf?.role;
      let resolvedRole;

      if (isAdminEmail) {
        resolvedRole = 'admin';
      } else if (existingRole && existingRole !== 'admin') {
        if (pendingRole && pendingRole !== existingRole) {
          console.warn(`[Auth] 🚫 ROLE CONFLICT: This account is already a '${existingRole}'. You tried to sign in as '${pendingRole}'.`);
          localStorage.setItem('schuber-role-conflict', `This account is registered as a ${existingRole}. Please sign in as ${existingRole}.`);
          await signOut().catch(() => { });

          setUser(null); setProfile(null); setLoading(false);
          return;
        }
        resolvedRole = existingRole;
      } else {
        resolvedRole =
          pendingRole
          || resolvedRoleRef.current
          || bestRole(null, meta.role, email);

        if (resolvedRole === 'admin' && !isAdminEmail) {
          console.warn('[Auth] 🚫 Blocked non-admin email from getting admin role:', email);
          resolvedRole = null;
          localStorage.setItem('schuber-role-conflict', 'Admin access is restricted.');
          await signOut().catch(() => { });
          setUser(null); setProfile(null); setLoading(false);
          return;
        }
      }

      if (!resolvedRole) {
        console.warn('[Auth] ⚠️  No role resolved for', email, '— defaulting to parent');
        resolvedRole = 'parent';
      }

      resolvedRoleRef.current = resolvedRole;

      // Persist profile + role to DB when new or roleless
      if (pendingRole || !existingRole) {
        console.log('[Auth] 📝 Saving profile to DB:', { id: session.user.id, role: resolvedRole });
        const { error: upsertErr } = await supabase.from('profiles').upsert({
          id: session.user.id,
          email,
          role: resolvedRole || 'parent',
          full_name: dbProf?.full_name || meta.full_name || meta.name || email,
          phone: dbProf?.phone || meta.phone || null,
        }, { onConflict: 'id' });

        if (upsertErr) {
          console.error('[Auth] ❌ Profile Upsert Failed:', upsertErr.message);
        } else {
          console.log('[Auth] ✅ Profile saved successfully.');
        }

        if (resolvedRole === 'driver' && !existingRole) {
          localStorage.setItem('schuber-driver-setup', '1');
        }
      }

      setProfile({
        id: session.user.id,
        email,
        role: resolvedRole,
        full_name: dbProf?.full_name ?? meta.full_name ?? email,
        phone: dbProf?.phone ?? meta.phone ?? null,
        avatar_url: dbProf?.avatar_url ?? meta.avatar_url ?? null,
        has_driver_profile: resolvedRole !== 'driver' || (dbProf?.driver_profile_exists ?? false),
        is_verified: dbProf?.is_verified ?? false,
      });
    } catch (err) {
      console.error('[Auth] ❌ Bootstrap failed:', err);
      setBootStatus('Unexpected error during startup.');
    } finally {
      setLoading(false);
      clearTimeout(timer);
      clearTimeout(bypassTimer);
    }
  }

  // ── Initialise on mount ────────────────────────────────────────────────────
  useEffect(() => {
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

    supabase.auth.getSession()
      .then(({ data: { session } }) => bootstrap(session))
      .catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      bootstrap(session);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  // ── login() ────────────────────────────────────────────────────────────────
  async function login(emailRaw, password) {
    const email = emailRaw?.trim().toLowerCase();
    loginSetRef.current = false;
    localStorage.removeItem('schuber-demo-session');

    const demo = DEMO_ACCOUNTS[email];
    if (demo && demo.password === password) {
      console.log('[Auth] 🎭 demo login:', email, '→ role:', demo.role);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
          const meta = data.user.user_metadata ?? {};
          const dbProf = await fetchProfileRole(data.user.id, email);
          const role = dbProf?.role || demo.role;
          const fullProfile = {
            id: data.user.id,
            email,
            role,
            full_name: dbProf?.full_name ?? meta.full_name ?? demo.full_name,
            phone: dbProf?.phone ?? meta.phone ?? demo.phone,
          };
          loginSetRef.current = true;
          setUser(data.user);
          setProfile(fullProfile);
          setIsDemoUser(false);
          setLoading(false);
          console.log('[Auth] ✅ demo real-login:', email, '→ role:', role);
          return { ...data.user, role };
        }
      } catch { /* fall through to local demo */ }

      const demoProfile = { ...demo };
      localStorage.setItem('schuber-demo-session', JSON.stringify(demoProfile));
      loginSetRef.current = true;
      setUser({ id: demo.id, email: demo.email });
      setProfile(demoProfile);
      setIsDemoUser(true);
      setLoading(false);
      return { ...demo, role: demo.role };
    }

    throw new Error('Invalid demo credentials.');
  }

  // ── logout() ───────────────────────────────────────────────────────────────
  async function logout() {
    loginSetRef.current = false;
    resolvedRoleRef.current = null;
    localStorage.removeItem('schuber-demo-session');
    localStorage.removeItem('schuber-pending-role');
    localStorage.removeItem('schuber-driver-setup');
    setUser(null);
    setProfile(null);
    setIsDemoUser(false);
    if (!isDemoUser) await signOut().catch(() => { });
  }

  async function getAuthHeader() {
    if (isDemoUser) {
      return {
        'Content-Type': 'application/json',
        'X-Demo-Role': profile?.role || 'parent',
        'X-Demo-User': profile?.id || 'demo',
      };
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session
      ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }

  async function refreshProfile() {
    if (!user) return;
    const dbProf = await fetchProfileRole(user.id, user.email).catch(() => null);
    if (dbProf) {
      setProfile(p => ({
        ...p,
        ...dbProf,
        has_driver_profile: dbProf.driver_profile_exists ?? p?.has_driver_profile,
        is_verified: dbProf.is_verified ?? p?.is_verified,
      }));
    }
  }

  return (
    <AuthContext.Provider value={{
      user, profile,
      role: profile?.role ?? null,
      loading, isDemoUser,
      login,
      logout, signOut: logout,
      signInWithGoogle,
      getAuthHeader, refreshProfile,
    }}>
      {loading ? (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#FFFBF0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          border: '10px solid #F59E0B'
        }}>
          <div style={{
            width: 64,
            height: 64,
            border: '8px solid #FDE68A',
            borderTopColor: '#F59E0B',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '2rem'
          }} />
          <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

          {showBypass && (
            <div style={{
              padding: '1rem',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: 12,
              textAlign: 'center',
              maxWidth: 300,
              animation: 'fadeIn 0.5s ease'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#92400E', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                Taking longer than usual? The connection might be slow.
              </div>
            </div>
          )}
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);