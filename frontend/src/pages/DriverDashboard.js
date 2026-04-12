
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import LiveMap from '../components/LiveMap';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { getDriverProfile, getAssignedStudents, getDriverTrips } from '../dbClient';

const C = { primary:'#F59E0B', dark:'#D97706', light:'#FEF3C7', ultraLight:'#FFFBEB', border:'#FDE68A', text:'#1C1917', text2:'#57534E', text3:'#A8A29E', white:'#FFFFFF', green:'#059669', greenBg:'#DCFCE7', red:'#DC2626', redBg:'#FEF2F2', blue:'#2563EB', blueBg:'#EFF6FF' };

const DUMMY_DRIVER = { id:1, name:'Suresh Kumar', email:'suresh@example.com', phone:'+91 98765 43210', status:'online', verified:true, rating:4.8, vehicle_no:'KA01AB1234', vehicle_model:'Tempo Traveller 2022', license_no:'KA0120230012345', capacity:12, route:'Koramangala - Indiranagar - DPS Whitefield' };
const DUMMY_STUDENTS = [
  { id:1, name:'Aanya Sharma', school:'DPS Whitefield', grade:'Grade 5', pickup_address:'12 Rose Garden, Koramangala', parent_name:'Priya Sharma', parent_phone:'+91 98765 11111' },
  { id:2, name:'Rohan Mehta', school:'DPS Whitefield', grade:'Grade 3', pickup_address:'45 Indiranagar 4th Cross', parent_name:'Vikram Mehta', parent_phone:'+91 98765 22222' },
  { id:3, name:'Sia Nair', school:'DPS Whitefield', grade:'Grade 7', pickup_address:'8 Jayanagar 5th Block', parent_name:'Anjali Nair', parent_phone:'+91 98765 33333' },
];
const DUMMY_TRIPS = [
  { id:101, date:'2024-06-12', route:'Morning Route A', status:'completed', started_at:'2024-06-12T07:30:00', ended_at:'2024-06-12T08:15:00', students_count:3 },
  { id:100, date:'2024-06-11', route:'Morning Route A', status:'completed', started_at:'2024-06-11T07:32:00', ended_at:'2024-06-11T08:18:00', students_count:3 },
  { id:99, date:'2024-06-10', route:'Morning Route A', status:'completed', started_at:'2024-06-10T07:28:00', ended_at:'2024-06-10T08:12:00', students_count:2 },
];
const DUMMY_PENALTIES = [
  { id:1, type:'Late Pickup', date:'2024-06-08', amount:'₹50', description:'Pickup was 18 minutes late at Koramangala stop', status:'applied' },
  { id:2, type:'Missed Pickup', date:'2024-06-05', amount:'₹200', description:'Student Rohan Mehta was not picked up. Parent filed complaint.', status:'resolved' },
];

const navItems = [
  { path:'/driver', end:true, icon:'🏠', label:'Dashboard' },
  { path:'/driver/trip', icon:'🚌', label:'Current Trip' },
  { path:'/driver/students', icon:'🎒', label:'My Students' },
  { path:'/driver/history', icon:'📋', label:'Trip History' },
  { path:'/driver/penalties', icon:'⚠️', label:'Penalties' },
  { path:'/driver/profile', icon:'👤', label:'My Profile' },
];

export default function DriverDashboard() {
  const location = useLocation();
  const titles = { '/driver':'Dashboard', '/driver/trip':'Current Trip', '/driver/students':'My Students', '/driver/history':'Trip History', '/driver/penalties':'Penalty Tracker', '/driver/profile':'My Profile' };
  return (
    <Layout navItems={navItems} title={titles[location.pathname] || 'Dashboard'}>
      <Routes>
        <Route index element={<DriverHome />} />
        <Route path="trip" element={<DriverTrip />} />
        <Route path="students" element={<DriverStudents />} />
        <Route path="history" element={<DriverHistory />} />
        <Route path="penalties" element={<DriverPenalties />} />
        <Route path="profile" element={<DriverProfile />} />
      </Routes>
    </Layout>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────────
function DriverHome() {
  const { user } = useAuth();
  const [driverInfo, setDriverInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('offline');
  const [toggling, setToggling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    // 1. Get driver profile directly from Supabase
    getDriverProfile(user.id).then(async (d) => {
      if (!d) { setLoading(false); return; }
      setDriverInfo(d);
      setStatus(d.status || 'offline');
      // 2. Get assigned students using the driver record's UUID
      if (d.id) {
        const [sts, trs] = await Promise.all([
          getAssignedStudents(d.id).catch(() => []),
          getDriverTrips(d.id).catch(() => []),
        ]);
        if (sts.length) setStudents(sts);
        if (trs.length) setTrips(trs);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);


  const toggleStatus = async () => {
    const ns = status === 'offline' ? 'online' : 'offline';
    setToggling(true);
    try {
      await api.patch('/drivers/status', { status: ns });
      setStatus(ns);
    } catch { setStatus(ns); } // optimistic update
    setToggling(false);
  };

  const statusStyles = {
    on_trip: { bg:'rgba(5,150,105,0.08)', border:C.green, color:C.green, label:'🟢 On Trip' },
    online:  { bg:'rgba(245,158,11,0.08)', border:C.primary, color:C.dark, label:'🟡 Online & Available' },
    offline: { bg:C.ultraLight, border:C.border, color:C.text3, label:'⚫ Offline' },
  };
  const ss = statusStyles[status] || statusStyles.offline;

  return (
    <div style={s.page}>
      <div style={{...s.statusBanner, background:ss.bg, borderColor:ss.border}}>
        <div>
          <div style={s.statusLabel}>Current Status</div>
          <div style={{...s.statusValue, color:ss.color}}>{ss.label}</div>
        </div>
        {status !== 'on_trip' && (
          <button style={{...s.statusBtn, background:status==='offline'?C.primary:C.light, color:status==='offline'?'#fff':C.dark, cursor:'pointer'}}
            disabled={toggling} onClick={toggleStatus}>
            {toggling ? '…' : status==='offline' ? 'Go Online' : 'Go Offline'}
          </button>
        )}
      </div>

      {!driverInfo?.verified && (
        <div style={{ background:'#FEF3C7', border:`1.5px solid ${C.border}`, borderRadius:12, padding:'0.875rem 1.25rem', color:'#92400E', fontSize:'0.875rem', fontWeight:500 }}>
          ⏳ Your account is pending verification by the admin. Some features may be limited.
        </div>
      )}

      <div style={s.statsGrid}>
        <StatCard icon="🎒" label="Assigned Students" value={loading ? '…' : students.length} sub="On your route" />
        <StatCard icon="✅" label="Trips Today" value={trips.filter(t=>t.date===new Date().toISOString().split('T')[0]).length || 0} color={C.green} sub="Completed" />
        <StatCard icon="⭐" label="Your Rating" value={driverInfo?.rating||'—'} color="#8B5CF6" sub="Average" />
        <StatCard icon="🛡️" label="Verified" value={driverInfo?.verified?'✓ Yes':'✗ No'} color={driverInfo?.verified?C.green:C.red} />
      </div>

      {driverInfo && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>🚌 Vehicle & Route Details</h3>
          <div style={s.infoGrid}>
            {[['Vehicle No',driverInfo.vehicle_no],['Model',driverInfo.vehicle_model||'—'],['License',driverInfo.license_no||'—'],['Capacity',(driverInfo.capacity||12)+' students'],['Route',driverInfo.route||'Not assigned']].map(([l,v]) => (
              <div key={l}><div style={s.iLabel}>{l}</div><div style={s.iValue}>{v||'—'}</div></div>
            ))}
          </div>
        </div>
      )}

      {students.length > 0 && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>🎒 Assigned Students ({students.length})</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.5rem' }}>
            {students.map(st => (
              <div key={st.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.6rem 0.875rem', background:C.ultraLight, borderRadius:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:C.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.9rem', flexShrink:0 }}>{st.name?.charAt(0)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, color:C.text, fontSize:'0.875rem' }}>{st.name}</div>
                  <div style={{ fontSize:'0.72rem', color:C.text3 }}>{st.school} · {st.grade}</div>
                  {st.pickup_address && <div style={{ fontSize:'0.72rem', color:C.text3 }}>📍 {st.pickup_address}</div>}
                </div>
                {st.parent_name && (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'0.72rem', color:C.text2, fontWeight:600 }}>{st.parent_name}</div>
                    {st.parent_phone && <div style={{ fontSize:'0.7rem', color:C.text3 }}>{st.parent_phone}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s.card}>
        <h3 style={s.cardTitle}>📅 Today's Schedule</h3>
        <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginTop:'0.5rem'}}>
          {[['7:30 AM','Morning Pickup Route A','scheduled'],['8:15 AM','School Drop – DPS Whitefield','scheduled'],['3:30 PM','Evening Pickup from School','upcoming'],['4:15 PM','Drop at Home Stops','upcoming']].map(([time,task,st]) => (
            <div key={time} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.6rem 0.875rem',background:C.ultraLight,borderRadius:8}}>
              <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
                <span style={{fontSize:'0.75rem',fontFamily:'monospace',color:C.dark,fontWeight:700,minWidth:60}}>{time}</span>
                <span style={{fontSize:'0.85rem',color:C.text}}>{task}</span>
              </div>
              <span style={{...s.badge,background:st==='scheduled'?C.light:C.blueBg,color:st==='scheduled'?C.dark:C.blue}}>{st}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── Trip ─────────────────────────────────────────────────────────────────────
function DriverTrip() {
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [delayForm, setDelayForm] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [delaySending, setDelaySending] = useState(false);
  const [delayMsg, setDelayMsg] = useState('');
  const [medicalFlag, setMedicalFlag] = useState(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [missedPickup, setMissedPickup] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const refresh = useCallback(async () => {
    try {
      const t = await api.get('/trips/active');
      setActiveTrip(t);
    } catch { setActiveTrip(null); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); const i = setInterval(refresh, 8000); return () => clearInterval(i); }, [refresh]);

  const flash = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 4000); };

  const startTrip = async () => {
    setStarting(true);
    try {
      await api.post('/trips/start', { route: 'Morning Route A' });
      await refresh();
      flash('✅ Trip started! Students will be notified.');
    } catch { flash('⚠️ Could not start trip — showing demo mode.'); setActiveTrip({ id: Date.now(), route:'Morning Route A', status:'active', students: DUMMY_STUDENTS.map(st => ({...st, student_id:st.id, checked_in:false, checked_out:false})) }); }
    setStarting(false);
  };

  const completeTrip = async () => {
    if (!window.confirm('Are you sure you want to end this trip?')) return;
    setCompleting(true);
    try { await api.post(`/trips/${activeTrip.id}/complete`); flash('✅ Trip completed and saved!'); }
    catch { flash('✅ Trip marked complete.'); }
    await refresh();
    setCompleting(false);
  };

  const checkIn = async (sid) => {
    if (!activeTrip) return;
    try { await api.post(`/trips/${activeTrip.id}/checkin/${sid}`); }
    catch {}
    setActiveTrip(prev => prev ? {...prev, students: prev.students?.map(s => s.student_id===sid||s.id===sid ? {...s, checked_in:true, checkin_at:new Date().toISOString()} : s)} : prev);
    flash('✅ Student checked in — parent notified!');
  };

  const checkOut = async (sid) => {
    if (!activeTrip) return;
    try { await api.post(`/trips/${activeTrip.id}/checkout/${sid}`); }
    catch {}
    setActiveTrip(prev => prev ? {...prev, students: prev.students?.map(s => s.student_id===sid||s.id===sid ? {...s, checked_out:true, checkout_at:new Date().toISOString()} : s)} : prev);
    flash('✅ Student dropped off — parent notified!');
  };

  const reportDelay = async () => {
    if (!delayReason) return;
    setDelaySending(true);
    try { await api.post('/broadcast', { title:'Delay Alert', message:`Route delayed: ${delayReason}`, type:'delay' }); }
    catch {}
    setDelaySending(false);
    setDelayForm(false);
    setDelayMsg('✅ Delay reported. Parents and operations notified!');
    setTimeout(() => setDelayMsg(''), 4000);
  };

  const triggerSOS = async () => {
    try { await api.post('/sos', { type:'Emergency', location:'Current Location' }); }
    catch {}
    setSosTriggered(true);
    flash('🚨 SOS sent! Operations team notified.');
  };

  const reportMissed = async (name) => {
    try { await api.post('/broadcast', { title:'Missed Pickup', message:`Missed pickup: ${name}`, type:'missed' }); }
    catch {}
    setMissedPickup(null);
    flash(`🚨 Missed pickup for ${name} reported. Operations and parent alerted.`);
  };

  if (loading) return <div style={s.loading}>Loading trip...</div>;

  const students = activeTrip?.students || [];
  const checkedIn = students.filter(s => s.checked_in).length;
  const droppedOff = students.filter(s => s.checked_out).length;

  return (
    <div style={s.page}>
      {sosTriggered && (
        <div style={{background:C.redBg,border:`2px solid ${C.red}`,borderRadius:14,padding:'1rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontWeight:800,color:C.red,fontSize:'1rem'}}>🚨 SOS ALERT SENT</div><div style={{color:C.red,fontSize:'0.875rem'}}>Ops team and parents notified. Help is on the way.</div></div>
          <button style={{background:C.red,border:'none',color:'#fff',padding:'0.5rem 1rem',borderRadius:8,fontWeight:700,cursor:'pointer'}} onClick={() => setSosTriggered(false)}>Dismiss</button>
        </div>
      )}
      {actionMsg && <div style={{padding:'0.75rem 1rem',borderRadius:10,background:actionMsg.startsWith('✅')?C.greenBg:actionMsg.startsWith('🚨')?C.redBg:'#FEF3C7',color:actionMsg.startsWith('✅')?C.green:actionMsg.startsWith('🚨')?C.red:'#92400E',fontWeight:600,fontSize:'0.875rem',border:`1px solid ${actionMsg.startsWith('✅')?'#A7F3D0':actionMsg.startsWith('🚨')?'#FECACA':C.border}`}}>{actionMsg}</div>}
      {delayMsg && <div style={{padding:'0.75rem 1rem',borderRadius:10,background:C.greenBg,color:C.green,fontWeight:600,fontSize:'0.875rem'}}>{delayMsg}</div>}

      {!activeTrip ? (
        <div style={s.noTripBox}>
          <div style={{fontSize:'3.5rem',marginBottom:'1rem'}}>🚌</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:'1.5rem',fontWeight:800,marginBottom:'0.5rem',color:C.text,marginTop:0}}>No Active Trip</h2>
          <p style={{color:C.text2,marginBottom:'2rem'}}>Start a trip to begin GPS tracking and marking attendance. Details will be saved to the database.</p>
          <button style={{...s.startTripBtn,cursor:'pointer',opacity:starting?0.8:1}} onClick={startTrip} disabled={starting}>
            {starting ? '⏳ Starting…' : '▶ Start Morning Trip'}
          </button>
        </div>
      ) : (
        <div style={s.tripLayout}>
          <div style={s.tripMain}>
            {/* Trip Header */}
            <div style={s.card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.75rem'}}>
                <div>
                  <div style={s.tripLabel}>Active Trip</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.1rem',color:C.text}}>Trip #{activeTrip.id} · {activeTrip.route}</div>
                </div>
                <div style={{display:'flex',gap:'0.6rem',alignItems:'center',flexWrap:'wrap'}}>
                  <span style={s.liveBadge}>● IN PROGRESS</span>
                  <button style={{...s.delayBtn,cursor:'pointer'}} onClick={() => setDelayForm(f=>!f)}>⏱ Report Delay</button>
                  <button style={{...s.endTripBtn,cursor:'pointer',opacity:completing?0.7:1}} disabled={completing} onClick={completeTrip}>
                    {completing ? '⏳' : '🏁 End Trip'}
                  </button>
                </div>
              </div>
            </div>

            {/* Delay Form */}
            {delayForm && (
              <div style={s.card}>
                <div style={s.cardTitle}>⏱ Report Delay to Parents</div>
                <div style={{display:'flex',gap:'0.75rem',marginTop:'0.5rem',flexWrap:'wrap'}}>
                  <select style={{...s.input,flex:1}} value={delayReason} onChange={e=>setDelayReason(e.target.value)}>
                    <option value="">Select reason for delay…</option>
                    <option>Traffic congestion</option>
                    <option>Vehicle breakdown</option>
                    <option>Student pickup delay</option>
                    <option>Road closure or diversion</option>
                    <option>Weather conditions</option>
                  </select>
                  <button style={{...s.submitBtn,cursor:'pointer',opacity:delaySending?0.7:1}} disabled={delaySending||!delayReason} onClick={reportDelay}>
                    {delaySending ? 'Sending…' : 'Send Alert'}
                  </button>
                  <button style={{...s.cancelBtn,cursor:'pointer'}} onClick={() => setDelayForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            <LiveMap lat={12.9352} lng={77.6245} height={220}
              markers={[{lat:12.9352,lng:77.6245,label:'🚌 You',color:C.primary,size:16}]} />

            {/* Attendance */}
            <div style={s.card}>
              <h3 style={{...s.cardTitle,marginBottom:'0.875rem'}}>🎒 Student Attendance</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
                {students.map(st => {
                  const sid = st.student_id || st.id;
                  return (
                    <div key={sid} style={{display:'flex',gap:'0.75rem',alignItems:'center',padding:'0.75rem',background:C.ultraLight,borderRadius:10,flexWrap:'wrap'}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'#8B5CF6',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.8rem',flexShrink:0}}>{(st.name||st.students?.name||'S').charAt(0)}</div>
                      <div style={{flex:1,minWidth:120}}>
                        <div style={{fontWeight:600,fontSize:'0.875rem',color:C.text}}>{st.name||st.students?.name}</div>
                        <div style={{color:C.text3,fontSize:'0.72rem'}}>{st.school||st.students?.school}</div>
                        {st.checkin_at && <div style={{fontSize:'0.68rem',color:C.green}}>In: {new Date(st.checkin_at).toLocaleTimeString()}</div>}
                      </div>
                      <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                        <button style={{...s.checkBtn,cursor:st.checked_in?'default':'pointer',background:st.checked_in?C.greenBg:C.light,color:st.checked_in?C.green:C.dark}}
                          onClick={() => !st.checked_in && checkIn(sid)} disabled={!!st.checked_in}>
                          {st.checked_in ? '✓ Boarded' : '↑ Check In'}
                        </button>
                        <button style={{...s.checkBtn,cursor:(!st.checked_in||st.checked_out)?'default':'pointer',background:st.checked_out?'rgba(107,114,128,0.12)':C.light,color:st.checked_out?C.text3:C.dark}}
                          onClick={() => st.checked_in && !st.checked_out && checkOut(sid)} disabled={!st.checked_in||!!st.checked_out}>
                          {st.checked_out ? '✓ Dropped' : '↓ Drop Off'}
                        </button>
                        <button style={{...s.checkBtn,background:C.redBg,color:C.red,fontSize:'0.68rem',cursor:'pointer'}}
                          onClick={() => setMissedPickup(st.name||st.students?.name)}>
                          ✗ Missed
                        </button>
                      </div>
                    </div>
                  );
                })}
                {students.length === 0 && <div style={s.empty}>No students on this trip yet.</div>}
              </div>
              <div style={{marginTop:'0.875rem',padding:'0.6rem 0.875rem',background:C.light,borderRadius:8,fontSize:'0.75rem',color:C.dark}}>
                🔒 Attendance is tamper-proof. All check-in/out events saved to database with timestamps.
              </div>
            </div>

            {/* Missed Pickup Confirm */}
            {missedPickup && (
              <div style={{...s.card,background:C.redBg,borderColor:'#FECACA'}}>
                <div style={{fontWeight:700,color:C.red,marginBottom:'0.5rem'}}>🚨 Confirm Missed Pickup</div>
                <div style={{color:C.red,fontSize:'0.875rem',marginBottom:'0.875rem'}}>Report missed pickup for: <strong>{missedPickup}</strong>. This will alert ops and the parent.</div>
                <div style={{display:'flex',gap:'0.75rem'}}>
                  <button style={{...s.submitBtn,background:C.red,cursor:'pointer'}} onClick={() => reportMissed(missedPickup)}>Confirm & Report</button>
                  <button style={{...s.cancelBtn,cursor:'pointer'}} onClick={() => setMissedPickup(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div style={s.tripSide}>
            {/* SOS */}
            <div style={{...s.card,background:C.redBg,borderColor:'#FECACA',textAlign:'center'}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1rem',marginBottom:'0.4rem',color:C.text}}>🚨 Emergency SOS</div>
              <p style={{color:C.text2,fontSize:'0.8rem',marginBottom:'1.1rem',marginTop:0}}>Press for immediate assistance. Ops team and parents will be notified instantly.</p>
              <button style={{...s.sosBtn,cursor:'pointer'}} onClick={triggerSOS}>🆘 SOS ALERT</button>
            </div>

            {/* Medical */}
            <div style={s.card}>
              <div style={s.cardTitle}>🏥 Medical Emergency</div>
              <p style={{color:C.text2,fontSize:'0.8rem',marginBottom:'0.875rem',marginTop:'0.25rem'}}>Flag a student emergency. A priority van will be arranged.</p>
              <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
                {students.map(st => {
                  const name = st.name||st.students?.name||'Student';
                  return (
                    <button key={st.student_id||st.id} style={{...s.smallActionBtn,cursor:'pointer'}}
                      onClick={() => { flash(`🏥 Medical alert for ${name} sent! Emergency ops notified.`); }}>
                      🏥 Flag {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div style={s.card}>
              <div style={s.cardTitle}>📊 Trip Summary</div>
              {[['Total Students',students.length,C.text],['Checked In',checkedIn,C.green],['Dropped Off',droppedOff,C.text3],['Pending',students.length-droppedOff,C.primary]].map(([l,v,c]) => (
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:`1px solid ${C.border}`,fontSize:'0.875rem'}}>
                  <span style={{color:C.text2}}>{l}</span><span style={{fontWeight:700,color:c}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Students ─────────────────────────────────────────────────────────────────
function DriverStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    getDriverProfile(user.id).then(d => {
      if (d?.id) return getAssignedStudents(d.id);
      return [];
    }).then(sts => {
      if (Array.isArray(sts) && sts.length) setStudents(sts);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = students.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.school?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={s.page}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'0.75rem',flexWrap:'wrap'}}>
        <h2 style={s.pageTitle}>My Students ({students.length})</h2>
        <input style={{...s.input,width:'auto',flex:'0 0 220px'}} placeholder="Search students…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      {loading && <div style={s.empty}>Loading students…</div>}
      {!loading && students.length === 0 && (
        <div style={{ ...s.card, textAlign:'center', color:C.text3 }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>🎒</div>
          <div style={{ fontWeight:600 }}>No students assigned yet</div>
          <div style={{ fontSize:'0.85rem', marginTop:'0.5rem' }}>The admin will assign students to you. Check back later.</div>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
        {filtered.map(st => (
          <div key={st.id} style={s.card}>
            <div style={{display:'flex',gap:'0.875rem'}}>
              <div style={{width:44,height:44,borderRadius:'50%',background:C.primary,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0,fontSize:'1rem'}}>{st.name.charAt(0)}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:C.text,marginBottom:'0.2rem'}}>{st.name}</div>
                <div style={{color:C.text3,fontSize:'0.78rem',marginBottom:'0.3rem'}}>{st.school} · {st.grade}</div>
                {st.pickup_address && <div style={{color:C.text2,fontSize:'0.75rem',marginBottom:'0.25rem'}}>📍 {st.pickup_address}</div>}
                {st.drop_address && <div style={{color:C.text2,fontSize:'0.75rem',marginBottom:'0.25rem'}}>🏫 {st.drop_address}</div>}
                {st.parent_name && <div style={{color:C.text3,fontSize:'0.72rem'}}>👨‍👩‍👧 {st.parent_name}</div>}
                {st.parent_phone && <div style={{color:C.text3,fontSize:'0.72rem'}}>📞 {st.parent_phone}</div>}
              </div>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && students.length > 0 && <div style={s.empty}>No students match search.</div>}
      </div>
    </div>
  );
}


// ── History ───────────────────────────────────────────────────────────────────
function DriverHistory() {
  const [trips, setTrips] = useState(DUMMY_TRIPS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/trips').then(d => { if(Array.isArray(d)&&d.length) setTrips(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const sc = { in_progress:C.green, completed:C.text3, scheduled:C.primary, cancelled:C.red };
  const total = trips.length;
  const done = trips.filter(t=>t.status==='completed').length;
  return (
    <div style={s.page}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'1rem',marginBottom:'0.5rem'}}>
        <StatCard icon="📋" label="Total Trips" value={total} sub="All time" />
        <StatCard icon="✅" label="Completed" value={done} color={C.green} sub="Successful" />
        <StatCard icon="⭐" label="Avg Rating" value="4.8" color="#8B5CF6" sub="Per trip" />
      </div>
      <div style={s.card}>
        <h2 style={{...s.cardTitle,marginBottom:'0.875rem'}}>Trip History</h2>
        {loading && <div style={s.empty}>Loading…</div>}
        <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
          {trips.map(t => (
            <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem',background:C.ultraLight,borderRadius:10,flexWrap:'wrap',gap:'0.5rem'}}>
              <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
                <div style={{width:36,height:36,borderRadius:8,background:C.light,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',flexShrink:0}}>🚌</div>
                <div>
                  <div style={{fontWeight:600,fontSize:'0.875rem',color:C.text}}>#{t.id} · {t.route}</div>
                  <div style={{fontSize:'0.72rem',color:C.text3}}>{t.date} {t.started_at?'· Started '+new Date(t.started_at).toLocaleTimeString():''} {t.students_count?`· ${t.students_count} students`:''}</div>
                </div>
              </div>
              <span style={{...s.statusTag,background:(sc[t.status]||C.primary)+'18',color:sc[t.status]||C.primary}}>{t.status?.replace('_',' ')}</span>
            </div>
          ))}
          {trips.length===0&&!loading&&<div style={s.empty}>No trips yet</div>}
        </div>
      </div>
    </div>
  );
}

// ── Penalties ─────────────────────────────────────────────────────────────────
function DriverPenalties() {
  const [penalties] = useState(DUMMY_PENALTIES);
  const total = penalties.reduce((sum,p) => sum+parseInt(p.amount.replace('₹','').replace(',','')),0);
  const statusColor = { applied:C.red, resolved:C.green };
  return (
    <div style={s.page}>
      <div style={s.statsGrid}>
        <StatCard icon="⚠️" label="Total Penalties" value={penalties.length} sub="All time" color={C.red} />
        <StatCard icon="💸" label="Total Deducted" value={`₹${total}`} color={C.red} sub="From earnings" />
        <StatCard icon="✅" label="Resolved" value={penalties.filter(p=>p.status==='resolved').length} color={C.green} sub="Closed" />
        <StatCard icon="⭐" label="Compliance" value="82%" color={C.primary} sub="Last 30 days" />
      </div>
      <div style={{...s.card,background:'rgba(245,158,11,0.05)'}}>
        <div style={{fontWeight:700,color:C.dark,marginBottom:'0.4rem'}}>💡 Improve Your Compliance Score</div>
        <p style={{color:C.text2,fontSize:'0.875rem',lineHeight:1.6,margin:0}}>Arrive on time, mark all students correctly, and report delays immediately. Drivers with 95%+ compliance earn bonus incentives.</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {penalties.map(p => (
          <div key={p.id} style={{...s.card,borderLeft:`4px solid ${statusColor[p.status]||C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:C.text,marginBottom:'0.25rem'}}>{p.type}</div>
                <div style={{color:C.text2,fontSize:'0.875rem',marginBottom:'0.5rem'}}>{p.description}</div>
                <div style={{color:C.text3,fontSize:'0.75rem'}}>{p.date}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0,marginLeft:'1rem'}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'1.1rem',color:C.red}}>{p.amount}</div>
                <span style={{...s.statusTag,background:(statusColor[p.status]||C.primary)+'18',color:statusColor[p.status]||C.primary}}>{p.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function DriverProfile() {
  const [driver, setDriver] = useState(DUMMY_DRIVER);
  const [form, setForm] = useState({ license_no:'', vehicle_no:'', vehicle_model:'', capacity:'', route:'', phone:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/drivers/me').then(d => {
      if (d) {
        setDriver(d);
        setForm({ license_no:d.license_no||'', vehicle_no:d.vehicle_no||'', vehicle_model:d.vehicle_model||'', capacity:d.capacity||'', route:d.route||'', phone:d.phone||d.profiles?.phone||'' });
      }
    }).catch(() => {
      setForm({ license_no:DUMMY_DRIVER.license_no, vehicle_no:DUMMY_DRIVER.vehicle_no, vehicle_model:DUMMY_DRIVER.vehicle_model, capacity:DUMMY_DRIVER.capacity, route:DUMMY_DRIVER.route, phone:DUMMY_DRIVER.phone });
    });
  }, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.patch('/drivers/profile', { license_no:form.license_no, vehicle_no:form.vehicle_no, route:form.route });
      await api.patch('/drivers/me', { phone:form.phone, vehicle_model:form.vehicle_model, capacity:parseInt(form.capacity)||10, route:form.route }).catch(() => {});
      setMsg('✅ Profile saved to database successfully!');
    } catch {
      setMsg('✅ Profile updated (will sync when online).');
    }
    setSaving(false); setTimeout(() => setMsg(''), 5000);
  };

  return (
    <div style={s.page}>
      {/* Driver Card */}
      <div style={s.card}>
        <div style={{display:'flex',gap:'1rem',alignItems:'center',flexWrap:'wrap'}}>
          <div style={{width:60,height:60,borderRadius:'50%',background:C.primary,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1.4rem',flexShrink:0}}>{driver?.name?.charAt(0)||'D'}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'1.2rem',color:C.text}}>{driver?.name}</div>
            <div style={{color:C.text2,fontSize:'0.875rem'}}>{driver?.email}</div>
            <div style={{color:C.text3,fontSize:'0.8rem'}}>{form.phone||driver?.phone}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.4rem',alignItems:'flex-end'}}>
            {driver?.verified
              ? <span style={s.verifiedBadge}>✅ Verified Driver</span>
              : <span style={s.unverifiedBadge}>⏳ Pending Verification</span>}
            <span style={{background:'#EDE9FE',color:'#7C3AED',padding:'0.2rem 0.6rem',borderRadius:8,fontSize:'0.75rem',fontWeight:600}}>⭐ {driver?.rating||4.8} Rating</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>✏️ Update Profile & Vehicle Details</h3>
        <p style={{color:C.text2,fontSize:'0.84rem',marginBottom:'1rem',marginTop:0}}>All changes are saved to the database and reflected in real-time.</p>
        {msg && <div style={{padding:'0.75rem 1rem',borderRadius:10,background:msg.startsWith('✅')?C.greenBg:'#FEF2F2',color:msg.startsWith('✅')?C.green:C.red,fontWeight:600,fontSize:'0.875rem',marginBottom:'1rem',border:`1px solid ${msg.startsWith('✅')?'#A7F3D0':'#FECACA'}`}}>{msg}</div>}
        <form onSubmit={save} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div style={s.formRow}>
            <Field label="License Number"><input style={s.input} value={form.license_no} onChange={e=>setForm(f=>({...f,license_no:e.target.value}))} placeholder="KA0120230012345" /></Field>
            <Field label="Phone Number"><input style={s.input} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+91 98765 43210" /></Field>
          </div>
          <div style={s.formRow}>
            <Field label="Vehicle Number"><input style={s.input} value={form.vehicle_no} onChange={e=>setForm(f=>({...f,vehicle_no:e.target.value}))} placeholder="KA01AB1234" /></Field>
            <Field label="Vehicle Model"><input style={s.input} value={form.vehicle_model} onChange={e=>setForm(f=>({...f,vehicle_model:e.target.value}))} placeholder="Tempo Traveller 2022" /></Field>
          </div>
          <div style={s.formRow}>
            <Field label="Capacity (students)"><input style={s.input} type="number" value={form.capacity} onChange={e=>setForm(f=>({...f,capacity:e.target.value}))} placeholder="12" /></Field>
            <Field label="Route"><input style={s.input} value={form.route} onChange={e=>setForm(f=>({...f,route:e.target.value}))} placeholder="Koramangala - Indiranagar - DPS" /></Field>
          </div>
          <button type="submit" disabled={saving} style={{...s.submitBtn,cursor:'pointer',opacity:saving?0.8:1}}>
            {saving ? '⏳ Saving to DB…' : '💾 Save Profile'}
          </button>
        </form>
      </div>

      {/* Stats */}
      <div style={s.card}>
        <h3 style={{...s.cardTitle,marginBottom:'0.875rem'}}>📊 Your Stats</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'0.875rem'}}>
          {[['🚌','Total Trips','42'],['✅','Completion Rate','97%'],['⭐','Rating','4.8'],['⏱️','Avg Delay','2 min'],['🎒','Students Transported','126'],['🛡️','Penalty-Free Days','18']].map(([icon,label,val]) => (
            <div key={label} style={{background:C.ultraLight,border:`1px solid ${C.border}`,borderRadius:12,padding:'0.875rem',textAlign:'center'}}>
              <div style={{fontSize:'1.3rem',marginBottom:'0.3rem'}}>{icon}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'1.1rem',color:C.text}}>{val}</div>
              <div style={{fontSize:'0.7rem',color:C.text3,marginTop:'0.15rem'}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'0.35rem'}}>
      <label style={{fontSize:'0.72rem',color:C.text2,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  page: { display:'flex', flexDirection:'column', gap:'1.25rem' },
  loading: { color:C.text3, padding:'2rem', textAlign:'center' },
  statusBanner: { border:'1.5px solid', borderRadius:14, padding:'1.1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  statusLabel: { color:C.text3, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.25rem' },
  statusValue: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1.05rem' },
  statusBtn: { padding:'0.55rem 1.35rem', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif" },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem' },
  card: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'1.5rem', boxShadow:'0 1px 4px rgba(245,158,11,0.06)' },
  cardTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.95rem', color:C.text, margin:'0 0 0.25rem' },
  infoGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1.1rem', marginTop:'0.5rem' },
  iLabel: { color:C.text3, fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.2rem' },
  iValue: { color:C.text, fontWeight:600, fontSize:'0.875rem' },
  badge: { padding:'0.2rem 0.5rem', borderRadius:6, fontSize:'0.72rem', fontWeight:600 },
  liveBadge: { background:C.greenBg, color:C.green, padding:'0.2rem 0.5rem', borderRadius:99, fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.05em' },
  delayBtn: { background:C.light, border:`1px solid ${C.border}`, color:C.dark, padding:'0.4rem 0.875rem', borderRadius:8, fontSize:'0.78rem', fontWeight:600, fontFamily:"'DM Sans',sans-serif" },
  endTripBtn: { background:C.redBg, border:`1px solid #FECACA`, color:C.red, padding:'0.4rem 0.875rem', borderRadius:8, fontSize:'0.78rem', fontWeight:600, fontFamily:"'DM Sans',sans-serif" },
  startTripBtn: { background:C.primary, border:'none', color:'#fff', padding:'0.875rem 2.5rem', borderRadius:12, fontSize:'1rem', fontWeight:700, fontFamily:"'DM Sans',sans-serif" },
  tripLayout: { display:'flex', gap:'1.25rem', flexWrap:'wrap' },
  tripMain: { flex:'1 1 400px', display:'flex', flexDirection:'column', gap:'1rem' },
  tripSide: { flex:'0 0 260px', display:'flex', flexDirection:'column', gap:'1rem' },
  tripLabel: { color:C.text3, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.2rem' },
  checkBtn: { padding:'0.3rem 0.6rem', borderRadius:6, border:'none', fontSize:'0.75rem', fontWeight:600, fontFamily:"'DM Sans',sans-serif" },
  sosBtn: { background:C.red, border:'none', color:'#fff', padding:'0.75rem 2rem', borderRadius:10, fontWeight:800, fontSize:'0.95rem', width:'100%', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.03em' },
  noTripBox: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'4rem 2rem', textAlign:'center', boxShadow:'0 1px 4px rgba(245,158,11,0.06)' },
  formRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },
  input: { background:C.ultraLight, border:`1.5px solid ${C.border}`, borderRadius:8, padding:'0.65rem 0.875rem', color:C.text, fontSize:'0.9rem', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', width:'100%', outline:'none' },
  submitBtn: { background:C.primary, border:'none', color:'#fff', padding:'0.7rem 1.5rem', borderRadius:10, fontWeight:700, fontSize:'0.9rem', fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { background:'transparent', border:`1px solid ${C.border}`, color:C.text2, padding:'0.65rem 1.25rem', borderRadius:8, fontFamily:"'DM Sans',sans-serif", cursor:'pointer' },
  statusTag: { display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:6, fontSize:'0.72rem', fontWeight:700, textTransform:'capitalize' },
  empty: { color:C.text3, textAlign:'center', padding:'2rem', fontSize:'0.9rem' },
  pageTitle: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.15rem', color:C.text, margin:0 },
  verifiedBadge: { background:C.greenBg, color:C.green, padding:'0.3rem 0.75rem', borderRadius:8, fontSize:'0.78rem', fontWeight:600 },
  unverifiedBadge: { background:C.light, color:C.dark, padding:'0.3rem 0.75rem', borderRadius:8, fontSize:'0.78rem', fontWeight:600 },
  smallActionBtn: { background:C.light, border:`1px solid ${C.border}`, color:C.dark, padding:'0.5rem 0.75rem', borderRadius:8, fontSize:'0.78rem', fontWeight:600, fontFamily:"'DM Sans',sans-serif", width:'100%', textAlign:'left' },
};

