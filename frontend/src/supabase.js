import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnon = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.error(
    '🔴 Supabase configuration missing! \n' +
    'Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file or Vercel dashboard.'
  );
}

// ⚠️  FIX: Use localStorage (not cookies) so auth persists across tabs/non-incognito.
//    The default in Supabase v2 is localStorage, but we make it explicit.
export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co', 
  supabaseAnon || 'missing-key', 
  {
    auth: {
      storage: window.localStorage,
      storageKey: 'schuber-auth',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,    // handles OAuth redirect tokens in URL
    },
  }
);

// ─── Auth helpers ────────────────────────────────────────────────────────────

/** Sign in/up with Google (opens OAuth redirect).
 *  Pass `role` so the profile row is created with the correct role after redirect. */
export const signInWithGoogle = async (role = 'parent') => {
  // Persist role so AuthContext can use it after the OAuth callback
  if (role) localStorage.setItem('schuber-pending-role', role);
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/',
      queryParams: { prompt: 'select_account' }, // always show account picker
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