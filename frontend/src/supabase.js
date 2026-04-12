import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnon = process.env.REACT_APP_SUPABASE_ANON_KEY;

// ⚠️  FIX: Use localStorage (not cookies) so auth persists across tabs/non-incognito.
//    The default in Supabase v2 is localStorage, but we make it explicit.
export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage: window.localStorage,
    storageKey: 'schuber-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,    // handles OAuth redirect tokens in URL
  },
});

// ─── Auth helpers ────────────────────────────────────────────────────────────

/** Sign in with Google (opens OAuth redirect) */
export const signInWithGoogle = async () => {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/',
    },
  });
};

/** Sign out */
export async function signOut() {
  await supabase.auth.signOut();
}

/** Get current session */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/** Get current user profile (includes role) */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}