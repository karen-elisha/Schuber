// frontend/src/supabase.js
// npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnon = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ─── Auth helpers ───────────────────────────────────────────

/** Sign in with Google (opens OAuth popup/redirect) */
export const signInWithGoogle = async () => {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/profile'
    }
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
