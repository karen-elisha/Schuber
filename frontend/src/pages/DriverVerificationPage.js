import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const steps = ['Basic Info', 'License Details', 'Upload Documents', 'Review'];

export default function DriverVerificationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: '', phone: '', dob: '', vehicleNo: '', vehicleModel: '',
    licenseNo: '', licenseExpiry: '', licenseState: '', yearsExperience: '',
    dlFile: null, dlPreview: null, photoFile: null, photoPreview: null,
    rcFile: null, rcPreview: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (key, previewKey, e) => {
    const file = e.target.files[0];
    if (!file) return;
    set(key, file);
    const reader = new FileReader();
    reader.onload = ev => set(previewKey, ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    setDone(true);
    setSubmitting(false);
    setTimeout(() => navigate('/driver'), 2500);
  };

  if (done) return (
    <div style={s.page}>
      <div style={s.successCard}>
        <div style={s.successIcon}>✅</div>
        <h2 style={s.successTitle}>Verification Submitted!</h2>
        <p style={s.successSub}>Your documents are under review. Redirecting to dashboard…</p>
        <div style={s.successBar}><div style={s.successBarFill} /></div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.blob1}/><div style={s.blob2}/>
      <div style={s.container}>

        {/* Logo */}
        <Link to="/" style={{display:'block',marginBottom:'1.5rem',textAlign:'center'}}>
          <img src="/logo.png" alt="Schuber" style={{height:70,objectFit:'contain',filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.1))'}} />
        </Link>

        {/* Header */}
        <div style={s.header}>
          <h1 style={s.title}>Driver Verification</h1>
          <p style={s.subtitle}>Complete verification to start accepting rides</p>
        </div>

        {/* Step Pills */}
        <div style={s.stepBar}>
          {steps.map((label, i) => (
            <div key={label} style={s.stepItem}>
              <div style={{...s.stepCircle, ...(i <= step ? s.stepCircleActive : {}), ...(i < step ? s.stepCircleDone : {})}}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{...s.stepLabel, ...(i <= step ? {color:'#D97706',fontWeight:700} : {})}}>{label}</span>
              {i < steps.length - 1 && <div style={{...s.stepLine, ...(i < step ? s.stepLineDone : {})}} />}
            </div>
          ))}
        </div>

        <div style={s.card}>
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>👤 Basic Information</h2>
              <p style={s.stepDesc}>Tell us about yourself so we can verify your identity.</p>
              <div style={s.grid2}>
                <Field label="Full Name *" icon="👤">
                  <input style={s.input} placeholder="Suresh Kumar" value={form.fullName}
                    onChange={e => set('fullName', e.target.value)} required />
                </Field>
                <Field label="Phone Number *" icon="📱">
                  <input style={s.input} placeholder="+91 98765 43210" value={form.phone}
                    onChange={e => set('phone', e.target.value)} />
                </Field>
                <Field label="Date of Birth *" icon="🎂">
                  <input style={s.input} type="date" value={form.dob}
                    onChange={e => set('dob', e.target.value)} />
                </Field>
                <Field label="Years of Experience *" icon="🏅">
                  <input style={s.input} placeholder="e.g. 5" type="number" min="0" value={form.yearsExperience}
                    onChange={e => set('yearsExperience', e.target.value)} />
                </Field>
              </div>
              <div style={s.grid2}>
                <Field label="Vehicle Number *" icon="🚌">
                  <input style={s.input} placeholder="KA01AB1234" value={form.vehicleNo}
                    onChange={e => set('vehicleNo', e.target.value)} />
                </Field>
                <Field label="Vehicle Model *" icon="🚐">
                  <input style={s.input} placeholder="Tempo Traveller 2022" value={form.vehicleModel}
                    onChange={e => set('vehicleModel', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* Step 1: License */}
          {step === 1 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>🪪 Driving License Details</h2>
              <p style={s.stepDesc}>Enter your driving license information exactly as it appears on the document.</p>
              <div style={s.grid2}>
                <Field label="License Number *" icon="🔢">
                  <input style={s.input} placeholder="KA0120230012345" value={form.licenseNo}
                    onChange={e => set('licenseNo', e.target.value)} />
                </Field>
                <Field label="Issuing State *" icon="📍">
                  <select style={s.input} value={form.licenseState} onChange={e => set('licenseState', e.target.value)}>
                    <option value="">Select State</option>
                    {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="License Expiry Date *" icon="📅">
                  <input style={s.input} type="date" value={form.licenseExpiry}
                    onChange={e => set('licenseExpiry', e.target.value)} />
                </Field>
              </div>
              <div style={s.infoBox}>
                <span style={{fontSize:'1.2rem'}}>ℹ️</span>
                <span style={{fontSize:'0.85rem',color:'#57534E'}}>
                  Your driving license must be valid for at least 6 months from today and must include authorization for commercial/passenger vehicle use (LMV-TR or Transport category).
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>📎 Upload Documents</h2>
              <p style={s.stepDesc}>Upload clear photos or scans of your documents. Max 5MB each.</p>
              <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
                <UploadBox
                  label="Driving License (Front & Back) *"
                  icon="🪪"
                  required
                  preview={form.dlPreview}
                  fileName={form.dlFile?.name}
                  onChange={e => handleFile('dlFile','dlPreview',e)}
                />
                <UploadBox
                  label="Driver Profile Photo *"
                  icon="🤳"
                  required
                  preview={form.photoPreview}
                  fileName={form.photoFile?.name}
                  onChange={e => handleFile('photoFile','photoPreview',e)}
                />
                <UploadBox
                  label="Vehicle RC (Registration Certificate)"
                  icon="📄"
                  preview={form.rcPreview}
                  fileName={form.rcFile?.name}
                  onChange={e => handleFile('rcFile','rcPreview',e)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>🔍 Review & Submit</h2>
              <p style={s.stepDesc}>Please review your information before submitting for verification.</p>
              <div style={s.reviewGrid}>
                {[
                  ['Full Name', form.fullName || '—'],
                  ['Phone', form.phone || '—'],
                  ['Date of Birth', form.dob || '—'],
                  ['Experience', form.yearsExperience ? `${form.yearsExperience} years` : '—'],
                  ['Vehicle No.', form.vehicleNo || '—'],
                  ['Vehicle Model', form.vehicleModel || '—'],
                  ['License No.', form.licenseNo || '—'],
                  ['License State', form.licenseState || '—'],
                  ['License Expiry', form.licenseExpiry || '—'],
                ].map(([k,v]) => (
                  <div key={k} style={s.reviewRow}>
                    <span style={s.reviewKey}>{k}</span>
                    <span style={s.reviewVal}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={s.docsRow}>
                {[['DL Proof', form.dlFile],['Profile Photo', form.photoFile],['Vehicle RC', form.rcFile]].map(([label, f]) => (
                  <div key={label} style={{...s.docChip, ...(f ? s.docChipDone : {})}}>
                    {f ? '✅' : '⬜'} {label}
                  </div>
                ))}
              </div>
              <div style={s.infoBox}>
                <span style={{fontSize:'1.2rem'}}>⏱️</span>
                <span style={{fontSize:'0.85rem',color:'#57534E'}}>
                  Verification typically takes <strong>24–48 hours</strong>. You'll be notified by SMS and email once approved. You can still explore the app while waiting.
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={s.navBtns}>
            {step > 0 && (
              <button style={s.backBtn} onClick={() => setStep(s => s - 1)}>← Back</button>
            )}
            <div style={{flex:1}} />
            {step < steps.length - 1 ? (
              <button style={s.nextBtn} onClick={() => setStep(s => s + 1)}>
                Next Step →
              </button>
            ) : (
              <button style={s.submitBtn} onClick={handleSubmit} disabled={submitting}>
                {submitting ? '⏳ Submitting...' : '🚀 Submit for Verification'}
              </button>
            )}
          </div>
        </div>

        <p style={{textAlign:'center',fontSize:'0.8rem',color:'#A8A29E',marginTop:'0.5rem'}}>
          Already verified? <Link to="/login" style={{color:'#D97706',fontWeight:600}}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
      <label style={{fontSize:'0.75rem',color:'#57534E',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function UploadBox({ label, icon, preview, fileName, onChange, required }) {
  const inputRef = React.useRef(null);
  return (
    <div>
      <label style={{fontSize:'0.78rem',color:'#57534E',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:'0.5rem'}}>
        {icon} {label}
      </label>
      <div
        style={{
          border: preview ? '2px solid #34D399' : '2px dashed #FDE68A',
          borderRadius: 14, background: preview ? '#F0FDF4' : '#FFFBEB',
          padding: '1.25rem', cursor: 'pointer', textAlign: 'center',
          transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
        }}
        onClick={() => inputRef.current?.click()}
      >
        {preview && preview.startsWith('data:image') ? (
          <img src={preview} alt="preview" style={{maxHeight:120,borderRadius:8,objectFit:'contain'}} />
        ) : preview ? (
          <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>📄</div>
        ) : (
          <>
            <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>📤</div>
            <div style={{fontWeight:600,color:'#92400E',fontSize:'0.9rem'}}>Click to upload</div>
            <div style={{fontSize:'0.75rem',color:'#A8A29E',marginTop:'0.25rem'}}>JPG, PNG or PDF • Max 5MB</div>
          </>
        )}
        {fileName && (
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'#059669',fontWeight:600}}>✅ {fileName}</div>
        )}
        <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={onChange}
          style={{position:'absolute',opacity:0,inset:0,cursor:'pointer'}} />
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFFBF0 0%, #FEF3C7 50%, #FFFBF0 100%)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif", padding: '2rem 1rem', position: 'relative', overflow: 'hidden',
  },
  blob1: { position:'absolute', top:-100, right:-100, width:350, height:350, background:'radial-gradient(circle,rgba(245,158,11,0.12) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' },
  blob2: { position:'absolute', bottom:-80, left:-80, width:300, height:300, background:'radial-gradient(circle,rgba(217,119,6,0.1) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' },
  container: { width:'100%', maxWidth:620, position:'relative', zIndex:1 },
  header: { textAlign:'center', marginBottom:'1.5rem' },
  title: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.75rem', color:'#1C1917' },
  subtitle: { color:'#78716C', fontSize:'0.95rem', marginTop:'0.25rem' },
  stepBar: { display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.5rem', gap:0 },
  stepItem: { display:'flex', alignItems:'center', gap:0 },
  stepCircle: { width:32, height:32, borderRadius:'50%', background:'#FEF3C7', border:'2px solid #FDE68A', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem', color:'#A8A29E', flexShrink:0, zIndex:1 },
  stepCircleActive: { background:'#FEF3C7', borderColor:'#F59E0B', color:'#D97706' },
  stepCircleDone: { background:'#F59E0B', borderColor:'#D97706', color:'#fff' },
  stepLabel: { fontSize:'0.72rem', color:'#A8A29E', fontWeight:500, margin:'0 0.35rem', whiteSpace:'nowrap' },
  stepLine: { width:40, height:2, background:'#FDE68A', flexShrink:0 },
  stepLineDone: { background:'#F59E0B' },
  card: { background:'#fff', borderRadius:24, boxShadow:'0 20px 60px rgba(0,0,0,0.08)', border:'1px solid rgba(253,230,138,0.5)', padding:'2rem', marginBottom:'1rem' },
  stepContent: { marginBottom:'1.5rem' },
  stepTitle: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.3rem', color:'#1C1917', marginBottom:'0.3rem' },
  stepDesc: { color:'#78716C', fontSize:'0.9rem', marginBottom:'1.5rem' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' },
  input: {
    width:'100%', background:'#FAFAFA', border:'1.5px solid #E5E7EB', borderRadius:10,
    padding:'0.7rem 0.9rem', color:'#1C1917', fontSize:'0.9rem', outline:'none',
    fontFamily:"'DM Sans',sans-serif", transition:'border-color 0.2s',
  },
  infoBox: { display:'flex', gap:'0.75rem', background:'#FFF8E7', border:'1px solid #FDE68A', borderRadius:12, padding:'0.875rem 1rem', marginTop:'1rem', alignItems:'flex-start' },
  reviewGrid: { background:'#FAFAFA', borderRadius:14, border:'1px solid #F3F4F6', overflow:'hidden', marginBottom:'1rem' },
  reviewRow: { display:'flex', justifyContent:'space-between', padding:'0.65rem 1rem', borderBottom:'1px solid #F3F4F6' },
  reviewKey: { fontSize:'0.82rem', color:'#78716C', fontWeight:600 },
  reviewVal: { fontSize:'0.82rem', color:'#1C1917', fontWeight:700 },
  docsRow: { display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1rem' },
  docChip: { padding:'0.4rem 0.85rem', borderRadius:20, background:'#F3F4F6', border:'1px solid #E5E7EB', fontSize:'0.78rem', fontWeight:600, color:'#78716C' },
  docChipDone: { background:'#F0FDF4', border:'1px solid #34D399', color:'#059669' },
  navBtns: { display:'flex', alignItems:'center', gap:'0.75rem', paddingTop:'0.5rem', borderTop:'1px solid #F3F4F6' },
  backBtn: { padding:'0.7rem 1.25rem', borderRadius:10, border:'1.5px solid #E5E7EB', background:'#fff', color:'#57534E', fontWeight:600, cursor:'pointer', fontSize:'0.9rem', fontFamily:"'DM Sans',sans-serif" },
  nextBtn: { padding:'0.7rem 1.5rem', borderRadius:10, background:'linear-gradient(135deg,#F59E0B,#D97706)', color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontSize:'0.9rem', boxShadow:'0 4px 14px rgba(245,158,11,0.35)', fontFamily:"'DM Sans',sans-serif" },
  submitBtn: { padding:'0.7rem 1.5rem', borderRadius:10, background:'linear-gradient(135deg,#059669,#047857)', color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontSize:'0.9rem', boxShadow:'0 4px 14px rgba(5,150,105,0.35)', fontFamily:"'DM Sans',sans-serif" },
  successCard: { background:'#fff', borderRadius:24, padding:'3rem 2rem', textAlign:'center', maxWidth:440, margin:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.08)' },
  successIcon: { fontSize:'4rem', marginBottom:'1rem' },
  successTitle: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:'#1C1917', marginBottom:'0.5rem' },
  successSub: { color:'#78716C', marginBottom:'1.5rem' },
  successBar: { height:6, background:'#FEF3C7', borderRadius:3, overflow:'hidden' },
  successBarFill: { height:'100%', background:'linear-gradient(90deg,#F59E0B,#059669)', width:'100%', animation:'slideIn 2.5s linear forwards' },
};
