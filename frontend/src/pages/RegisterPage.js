
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithGoogle } from '../supabase';

const ROLES = [
  {
    id: 'parent',
    icon: '👨‍👩‍👧',
    title: 'Parent',
    desc: 'Track your child\'s commute in real-time',
    features: ['Live GPS tracking', 'Boarding & drop-off alerts', 'Trip history'],
  },
  {
    id: 'driver',
    icon: '🚌',
    title: 'Driver',
    desc: 'Manage your route & student attendance',
    features: ['Student manifest', 'Trip management', 'SOS & navigation'],
  },
];

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState('parent');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      await signInWithGoogle(selectedRole);
      // Supabase OAuth redirect — role stored in localStorage for callback
    } catch {
      setError('Google sign-up failed. Please try again.');
      setLoading(false);
    }
  };

  const chosen = ROLES.find(r => r.id === selectedRole);

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .role-card:hover  { border-color: #F59E0B !important; }
        .goog-btn:hover:not(:disabled) { box-shadow: 0 6px 22px rgba(0,0,0,0.13) !important; transform: translateY(-1px); }
      `}</style>

      {/* Left: form */}
      <div style={s.left}>
        <div style={s.card}>
          <Link to="/" style={s.logo}>🚌 <span style={{ color:'#F59E0B' }}>Schu</span>ber</Link>

          <h1 style={s.heading}>Create your account</h1>
          <p style={s.sub}>Join 12,000+ families keeping kids safe every day</p>

          {/* Role Picker */}
          <p style={s.roleLabel}>I am joining as:</p>
          <div style={s.roleGrid}>
            {ROLES.map(r => (
              <button key={r.id} className="role-card"
                onClick={() => setSelectedRole(r.id)}
                style={{ ...s.roleCard, ...(selectedRole === r.id ? s.roleCardActive : {}) }}>
                <div style={s.roleIcon}>{r.icon}</div>
                <div style={s.roleTitle}>{r.title}</div>
                <div style={s.roleDesc}>{r.desc}</div>
                {selectedRole === r.id && (
                  <div style={s.roleCheck}>✓</div>
                )}
              </button>
            ))}
          </div>

          {/* Features for selected role */}
          <div style={s.featureBox}>
            <div style={s.featureTitle}>{chosen?.icon} What you get as a {chosen?.title}:</div>
            {chosen?.features.map(f => (
              <div key={f} style={s.feature}>✅ {f}</div>
            ))}
          </div>

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          {/* Google Sign Up */}
          <button className="goog-btn" onClick={handleGoogle} disabled={loading} style={s.googleBtn}>
            {loading
              ? <span style={s.spinner} />
              : <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
            }
            <span style={{ flex: 1, textAlign: 'center' }}>
              {loading ? 'Connecting…' : `Sign up as ${chosen?.title} with Google`}
            </span>
          </button>

          <div style={s.note}>🔒 We only access your name & email. No passwords stored.</div>

          <p style={s.terms}>
            By signing up you agree to our{' '}
            <span style={s.termLink}>Terms of Service</span> and{' '}
            <span style={s.termLink}>Privacy Policy</span>.
          </p>
          <p style={s.switchTxt}>
            Already have an account? <Link to="/login" style={s.switchLink}>Sign in →</Link>
          </p>
        </div>
      </div>

      {/* Right: Hero */}
      <div style={s.right}>
        <div style={s.rightInner}>
          <div style={s.badge}>🎁 7-day free trial · No credit card</div>
          <h2 style={s.heroTitle}>School commute,<br />simplified.</h2>
          <p style={s.heroSub}>
            Schuber connects parents, drivers and schools —
            so every child arrives safely, every day.
          </p>
          <div style={s.planCards}>
            {[
              { name:'Free Trial', price:'₹0',     dur:'7 days',        features:['Basic GPS','1 child','Notifications'] },
              { name:'Monthly',    price:'₹299',   dur:'/month',        features:['Live GPS','3 children','All alerts','Priority support'], hot:true },
              { name:'Yearly',     price:'₹2,499', dur:'/year · save 30%', features:['Unlimited children','AI Assistant','Analytics'] },
            ].map(p => (
              <div key={p.name} style={{ ...s.planCard, ...(p.hot ? s.planCardHot : {}) }}>
                <div style={s.planName}>{p.name}</div>
                <div style={s.planPrice}>{p.price} <span style={s.planDur}>{p.dur}</span></div>
                <div style={s.planFs}>{p.features.map(f => <span key={f} style={s.planF}>✓ {f}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const C = { primary:'#F59E0B', dark:'#D97706', text:'#1C1917', text2:'#57534E', text3:'#78716C', border:'#E5E7EB', light:'#FEF3C7' };
const s = {
  page:       { display:'flex', minHeight:'100vh', fontFamily:"'DM Sans',sans-serif", background:'#FFFBF0' },
  left:       { flex:'1 1 480px', display:'flex', alignItems:'center', justifyContent:'center', padding:'2.5rem 2rem', overflowY:'auto' },
  card:       { width:'100%', maxWidth:460, animation:'fadeUp 0.4s ease' },
  logo:       { display:'block', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.4rem', color:C.text, textDecoration:'none', marginBottom:'1.5rem' },
  heading:    { fontFamily:"'Syne',sans-serif", fontSize:'1.75rem', fontWeight:800, color:C.text, margin:'0 0 0.35rem' },
  sub:        { color:C.text3, fontSize:'0.92rem', margin:'0 0 1.5rem' },
  roleLabel:  { fontSize:'0.72rem', color:C.text2, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.6rem' },
  roleGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' },
  roleCard:   { position:'relative', padding:'1rem', background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:14, cursor:'pointer', textAlign:'left', transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif" },
  roleCardActive: { border:`2px solid ${C.primary}`, background:C.light },
  roleIcon:   { fontSize:'1.75rem', marginBottom:'0.4rem' },
  roleTitle:  { fontWeight:800, fontSize:'1rem', color:C.text, marginBottom:'0.25rem' },
  roleDesc:   { fontSize:'0.75rem', color:C.text3, lineHeight:1.4 },
  roleCheck:  { position:'absolute', top:10, right:10, width:22, height:22, background:C.primary, color:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800 },
  featureBox: { background:'#FFFBEB', border:`1px solid ${C.light}`, borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1.1rem', display:'flex', flexDirection:'column', gap:'0.35rem' },
  featureTitle:{ fontSize:'0.78rem', fontWeight:700, color:C.text2, marginBottom:'0.25rem' },
  feature:    { fontSize:'0.82rem', color:C.text2 },
  errorBox:   { background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', padding:'0.7rem 1rem', borderRadius:10, fontSize:'0.85rem', marginBottom:'1rem' },
  googleBtn:  { width:'100%', display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.9rem 1.25rem', background:'#fff', border:`1.5px solid ${C.border}`, borderRadius:12, fontSize:'0.95rem', fontWeight:700, color:C.text, cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif", marginBottom:'0.75rem' },
  note:       { textAlign:'center', color:C.text3, fontSize:'0.75rem', marginBottom:'1rem' },
  terms:      { color:'#A8A29E', fontSize:'0.7rem', textAlign:'center', marginBottom:'0.4rem', marginTop:0 },
  termLink:   { color:C.dark, cursor:'pointer' },
  switchTxt:  { color:C.text3, fontSize:'0.875rem', textAlign:'center', margin:0 },
  switchLink: { color:C.dark, fontWeight:700, textDecoration:'none' },
  spinner:    { display:'inline-block', width:18, height:18, border:'2.5px solid rgba(0,0,0,0.1)', borderTopColor:C.primary, borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 },
  right:      { flex:'0 0 400px', background:'linear-gradient(160deg,#D97706 0%,#92400E 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem 2rem', overflowY:'auto' },
  rightInner: { width:'100%' },
  badge:      { display:'inline-block', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', borderRadius:20, padding:'0.3rem 0.875rem', fontSize:'0.72rem', fontWeight:700, marginBottom:'1.25rem' },
  heroTitle:  { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2rem', color:'#fff', margin:'0 0 0.75rem', lineHeight:1.2 },
  heroSub:    { color:'rgba(255,255,255,0.85)', fontSize:'0.875rem', margin:'0 0 1.75rem', lineHeight:1.6 },
  planCards:  { display:'flex', flexDirection:'column', gap:'0.6rem' },
  planCard:   { background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'0.875rem 1rem' },
  planCardHot:{ background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.5)' },
  planName:   { color:'rgba(255,255,255,0.65)', fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.2rem' },
  planPrice:  { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.2rem', color:'#fff', marginBottom:'0.4rem' },
  planDur:    { fontSize:'0.73rem', fontWeight:400, color:'rgba(255,255,255,0.65)' },
  planFs:     { display:'flex', flexWrap:'wrap', gap:'0.3rem 0.75rem' },
  planF:      { color:'rgba(255,255,255,0.85)', fontSize:'0.75rem' },
};
