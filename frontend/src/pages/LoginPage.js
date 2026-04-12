
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../supabase';

const demos = [
  { label: '👨‍👩‍👧 Parent', email: 'priya@example.com', password: 'parent123', role: 'parent', desc: 'See live tracking, children & notifications' },
  { label: '🚌 Driver', email: 'suresh@example.com', password: 'driver123', role: 'driver', desc: 'Manage trips, students & attendance' },
  { label: '🛡️ Admin', email: 'admin@schuber.com', password: 'admin123', role: 'admin', desc: 'Full fleet & operations control' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loginRole, setLoginRole] = useState('parent');
  const [demoLoading, setDemoLoading] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const role = user?.role ?? loginRole ?? 'parent';
      navigate(`/${role}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign-in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try { await signInWithGoogle(); }
    catch (err) { setError('Google sign-in failed. Please try again.'); }
  };

  const fillDemo = (d) => {
    setForm({ email: d.email, password: d.password });
    setLoginRole(d.role);
    setError('');
  };

  const loginAsDemo = async (d) => {
    setDemoLoading(d.role);
    setError('');
    try {
      const user = await login(d.email, d.password);
      const role = user?.role ?? d.role;
      navigate(`/${role}`, { replace: true });
    } catch (err) {
      // If real login fails, simulate demo login with dummy data
      navigate(`/${d.role}`, { replace: true });
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .schuber-input:focus { border-color: #F59E0B !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.15) !important; outline: none; }
        .google-btn:hover { background: #F9FAFB !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
        .demo-card:hover { border-color: #F59E0B !important; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245,158,11,0.15) !important; }
        .role-tab:hover { background: #FEF3C7 !important; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(245,158,11,0.5) !important; }
      `}</style>

      <div style={s.container}>
        <Link to="/" style={s.logoWrap}>
          <div style={s.logoText}>🚌 <span style={{ color: '#F59E0B' }}>Schu</span>ber</div>
        </Link>

        <div style={s.card}>
          <h1 style={s.heading}>Welcome back</h1>
          <p style={s.sub}>Sign in to your Schuber account</p>

          {/* Demo Accounts - prominent */}
          <div style={s.demoSection}>
            <p style={s.demoLabel}>🎯 Try a Demo Account — One Click!</p>
            <div style={s.demoGrid}>
              {demos.map(d => (
                <div key={d.label} className="demo-card" style={s.demoCard}
                  onClick={() => loginAsDemo(d)}>
                  <div style={s.demoCardIcon}>{d.label.split(' ')[0]}</div>
                  <div style={s.demoCardLabel}>{d.label.substring(2)}</div>
                  <div style={s.demoCardDesc}>{d.desc}</div>
                  <button style={{ ...s.demoLoginBtn, opacity: demoLoading === d.role ? 0.7 : 1 }}
                    onClick={(e) => { e.stopPropagation(); loginAsDemo(d); }}>
                    {demoLoading === d.role ? '⏳ Logging in…' : 'Login as Demo →'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={s.dividerRow}>
            <div style={s.dividerLine}/>
            <span style={s.dividerTxt}>or sign in with your account</span>
            <div style={s.dividerLine}/>
          </div>

          {/* Role Toggle */}
          <div style={s.roleRow}>
            <span style={s.roleLabel}>I am a:</span>
            <div style={s.roleTabs}>
              {[['parent','👨‍👩‍👧 Parent'],['driver','🚌 Driver'],['admin','🛡️ Admin']].map(([r,l]) => (
                <button key={r} className="role-tab"
                  style={{ ...s.roleTab, ...(loginRole === r ? s.roleTabActive : {}) }}
                  onClick={() => setLoginRole(r)}>{l}
                </button>
              ))}
            </div>
          </div>

          {/* Google Sign-In */}
          <button onClick={handleGoogle} className="google-btn" style={s.googleBtn}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>

          <form onSubmit={handle} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>✉️</span>
                <input className="schuber-input" style={s.input} type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
              </div>
            </div>
            <div style={s.field}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <label style={s.label}>Password</label>
                <span style={s.forgotLink}>Forgot password?</span>
              </div>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>🔒</span>
                <input className="schuber-input" style={{...s.input, paddingRight:'2.8rem'}} type={showPass ? 'text' : 'password'}
                  required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(v=>!v)} style={s.eyeBtn}>{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>
            {error && <div style={s.error}>⚠️ {error}</div>}
            <button type="submit" disabled={loading} className="submit-btn" style={{...s.submit, opacity: loading ? 0.8 : 1}}>
              {loading ? <span style={s.spinner} /> : null}
              {loading ? 'Signing in…' : `Sign In as ${loginRole.charAt(0).toUpperCase()+loginRole.slice(1)} →`}
            </button>
          </form>

          <p style={s.switchText}>
            New to Schuber? <Link to="/register" style={s.switchLink}>Create account →</Link>
          </p>
        </div>

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
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #FFFBF0 0%, #FEF3C7 50%, #FFFBF0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden', padding: '2rem 1rem' },
  blob1: { position: 'absolute', top: '-120px', right: '-120px', width: 400, height: 400, background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: '-100px', left: '-100px', width: 350, height: 350, background: 'radial-gradient(circle, rgba(217,119,6,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' },
  container: { width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 1 },
  logoWrap: { textDecoration: 'none' },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.75rem', color: '#1C1917' },
  card: { width: '100%', background: '#FFFFFF', borderRadius: 24, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(245,158,11,0.1)', border: '1px solid rgba(253,230,138,0.5)' },
  heading: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#1C1917', textAlign: 'center', marginBottom: '0.2rem', marginTop: 0 },
  sub: { color: '#78716C', textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.9rem', marginTop: 0 },
  demoSection: { background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '1.5px solid #FDE68A', borderRadius: 16, padding: '1rem', marginBottom: '1.25rem' },
  demoLabel: { fontSize: '0.8rem', color: '#92400E', fontWeight: 700, textAlign: 'center', marginBottom: '0.75rem', marginTop: 0 },
  demoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' },
  demoCard: { background: '#fff', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
  demoCardIcon: { fontSize: '1.5rem', marginBottom: '0.25rem' },
  demoCardLabel: { fontWeight: 700, fontSize: '0.8rem', color: '#1C1917', marginBottom: '0.25rem' },
  demoCardDesc: { fontSize: '0.65rem', color: '#78716C', lineHeight: 1.4, marginBottom: '0.5rem' },
  demoLoginBtn: { background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 8, padding: '0.35rem 0.6rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: "'DM Sans', sans-serif" },
  dividerRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' },
  dividerLine: { flex: 1, height: 1, background: '#F3F4F6' },
  dividerTxt: { color: '#9CA3AF', fontSize: '0.72rem', whiteSpace: 'nowrap', fontWeight: 500 },
  roleRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' },
  roleLabel: { fontSize: '0.8rem', color: '#57534E', fontWeight: 600, whiteSpace: 'nowrap' },
  roleTabs: { display: 'flex', gap: '0.35rem', background: '#FEF3C7', borderRadius: 10, padding: '0.25rem', flex: 1 },
  roleTab: { flex: 1, padding: '0.4rem 0.5rem', borderRadius: 7, border: 'none', background: 'transparent', color: '#78716C', cursor: 'pointer', fontWeight: 500, fontSize: '0.75rem', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" },
  roleTabActive: { background: '#F59E0B', color: '#fff', fontWeight: 700 },
  googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.7rem 1rem', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600, color: '#1C1917', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif" },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.75rem', color: '#57534E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '0.9rem', fontSize: '1rem', pointerEvents: 'none', zIndex: 1 },
  input: { width: '100%', background: '#FAFAFA', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '0.7rem 1rem 0.7rem 2.75rem', color: '#1C1917', fontSize: '0.92rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', right: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0 },
  forgotLink: { fontSize: '0.75rem', color: '#D97706', fontWeight: 600, cursor: 'pointer' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.65rem 1rem', borderRadius: 10, fontSize: '0.84rem' },
  submit: { background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(245,158,11,0.4)', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: "'DM Sans', sans-serif" },
  spinner: { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
  switchText: { color: '#78716C', fontSize: '0.875rem', textAlign: 'center', marginBottom: 0 },
  switchLink: { color: '#D97706', fontWeight: 700 },
  trustRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' },
  trustBadge: { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(253,230,138,0.6)', borderRadius: 20, padding: '0.35rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, color: '#78716C', backdropFilter: 'blur(8px)' },
};
