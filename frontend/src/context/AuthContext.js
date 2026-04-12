
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, getProfile, signInWithGoogle, signOut } from '../supabase';

const AuthContext = createContext(null);

// Demo accounts — work even without Supabase connectivity
const DEMO_ACCOUNTS = {
  'priya@example.com':   { password:'parent123', role:'parent', full_name:'Priya Sharma', id:'demo-parent-001', email:'priya@example.com', phone:'+91 98765 43210' },
  'suresh@example.com':  { password:'driver123', role:'driver', full_name:'Suresh Kumar', id:'demo-driver-001', email:'suresh@example.com', phone:'+91 98765 99999' },
  'admin@schuber.com':   { password:'admin123',  role:'admin',  full_name:'Schuber Admin', id:'demo-admin-001', email:'admin@schuber.com', phone:'+91 98765 00000' },
};

// Reliable role lookup by email — works even when RLS blocks DB reads
const KNOWN_ROLES = {
  'priya@example.com': 'parent',
  'suresh@example.com': 'driver',
  'admin@schuber.com': 'admin',
};

function resolveRole(dbRole, userMetadata, email) {
  // 1. DB role is most authoritative
  if (dbRole) return dbRole;
  // 2. user_metadata from Supabase Auth
  if (userMetadata?.role) return userMetadata.role;
  // 3. Known email mapping (reliable fallback)
  if (email && KNOWN_ROLES[email.toLowerCase()]) return KNOWN_ROLES[email.toLowerCase()];
  // 4. Default
  return 'parent';
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isDemoUser, setIsDemoUser] = useState(false);

  // Tracks the profile set by login() — bootstrap must never overwrite this
  const manualProfileRef = useRef(null);

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
        // Only clear state if login() didn't just set it
        if (!manualProfileRef.current) {
          setUser(null);
          setProfile(null);
        }
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);
      setIsDemoUser(false);

      // If login() manually set the profile, DON'T overwrite — just use it
      if (manualProfileRef.current) {
        console.log('[Auth] bootstrap: using profile set by login()', manualProfileRef.current.role);
        setProfile(manualProfileRef.current);
        return;
      }

      // Otherwise, fetch profile from DB
      let prof = null;
      try {
        prof = await getProfile(currentUser.id);
      } catch (err) {
        console.warn('[Auth] getProfile failed:', err.message);
      }

      const role = resolveRole(prof?.role, currentUser.user_metadata, currentUser.email);

      if (prof) {
        prof = { ...prof, role }; // ensure resolved role
        if (!prof.avatar_url && currentUser.user_metadata?.avatar_url) {
          prof = { ...prof, avatar_url: currentUser.user_metadata.avatar_url };
        }
        setProfile(prof);
      } else {
        // Build profile from metadata
        setProfile({
          id: currentUser.id,
          role,
          full_name: currentUser.user_metadata?.full_name ?? currentUser.email ?? 'User',
          email: currentUser.email,
          avatar_url: currentUser.user_metadata?.avatar_url ?? null,
          phone: currentUser.user_metadata?.phone ?? null,
        });
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
      console.log('[Auth] onAuthStateChange:', event);
      bootstrap(session);
    });

    const timeout = setTimeout(() => setLoading(false), 8000);
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, [bootstrap]);

  async function login(email, password) {
    // Clear any previous manual profile and stale sessions
    manualProfileRef.current = null;
    localStorage.removeItem('schuber-demo-session');

    // Try real Supabase login first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        const prof = await getProfile(data.user.id).catch(() => null);
        const role = resolveRole(prof?.role, data.user.user_metadata, email);

        const fullProfile = prof
          ? { ...prof, role }
          : {
              id: data.user.id, role, email: data.user.email,
              full_name: data.user.user_metadata?.full_name ?? data.user.email,
              avatar_url: data.user.user_metadata?.avatar_url ?? null,
              phone: data.user.user_metadata?.phone ?? null,
            };

        console.log('[Auth] login success:', email, '→ role:', role);

        // Store in ref so bootstrap doesn't overwrite
        manualProfileRef.current = fullProfile;
        setUser(data.user);
        setProfile(fullProfile);
        setIsDemoUser(false);
        setLoading(false);
        return { ...data.user, role };
      }
    } catch (e) {
      console.warn('[Auth] Supabase login failed, trying demo:', e.message);
    }

    // Fallback: demo accounts
    const demo = DEMO_ACCOUNTS[email?.toLowerCase()];
    if (demo && demo.password === password) {
      const demoProfile = { ...demo };
      console.log('[Auth] demo login:', email, '→ role:', demo.role);
      localStorage.setItem('schuber-demo-session', JSON.stringify(demoProfile));
      manualProfileRef.current = demoProfile;
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
      await supabase.from('profiles').upsert(
        { id: data.user.id, role, full_name: fullName, email, phone },
        { onConflict:'id' }
      ).catch(e => console.error('[Auth] Profile upsert failed:', e.message));

      if (role === 'driver') {
        await supabase.from('drivers').insert({
          user_id: data.user.id,
          verified: false, is_online: false, rating: 0, capacity: 12,
        }).catch(e => console.error('[Auth] Driver insert failed:', e.message));
      }

      if (data.session) {
        const prof = { id: data.user.id, role, full_name: fullName, email, phone };
        manualProfileRef.current = prof;
        setUser(data.user);
        setProfile(prof);
        setLoading(false);
        return data.user;
      }
    }
    return data.user;
  }

  async function logout() {
    manualProfileRef.current = null;
    localStorage.removeItem('schuber-demo-session');
    setUser(null);
    setProfile(null);
    setIsDemoUser(false);
    if (!isDemoUser) {
      await signOut().catch(() => {});
    }
  }

  async function getAuthHeader() {
    if (isDemoUser) return { 'X-Demo-User': profile?.id || 'demo', 'X-Demo-Role': profile?.role || 'parent', 'Content-Type':'application/json' };
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization:`Bearer ${session.access_token}`, 'Content-Type':'application/json' } : { 'Content-Type':'application/json' };
  }

  async function refreshProfile() {
    if (isDemoUser || !user) return;
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
