
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithGoogle } from '../supabase';

export default function RegisterPage() {
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      await signInWithGoogle();
      // Supabase OAuth redirect handles the rest
    } catch {
      setError('Google sign-up failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .goog-reg:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(0,0,0,0.12) !important; transform: translateY(-1px); }
      `}</style>

      {/* Left: Sign-up card */}
      <div style={s.left}>
        <div style={s.card}>
          <Link to="/" style={s.logo}>🚌 <span style={{ color:'#F59E0B' }}>Schu</span>ber</Link>

          <h1 style={s.heading}>Create your account</h1>
          <p style={s.sub}>Join 12,000+ families keeping kids safe every day</p>

          {/* Stats */}
          <div style={s.statsRow}>
            {[['12k+','Families'],['98.2%','On-time'],['450+','Drivers'],['4.8★','Rating']].map(([v,l]) => (
              <div key={l} style={s.stat}>
                <div style={s.statVal}>{v}</div>
                <div style={s.statLbl}>{l}</div>
              </div>
            ))}
          </div>

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          {/* Google Sign Up — only option */}
          <button className="goog-reg" onClick={handleGoogle} disabled={loading} style={s.googleBtn}>
            {loading
              ? <span style={s.spinner} />
              : <svg width="22" height="22" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
            }
            <span>{loading ? 'Connecting to Google…' : 'Sign up with Google'}</span>
          </button>

          <div style={s.note}>
            🔒 We only access your name & email. No passwords stored.
          </div>

          {/* Features */}
          <div style={s.features}>
            {[
              ['✅', 'Verified & background-checked drivers'],
              ['📍', 'Real-time GPS on every trip'],
              ['🔔', 'Instant boarding & drop-off alerts'],
              ['🆘', 'SOS emergency button'],
              ['📊', 'Full trip history & attendance'],
              ['🤖', 'AI assistant for instant answers'],
            ].map(([icon, txt]) => (
              <div key={txt} style={s.feature}>
                <span>{icon}</span>
                <span style={s.featureTxt}>{txt}</span>
              </div>
            ))}
          </div>

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
          <div style={s.badge}>7-day free trial · No credit card</div>
          <h2 style={s.heroTitle}>School commute,<br />simplified.</h2>
          <p style={s.heroSub}>
            Schuber connects parents, drivers and schools in one platform —
            so every child arrives safely, every day.
          </p>
          <div style={s.planCards}>
            {[
              { name:'Free Trial', price:'₹0', dur:'7 days', features:['Basic GPS','1 child','Notifications'] },
              { name:'Monthly', price:'₹299', dur:'/month', features:['Live GPS','3 children','All alerts','Priority support'], hot:true },
              { name:'Yearly', price:'₹2,499', dur:'/year  · save 30%', features:['Everything','Unlimited children','AI Assistant','Analytics'] },
            ].map(p => (
              <div key={p.name} style={{ ...s.planCard, ...(p.hot ? s.planCardHot : {}) }}>
                <div style={s.planName}>{p.name}</div>
                <div style={s.planPrice}>{p.price} <span style={s.planDur}>{p.dur}</span></div>
                <div style={s.planFeatures}>{p.features.map(f => <div key={f} style={s.planF}>✓ {f}</div>)}</div>
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
  card:       { width:'100%', maxWidth:460, animation:'fadeUp 0.4s ease' },
  logo:       { display:'block', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.4rem', color:'#1C1917', textDecoration:'none', marginBottom:'1.5rem' },
  heading:    { fontFamily:"'Syne',sans-serif", fontSize:'1.75rem', fontWeight:800, color:'#1C1917', margin:'0 0 0.4rem' },
  sub:        { color:'#78716C', fontSize:'0.92rem', margin:'0 0 1.25rem' },
  statsRow:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem', marginBottom:'1.25rem', background:'linear-gradient(135deg,#FEF3C7,#FFFBEB)', borderRadius:12, padding:'0.75rem' },
  stat:       { textAlign:'center' },
  statVal:    { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1rem', color:'#D97706' },
  statLbl:    { fontSize:'0.62rem', color:'#78716C', fontWeight:600, marginTop:'0.1rem' },
  errorBox:   { background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', padding:'0.7rem 1rem', borderRadius:10, fontSize:'0.85rem', marginBottom:'1rem' },
  googleBtn:  { width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.875rem', padding:'1rem 1.25rem', background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:14, fontSize:'1rem', fontWeight:700, color:'#1C1917', cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif", marginBottom:'0.875rem' },
  note:       { textAlign:'center', color:'#78716C', fontSize:'0.76rem', marginBottom:'1.5rem' },
  features:   { display:'flex', flexDirection:'column', gap:'0.6rem', marginBottom:'1.25rem', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:12, padding:'1rem' },
  feature:    { display:'flex', gap:'0.6rem', alignItems:'flex-start' },
  featureTxt: { color:'#57534E', fontSize:'0.85rem' },
  terms:      { color:'#A8A29E', fontSize:'0.7rem', textAlign:'center', marginBottom:'0.4rem', marginTop:'0' },
  termLink:   { color:'#D97706', cursor:'pointer' },
  switchTxt:  { color:'#78716C', fontSize:'0.875rem', textAlign:'center', margin:0 },
  switchLink: { color:'#D97706', fontWeight:700, textDecoration:'none' },
  spinner:    { display:'inline-block', width:18, height:18, border:'2.5px solid rgba(0,0,0,0.1)', borderTopColor:'#F59E0B', borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 },
  // Right
  right:      { flex:'0 0 400px', background:'linear-gradient(160deg,#D97706 0%,#92400E 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem 2rem', overflowY:'auto' },
  rightInner: { width:'100%' },
  badge:      { display:'inline-block', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', borderRadius:20, padding:'0.3rem 0.875rem', fontSize:'0.72rem', fontWeight:700, marginBottom:'1.25rem' },
  heroTitle:  { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2rem', color:'#fff', margin:'0 0 0.75rem', lineHeight:1.2 },
  heroSub:    { color:'rgba(255,255,255,0.85)', fontSize:'0.875rem', margin:'0 0 1.75rem', lineHeight:1.6 },
  planCards:  { display:'flex', flexDirection:'column', gap:'0.6rem' },
  planCard:   { background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'0.875rem 1rem' },
  planCardHot:{ background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.5)' },
  planName:   { color:'rgba(255,255,255,0.7)', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.2rem' },
  planPrice:  { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.25rem', color:'#fff', marginBottom:'0.4rem' },
  planDur:    { fontSize:'0.75rem', fontWeight:400, color:'rgba(255,255,255,0.7)' },
  planFeatures:{ display:'flex', flexWrap:'wrap', gap:'0.3rem 0.75rem' },
  planF:      { color:'rgba(255,255,255,0.85)', fontSize:'0.75rem' },
};
