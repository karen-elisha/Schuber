import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../supabase';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: params.get('role') || 'parent',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await register(form.email, form.password, form.name, form.role, form.phone);
      if (!user) {
        // Supabase email confirmation required
        setSuccess('Account created! Check your email to confirm, then sign in.');
        return;
      }
      if (form.role === 'driver') {
        navigate('/driver-verification');
      } else {
        navigate(`/${form.role}`, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Google sign-up failed. Please try again.');
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .reg-input:focus { border-color: #F59E0B !important; outline: none; box-shadow: 0 0 0 3px rgba(245,158,11,0.15) !important; }
      `}</style>
      <div style={s.card}>
        <Link to="/" style={s.logo}>
          <div style={s.logoText}>🚌 <span style={{color:'#F59E0B'}}>Schu</span>ber</div>
        </Link>
        <h1 style={s.heading}>Create your account</h1>
        <p style={s.sub}>Join thousands of families using Schuber</p>

        {/* Google Sign-Up */}
        <button onClick={handleGoogle} style={s.googleBtn}>
          <svg width="20" height="20" viewBox="0 0 48 48" style={{flexShrink:0}}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign up with Google
        </button>

        <div style={s.dividerRow}>
          <div style={s.dividerLine}/>
          <span style={s.dividerTxt}>or register with email</span>
          <div style={s.dividerLine}/>
        </div>

        <div style={s.roleToggle}>
          {['parent', 'driver'].map(r => (
            <button key={r} style={{ ...s.roleBtn, ...(form.role === r ? s.roleBtnActive : {}) }}
              onClick={() => setForm(f => ({ ...f, role: r }))}>
              {r === 'parent' ? '👨‍👩‍👧 Parent' : '🚌 Driver'}
            </button>
          ))}
        </div>

        <form onSubmit={handle} style={s.form}>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input className="reg-input" style={s.input} required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Priya Sharma" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Phone</label>
              <input className="reg-input" style={s.input} value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input className="reg-input" style={s.input} type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input className="reg-input" style={s.input} type="password" required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" minLength={6} />
          </div>
          {error && <div style={s.error}>⚠️ {error}</div>}
          {success && <div style={s.successBox}>✅ {success}</div>}
          <button type="submit" disabled={loading} style={{...s.submit, opacity: loading ? 0.8 : 1}}>
            {loading ? <span style={s.spinner} /> : null}
            {loading ? 'Creating account…' : `Create ${form.role === 'parent' ? 'Parent' : 'Driver'} Account →`}
          </button>
        </form>

        {form.role === 'driver' && (
          <div style={s.driverNote}>
            <span>ℹ️</span>
            <span>Driver accounts require <strong>identity & license verification</strong> before accepting rides. You'll be prompted after registration.</span>
          </div>
        )}
        <p style={s.terms}>By registering you agree to our Terms of Service and Privacy Policy.</p>
        <p style={s.switchText}>
          Already have an account? <Link to="/login" style={s.switchLink}>Sign in</Link>
        </p>
      </div>

      <div style={s.sidePanel}>
        <h3 style={s.benefitTitle}>Why Schuber?</h3>
        {[
          ['✅', 'Verified & background-checked drivers'],
          ['📍', 'Real-time GPS tracking on every trip'],
          ['🔔', 'Instant alerts for check-in & check-out'],
          ['🆘', 'SOS emergency alerts with one tap'],
          ['📊', 'Full trip history & attendance records'],
          ['💳', 'Subscription plans from ₹99/month'],
          ['🤖', 'AI assistant for instant answers'],
          ['🔒', 'Attendance locked — tamper-proof'],
        ].map(([icon, text]) => (
          <div key={text} style={s.benefitItem}>
            <span style={s.bIcon}>{icon}</span>
            <span style={s.bText}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', background: '#FFFBF0', fontFamily: "'DM Sans', sans-serif" },
  card: { flex: '1 1 480px', padding: 'clamp(2rem,6vw,4rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 580 },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem', textDecoration: 'none' },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#1C1917' },
  heading: { fontFamily: "'Syne', sans-serif", fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.35rem', color: '#1C1917', marginTop: 0 },
  sub: { color: '#78716C', marginBottom: '1.25rem', marginTop: 0 },
  googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: '0.95rem', fontWeight: 600, color: '#1C1917', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif" },
  dividerRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' },
  dividerLine: { flex: 1, height: 1, background: '#E5E7EB' },
  dividerTxt: { color: '#9CA3AF', fontSize: '0.78rem', whiteSpace: 'nowrap', fontWeight: 500 },
  roleToggle: { display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: '#FEF3C7', borderRadius: 12, padding: '0.3rem' },
  roleBtn: { flex: 1, padding: '0.6rem', borderRadius: 9, border: 'none', background: 'transparent', color: '#78716C', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" },
  roleBtnActive: { background: '#F59E0B', color: '#fff', fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '0.75rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.75rem', color: '#57534E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { background: '#FFFFFF', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '0.7rem 0.9rem', color: '#1C1917', fontSize: '0.95rem', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', width: '100%' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.875rem' },
  successBox: { background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#065F46', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.875rem' },
  submit: { background: '#F59E0B', color: '#fff', border: 'none', padding: '0.875rem', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700, marginTop: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: "'DM Sans', sans-serif" },
  spinner: { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
  driverNote: { background: '#FFF8E7', border: '1px solid #FDE68A', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#92400E', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' },
  terms: { color: '#A8A29E', fontSize: '0.72rem', textAlign: 'center', marginBottom: '0.5rem', marginTop: '0.5rem' },
  switchText: { color: '#78716C', fontSize: '0.875rem', textAlign: 'center', marginBottom: 0 },
  switchLink: { color: '#D97706', fontWeight: 700 },
  sidePanel: { flex: '1 1 300px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3rem' },
  benefitTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.75rem', color: '#fff', marginTop: 0 },
  benefitItem: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-start' },
  bIcon: { fontSize: '1.1rem', flexShrink: 0, marginTop: '0.1rem' },
  bText: { color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: 1.5 },
};