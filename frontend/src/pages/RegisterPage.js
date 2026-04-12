
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithGoogle } from '../supabase';

const REVIEWS = [
  { name: 'Priya Mehta',       initials: 'PM', role: 'Mother of 2, Koramangala', stars: 5, text: 'Schuber gave me peace of mind I never thought possible. I see exactly where my kids are every single morning. The alerts are instant!' },
  { name: 'Ramesh Nair',       initials: 'RN', role: 'Father, Indiranagar',      stars: 5, text: 'My daughter boards the school van at 7:30 AM and I get a notification the moment she sits down. Incredible app!' },
  { name: 'Sunita Krishnan',   initials: 'SK', role: 'Working Mom, HSR Layout',  stars: 5, text: 'The SOS button and real-time tracking mean I can focus at work without worrying. Best investment for my child\'s safety!' },
  { name: 'Arjun Patel',       initials: 'AP', role: 'Parent, Whitefield',       stars: 5, text: 'Super easy setup. Our driver is verified and professional. The live tracking is spot on — never more than 30 seconds off.' },
  { name: 'Deepa Venkatesh',   initials: 'DV', role: 'Mother of 3, JP Nagar',   stars: 5, text: 'Managing three kids on different routes was chaotic. Now it\'s effortless. Highly recommend Schuber to every parent!' },
];

const FEATURES = [
  ['📍', 'Live GPS tracking every 30 seconds'],
  ['🔔', 'Instant boarding & drop-off alerts'],
  ['🚌', 'Background-checked, verified drivers'],
  ['🆘', 'One-tap SOS emergency alert'],
  ['📊', 'Full trip history & attendance'],
  ['🤖', 'AI assistant for instant answers'],
];

const ROLES = [
  { id:'parent', icon:'👨‍👩‍👧', title:'Parent', desc:'Track your child\'s commute in real-time', features:['Live GPS tracking','Boarding & drop-off alerts','Trip history & attendance'] },
  { id:'driver', icon:'🚌',      title:'Driver', desc:'Manage your route & student attendance',  features:['Student manifest & check-in','Trip management & navigation','SOS & emergency alerts'] },
];

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState('parent');
  const [reviewIdx,    setReviewIdx]    = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const chosen = ROLES.find(r => r.id === selectedRole);
  const review = REVIEWS[reviewIdx];

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await signInWithGoogle(selectedRole); }
    catch { setError('Google sign-up failed. Please try again.'); setLoading(false); }
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .role-card:hover   { border-color: #F59E0B !important; box-shadow: 0 4px 16px rgba(245,158,11,0.15) !important; }
        .goog-btn:hover:not(:disabled) { box-shadow: 0 4px 18px rgba(0,0,0,0.12) !important; transform: translateY(-1px); }
        .rev-dot:hover     { background: #F59E0B !important; }
      `}</style>

      {/* ── Left: Form ── */}
      <div style={s.left}>
        <div style={s.card}>
          <Link to="/" style={s.logo}>🚌 <span style={{ color:'#F59E0B' }}>Schu</span>ber</Link>

          <h1 style={s.heading}>Create your account</h1>
          <p style={s.sub}>Join <strong>12,000+ families</strong> keeping kids safe every day</p>

          {/* Stats row */}
          <div style={s.statsRow}>
            {[['12k+','Families'],['98.2%','On-time'],['450+','Drivers'],['4.8★','Rating']].map(([v,l]) => (
              <div key={l} style={s.stat}><div style={s.statVal}>{v}</div><div style={s.statLbl}>{l}</div></div>
            ))}
          </div>

          {/* Role picker */}
          <p style={s.roleLabel}>I am joining as:</p>
          <div style={s.roleGrid}>
            {ROLES.map(r => (
              <button key={r.id} className="role-card"
                onClick={() => setSelectedRole(r.id)}
                style={{ ...s.roleCard, ...(selectedRole === r.id ? s.roleCardActive : {}) }}>
                <div style={s.roleIcon}>{r.icon}</div>
                <div style={s.roleTitle}>{r.title}</div>
                <div style={s.roleDesc}>{r.desc}</div>
                {selectedRole === r.id && <div style={s.roleCheck}>✓</div>}
              </button>
            ))}
          </div>

          {/* Features for chosen role */}
          <div style={s.featureBox}>
            <div style={s.featureBoxTitle}>{chosen?.icon} As a {chosen?.title} you get:</div>
            {chosen?.features.map(f => (
              <div key={f} style={s.featureItem}>
                <span style={s.featureDot}>✅</span> {f}
              </div>
            ))}
          </div>

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          {/* Google Sign Up */}
          <button className="goog-btn" onClick={handleGoogle} disabled={loading} style={s.googleBtn}>
            {loading
              ? <span style={{ ...s.spinner, borderColor:'rgba(0,0,0,0.1)', borderTopColor:'#F59E0B' }} />
              : <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
            }
            <span style={{ flex:1, textAlign:'center' }}>
              {loading ? 'Connecting…' : `Sign up as ${chosen?.title} with Google`}
            </span>
          </button>

          <div style={s.note}>🔒 We only access your name & email. No passwords stored.</div>

          <p style={s.terms}>By signing up you agree to our <span style={s.termLink}>Terms of Service</span> and <span style={s.termLink}>Privacy Policy</span>.</p>
          <p style={s.switchTxt}>Already have an account? <Link to="/login" style={s.switchLink}>Sign in →</Link></p>
        </div>
      </div>

      {/* ── Right: Reviews Panel ── */}
      <div style={s.right}>
        <div style={s.rightInner}>

          {/* Header */}
          <div style={s.rightBadge}>⭐ Loved by parents across India</div>
          <h2 style={s.rightTitle}>What parents<br />are saying</h2>

          {/* Feature list */}
          <div style={s.featList}>
            {FEATURES.map(([icon, txt]) => (
              <div key={txt} style={s.featItem}>
                <span style={s.featIcon}>{icon}</span>
                <span style={s.featTxt}>{txt}</span>
              </div>
            ))}
          </div>

          {/* Review card */}
          <div style={s.reviewCard}>
            <div style={s.reviewStars}>{'⭐'.repeat(review.stars)}</div>
            <p style={s.reviewText}>"{review.text}"</p>
            <div style={s.reviewFooter}>
              <div style={s.reviewAvatar}>{review.initials}</div>
              <div>
                <div style={s.reviewName}>{review.name}</div>
                <div style={s.reviewRole}>{review.role}</div>
              </div>
            </div>
          </div>

          {/* Review navigation dots */}
          <div style={s.reviewNav}>
            <button style={s.navArrow} onClick={() => setReviewIdx(i => (i - 1 + REVIEWS.length) % REVIEWS.length)}>‹</button>
            <div style={s.dots}>
              {REVIEWS.map((_, i) => (
                <div key={i} className="rev-dot" onClick={() => setReviewIdx(i)}
                  style={{ ...s.dot, background: i === reviewIdx ? '#F59E0B' : 'rgba(255,255,255,0.35)' }} />
              ))}
            </div>
            <button style={s.navArrow} onClick={() => setReviewIdx(i => (i + 1) % REVIEWS.length)}>›</button>
          </div>

          {/* Trial badge */}
          <div style={s.trialBadge}>
            🎁 <strong>7-day free trial</strong> — no credit card required
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const s = {
  // Layout
  page:         { display:'flex', minHeight:'100vh', fontFamily:"'Plus Jakarta Sans',sans-serif", background:'#FFFBF0' },
  left:         { flex:'1 1 520px', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2.5rem 2rem', overflowY:'auto' },
  right:        { flex:'0 0 420px', background:'linear-gradient(160deg,#F59E0B 0%,#B45309 100%)', display:'flex', alignItems:'center', justifyContent:'center', overflowY:'auto' },
  rightInner:   { padding:'3rem 2.25rem', width:'100%' },

  // Left card
  card:         { width:'100%', maxWidth:480, animation:'fadeUp 0.4s ease', paddingTop:'0.5rem' },
  logo:         { display:'block', fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:'1.45rem', color:'#1C1917', textDecoration:'none', marginBottom:'1.5rem' },
  heading:      { fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'1.75rem', fontWeight:800, color:'#1C1917', margin:'0 0 0.35rem' },
  sub:          { color:'#78716C', fontSize:'0.92rem', margin:'0 0 1.25rem' },

  // Stats
  statsRow:     { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.5rem', marginBottom:'1.25rem', background:'linear-gradient(135deg,#FEF3C7,#FFFBEB)', borderRadius:12, padding:'0.75rem', border:'1px solid #FDE68A' },
  stat:         { textAlign:'center' },
  statVal:      { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:'1rem', color:'#D97706' },
  statLbl:      { fontSize:'0.62rem', color:'#78716C', fontWeight:600, marginTop:'0.1rem' },

  // Role picker
  roleLabel:    { fontSize:'0.72rem', color:'#57534E', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.6rem' },
  roleGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' },
  roleCard:     { position:'relative', padding:'1rem', background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:14, cursor:'pointer', textAlign:'left', transition:'all 0.2s', fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  roleCardActive:{ border:'2px solid #F59E0B', background:'#FFFBEB', boxShadow:'0 4px 16px rgba(245,158,11,0.18)' },
  roleIcon:     { fontSize:'1.75rem', marginBottom:'0.4rem' },
  roleTitle:    { fontWeight:800, fontSize:'0.95rem', color:'#1C1917', marginBottom:'0.2rem' },
  roleDesc:     { fontSize:'0.73rem', color:'#78716C', lineHeight:1.4 },
  roleCheck:    { position:'absolute', top:8, right:8, width:22, height:22, background:'#F59E0B', color:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.68rem', fontWeight:900 },

  // Feature box
  featureBox:   { background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'0.875rem 1rem', marginBottom:'1.1rem' },
  featureBoxTitle:{ fontSize:'0.78rem', fontWeight:700, color:'#92400E', marginBottom:'0.5rem' },
  featureItem:  { fontSize:'0.82rem', color:'#57534E', marginBottom:'0.25rem', display:'flex', alignItems:'center', gap:'0.4rem' },
  featureDot:   { fontSize:'0.75rem', flexShrink:0 },

  // Error
  errorBox:     { background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', padding:'0.7rem 1rem', borderRadius:10, fontSize:'0.85rem', marginBottom:'1rem' },

  // Google button
  googleBtn:    { width:'100%', display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.9rem 1.25rem', background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:'0.95rem', fontWeight:700, color:'#1C1917', cursor:'pointer', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', transition:'all 0.2s', fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:'0.75rem' },
  note:         { textAlign:'center', color:'#78716C', fontSize:'0.75rem', marginBottom:'0.875rem' },
  terms:        { color:'#A8A29E', fontSize:'0.7rem', textAlign:'center', marginBottom:'0.4rem', marginTop:0 },
  termLink:     { color:'#D97706', cursor:'pointer' },
  switchTxt:    { color:'#78716C', fontSize:'0.875rem', textAlign:'center', margin:0 },
  switchLink:   { color:'#D97706', fontWeight:700, textDecoration:'none' },
  spinner:      { display:'inline-block', width:18, height:18, border:'2.5px solid transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 },

  // Right panel
  rightBadge:   { display:'inline-block', background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.35)', color:'#fff', borderRadius:20, padding:'0.3rem 0.875rem', fontSize:'0.72rem', fontWeight:700, marginBottom:'1rem', letterSpacing:'0.03em' },
  rightTitle:   { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:'1.75rem', color:'#fff', margin:'0 0 1.5rem', lineHeight:1.25 },

  // Feature list
  featList:     { display:'flex', flexDirection:'column', gap:'0.625rem', marginBottom:'1.75rem' },
  featItem:     { display:'flex', gap:'0.6rem', alignItems:'center' },
  featIcon:     { fontSize:'1rem', flexShrink:0 },
  featTxt:      { color:'rgba(255,255,255,0.9)', fontSize:'0.85rem' },

  // Review card
  reviewCard:   { background:'rgba(255,255,255,0.14)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:16, padding:'1.25rem', marginBottom:'1rem' },
  reviewStars:  { fontSize:'0.85rem', marginBottom:'0.6rem' },
  reviewText:   { color:'rgba(255,255,255,0.95)', fontSize:'0.875rem', lineHeight:1.65, fontStyle:'italic', margin:'0 0 0.875rem' },
  reviewFooter: { display:'flex', alignItems:'center', gap:'0.65rem' },
  reviewAvatar: { width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.25)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.78rem', flexShrink:0 },
  reviewName:   { color:'#fff', fontWeight:700, fontSize:'0.875rem' },
  reviewRole:   { color:'rgba(255,255,255,0.65)', fontSize:'0.72rem', marginTop:'0.1rem' },

  // Nav
  reviewNav:    { display:'flex', alignItems:'center', gap:'0.875rem', marginBottom:'1.5rem' },
  navArrow:     { width:30, height:30, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.4)', background:'transparent', color:'#fff', cursor:'pointer', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s', fontFamily:'sans-serif' },
  dots:         { display:'flex', gap:'0.4rem', flex:1, justifyContent:'center' },
  dot:          { width:7, height:7, borderRadius:'50%', cursor:'pointer', transition:'background 0.2s' },

  // Trial badge
  trialBadge:   { background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:10, padding:'0.75rem 1rem', color:'#fff', fontSize:'0.85rem', textAlign:'center', lineHeight:1.5 },
};
