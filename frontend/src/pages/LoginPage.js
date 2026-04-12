
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../supabase';


// Admin signs in via Google automatically — no tab shown
const ROLES = [
  {
    id:     'parent',
    icon:   '👨‍👩‍👧',
    label:  'Parent',
    color:  '#059669',
    bg:     '#DCFCE7',
    border: '#6EE7B7',
    desc:   "Track your child's commute",
    demo:   { email:'priya@example.com', password:'parent123' },
  },
  {
    id:     'driver',
    icon:   '🚌',
    label:  'Driver',
    color:  '#2563EB',
    bg:     '#EFF6FF',
    border: '#93C5FD',
    desc:   'Manage trips & students',
    demo:   { email:'suresh@example.com', password:'driver123' },
  },
];


export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const [selectedRole,  setSelectedRole]  = useState('parent');
  const [demoLoading,   setDemoLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');

  // Pick up role-conflict error set by AuthContext bootstrap
  useEffect(() => {
    const conflict = localStorage.getItem('schuber-role-conflict');
    if (conflict) {
      setError(conflict);
      localStorage.removeItem('schuber-role-conflict');
    }
  }, []);

  const role = ROLES.find(r => r.id === selectedRole);

  const handleGoogle = async () => {
    setError(''); setGoogleLoading(true);
    try {
      await signInWithGoogle(selectedRole);
    } catch {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleDemo = async () => {
    if (!role) return;
    setDemoLoading(true); setError('');
    try {
      const user = await login(role.demo.email, role.demo.password);
      navigate(`/${user?.role ?? role.id}`, { replace: true });
    } catch {
      navigate(`/${role.id}`, { replace: true });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .role-tab:hover  { opacity: 0.85; }
        .goog-btn:hover:not(:disabled) { box-shadow: 0 4px 18px rgba(0,0,0,0.12) !important; transform: translateY(-1px); }
        .demo-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      {/* Left */}
      <div style={s.left}>
        <div style={s.card}>

          <Link to="/" style={s.logo}>🚌 <span style={{ color:'#F59E0B' }}>Schu</span>ber</Link>

          <h1 style={s.heading}>Welcome back</h1>
          <p style={s.sub}>Sign in to continue</p>

          {/* Role selector tabs */}
          <p style={s.roleLabel}>I am a:</p>
          <div style={s.roleRow}>
            {ROLES.map(r => (
              <button key={r.id} className="role-tab"
                onClick={() => { setSelectedRole(r.id); setError(''); }}
                style={{
                  ...s.roleTab,
                  background:   selectedRole === r.id ? r.bg         : '#fff',
                  border:       selectedRole === r.id ? `2px solid ${r.border}` : '1.5px solid #E5E7EB',
                  color:        selectedRole === r.id ? r.color       : '#78716C',
                }}>
                <span style={{ fontSize:'1.25rem' }}>{r.icon}</span>
                <span style={{ fontWeight: selectedRole === r.id ? 800 : 600 }}>{r.label}</span>
                {selectedRole === r.id && (
                  <span style={{ ...s.activeCheck, background: r.color }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Context box for chosen role */}
          <div style={{ ...s.contextBox, borderColor: role?.border, background: role?.bg }}>
            <span style={{ fontSize:'1.3rem' }}>{role?.icon}</span>
            <div>
              <div style={{ fontWeight:700, color: role?.color, fontSize:'0.88rem' }}>
                Signing in as {role?.label}
              </div>
              <div style={{ fontSize:'0.75rem', color:'#57534E', marginTop:'0.1rem' }}>
                {role?.desc}
              </div>
            </div>
          </div>

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          {/* Google Sign In */}
          <button className="goog-btn" onClick={handleGoogle}
            disabled={googleLoading || demoLoading} style={s.googleBtn}>
            {googleLoading
              ? <span style={{ ...s.spinner, borderColor:'rgba(0,0,0,0.1)', borderTopColor:'#F59E0B' }} />
              : <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
            }
            <span style={{ flex:1, textAlign:'center' }}>
              {googleLoading ? 'Connecting…' : `Sign in as ${role?.label} with Google`}
            </span>
          </button>

          {/* Divider */}
          <div style={s.divider}>
            <div style={s.divLine} />
            <span style={s.divTxt}>or use demo account</span>
            <div style={s.divLine} />
          </div>

          {/* Demo quick-login */}
          <button className="demo-btn" onClick={handleDemo}
            disabled={demoLoading || googleLoading}
            style={{ ...s.demoBtn, background: role?.color, boxShadow:`0 4px 14px ${role?.color}40` }}>
            {demoLoading
              ? <span style={s.spinner} />
              : <span style={{ fontSize:'1.1rem' }}>{role?.icon}</span>
            }
            <span style={{ flex:1, textAlign:'center' }}>
              {demoLoading ? 'Signing in…' : `Try ${role?.label} Demo`}
            </span>
          </button>

          <div style={s.demoHint}>
            Demo: <code style={s.demoCode}>{role?.demo.email}</code>
          </div>

          <p style={s.register}>
            New to Schuber? <Link to="/register" style={s.link}>Create an account →</Link>
          </p>
        </div>
      </div>

      {/* Right: hero */}
      <div style={s.right}>
        <div style={s.rightInner}>
          <div style={s.badge}>🔒 Trusted by 12,000+ families</div>
          <h2 style={s.heroTitle}>School commute,<br />made safe & simple.</h2>
          <p style={s.heroSub}>Real-time GPS · Instant alerts · Verified drivers</p>
          <div style={s.features}>
            {[
              ['📍','Live GPS every 30 seconds'],
              ['🔔','Instant boarding & drop-off alerts'],
              ['🚌','Background-checked, verified drivers'],
              ['🆘','One-tap SOS emergency alert'],
              ['📊','Full trip history & attendance'],
              ['🤖','AI assistant for instant answers'],
            ].map(([icon,txt]) => (
              <div key={txt} style={s.feature}>
                <span style={s.fIcon}>{icon}</span>
                <span style={s.fTxt}>{txt}</span>
              </div>
            ))}
          </div>
          <div style={s.statsRow}>
            {[['12k+','Families'],['450+','Drivers'],['98.2%','On-time'],['4.8★','Rating']].map(([v,l]) => (
              <div key={l} style={s.stat}>
                <div style={s.statVal}>{v}</div>
                <div style={s.statLbl}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:       { display:'flex', minHeight:'100vh', fontFamily:"'DM Sans',sans-serif", background:'#FFFBF0' },
  left:       { flex:'1 1 480px', display:'flex', alignItems:'center', justifyContent:'center', padding:'2.5rem 2rem', overflowY:'auto' },
  card:       { width:'100%', maxWidth:440, animation:'fadeUp 0.4s ease' },
  logo:       { display:'block', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.4rem', color:'#1C1917', textDecoration:'none', marginBottom:'1.75rem' },
  heading:    { fontFamily:"'Syne',sans-serif", fontSize:'1.75rem', fontWeight:800, color:'#1C1917', margin:'0 0 0.25rem' },
  sub:        { color:'#78716C', fontSize:'0.92rem', margin:'0 0 1.5rem' },
  roleLabel:  { fontSize:'0.72rem', color:'#57534E', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.6rem' },
  roleRow:    { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem', marginBottom:'1rem' },
  roleTab:    { position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem', padding:'0.75rem 0.5rem', borderRadius:12, cursor:'pointer', transition:'all 0.18s', fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem' },
  activeCheck:{ position:'absolute', top:6, right:6, width:18, height:18, color:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:900 },
  contextBox: { display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:10, border:'1.5px solid', marginBottom:'1.1rem', transition:'all 0.2s' },
  errorBox:   { background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', padding:'0.7rem 1rem', borderRadius:10, fontSize:'0.85rem', marginBottom:'1rem' },
  googleBtn:  { width:'100%', display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.9rem 1.25rem', background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:'0.93rem', fontWeight:700, color:'#1C1917', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif", marginBottom:'1.1rem' },
  divider:    { display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' },
  divLine:    { flex:1, height:1, background:'#E5E7EB' },
  divTxt:     { color:'#9CA3AF', fontSize:'0.72rem', whiteSpace:'nowrap', fontWeight:500 },
  demoBtn:    { width:'100%', display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.9rem 1.25rem', color:'#fff', border:'none', borderRadius:12, fontSize:'0.93rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif", marginBottom:'0.6rem' },
  demoHint:   { textAlign:'center', color:'#9CA3AF', fontSize:'0.72rem', marginBottom:'1.25rem' },
  demoCode:   { background:'#F5F5F4', padding:'0.1rem 0.4rem', borderRadius:4, fontSize:'0.7rem', color:'#57534E' },
  register:   { color:'#78716C', fontSize:'0.875rem', textAlign:'center', margin:0 },
  link:       { color:'#D97706', fontWeight:700, textDecoration:'none' },
  spinner:    { display:'inline-block', width:18, height:18, border:'2.5px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 },
  right:      { flex:'0 0 420px', background:'linear-gradient(160deg,#D97706 0%,#92400E 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem 2.5rem' },
  rightInner: { width:'100%' },
  badge:      { display:'inline-block', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', borderRadius:20, padding:'0.3rem 0.9rem', fontSize:'0.72rem', fontWeight:700, marginBottom:'1.5rem' },
  heroTitle:  { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2rem', color:'#fff', margin:'0 0 0.75rem', lineHeight:1.2 },
  heroSub:    { color:'rgba(255,255,255,0.8)', fontSize:'0.88rem', margin:'0 0 2rem' },
  features:   { display:'flex', flexDirection:'column', gap:'0.875rem', marginBottom:'2rem' },
  feature:    { display:'flex', gap:'0.75rem', alignItems:'center' },
  fIcon:      { fontSize:'1.1rem', flexShrink:0 },
  fTxt:       { color:'rgba(255,255,255,0.9)', fontSize:'0.875rem' },
  statsRow:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem' },
  stat:       { background:'rgba(255,255,255,0.12)', borderRadius:10, padding:'0.75rem 0.5rem', textAlign:'center' },
  statVal:    { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.1rem', color:'#fff' },
  statLbl:    { fontSize:'0.65rem', color:'rgba(255,255,255,0.7)', marginTop:'0.15rem', fontWeight:600 },
};
