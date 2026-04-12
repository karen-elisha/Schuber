import { supabase } from './supabase';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

async function getAuthHeaders() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      };
    }
  } catch (_) {}
  return { 'Content-Type': 'application/json' };
}

async function request(method, path, body) {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    // Handle non-JSON or empty responses gracefully
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    console.warn(`[api] ${method} ${path} failed:`, err.message);
    throw err;
  }
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  patch:  (path, body) => request('PATCH',  path, body),
  delete: (path)       => request('DELETE', path),
};

export default api;