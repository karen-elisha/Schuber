import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: params.get('role') || 'parent', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await register(form);
      if (user.role === 'driver') {
        navigate('/driver-verification');
      } else {
        navigate(`/${user.role}`);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>
          <img src="/logo.png" alt="Schuber" style={{height:50,objectFit:'contain'}} />
        </Link>
        <h1 style={s.heading}>Create your account</h1>
        <p style={s.sub}>Join thousands of families using Schuber</p>

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
              <input style={s.input} required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Priya Sharma" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Phone</label>
              <input style={s.input} value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input style={s.input} type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" minLength={6} />
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button type="submit" disabled={loading} style={s.submit}>
            {loading ? 'Creating account...' : `Create ${form.role === 'parent' ? 'Parent' : 'Driver'} Account →`}
          </button>
        </form>

        {form.role === 'driver' && (
          <div style={{background:'#FFF8E7',border:'1px solid #FDE68A',borderRadius:10,padding:'0.75rem 1rem',fontSize:'0.82rem',color:'#92400E',marginBottom:'0.5rem',display:'flex',gap:'0.5rem',alignItems:'flex-start'}}>
            <span>ℹ️</span>
            <span>Driver accounts require <strong>identity & license verification</strong> before you can start accepting rides. You'll be prompted after registration.</span>
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
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#1C1917' },
  logoHub: { background: '#F59E0B', color: '#fff', padding: '0 4px', borderRadius: 4 },
  heading: { fontFamily: "'Syne', sans-serif", fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.35rem', color: '#1C1917' },
  sub: { color: '#78716C', marginBottom: '1.5rem' },
  roleToggle: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#FEF3C7', borderRadius: 12, padding: '0.3rem' },
  roleBtn: { flex: 1, padding: '0.6rem', borderRadius: 9, border: 'none', background: 'transparent', color: '#78716C', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', transition: 'all 0.2s' },
  roleBtnActive: { background: '#F59E0B', color: '#fff', fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '0.75rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.75rem', color: '#57534E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { background: '#FFFFFF', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '0.7rem 0.9rem', color: '#1C1917', fontSize: '0.95rem' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.875rem' },
  submit: { background: '#F59E0B', color: '#fff', border: 'none', padding: '0.875rem', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700, marginTop: '0.5rem' },
  terms: { color: '#A8A29E', fontSize: '0.72rem', textAlign: 'center', marginBottom: '0.5rem' },
  switchText: { color: '#78716C', fontSize: '0.875rem', textAlign: 'center' },
  switchLink: { color: '#D97706', fontWeight: 700 },
  sidePanel: { flex: '1 1 300px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3rem' },
  benefitTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.75rem', color: '#fff' },
  benefitItem: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-start' },
  bIcon: { fontSize: '1.1rem', flexShrink: 0, marginTop: '0.1rem' },
  bText: { color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: 1.5 },
};
