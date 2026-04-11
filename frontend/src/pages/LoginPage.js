import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../supabase';

const demos = [
  { label: '👨‍👩‍👧 Parent', email: 'priya@example.com', password: 'parent123' },
  { label: '🚌 Driver', email: 'suresh@example.com', password: 'driver123' },
  { label: '🛡️ Admin', email: 'admin@schuber.com', password: 'admin123' },
];

export default function LoginPage() {
  useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { supabase } = await import('../supabase');
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    }
  };

  return (
    <div style={s.page}>
      {/* Background decorative blobs */}
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={s.container}>
        {/* Logo */}
        <Link to="/" style={s.logoWrap}>
          <img src="/logo.png" alt="Schuber Logo" style={s.logoImg} />
        </Link>

        <div style={s.card}>
          <h1 style={s.heading}>Welcome back</h1>
          <p style={s.sub}>Sign in to your Schuber account</p>

          {/* Google Sign-In */}
          <button onClick={handleGoogle} style={s.googleBtn}>
            <svg width="20" height="20" viewBox="0 0 48 48" style={{flexShrink:0}}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div style={s.dividerRow}>
            <div style={s.dividerLine}/>
            <span style={s.dividerTxt}>or sign in with email</span>
            <div style={s.dividerLine}/>
          </div>

          <form onSubmit={handle} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>✉️</span>
                <input style={s.input} type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com" />
              </div>
            </div>
            <div style={s.field}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <label style={s.label}>Password</label>
                <span style={s.forgotLink}>Forgot password?</span>
              </div>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>🔒</span>
                <input style={{...s.input, paddingRight:'2.8rem'}} type={showPass ? 'text' : 'password'}
                  required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(v=>!v)} style={s.eyeBtn}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {error && <div style={s.error}>⚠️ {error}</div>}
            <button type="submit" disabled={loading} style={s.submit}>
              {loading ? <span style={s.spinner} /> : null}
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={s.demoSection}>
            <p style={s.demoLabel}>Try a demo account</p>
            <div style={s.demoGrid}>
              {demos.map(d => (
                <button key={d.label} style={s.demoBtn}
                  onClick={() => setForm({ email: d.email, password: d.password })}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p style={s.switchText}>
            New to Schuber? <Link to="/register" style={s.switchLink}>Create account →</Link>
          </p>
        </div>

        {/* Trust badges */}
        <div style={s.trustRow}>
          {['🔒 SSL Secured', '✅ Verified Drivers', '🛡️ AIS-140 Compliant'].map(t => (
            <span key={t} style={s.trustBadge}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFFBF0 0%, #FEF3C7 50%, #FFFBF0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    padding: '2rem 1rem',
  },
  blob1: {
    position: 'absolute', top: '-120px', right: '-120px',
    width: 400, height: 400,
    background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-100px', left: '-100px',
    width: 350, height: 350,
    background: 'radial-gradient(circle, rgba(217,119,6,0.12) 0%, transparent 70%)',
    borderRadius: '50%', pointerEvents: 'none',
  },
  container: {
    width: '100%', maxWidth: 480,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
    position: 'relative', zIndex: 1,
  },
  logoWrap: { display: 'block' },
  logoImg: { height: 90, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' },
  card: {
    width: '100%',
    background: '#FFFFFF',
    borderRadius: 24,
    padding: '2.5rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(245,158,11,0.1)',
    border: '1px solid rgba(253,230,138,0.5)',
  },
  heading: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: '1.875rem', color: '#1C1917', textAlign: 'center', marginBottom: '0.3rem',
  },
  sub: { color: '#78716C', textAlign: 'center', marginBottom: '1.75rem', fontSize: '0.95rem' },
  googleBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.75rem', padding: '0.8rem 1rem',
    background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12,
    fontSize: '0.95rem', fontWeight: 600, color: '#1C1917',
    cursor: 'pointer', transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '1.25rem',
    fontFamily: "'DM Sans', sans-serif",
  },
  dividerRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' },
  dividerLine: { flex: 1, height: 1, background: '#F3F4F6' },
  dividerTxt: { color: '#9CA3AF', fontSize: '0.78rem', whiteSpace: 'nowrap', fontWeight: 500 },
  form: { display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.78rem', color: '#57534E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '0.9rem', fontSize: '1rem', pointerEvents: 'none' },
  input: {
    width: '100%', background: '#FAFAFA', border: '1.5px solid #E5E7EB', borderRadius: 12,
    padding: '0.75rem 1rem 0.75rem 2.75rem', color: '#1C1917', fontSize: '0.95rem',
    transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  },
  eyeBtn: {
    position: 'absolute', right: '0.9rem', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '1rem', padding: 0,
  },
  forgotLink: { fontSize: '0.78rem', color: '#D97706', fontWeight: 600, cursor: 'pointer' },
  error: {
    background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
    padding: '0.75rem 1rem', borderRadius: 10, fontSize: '0.875rem',
  },
  submit: {
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: '#fff', border: 'none', padding: '0.9rem', borderRadius: 12,
    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    fontFamily: "'DM Sans', sans-serif",
  },
  spinner: {
    width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    display: 'inline-block', animation: 'spin 0.7s linear infinite',
  },
  demoSection: { marginBottom: '1.5rem' },
  demoLabel: { fontSize: '0.75rem', color: '#A8A29E', fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' },
  demoGrid: { display: 'flex', gap: '0.5rem' },
  demoBtn: {
    flex: 1, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E',
    padding: '0.5rem 0.5rem', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
  switchText: { color: '#78716C', fontSize: '0.875rem', textAlign: 'center' },
  switchLink: { color: '#D97706', fontWeight: 700 },
  trustRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' },
  trustBadge: {
    background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(253,230,138,0.6)',
    borderRadius: 20, padding: '0.35rem 0.75rem', fontSize: '0.72rem', fontWeight: 600,
    color: '#78716C', backdropFilter: 'blur(8px)',
  },
};