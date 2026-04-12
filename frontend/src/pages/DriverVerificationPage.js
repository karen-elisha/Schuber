import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

const VEHICLE_TYPES = ['Tempo Traveller','Mini Bus','Innova','Ertiga','Maruti Van','Force Traveller','School Bus','Mahindra Bolero','Other'];
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
const STEPS = ['Vehicle Details','License & Experience','Upload Documents','Confirm & Submit'];

export default function DriverVerificationPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const dlRef  = useRef();
  const rcRef  = useRef();
  const picRef = useRef();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    // Step 0 — Vehicle
    vehicleType:    '',
    vehicleNo:      '',
    vehicleModel:   '',
    capacity:       '12',
    routeArea:      '',
    // Step 1 — License
    licenseNo:      '',
    licenseState:   '',
    licenseExpiry:  '',
    yearsExp:      '',
    dob:            '',
    // Step 2 — Files
    dlFile:    null, dlPreview:    null,
    rcFile:    null, rcPreview:    null,
    photoFile: null, photoPreview: null,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (fileKey, previewKey, ref) => {
    const file = ref.current?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setForm(f => ({ ...f, [fileKey]: file, [previewKey]: e.target.result }));
    reader.readAsDataURL(file);
  };

  // ── Validation per step ───────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.vehicleType)  e.vehicleType  = 'Select a vehicle type';
      if (!form.vehicleNo.trim())  e.vehicleNo = 'Vehicle number is required';
      if (!form.vehicleModel.trim()) e.vehicleModel = 'Vehicle model is required';
      if (!form.capacity || isNaN(form.capacity)) e.capacity = 'Enter valid capacity';
    }
    if (step === 1) {
      if (!form.licenseNo.trim()) e.licenseNo = 'DL number is required';
      if (!form.licenseState)     e.licenseState = 'Select issuing state';
      if (!form.licenseExpiry)    e.licenseExpiry = 'DL expiry date is required';
      if (!form.yearsExp || isNaN(form.yearsExp)) e.yearsExp = 'Enter years of experience';
      if (!form.dob) e.dob = 'Date of birth is required';
    }
    if (step === 2) {
      if (!form.dlFile)    e.dlFile    = 'Upload your Driving License';
      if (!form.rcFile)    e.rcFile    = 'Upload vehicle RC document';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => { setErrors({}); setStep(s => s - 1); };

  // ── Submit to Supabase ────────────────────────────────────────────────────
  const submit = async () => {
    setSaving(true);
    try {
      const userId = user?.id;
      if (!userId) throw new Error('Not logged in');

      // Upload DL image to Supabase Storage (if bucket exists; ignore errors)
      let dlUrl = null;
      if (form.dlFile) {
        const { data } = await supabase.storage
          .from('driver-docs')
          .upload(`${userId}/dl.${form.dlFile.name.split('.').pop()}`, form.dlFile, { upsert: true })
          .catch(() => ({ data: null }));
        if (data?.path) {
          const { data: { publicUrl } } = supabase.storage.from('driver-docs').getPublicUrl(data.path);
          dlUrl = publicUrl;
        }
      }

      // Upsert drivers table
      const { error } = await supabase.from('drivers').upsert({
        user_id:        userId,
        vehicle_type:   form.vehicleType,
        vehicle_no:     form.vehicleNo.toUpperCase().trim(),
        vehicle_model:  form.vehicleModel,
        capacity:       parseInt(form.capacity, 10),
        route:          form.routeArea,
        license_no:     form.licenseNo.toUpperCase().trim(),
        license_state:  form.licenseState,
        license_expiry: form.licenseExpiry,
        years_exp:      parseInt(form.yearsExp, 10),
        dob:            form.dob,
        dl_document_url: dlUrl,
        verified:       false,
        is_online:      false,
        rating:         0,
      }, { onConflict: 'user_id' });

      if (error) throw error;

        localStorage.removeItem("schuber-driver-setup");
        await refreshProfile().catch(() => {});
       setDone(true);
       setTimeout(() => navigate('/driver', { replace: true }), 2500);
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ ...s.page, alignItems:'center', justifyContent:'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes grow { from { width:0 } to { width:100% } }`}</style>
      <div style={s.successCard}>
        <div style={s.successEmoji}>🎉</div>
        <h2 style={s.successTitle}>Profile Submitted!</h2>
        <p style={s.successSub}>Your details have been saved. An admin will verify your account shortly.</p>
        <div style={s.progressBar}><div style={s.progressFill} /></div>
        <p style={{ color:'#78716C', fontSize:'0.8rem', marginTop:'0.5rem' }}>Redirecting to your dashboard…</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes grow    { from { width:0 } to { width:100% } }
        .dv-input:focus    { border-color:#F59E0B !important; box-shadow:0 0 0 3px rgba(245,158,11,0.15) !important; outline:none; }
        .dv-select:focus   { border-color:#F59E0B !important; outline:none; }
        .upload-box:hover  { border-color:#F59E0B !important; background:#FFFBEB !important; }
        .dv-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(245,158,11,0.4) !important; }
      `}</style>

      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLogo}>🚌 <span style={{ color:'#F59E0B' }}>Schu</span>ber</div>
          <h1 style={s.headerTitle}>Driver Verification</h1>
          <p style={s.headerSub}>Complete your profile to start accepting school routes</p>
        </div>

        {/* Step progress */}
        <div style={s.steps}>
          {STEPS.map((label, i) => (
            <div key={label} style={s.stepItem}>
              <div style={{ ...s.stepCircle, ...(i < step ? s.stepDone : i === step ? s.stepActive : s.stepFuture) }}>
                {i < step ? '✓' : i + 1}
              </div>
              <div style={{ ...s.stepLabel, color: i <= step ? '#92400E' : '#A8A29E' }}>{label}</div>
              {i < STEPS.length - 1 && (
                <div style={{ ...s.stepLine, background: i < step ? '#F59E0B' : '#E5E7EB' }} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div style={s.formCard}>

          {/* ── STEP 0: Vehicle Details ── */}
          {step === 0 && (
            <div style={s.formBody}>
              <h2 style={s.stepTitle}>🚌 Vehicle Details</h2>
              <div style={s.grid2}>
                <Field label="Type of Vehicle *" error={errors.vehicleType}>
                  <select className="dv-select" value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} style={s.select}>
                    <option value="">Select vehicle type</option>
                    {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Vehicle Number *" error={errors.vehicleNo}>
                  <input className="dv-input" style={s.input} placeholder="KA01AB1234" value={form.vehicleNo}
                    onChange={e => set('vehicleNo', e.target.value.toUpperCase())} />
                </Field>
                <Field label="Vehicle Model *" error={errors.vehicleModel}>
                  <input className="dv-input" style={s.input} placeholder="e.g. Tempo Traveller 2022" value={form.vehicleModel}
                    onChange={e => set('vehicleModel', e.target.value)} />
                </Field>
                <Field label="Seating Capacity *" error={errors.capacity}>
                  <input className="dv-input" style={s.input} type="number" min="1" max="60" placeholder="12" value={form.capacity}
                    onChange={e => set('capacity', e.target.value)} />
                </Field>
              </div>
              <Field label="Operating Route / Area" error={errors.routeArea}>
                <input className="dv-input" style={s.input} placeholder="e.g. Koramangala – DPS Whitefield" value={form.routeArea}
                  onChange={e => set('routeArea', e.target.value)} />
              </Field>
            </div>
          )}

          {/* ── STEP 1: License & Experience ── */}
          {step === 1 && (
            <div style={s.formBody}>
              <h2 style={s.stepTitle}>📋 License & Experience</h2>
              <div style={s.grid2}>
                <Field label="Driving License Number *" error={errors.licenseNo}>
                  <input className="dv-input" style={s.input} placeholder="KA0120230012345" value={form.licenseNo}
                    onChange={e => set('licenseNo', e.target.value.toUpperCase())} />
                </Field>
                <Field label="Issuing State *" error={errors.licenseState}>
                  <select className="dv-select" value={form.licenseState} onChange={e => set('licenseState', e.target.value)} style={s.select}>
                    <option value="">Select state</option>
                    {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </Field>
                <Field label="DL Validity / Expiry Date *" error={errors.licenseExpiry}>
                  <input className="dv-input" style={s.input} type="date" value={form.licenseExpiry}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => set('licenseExpiry', e.target.value)} />
                </Field>
                <Field label="Years of Driving Experience *" error={errors.yearsExp}>
                  <input className="dv-input" style={s.input} type="number" min="0" max="50" placeholder="5" value={form.yearsExp}
                    onChange={e => set('yearsExp', e.target.value)} />
                </Field>
                <Field label="Date of Birth *" error={errors.dob}>
                  <input className="dv-input" style={s.input} type="date" value={form.dob}
                    max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
                    onChange={e => set('dob', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 2: Upload Documents ── */}
          {step === 2 && (
            <div style={s.formBody}>
              <h2 style={s.stepTitle}>📎 Upload Documents</h2>
              <p style={s.stepHint}>Upload clear photos/scans. Accepted: JPG, PNG, PDF (max 5MB each)</p>

              <div style={s.uploadGrid}>
                {/* DL */}
                <UploadBox label="Driving License *" icon="🪪" preview={form.dlPreview}
                  error={errors.dlFile} fileRef={dlRef}
                  onChange={() => handleFile('dlFile', 'dlPreview', dlRef)} />
                {/* RC */}
                <UploadBox label="Vehicle RC Book *" icon="📄" preview={form.rcPreview}
                  error={errors.rcFile} fileRef={rcRef}
                  onChange={() => handleFile('rcFile', 'rcPreview', rcRef)} />
                {/* Profile photo */}
                <UploadBox label="Your Photo (optional)" icon="🤳" preview={form.photoPreview}
                  fileRef={picRef} onChange={() => handleFile('photoFile', 'photoPreview', picRef)} />
              </div>
            </div>
          )}

          {/* ── STEP 3: Review & Submit ── */}
          {step === 3 && (
            <div style={s.formBody}>
              <h2 style={s.stepTitle}>🔍 Review Your Details</h2>
              <div style={s.reviewGrid}>
                <ReviewRow label="Vehicle Type"      value={form.vehicleType} />
                <ReviewRow label="Vehicle No."       value={form.vehicleNo} />
                <ReviewRow label="Vehicle Model"     value={form.vehicleModel} />
                <ReviewRow label="Capacity"          value={`${form.capacity} seats`} />
                <ReviewRow label="Route / Area"      value={form.routeArea || '—'} />
                <ReviewRow label="DL Number"         value={form.licenseNo} />
                <ReviewRow label="DL Issuing State"  value={form.licenseState} />
                <ReviewRow label="DL Expiry"         value={form.licenseExpiry} />
                <ReviewRow label="Experience"        value={`${form.yearsExp} years`} />
                <ReviewRow label="Date of Birth"     value={form.dob} />
                <ReviewRow label="DL Document"       value={form.dlFile?.name || '—'} />
                <ReviewRow label="RC Document"       value={form.rcFile?.name || '—'} />
              </div>
              <div style={s.reviewNote}>
                ℹ️ Your account will be marked as <strong>pending verification</strong>. An admin will review your documents and activate your account within 24–48 hours.
              </div>
              {errors.submit && <div style={s.errBox}>⚠️ {errors.submit}</div>}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={s.navRow}>
            {step > 0 && (
              <button onClick={back} disabled={saving} style={s.backBtn}>← Back</button>
            )}
            {step < 3 ? (
              <button onClick={next} style={{ ...s.nextBtn, marginLeft: step === 0 ? 'auto' : undefined }}>
                Next →
              </button>
            ) : (
              <button className="dv-btn" onClick={submit} disabled={saving}
                style={{ ...s.submitBtn, opacity: saving ? 0.8 : 1 }}>
                {saving
                  ? <><span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', marginRight:8 }} />Saving…</>
                  : '✅ Submit for Verification'
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
      <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#57534E', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</label>
      {children}
      {error && <span style={{ color:'#DC2626', fontSize:'0.72rem', fontWeight:500 }}>{error}</span>}
    </div>
  );
}

function UploadBox({ label, icon, preview, error, fileRef, onChange }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
      <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#57534E', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</label>
      <div className="upload-box" onClick={() => fileRef.current?.click()}
        style={{ border:`2px dashed ${error ? '#DC2626' : '#FDE68A'}`, borderRadius:12, padding:'1.25rem', textAlign:'center', cursor:'pointer', background:'#FFFBF0', transition:'all 0.2s', minHeight:110, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
        {preview
          ? <img src={preview} alt="preview" style={{ maxHeight:80, maxWidth:'100%', borderRadius:8, objectFit:'cover' }} />
          : <>
              <span style={{ fontSize:'2rem' }}>{icon}</span>
              <span style={{ fontSize:'0.78rem', color:'#78716C' }}>Click to upload</span>
              <span style={{ fontSize:'0.68rem', color:'#A8A29E' }}>JPG, PNG or PDF</span>
            </>
        }
      </div>
      <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display:'none' }} onChange={onChange} />
      {error && <span style={{ color:'#DC2626', fontSize:'0.72rem' }}>{error}</span>}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0', borderBottom:'1px solid #FDE68A' }}>
      <span style={{ fontSize:'0.82rem', color:'#78716C', fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:'0.85rem', color:'#1C1917', fontWeight:700 }}>{value}</span>
    </div>
  );
}

/* ── Styles ── */
const s = {
  page:         { minHeight:'100vh', background:'#FFFBF0', fontFamily:"'Plus Jakarta Sans',sans-serif", display:'flex', flexDirection:'column', alignItems:'center', padding:'2rem 1rem' },
  container:    { width:'100%', maxWidth:720, animation:'fadeUp 0.4s ease' },
  header:       { textAlign:'center', marginBottom:'2rem' },
  headerLogo:   { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:'1.4rem', color:'#1C1917', marginBottom:'0.75rem' },
  headerTitle:  { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:'1.75rem', color:'#1C1917', margin:'0 0 0.35rem' },
  headerSub:    { color:'#78716C', fontSize:'0.92rem', margin:0 },
  // Steps
  steps:        { display:'flex', alignItems:'flex-start', justifyContent:'center', gap:0, marginBottom:'2rem', position:'relative' },
  stepItem:     { display:'flex', flexDirection:'column', alignItems:'center', position:'relative', flex:1 },
  stepCircle:   { width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.85rem', marginBottom:'0.4rem', zIndex:1 },
  stepActive:   { background:'#F59E0B', color:'#fff', boxShadow:'0 4px 12px rgba(245,158,11,0.4)' },
  stepDone:     { background:'#059669', color:'#fff' },
  stepFuture:   { background:'#E5E7EB', color:'#9CA3AF' },
  stepLabel:    { fontSize:'0.68rem', fontWeight:600, textAlign:'center', maxWidth:80 },
  stepLine:     { position:'absolute', top:18, left:'50%', width:'100%', height:2, zIndex:0, transition:'background 0.3s' },
  // Form
  formCard:     { background:'#fff', border:'1.5px solid #FDE68A', borderRadius:20, boxShadow:'0 4px 24px rgba(245,158,11,0.08)', overflow:'hidden' },
  formBody:     { padding:'2rem', animation:'fadeUp 0.3s ease' },
  stepTitle:    { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:'1.2rem', color:'#1C1917', margin:'0 0 1.25rem' },
  stepHint:     { color:'#78716C', fontSize:'0.82rem', margin:'-0.75rem 0 1.25rem' },
  grid2:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' },
  input:        { padding:'0.65rem 0.875rem', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:'0.9rem', color:'#1C1917', background:'#fff', width:'100%', boxSizing:'border-box', fontFamily:"'Plus Jakarta Sans',sans-serif", transition:'border-color 0.2s, box-shadow 0.2s' },
  select:       { padding:'0.65rem 0.875rem', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:'0.9rem', color:'#1C1917', background:'#fff', width:'100%', fontFamily:"'Plus Jakarta Sans',sans-serif", transition:'border-color 0.2s' },
  uploadGrid:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' },
  reviewGrid:   { background:'#FFFBF0', border:'1px solid #FDE68A', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem' },
  reviewNote:   { background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:10, padding:'0.75rem 1rem', fontSize:'0.82rem', color:'#92400E', lineHeight:1.6 },
  errBox:       { background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', borderRadius:10, padding:'0.75rem 1rem', fontSize:'0.85rem', marginTop:'1rem' },
  // Nav
  navRow:       { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.25rem 2rem', borderTop:'1px solid #FDE68A', background:'#FFFBF0' },
  backBtn:      { padding:'0.7rem 1.5rem', background:'#fff', border:'1.5px solid #FDE68A', borderRadius:10, fontWeight:700, color:'#92400E', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'0.9rem' },
  nextBtn:      { padding:'0.7rem 1.75rem', background:'#F59E0B', border:'none', borderRadius:10, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'0.9rem', boxShadow:'0 4px 12px rgba(245,158,11,0.35)', marginLeft:'auto' },
  submitBtn:    { padding:'0.8rem 2rem', background:'linear-gradient(135deg,#F59E0B,#D97706)', border:'none', borderRadius:10, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'0.95rem', boxShadow:'0 4px 14px rgba(245,158,11,0.35)', display:'flex', alignItems:'center', gap:'0.5rem', marginLeft:'auto' },
  // Success
  successCard:  { background:'#fff', border:'1.5px solid #FDE68A', borderRadius:20, padding:'3rem 2.5rem', textAlign:'center', maxWidth:420, boxShadow:'0 8px 40px rgba(245,158,11,0.12)' },
  successEmoji: { fontSize:'3.5rem', marginBottom:'1rem' },
  successTitle: { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:'1.5rem', color:'#1C1917', margin:'0 0 0.5rem' },
  successSub:   { color:'#78716C', fontSize:'0.9rem', margin:'0 0 1.5rem', lineHeight:1.6 },
  progressBar:  { height:5, background:'#FDE68A', borderRadius:99, overflow:'hidden' },
  progressFill: { height:'100%', background:'#F59E0B', borderRadius:99, animation:'grow 2.5s linear forwards' },
};
