import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { supabase } from '../supabase'; // ✅ ADD THIS

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 fetch profile from supabase
  const getProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log("PROFILE:", data, error);

    if (error) return null;
    return data;
  };

  useEffect(() => {
    const token = localStorage.getItem('schuber_token');

    if (token) {
      api.get('/auth/me')
        .then(async (u) => {
          // ✅ fetch profile from supabase
          const profile = await getProfile(u.id);

          if (!profile) {
            console.warn("No profile found");
            setUser(null);
            return;
          }

          // ✅ merge user + profile
          setUser({
            ...u,
            role: profile.role,
            full_name: profile.full_name
          });
        })
        .catch(() => {
          localStorage.removeItem('schuber_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });

    localStorage.setItem('schuber_token', data.token);

    // ✅ fetch profile
    const profile = await getProfile(data.user.id);

    const mergedUser = {
      ...data.user,
      role: profile?.role ?? 'parent',
      full_name: profile?.full_name
    };

    setUser(mergedUser);

    return mergedUser;
  };

  const register = async (form) => {
    const data = await api.post('/auth/register', form);

    localStorage.setItem('schuber_token', data.token);

    // ✅ fetch profile after register
    const profile = await getProfile(data.user.id);

    const mergedUser = {
      ...data.user,
      role: profile?.role ?? 'parent',
      full_name: profile?.full_name
    };

    setUser(mergedUser);

    return mergedUser;
  };

  const logout = () => {
    localStorage.removeItem('schuber_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {loading ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          Loading...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);