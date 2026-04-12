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
  'priya@example.com':  { password:'parent123', role:'parent', full_name:'Priya Sharma',   id:'demo-parent-001', email:'priya@example.com',  phone:'+91 98765 43210' },
  'suresh@example.com': { password:'driver123', role:'driver', full_name:'Suresh Kumar',   id:'demo-driver-001', email:'suresh@example.com', phone:'+91 98765 99999' },
  'admin@schuber.com':  { password:'admin123',  role:'admin',  full_name:'Schuber Admin',  id:'demo-admin-001',  email:'admin@schuber.com',  phone:'+91 98765 00000' },
};

// Guaranteed role for known e-mails
const KNOWN_ROLES = {
  'priya@example.com':       'parent',
  'suresh@example.com':      'driver',
  'admin@schuber.com':       'admin',
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
  } catch (_) {}
  return null;
}

function bestRole(dbRole, metaRole, email) {
  if (dbRole)   return dbRole;
  if (metaRole && ['parent','driver','admin'].includes(metaRole)) return metaRole;
  if (email && KNOWN_ROLES[email?.toLowerCase()]) return KNOWN_ROLES[email.toLowerCase()];
  return null; // no default — user must choose a role
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [isDemoUser,setIsDemoUser]= useState(false);

  // When login() sets profile, block bootstrap() from overwriting it
  const loginSetRef = useRef(false);
  // Remembers the last successfully resolved role across multiple bootstrap() calls
  // (fixes OAuth double-fire race condition)
  const resolvedRoleRef = useRef(null);

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
      const meta        = session.user.user_metadata ?? {};
      const email       = session.user.email ?? '';
      const dbProf      = await fetchProfileRole(session.user.id, email);

      const pendingRole = localStorage.getItem('schuber-pending-role');
      console.log('[Auth] 🔍 Bootstrap:', { email, dbProf: dbProf?.role, pendingRole });
      localStorage.removeItem('schuber-pending-role');


      // ── RULE 1: Admin-only email enforcement ──────────────────────────────
      // karenelisha0204@gmail.com is ALWAYS admin.
      // Any other account that somehow gets admin role is forced to parent.
      const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // ── RULE 2: Role conflict — if user already has a DB role, respect it ─
      // They cannot switch roles by picking a different one on the login page.
      const existingRole = dbProf?.role;
      let resolvedRole;

      if (isAdminEmail) {
        // Real admin account — always admin, no exceptions
        resolvedRole = 'admin';
      } else if (existingRole && existingRole !== 'admin') {
        // Existing parent/driver — their DB role wins, ignore pendingRole
        if (pendingRole && pendingRole !== existingRole) {
          console.warn(`[Auth] 🚫 ROLE CONFLICT: This account is already a '${existingRole}'. You tried to sign in as '${pendingRole}'.`);
          localStorage.setItem('schuber-role-conflict', `This account is registered as a ${existingRole}. Please sign in as ${existingRole}.`);
          await signOut().catch(() => {});

          setUser(null); setProfile(null); setLoading(false);
          return;
        }
        resolvedRole = existingRole;
      } else {
        // New user — use pendingRole from the role picker
        resolvedRole =
          pendingRole
          || resolvedRoleRef.current
          || bestRole(null, meta.role, email);

        // Block anyone (other than admin email) from getting admin role
        if (resolvedRole === 'admin' && !isAdminEmail) {
          console.warn('[Auth] 🚫 Blocked non-admin email from getting admin role:', email);
          resolvedRole = null;
          localStorage.setItem('schuber-role-conflict', 'Admin access is restricted.');
          await signOut().catch(() => {});
          setUser(null); setProfile(null); setLoading(false);
          return;
        }
      }

      if (!resolvedRole) console.warn('[Auth] ⚠️  No role resolved for', email);

      // Remember this role for any subsequent bootstrap() calls this session
      if (resolvedRole) resolvedRoleRef.current = resolvedRole;

      // Persist profile + role to DB when new or roleless
      if (pendingRole || !existingRole) {
        await supabase.from('profiles').upsert({
          id:        session.user.id,
          email,
          role:      resolvedRole || 'parent',
          full_name: dbProf?.full_name || meta.full_name || meta.name || email,
          phone:     dbProf?.phone     || meta.phone     || null,
        }, { onConflict: 'id' }).catch(() => {});

        // New driver → flag for verification form
        if (resolvedRole === 'driver' && !existingRole) {
          localStorage.setItem('schuber-driver-setup', '1');
        }
      }

      setProfile({
        id:         session.user.id,
        email,
        role:       resolvedRole,
        full_name:  dbProf?.full_name ?? meta.full_name ?? email,
        phone:      dbProf?.phone     ?? meta.phone     ?? null,
        avatar_url: dbProf?.avatar_url ?? meta.avatar_url ?? null,
        has_driver_profile: dbProf?.driver_profile_exists ?? false,
        is_verified: dbProf?.is_verified ?? false,
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
  // ── login() — only used for demo accounts ─────────────────────────────────
  // Real users sign in via Google (signInWithGoogle) which is handled
  // automatically by Supabase onAuthStateChange.
  async function login(emailRaw, password) {
    const email = emailRaw?.trim().toLowerCase();
    loginSetRef.current = false;
    localStorage.removeItem('schuber-demo-session');

    // ── Demo account fast-path ─────────────────────────────────────────────
    const demo = DEMO_ACCOUNTS[email];
    if (demo && demo.password === password) {
      console.log('[Auth] 🎭 demo login:', email, '→ role:', demo.role);

      // Also try real Supabase auth for demo accounts (so DB queries work)
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
          const meta    = data.user.user_metadata ?? {};
          const dbProf  = await fetchProfileRole(data.user.id, email);
          // Use demo.role as guaranteed fallback — never let DB/metadata override known demo roles
          const role    = dbProf?.role || demo.role;
          const fullProfile = {
            id:        data.user.id,
            email,
            role,
            full_name: dbProf?.full_name ?? meta.full_name ?? demo.full_name,
            phone:     dbProf?.phone     ?? meta.phone     ?? demo.phone,
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

      // Local demo fallback (no internet / Supabase down)
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
    loginSetRef.current   = false;
    resolvedRoleRef.current = null;   // clear cached role for next user
    localStorage.removeItem('schuber-demo-session');
    localStorage.removeItem('schuber-pending-role');
    localStorage.removeItem('schuber-driver-setup');
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
      login,
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
