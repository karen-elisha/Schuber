
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../supabase';

const REVIEWS = [
  { name: 'Priya Sharma', role: 'Parent of 2', avatar: 'PS', rating: 5, text: 'Schuber gave me peace of mind. I can see exactly where my kids are every morning. The live tracking is incredibly accurate!', location: 'Koramangala, Bengaluru' },
  { name: 'Ramesh Nair', role: 'Father', avatar: 'RN', rating: 5, text: 'My daughter boards the school van at 7:30 AM and I get a notification the moment she sits down. Amazing app!', location: 'Indiranagar, Bengaluru' },
  { name: 'Sunita Mehta', role: 'Working Mom', avatar: 'SM', rating: 5, text: 'The SOS feature and instant alerts mean I\'m always in the loop. Worth every rupee of the subscription.', location: 'HSR Layout, Bengaluru' },
  { name: 'Arjun Patel', role: 'Parent', avatar: 'AP', rating: 4, text: 'Super easy to add my child\'s details. Driver was verified and professional. The AI assistant answers all my questions quickly.', location: 'Whitefield, Bengaluru' },
  { name: 'Deepa Krishnan', role: 'Mother of 3', avatar: 'DK', rating: 5, text: 'Managing three kids on different routes was a nightmare before Schuber. Now it\'s effortless. Highly recommend!', location: 'JP Nagar, Bengaluru' },
  { name: 'Vijay Kumar', role: 'Father', avatar: 'VK', rating: 5, text: 'The trip history feature is great for tracking attendance. And the driver ratings helped us pick the best one for our area.', location: 'Marathahalli, Bengaluru' },
];

const STATS = [
  { value: '12,000+', label: 'Happy Families' },
  { value: '98.2%', label: 'On-Time Rate' },
  { value: '450+', label: 'Verified Drivers' },
  { value: '4.8★', label: 'App Rating' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: params.get('role') || 'parent', phone: '',
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => !phone || /^[+]?[\d\s()-]{7,15}$/.test(phone);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!validateEmail(form.email)) e.email = 'Please enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (form.phone && !validatePhone(form.phone)) e.phone = 'Please enter a valid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearFieldError = (field) => {
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const updateField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    clearFieldError(field);
  };

  const handle = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError(''); setLoading(true);
    try {
      const user = await register(form.email, form.password, form.name, form.role, form.phone);
      if (!user) {
        setSuccess('Account created! Check your email to confirm, then sign in.');
        return;
      }
      const role = user?.user_metadata?.role || form.role;

      if (role === 'driver') {
        navigate('/driver', { replace: true });   // ✅ go to driver dashboard
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try { await signInWithGoogle(); }
    catch (err) { setError('Google sign-up failed. Please try again.'); }
  };

  const review = REVIEWS[reviewIdx];

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .reg-input:focus { border-color: #F59E0B !important; outline: none; box-shadow: 0 0 0 3px rgba(245,158,11,0.15) !important; }
        .role-btn:hover { opacity: 0.85; }
        .submit-reg:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(245,158,11,0.45) !important; }
        .review-nav:hover { background: #F59E0B !important; color: #fff !important; }
      `}</style>

      {/* Left: Form */}
      <div style={s.formSide}>
        <div style={s.formInner}>
          <Link to="/" style={s.logo}>
            <div style={s.logoText}>🚌 <span style={{ color: '#F59E0B' }}>Schu</span>ber</div>
          </Link>

          <div style={s.headGroup}>
            <h1 style={s.heading}>Start your free trial</h1>
            <p style={s.sub}>Join <strong>12,000+ families</strong> keeping kids safe every day</p>
          </div>

          {/* Stats row */}
          <div style={s.statsRow}>
            {STATS.map(st => (
              <div key={st.label} style={s.statItem}>
                <div style={s.statVal}>{st.value}</div>
                <div style={s.statLbl}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* Google Sign-Up */}
          <button onClick={handleGoogle} style={s.googleBtn}>
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Sign up with Google
          </button>

          <div style={s.dividerRow}>
            <div style={s.dividerLine} />
            <span style={s.dividerTxt}>or register with email</span>
            <div style={s.dividerLine} />
          </div>

          {/* Role Toggle */}
          <div style={s.roleSection}>
            <p style={s.roleSectionLabel}>I am registering as:</p>
            <div style={s.roleToggle}>
              {[['parent', '👨‍👩‍👧', 'Parent'], ['driver', '🚌', 'Driver']].map(([r, icon, label]) => (
                <button key={r} className="role-btn"
                  style={{ ...s.roleBtn, ...(form.role === r ? s.roleBtnActive : {}) }}
                  onClick={() => setForm(f => ({ ...f, role: r }))}>
                  <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                  <span>{label}</span>
                  {form.role === r && <span style={s.roleCheck}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handle} style={s.form}>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Full Name *</label>
                <input className="reg-input" style={{ ...s.input, ...(errors.name ? { borderColor: '#DC2626' } : {}) }} required value={form.name}
                  onChange={e => updateField('name', e.target.value)} placeholder="Priya Sharma" />
                {errors.name && <div style={s.fieldError}>{errors.name}</div>}
              </div>
              <div style={s.field}>
                <label style={s.label}>Phone Number</label>
                <input className="reg-input" style={{ ...s.input, ...(errors.phone ? { borderColor: '#DC2626' } : {}) }} value={form.phone}
                  onChange={e => updateField('phone', e.target.value)} placeholder="+91 98765 43210" />
                {errors.phone && <div style={s.fieldError}>{errors.phone}</div>}
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Email Address *</label>
              <input className="reg-input" style={{ ...s.input, ...(errors.email ? { borderColor: '#DC2626' } : {}) }} type="email" required value={form.email}
                onChange={e => updateField('email', e.target.value)} placeholder="you@example.com" />
              {errors.email && <div style={s.fieldError}>{errors.email}</div>}
            </div>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input className="reg-input" style={{ ...s.input, paddingRight: '2.5rem', ...(errors.password ? { borderColor: '#DC2626' } : {}) }}
                    type={showPass ? 'text' : 'password'} required value={form.password}
                    onChange={e => updateField('password', e.target.value)}
                    placeholder="Min. 6 characters" minLength={6} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <div style={s.fieldError}>{errors.password}</div>}
              </div>
              <div style={s.field}>
                <label style={s.label}>Confirm Password *</label>
                <input className="reg-input" style={{ ...s.input, ...(errors.confirmPassword ? { borderColor: '#DC2626' } : {}) }} type="password" required value={form.confirmPassword}
                  onChange={e => updateField('confirmPassword', e.target.value)}
                  placeholder="Re-enter password" minLength={6} />
                {errors.confirmPassword && <div style={s.fieldError}>{errors.confirmPassword}</div>}
              </div>
            </div>
            {error && <div style={s.error}>⚠️ {error}</div>}
            {success && <div style={s.successBox}>✅ {success}</div>}
            <button type="submit" disabled={loading} className="submit-reg"
              style={{ ...s.submit, opacity: loading ? 0.8 : 1 }}>
              {loading ? <span style={s.spinner} /> : null}
              {loading ? 'Creating account…' : `Create ${form.role === 'parent' ? 'Parent' : 'Driver'} Account — Free →`}
            </button>
          </form>

          {form.role === 'driver' && (
            <div style={s.driverNote}>
              ℹ️ Driver accounts require <strong>identity & license verification</strong> before accepting rides.
            </div>
          )}

          <p style={s.terms}>By registering you agree to our <span style={{ color: '#D97706', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ color: '#D97706', cursor: 'pointer' }}>Privacy Policy</span>.</p>
          <p style={s.switchText}>
            Already have an account? <Link to="/login" style={s.switchLink}>Sign in →</Link>
          </p>
        </div>
      </div>

      {/* Right: Social Proof */}
      <div style={s.sidePanel}>
        <div style={s.sidePanelInner}>
          <div style={s.sideTitle}>
            <div style={s.sideTitleBadge}>Why Schuber?</div>
            <h2 style={s.sideTitleText}>School commute, simplified</h2>
          </div>

          {/* Features */}
          <div style={s.features}>
            {[
              ['✅', 'Verified & background-checked drivers'],
              ['📍', 'Real-time GPS tracking on every trip'],
              ['🔔', 'Instant alerts for check-in & check-out'],
              ['🆘', 'SOS emergency alert with one tap'],
              ['📊', 'Full trip history & attendance records'],
              ['🤖', 'AI assistant for instant answers'],
              ['💳', 'Subscription plans from ₹99/month'],
            ].map(([icon, text]) => (
              <div key={text} style={s.featureItem}>
                <span style={s.fIcon}>{icon}</span>
                <span style={s.fText}>{text}</span>
              </div>
            ))}
          </div>

          {/* Review Card */}
          <div style={s.reviewCard}>
            <div style={s.reviewStars}>{'⭐'.repeat(review.rating)}</div>
            <p style={s.reviewText}>"{review.text}"</p>
            <div style={s.reviewAuthor}>
              <div style={s.reviewAv}>{review.avatar}</div>
              <div>
                <div style={s.reviewName}>{review.name}</div>
                <div style={s.reviewRole}>{review.role} · {review.location}</div>
              </div>
            </div>
            <div style={s.reviewNav}>
              <button className="review-nav" style={s.reviewNavBtn}
                onClick={() => setReviewIdx(i => (i - 1 + REVIEWS.length) % REVIEWS.length)}>‹</button>
              <div style={s.reviewDots}>
                {REVIEWS.map((_, i) => (
                  <div key={i} style={{ ...s.reviewDot, background: i === reviewIdx ? '#fff' : 'rgba(255,255,255,0.3)' }}
                    onClick={() => setReviewIdx(i)} />
                ))}
              </div>
              <button className="review-nav" style={s.reviewNavBtn}
                onClick={() => setReviewIdx(i => (i + 1) % REVIEWS.length)}>›</button>
            </div>
          </div>

          <div style={s.trialBadge}>
            🎁 <strong>7-day free trial</strong> — no credit card required
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#FFFBF0' },
  formSide: { flex: '1 1 520px', overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2.5rem 2rem' },
  formInner: { width: '100%', maxWidth: 520 },
  logo: { display: 'flex', alignItems: 'center', marginBottom: '1.5rem', textDecoration: 'none' },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#1C1917' },
  headGroup: { marginBottom: '1rem' },
  heading: { fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.3rem', color: '#1C1917', marginTop: 0 },
  sub: { color: '#78716C', marginBottom: 0, marginTop: 0, fontSize: '0.95rem' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.6rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg,#FEF3C7,#FFFBEB)', borderRadius: 14, padding: '0.875rem' },
  statItem: { textAlign: 'center' },
  statVal: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#D97706' },
  statLbl: { fontSize: '0.65rem', color: '#78716C', fontWeight: 600, marginTop: '0.1rem' },
  googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem', padding: '0.75rem 1rem', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600, color: '#1C1917', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif" },
  dividerRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' },
  dividerLine: { flex: 1, height: 1, background: '#E5E7EB' },
  dividerTxt: { color: '#9CA3AF', fontSize: '0.75rem', whiteSpace: 'nowrap', fontWeight: 500 },
  roleSection: { marginBottom: '1.1rem' },
  roleSectionLabel: { fontSize: '0.78rem', color: '#57534E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', marginTop: 0 },
  roleToggle: { display: 'flex', gap: '0.6rem' },
  roleBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem 1rem', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', color: '#78716C', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" },
  roleBtnActive: { background: '#FEF3C7', border: '1.5px solid #F59E0B', color: '#92400E' },
  roleCheck: { marginLeft: 'auto', background: '#F59E0B', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '0.75rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label: { fontSize: '0.72rem', color: '#57534E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.65rem 0.875rem', color: '#1C1917', fontSize: '0.9rem', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', width: '100%' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.7rem 1rem', borderRadius: 8, fontSize: '0.84rem' },
  successBox: { background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#065F46', padding: '0.7rem 1rem', borderRadius: 8, fontSize: '0.84rem' },
  submit: { background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#fff', border: 'none', padding: '0.875rem', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 14px rgba(245,158,11,0.35)', transition: 'transform 0.2s, box-shadow 0.2s' },
  spinner: { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
  driverNote: { background: '#FFF8E7', border: '1px solid #FDE68A', borderRadius: 10, padding: '0.65rem 0.875rem', fontSize: '0.8rem', color: '#92400E', marginBottom: '0.75rem' },
  terms: { color: '#A8A29E', fontSize: '0.7rem', textAlign: 'center', marginBottom: '0.4rem', marginTop: '0.5rem' },
  switchText: { color: '#78716C', fontSize: '0.875rem', textAlign: 'center', marginBottom: 0 },
  switchLink: { color: '#D97706', fontWeight: 700, textDecoration: 'none' },
  fieldError: { color: '#DC2626', fontSize: '0.72rem', fontWeight: 500, marginTop: '0.15rem' },
  // Right Panel
  sidePanel: { flex: '0 0 400px', background: 'linear-gradient(160deg, #D97706 0%, #B45309 100%)', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sidePanelInner: { padding: '3rem 2.5rem', width: '100%' },
  sideTitle: { marginBottom: '1.5rem' },
  sideTitleBadge: { display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '0.3rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.6rem', letterSpacing: '0.05em' },
  sideTitleText: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#fff', margin: 0, lineHeight: 1.3 },
  features: { display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.75rem' },
  featureItem: { display: 'flex', gap: '0.6rem', alignItems: 'flex-start' },
  fIcon: { fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' },
  fText: { color: 'rgba(255,255,255,0.92)', fontSize: '0.875rem', lineHeight: 1.5 },
  reviewCard: { background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.2)' },
  reviewStars: { fontSize: '0.8rem', marginBottom: '0.6rem' },
  reviewText: { color: 'rgba(255,255,255,0.95)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.875rem', fontStyle: 'italic', marginTop: 0 },
  reviewAuthor: { display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.875rem' },
  reviewAv: { width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 },
  reviewName: { color: '#fff', fontWeight: 700, fontSize: '0.875rem' },
  reviewRole: { color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' },
  reviewNav: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' },
  reviewNavBtn: { width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', fontFamily: 'sans-serif' },
  reviewDots: { display: 'flex', gap: '0.35rem' },
  reviewDot: { width: 6, height: 6, borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' },
  trialBadge: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '0.7rem 1rem', color: '#fff', fontSize: '0.85rem', textAlign: 'center' },
};
