
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, getProfile, signInWithGoogle, signOut } from '../supabase';

const AuthContext = createContext(null);

// Demo accounts — work even without Supabase connectivity
const DEMO_ACCOUNTS = {
  'priya@example.com':   { password:'parent123', role:'parent', full_name:'Priya Sharma', id:'demo-parent-001', email:'priya@example.com', phone:'+91 98765 43210' },
  'suresh@example.com':  { password:'driver123', role:'driver', full_name:'Suresh Kumar', id:'demo-driver-001', email:'suresh@example.com', phone:'+91 98765 99999' },
  'admin@schuber.com':   { password:'admin123',  role:'admin',  full_name:'Schuber Admin', id:'demo-admin-001', email:'admin@schuber.com', phone:'+91 98765 00000' },
};

// Email → role mapping for known accounts (reliable fallback when RLS blocks profile reads)
const KNOWN_ROLES = {
  'priya@example.com': 'parent',
  'suresh@example.com': 'driver',
  'admin@schuber.com': 'admin',
};

function resolveRole(dbRole, userMetadata, email) {
  // Priority: DB profile role → user_metadata role → known account role → 'parent'
  if (dbRole && dbRole !== 'parent') return dbRole;  // explicit non-default role from DB
  if (dbRole === 'parent') return dbRole;             // explicitly set to parent in DB
  if (userMetadata?.role) return userMetadata.role;
  if (email && KNOWN_ROLES[email.toLowerCase()]) return KNOWN_ROLES[email.toLowerCase()];
  return 'parent';
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isDemoUser, setIsDemoUser] = useState(false);

  // Flag: when login() sets profile manually, bootstrap should NOT overwrite it
  const loginSetProfileRef = useRef(false);

  const bootstrap = useCallback(async (session) => {
    try {
      setAuthError(null);

      if (!session?.user) {
        // Check for demo session in localStorage
        const demoSession = localStorage.getItem('schuber-demo-session');
        if (demoSession) {
          try {
            const demo = JSON.parse(demoSession);
            setUser({ id: demo.id, email: demo.email });
            setProfile(demo);
            setIsDemoUser(true);
          } catch { localStorage.removeItem('schuber-demo-session'); }
          return;
        }
        setUser(null);
        setProfile(null);
        return;
      }

      // If login() already set the profile, don't overwrite it
      if (loginSetProfileRef.current) {
        loginSetProfileRef.current = false;
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);
      setIsDemoUser(false);

      // Try fetching profile from DB
      let prof = null;
      try {
        prof = await getProfile(currentUser.id);
      } catch (err) {
        console.warn('[Auth] getProfile failed:', err.message);
      }

      if (prof) {
        // Got profile from DB
        if (!prof.avatar_url && currentUser.user_metadata?.avatar_url) {
          prof = { ...prof, avatar_url: currentUser.user_metadata.avatar_url };
        }
        setProfile(prof);
      } else {
        // Profile fetch failed (likely RLS) — build from user_metadata + known roles
        const role = resolveRole(null, currentUser.user_metadata, currentUser.email);
        const fallback = {
          id: currentUser.id,
          role,
          full_name: currentUser.user_metadata?.full_name ?? currentUser.email ?? 'User',
          email: currentUser.email,
          avatar_url: currentUser.user_metadata?.avatar_url ?? null,
          phone: currentUser.user_metadata?.phone ?? null,
        };
        setProfile(fallback);
      }
    } catch (err) {
      setAuthError(err?.message ?? 'Authentication error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check demo session first
    const demoSession = localStorage.getItem('schuber-demo-session');
    if (demoSession) {
      try {
        const demo = JSON.parse(demoSession);
        setUser({ id: demo.id, email: demo.email });
        setProfile(demo);
        setIsDemoUser(true);
        setLoading(false);
        return;
      } catch { localStorage.removeItem('schuber-demo-session'); }
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('[Auth] getSession error:', error.message);
      bootstrap(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      bootstrap(session);
    });

    const timeout = setTimeout(() => setLoading(false), 8000);
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, [bootstrap]);

  async function login(email, password) {
    // Try real Supabase login first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        const prof = await getProfile(data.user.id).catch(() => null);
        const role = resolveRole(prof?.role, data.user.user_metadata, email);
        const fullProfile = prof
          ? { ...prof, role }  // ensure we use resolved role
          : {
              id: data.user.id, role, email: data.user.email,
              full_name: data.user.user_metadata?.full_name ?? data.user.email,
              avatar_url: data.user.user_metadata?.avatar_url ?? null,
              phone: data.user.user_metadata?.phone ?? null,
            };

        // Set state IMMEDIATELY — and tell bootstrap to skip overwriting
        loginSetProfileRef.current = true;
        setUser(data.user);
        setProfile(fullProfile);
        setIsDemoUser(false);
        setLoading(false);
        return { ...data.user, role };
      }
    } catch (e) {
      // If Supabase is unreachable, fall through to demo
      console.warn('[Auth] Supabase login failed, trying demo:', e.message);
    }

    // Fallback: demo accounts
    const demo = DEMO_ACCOUNTS[email?.toLowerCase()];
    if (demo && demo.password === password) {
      const demoProfile = { ...demo };
      localStorage.setItem('schuber-demo-session', JSON.stringify(demoProfile));
      loginSetProfileRef.current = true;
      setUser({ id: demo.id, email: demo.email });
      setProfile(demoProfile);
      setIsDemoUser(true);
      setLoading(false);
      return { ...demo, role: demo.role };
    }

    throw new Error('Invalid email or password. Please check your credentials and try again.');
  }

  async function register(email, password, fullName, role = 'parent', phone = '') {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName, phone, role },
        emailRedirectTo: window.location.origin + '/login',
      },
    });
    if (error) throw error;

    if (data.user) {
      // Upsert profile with role
      await supabase.from('profiles').upsert(
        { id: data.user.id, role, full_name: fullName, email, phone },
        { onConflict:'id' }
      ).catch(e => console.error('[Auth] Profile upsert failed:', e.message));

      // If driver, auto-create driver record
      if (role === 'driver') {
        await supabase.from('drivers').insert({
          user_id: data.user.id,
          verified: false,
          is_online: false,
          rating: 0,
          capacity: 12,
        }).catch(e => console.error('[Auth] Driver insert failed:', e.message));
      }

      // Check if session exists (email might be auto-confirmed)
      if (data.session) {
        const prof = { id: data.user.id, role, full_name: fullName, email, phone };
        loginSetProfileRef.current = true;
        setUser(data.user);
        setProfile(prof);
        setLoading(false);
        return data.user;
      }
    }

    return data.user;
  }

  async function logout() {
    loginSetProfileRef.current = false;
    if (isDemoUser) {
      localStorage.removeItem('schuber-demo-session');
      setUser(null);
      setProfile(null);
      setIsDemoUser(false);
      return;
    }
    await signOut();
    localStorage.removeItem('schuber-demo-session');
    setUser(null);
    setProfile(null);
  }

  async function getAuthHeader() {
    if (isDemoUser) return { 'X-Demo-User': profile?.role || 'parent', 'Content-Type':'application/json' };
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization:`Bearer ${session.access_token}` } : {};
  }

  async function refreshProfile() {
    if (isDemoUser) return;
    if (!user) return;
    try { const prof = await getProfile(user.id); if (prof) setProfile(prof); }
    catch (err) { console.error('[Auth] refreshProfile error:', err); }
  }

  const value = {
    user, profile,
    role: profile?.role ?? null,
    loading, authError,
    isDemoUser,
    login, register,
    signOut: logout, logout,
    signInWithGoogle,
    getAuthHeader,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#FFFBF0', flexDirection:'column', gap:'1rem' }}>
          <div style={{ width:40, height:40, border:'3px solid #FDE68A', borderTopColor:'#F59E0B', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ color:'#D97706', fontWeight:600, fontFamily:'DM Sans,sans-serif' }}>Loading Schuber…</div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
