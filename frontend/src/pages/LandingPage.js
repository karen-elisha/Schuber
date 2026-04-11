import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '📍', title: 'Live GPS Tracking', desc: 'Real-time van location, updated every 10 seconds.' },
  { icon: '✅', title: 'Verified Drivers', desc: 'Background-checked, licensed drivers with photo ID.' },
  { icon: '🔔', title: 'Instant Alerts', desc: 'Check-in/out, ETA updates and emergency SOS.' },
  { icon: '📊', title: 'Attendance Records', desc: 'Immutable, tamper-proof attendance history.' },
  { icon: '🛡️', title: 'Safety First', desc: 'AIS-140 compliant with SOS panic button.' },
  { icon: '💳', title: 'Easy Payments', desc: 'Subscription plans starting at ₹99/month.' },
  { icon: '🤖', title: 'AI Assistant', desc: 'Ask questions & get instant answers about trips.' },
  { icon: '🚨', title: 'SOS Emergency', desc: 'One-tap emergency alert for driver & parent.' },
];

const stats = [
  { n: '30M+', label: 'Students Served' },
  { n: '₹99', label: 'Starting Plan' },
  { n: '4.8★', label: 'Driver Rating' },
  { n: '98%', label: 'On-Time' },
];

const steps = [
  { num: '01', title: 'Sign Up as Parent', desc: 'Create your account and add your child in minutes.' },
  { num: '02', title: 'Get Matched', desc: 'We assign a verified driver on your route.' },
  { num: '03', title: 'Track Live', desc: 'Follow the van, get alerts at every checkpoint.' },
  { num: '04', title: 'Peace of Mind', desc: 'Know when your child boards and arrives safely.' },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const h = (e) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = ((e.clientX - left) / width - 0.5) * 10;
      const y = ((e.clientY - top) / height - 0.5) * 7;
      el.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
    };
    el.addEventListener('mousemove', h);
    el.addEventListener('mouseleave', () => { el.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)'; });
    return () => el.removeEventListener('mousemove', h);
  }, []);

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.logo}><img src="/logo.png" alt="Schuber" style={{height:44,objectFit:"contain"}} /></div>
        <div style={s.navLinks}>
          <a href="#features" style={s.navLink}>Features</a>
          <a href="#how" style={s.navLink}>How it Works</a>
          <a href="#about" style={s.navLink}>About</a>
        </div>
        <div style={s.navActions}>
          <Link to="/login" style={s.btnGhost}>Log in</Link>
          <Link to="/register" style={s.btnAmber}>Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroBg} />
        <div style={s.heroContent}>
          <div style={s.badge}>🇮🇳 India's Safety-First School Transport</div>
          <h1 style={s.heroTitle}>
            Your child's journey,<br />
            <span style={s.heroAccent}>tracked in real-time</span>
          </h1>
          <p style={s.heroSub}>
            Schuber connects parents with verified drivers for safe, accountable,
            and transparent school transportation. Peace of mind, every single day.
          </p>
          <div style={s.heroCTA}>
            <Link to="/register" style={s.btnAmberLg}>Start Free Trial →</Link>
            <Link to="/login" style={s.btnOutlineLg}>View Demo</Link>
          </div>
          <div style={s.demoCreds}>
            <span style={s.credLabel}>Demo accounts:</span>
            <span style={s.credItem}>parent: priya@example.com / parent123</span>
            <span style={s.credItem}>driver: suresh@example.com / driver123</span>
          </div>
        </div>
        <div ref={heroRef} style={s.heroVisual}>
          <div style={s.mockup}>
            <div style={s.mockupBar}>
              <span style={s.mockupTitle}>Live Tracking</span>
              <span style={s.liveDot} />
            </div>
            <div style={s.mockupMap}>
              <div style={s.mapLine} />
              <div style={s.mapLine2} />
              <div style={s.vanDot}>🚌</div>
              <div style={s.homeDot}>🏠</div>
              <div style={s.schoolDot}>🏫</div>
            </div>
            <div style={s.mockupCard}>
              <div style={s.cardRow}>
                <div style={s.cardAvatar}>SK</div>
                <div>
                  <div style={s.cardName}>Suresh Kumar</div>
                  <div style={s.cardSub}>KA01AB1234 · 4.8 ★</div>
                </div>
                <div style={s.etaBadge}>ETA 7 min</div>
              </div>
            </div>
            <div style={s.checkBadge}>✅ Aanya boarded safely</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={s.statsStrip}>
        {stats.map(st => (
          <div key={st.n} style={s.statItem}>
            <div style={s.statNum}>{st.n}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" style={s.section}>
        <div style={s.tag}>PLATFORM</div>
        <h2 style={s.sectionTitle}>Everything you need,<br /><span style={s.heroAccent}>nothing you don't</span></h2>
        <div style={s.featGrid}>
          {features.map(f => (
            <div key={f.title} style={s.featCard}>
              <div style={s.featIcon}>{f.icon}</div>
              <h3 style={s.featTitle}>{f.title}</h3>
              <p style={s.featDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={s.howSection}>
        <div style={s.tag}>PROCESS</div>
        <h2 style={s.sectionTitle}>Up and running<br /><span style={s.heroAccent}>in 4 simple steps</span></h2>
        <div style={s.stepsGrid}>
          {steps.map((st, i) => (
            <div key={st.num} style={s.stepCard}>
              <div style={s.stepNum}>{st.num}</div>
              <h3 style={s.stepTitle}>{st.title}</h3>
              <p style={s.stepDesc}>{st.desc}</p>
              {i < steps.length - 1 && <div style={s.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="about" style={s.rolesSection}>
        <div style={s.roleCard}>
          <div style={s.roleEmoji}>👨‍👩‍👧</div>
          <h3 style={s.roleTitle}>For Parents</h3>
          <p style={s.roleDesc}>Track your child live, get instant alerts, and never worry about their commute again.</p>
          <Link to="/register?role=parent" style={s.btnAmber}>Join as Parent →</Link>
        </div>
        <div style={s.roleDivider} />
        <div style={s.roleCard}>
          <div style={s.roleEmoji}>🚌</div>
          <h3 style={s.roleTitle}>For Drivers</h3>
          <p style={s.roleDesc}>Get structured routes, fixed monthly payouts, and build trust with families.</p>
          <Link to="/register?role=driver" style={s.btnAmberOutline}>Join as Driver →</Link>
        </div>
      </section>

      <footer style={s.footer}>
        <div style={s.footerLogo}>
          <span>🚌</span>
          <span style={s.logoText}>Sc<span style={s.logoHub}>HUB</span>er</span>
        </div>
        <p style={s.footerTag}>Safety first, always.</p>
        <p style={s.footerCopy}>© 2024 Schuber · Team Fantastic5, RV University · Agile Software Engineering</p>
      </footer>
    </div>
  );
}

const s = {
  page: { background: '#FFFBF0', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 4vw', borderBottom: '1px solid #FDE68A', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,251,240,0.95)', backdropFilter: 'blur(10px)' },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#1C1917', letterSpacing: '-0.02em' },
  logoHub: { background: '#F59E0B', color: '#fff', padding: '0 4px', borderRadius: 4 },
  navLinks: { display: 'flex', gap: '2rem' },
  navLink: { color: '#57534E', fontSize: '0.9rem', fontWeight: 500 },
  navActions: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  btnGhost: { background: 'transparent', border: '1.5px solid #FDE68A', color: '#92400E', padding: '0.5rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600 },
  btnAmber: { background: '#F59E0B', border: 'none', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 700 },
  btnAmberLg: { background: '#F59E0B', border: 'none', color: '#fff', padding: '0.875rem 2rem', borderRadius: 12, fontSize: '1rem', fontWeight: 700, display: 'inline-block' },
  btnOutlineLg: { background: 'transparent', border: '1.5px solid #FDE68A', color: '#92400E', padding: '0.875rem 2rem', borderRadius: 12, fontSize: '1rem', fontWeight: 600, display: 'inline-block' },
  btnAmberOutline: { background: 'transparent', border: '1.5px solid #F59E0B', color: '#D97706', padding: '0.5rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 700, display: 'inline-block', marginTop: 'auto' },
  hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4.5rem 4vw', position: 'relative', overflow: 'hidden', minHeight: '85vh', gap: '2rem', flexWrap: 'wrap' },
  heroBg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 70% at 85% 50%, rgba(245,158,11,0.12) 0%, transparent 70%)', pointerEvents: 'none' },
  heroContent: { flex: '1 1 420px', position: 'relative', zIndex: 1 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '0.4rem 1rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem' },
  heroTitle: { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.5rem,5vw,3.75rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.25rem', color: '#1C1917' },
  heroAccent: { color: '#F59E0B' },
  heroSub: { color: '#57534E', fontSize: '1.1rem', lineHeight: 1.75, maxWidth: 500, marginBottom: '2rem' },
  heroCTA: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  demoCreds: { display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.75rem 1rem', background: '#FEF3C7', borderRadius: 8, fontSize: '0.75rem', border: '1px solid #FDE68A' },
  credLabel: { color: '#92400E', fontWeight: 700 },
  credItem: { color: '#D97706', fontFamily: 'monospace', fontWeight: 600 },
  heroVisual: { flex: '1 1 300px', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1, transition: 'transform 0.1s ease' },
  mockup: { background: '#FFFFFF', border: '2px solid #FDE68A', borderRadius: 24, padding: '1.25rem', width: 280, boxShadow: '0 20px 60px rgba(245,158,11,0.15)', position: 'relative' },
  mockupBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  mockupTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1C1917' },
  liveDot: { width: 8, height: 8, borderRadius: '50%', background: '#059669', boxShadow: '0 0 6px #059669' },
  mockupMap: { background: '#FEF9EE', borderRadius: 12, height: 140, position: 'relative', overflow: 'hidden', marginBottom: '0.75rem', border: '1px solid #FDE68A' },
  mapLine: { position: 'absolute', top: '45%', left: '10%', width: '80%', height: 2, background: 'linear-gradient(90deg, #F59E0B, #FCD34D)', borderRadius: 1 },
  mapLine2: { position: 'absolute', top: '58%', left: '30%', width: '50%', height: 2, background: 'rgba(245,158,11,0.3)', transform: 'rotate(-15deg)', borderRadius: 1 },
  vanDot: { position: 'absolute', top: '30%', left: '45%', fontSize: '1.5rem' },
  homeDot: { position: 'absolute', bottom: '20%', left: '10%', fontSize: '1.1rem' },
  schoolDot: { position: 'absolute', top: '15%', right: '10%', fontSize: '1.1rem' },
  mockupCard: { background: '#FEF9EE', borderRadius: 10, padding: '0.75rem', marginBottom: '0.5rem', border: '1px solid #FDE68A' },
  cardRow: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  cardAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 },
  cardName: { fontWeight: 600, fontSize: '0.85rem', color: '#1C1917' },
  cardSub: { color: '#78716C', fontSize: '0.72rem' },
  etaBadge: { marginLeft: 'auto', background: '#DCFCE7', color: '#059669', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 },
  checkBadge: { background: '#DCFCE7', color: '#059669', padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.78rem', textAlign: 'center', border: '1px solid #A7F3D0' },
  statsStrip: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', background: '#F59E0B', gap: '1px' },
  statItem: { background: '#F59E0B', padding: '1.75rem', textAlign: 'center' },
  statNum: { fontFamily: "'Syne', sans-serif", fontSize: '2.25rem', fontWeight: 800, color: '#fff', lineHeight: 1 },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 600 },
  section: { padding: '5rem 4vw', textAlign: 'center' },
  howSection: { padding: '5rem 4vw', textAlign: 'center', background: '#FEF9EE' },
  tag: { color: '#D97706', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '0.75rem' },
  sectionTitle: { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.875rem,4vw,2.75rem)', fontWeight: 800, marginBottom: '3rem', lineHeight: 1.2, color: '#1C1917' },
  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', maxWidth: 1100, margin: '0 auto' },
  featCard: { background: '#FFFFFF', border: '1.5px solid #FDE68A', borderRadius: 16, padding: '1.75rem', textAlign: 'left', boxShadow: '0 1px 4px rgba(245,158,11,0.08)' },
  featIcon: { fontSize: '1.75rem', marginBottom: '0.75rem' },
  featTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem', color: '#1C1917' },
  featDesc: { color: '#78716C', fontSize: '0.88rem', lineHeight: 1.65 },
  stepsGrid: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', position: 'relative', maxWidth: 1100, margin: '0 auto' },
  stepCard: { background: '#FFFFFF', border: '1.5px solid #FDE68A', borderRadius: 16, padding: '2rem 1.5rem', flex: '1 1 200px', maxWidth: 240, position: 'relative', textAlign: 'left', boxShadow: '0 1px 4px rgba(245,158,11,0.08)' },
  stepNum: { fontFamily: "'Syne', sans-serif", fontSize: '2.75rem', fontWeight: 800, color: 'rgba(245,158,11,0.2)', lineHeight: 1, marginBottom: '0.5rem' },
  stepTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem', color: '#1C1917' },
  stepDesc: { color: '#78716C', fontSize: '0.875rem', lineHeight: 1.6 },
  stepArrow: { position: 'absolute', right: -18, top: '50%', transform: 'translateY(-50%)', color: '#FDE68A', fontSize: '1.5rem', zIndex: 1 },
  rolesSection: { display: 'flex', gap: '0', maxWidth: 900, margin: '0 auto', padding: '5rem 4vw', alignItems: 'stretch', flexWrap: 'wrap' },
  roleCard: { flex: 1, background: '#FFFFFF', border: '1.5px solid #FDE68A', borderRadius: 20, padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 260, boxShadow: '0 2px 12px rgba(245,158,11,0.1)' },
  roleDivider: { width: 1, background: '#FDE68A', margin: '0 1.5rem' },
  roleEmoji: { fontSize: '2.5rem' },
  roleTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#1C1917' },
  roleDesc: { color: '#78716C', lineHeight: 1.7, fontSize: '0.95rem', flex: 1 },
  footer: { borderTop: '2px solid #FDE68A', padding: '2.5rem 4vw', textAlign: 'center', background: '#FFFBF0' },
  footerLogo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' },
  footerTag: { color: '#A8A29E', fontSize: '0.875rem', marginBottom: '0.4rem' },
  footerCopy: { color: '#D4C5A9', fontSize: '0.78rem' },
};
