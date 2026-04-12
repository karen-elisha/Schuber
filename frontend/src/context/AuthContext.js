
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, getProfile, signInWithGoogle, signOut } from '../supabase';

const AuthContext = createContext(null);

// Demo accounts that work without real Supabase setup
const DEMO_ACCOUNTS = {
  'priya@example.com':   { password:'parent123', role:'parent', full_name:'Priya Sharma', id:'demo-parent-001', email:'priya@example.com', phone:'+91 98765 43210' },
  'suresh@example.com':  { password:'driver123', role:'driver', full_name:'Suresh Kumar', id:'demo-driver-001', email:'suresh@example.com', phone:'+91 98765 99999' },
  'admin@schuber.com':   { password:'admin123',  role:'admin',  full_name:'Schuber Admin', id:'demo-admin-001', email:'admin@schuber.com', phone:'+91 98765 00000' },
};

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
  const [isDemoUser, setIsDemoUser] = useState(false);

  const bootstrap = useCallback(async (session) => {
    try {
      setAuthError(null);
      if (!session?.user) {
        // Check for demo session in localStorage
        const demoSession = localStorage.getItem('schuber-demo-session');
        if (demoSession) {
          const demo = JSON.parse(demoSession);
          setUser({ id: demo.id, email: demo.email });
          setProfile(demo);
          setIsDemoUser(true);
          return;
        }
        setUser(null);
        setProfile(null);
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);
      setIsDemoUser(false);

      let prof = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try { prof = await getProfile(currentUser.id); break; }
        catch (err) { if (attempt < 3) await new Promise(r => setTimeout(r, 600 * attempt)); }
      }

      if (!prof) {
        const fallback = DEFAULT_PROFILE_FALLBACK(currentUser);
        await supabase.from('profiles').upsert(fallback, { onConflict:'id' }).catch(() => {});
        setProfile(fallback);
        return;
      }

      if (!prof.role) {
        await supabase.from('profiles').update({ role:'parent' }).eq('id', currentUser.id);
        prof = { ...prof, role:'parent' };
      }

      if (!prof.avatar_url && currentUser.user_metadata?.avatar_url) {
        prof = { ...prof, avatar_url: currentUser.user_metadata.avatar_url };
      }

      setProfile(prof);
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
        return { ...data.user, role: prof?.role ?? 'parent' };
      }
    } catch (e) {
      // If Supabase is unreachable, fall through to demo
    }

    // Fallback: demo accounts
    const demo = DEMO_ACCOUNTS[email?.toLowerCase()];
    if (demo && demo.password === password) {
      const demoProfile = { ...demo };
      localStorage.setItem('schuber-demo-session', JSON.stringify(demoProfile));
      setUser({ id: demo.id, email: demo.email });
      setProfile(demoProfile);
      setIsDemoUser(true);
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
        // User is auto-logged in
        const prof = { id: data.user.id, role, full_name: fullName, email, phone };
        setUser(data.user);
        setProfile(prof);
        return data.user;
      }
    }

    // If no session, the user needs to confirm their email
    return data.user;
  }

  async function logout() {
    if (isDemoUser) {
      localStorage.removeItem('schuber-demo-session');
      setUser(null);
      setProfile(null);
      setIsDemoUser(false);
      return;
    }
    await signOut();
    localStorage.removeItem('schuber-demo-session');
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
