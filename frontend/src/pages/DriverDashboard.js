import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import LiveMap from '../components/LiveMap';
import api from '../api';

const C = { primary:'#F59E0B', dark:'#D97706', light:'#FEF3C7', ultraLight:'#FFFBEB', border:'#FDE68A', text:'#1C1917', text2:'#57534E', text3:'#A8A29E', white:'#FFFFFF', green:'#059669', greenBg:'#DCFCE7', red:'#DC2626', redBg:'#FEF2F2', blue:'#2563EB', blueBg:'#EFF6FF' };

const DUMMY_DRIVER = { id:1, name:'Suresh Kumar', email:'suresh@example.com', phone:'+91 98765 43210', status:'online', verified:true, rating:4.8, vehicle_no:'KA01AB1234', vehicle_model:'Tempo Traveller 2022', license_no:'KA0120230012345', capacity:12, route:'Koramangala - Indiranagar - DPS Whitefield' };
const DUMMY_STUDENTS = [
  { id:1, name:'Aanya Sharma', school:'DPS Whitefield', grade:'Grade 5', pickup_address:'12 Rose Garden, Koramangala', parent_name:'Priya Sharma', parent_phone:'+91 98765 11111' },
  { id:2, name:'Rohan Mehta', school:'DPS Whitefield', grade:'Grade 3', pickup_address:'45 Indiranagar 4th Cross', parent_name:'Vikram Mehta', parent_phone:'+91 98765 22222' },
  { id:3, name:'Sia Nair', school:'DPS Whitefield', grade:'Grade 7', pickup_address:'8 Jayanagar 5th Block', parent_name:'Anjali Nair', parent_phone:'+91 98765 33333' },
];
const DUMMY_TRIPS = [
  { id:101, date:'2024-06-12', route:'Morning Route A', status:'completed', started_at:'2024-06-12T07:30:00' },
  { id:100, date:'2024-06-11', route:'Morning Route A', status:'completed', started_at:'2024-06-11T07:32:00' },
  { id:99,  date:'2024-06-10', route:'Morning Route A', status:'completed', started_at:'2024-06-10T07:28:00' },
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
  { path:'/driver/profile', icon:'👤', label:'Profile' },
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
  const [driverInfo, setDriverInfo] = useState(DUMMY_DRIVER);
  const [students, setStudents] = useState(DUMMY_STUDENTS);
  const [trips, setTrips] = useState(DUMMY_TRIPS);
  const [status, setStatus] = useState('online');

  useEffect(() => {
    api.get('/drivers/me').then(d => { setDriverInfo(d); setStatus(d?.status || 'offline'); }).catch(() => {});
    api.get('/students').then(setStudents).catch(() => {});
    api.get('/trips').then(setTrips).catch(() => {});
  }, []);

  const toggleStatus = async () => {
    const ns = status === 'offline' ? 'online' : 'offline';
    await api.patch('/drivers/status', { status: ns }).catch(()=>{});
    setStatus(ns);
  };

  const statusStyles = {
    on_trip:  { bg:'rgba(5,150,105,0.08)', border:C.green, color:C.green, label:'🟢 On Trip' },
    online:   { bg:'rgba(245,158,11,0.08)', border:C.primary, color:C.dark, label:'🟡 Online & Available' },
    offline:  { bg:C.ultraLight, border:C.border, color:C.text3, label:'⚫ Offline' },
  };
  const ss = statusStyles[status] || statusStyles.offline;

  return (
    <div style={s.page}>
      <div style={{ ...s.statusBanner, background:ss.bg, borderColor:ss.border }}>
        <div>
          <div style={s.statusLabel}>Current Status</div>
          <div style={{ ...s.statusValue, color:ss.color }}>{ss.label}</div>
        </div>
        {status !== 'on_trip' && (
          <button style={{ ...s.statusBtn, background: status === 'offline' ? C.primary : C.light, color: status === 'offline' ? '#fff' : C.dark }}
            onClick={toggleStatus}>
            {status === 'offline' ? 'Go Online' : 'Go Offline'}
          </button>
        )}
      </div>

      <div style={s.statsGrid}>
        <StatCard icon="🎒" label="Assigned Students" value={students.length} sub="On your route" />
        <StatCard icon="✅" label="Trips Today" value={1} color={C.green} sub="Completed" />
        <StatCard icon="⭐" label="Your Rating" value={driverInfo?.rating || '—'} color="#8B5CF6" sub="Average" />
        <StatCard icon="🛡️" label="Verified" value={driverInfo?.verified ? '✓ Yes' : '✗ No'} color={driverInfo?.verified ? C.green : C.red} />
      </div>

      {driverInfo && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>🚌 Vehicle & Route Details</h3>
          <div style={s.infoGrid}>
            {[['Vehicle No', driverInfo.vehicle_no],['Model', driverInfo.vehicle_model],['License', driverInfo.license_no],['Capacity', driverInfo.capacity + ' students'],['Route', driverInfo.route]].map(([l,v]) => (
              <div key={l}>
                <div style={s.iLabel}>{l}</div>
                <div style={s.iValue}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s.card}>
        <h3 style={s.cardTitle}>📅 Today's Schedule</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.5rem' }}>
          {[['7:30 AM','Morning Pickup Route A','pending'],['8:15 AM','School Drop – DPS Whitefield','pending'],['3:30 PM','Evening Pickup from School','upcoming'],['4:15 PM','Drop at Home Stops','upcoming']].map(([time, task, st]) => (
            <div key={time} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0.875rem', background:C.ultraLight, borderRadius:8 }}>
              <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
                <span style={{ fontSize:'0.75rem', fontFamily:'monospace', color:C.dark, fontWeight:700, minWidth:60 }}>{time}</span>
                <span style={{ fontSize:'0.85rem', color:C.text }}>{task}</span>
              </div>
              <span style={{ ...s.badge, background: st === 'pending' ? C.light : C.blueBg, color: st === 'pending' ? C.dark : C.blue }}>{st}</span>
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
  const [delayForm, setDelayForm] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [medicalFlag, setMedicalFlag] = useState(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [missedPickup, setMissedPickup] = useState(null);

  const refresh = useCallback(async () => {
    const t = await api.get('/trips/active').catch(() => null);
    setActiveTrip(t); setLoading(false);
  }, []);
  useEffect(() => { refresh(); const i = setInterval(refresh, 8000); return () => clearInterval(i); }, [refresh]);

  const startTrip = async () => {
    setStarting(true);
    await api.post('/trips/start', { route: 'Morning Route A' }).catch(() => {});
    await refresh(); setStarting(false);
  };
  const completeTrip = async () => {
    if (!activeTrip) return;
    await api.post(`/trips/${activeTrip.id}/complete`).catch(() => {});
    await refresh();
  };
  const checkIn = async (sid) => {
    if (!activeTrip) return;
    await api.post(`/trips/${activeTrip.id}/checkin/${sid}`).catch(() => {});
    await refresh();
  };
  const checkOut = async (sid) => {
    if (!activeTrip) return;
    await api.post(`/trips/${activeTrip.id}/checkout/${sid}`).catch(() => {});
    await refresh();
  };

  if (loading) return <div style={s.loading}>Loading trip...</div>;

  return (
    <div style={s.page}>
      {sosTriggered && (
        <div style={{ background:C.redBg, border:`2px solid ${C.red}`, borderRadius:14, padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:800, color:C.red, fontSize:'1rem' }}>🚨 SOS ALERT SENT</div>
            <div style={{ color:C.red, fontSize:'0.875rem' }}>Operations team and parents have been notified. Help is on the way.</div>
          </div>
          <button style={{ background:C.red, border:'none', color:'#fff', padding:'0.5rem 1rem', borderRadius:8, fontWeight:700 }} onClick={() => setSosTriggered(false)}>Dismiss</button>
        </div>
      )}

      {!activeTrip ? (
        <div style={s.noTripBox}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🚌</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.5rem', fontWeight:800, marginBottom:'0.5rem', color:C.text }}>No Active Trip</h2>
          <p style={{ color:C.text2, marginBottom:'2rem' }}>Start a trip to begin tracking and marking attendance.</p>
          <button style={s.startTripBtn} onClick={startTrip} disabled={starting}>{starting ? 'Starting...' : '▶ Start Morning Trip'}</button>
        </div>
      ) : (
        <div style={s.tripLayout}>
          <div style={s.tripMain}>
            <div style={s.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
                <div>
                  <div style={s.tripLabel}>Active Trip</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1.1rem', color:C.text }}>Trip #{activeTrip.id} · {activeTrip.route}</div>
                </div>
                <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
                  <span style={s.liveBadge}>● IN PROGRESS</span>
                  <button style={s.delayBtn} onClick={() => setDelayForm(f=>!f)}>⏱ Report Delay</button>
                  <button style={s.endTripBtn} onClick={completeTrip}>End Trip</button>
                </div>
              </div>
            </div>

            {delayForm && (
              <div style={s.card}>
                <div style={s.cardTitle}>⏱ Report Delay (PB-31)</div>
                <div style={s.formRow}>
                  <select style={s.input} value={delayReason} onChange={e=>setDelayReason(e.target.value)}>
                    <option value="">Select reason</option>
                    <option>Traffic congestion</option>
                    <option>Vehicle breakdown</option>
                    <option>Student pickup delay</option>
                    <option>Road closure</option>
                    <option>Weather conditions</option>
                  </select>
                  <button style={s.submitBtn} onClick={() => { alert('Delay reported. Parents and operations notified!'); setDelayForm(false); }}>Send Alert</button>
                </div>
              </div>
            )}

            <LiveMap lat={12.9352} lng={77.6245} height={220}
              markers={[{ lat:12.9352, lng:77.6245, label:'🚌 You', color:C.primary, size:16 }]} />

            <div style={s.card}>
              <h3 style={s.cardTitle}>🎒 Student Attendance</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', marginTop:'0.5rem' }}>
                {activeTrip.students?.map(st => (
                  <div key={st.student_id} style={{ display:'flex', gap:'0.75rem', alignItems:'center', padding:'0.75rem', background:C.ultraLight, borderRadius:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'#8B5CF6', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.8rem', flexShrink:0 }}>{st.name?.charAt(0)}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:'0.875rem', color:C.text }}>{st.name}</div>
                      <div style={{ color:C.text3, fontSize:'0.72rem' }}>{st.school} · {st.grade}</div>
                    </div>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <button style={{ ...s.checkBtn, ...(st.checked_in ? { background:C.greenBg, color:C.green } : { background:C.light, color:C.dark }) }}
                        onClick={() => !st.checked_in && checkIn(st.student_id)} disabled={!!st.checked_in}>
                        {st.checked_in ? '✓ In' : 'Check In'}
                      </button>
                      <button style={{ ...s.checkBtn, ...(st.checked_out ? { background:'rgba(107,114,128,0.15)', color:C.text3 } : { background:C.light, color:C.dark }) }}
                        onClick={() => st.checked_in && !st.checked_out && checkOut(st.student_id)} disabled={!st.checked_in || !!st.checked_out}>
                        {st.checked_out ? '✓ Out' : 'Drop Off'}
                      </button>
                      <button style={{ ...s.checkBtn, background:C.redBg, color:C.red, fontSize:'0.68rem' }}
                        onClick={() => setMissedPickup(st.name)}>
                        Missed
                      </button>
                    </div>
                  </div>
                ))}
                {(!activeTrip.students || activeTrip.students.length === 0) && (
                  <div style={s.empty}>No students assigned yet.</div>
                )}
              </div>
              <div style={{ marginTop:'0.75rem', padding:'0.6rem', background:C.light, borderRadius:8, fontSize:'0.75rem', color:C.dark }}>
                🔒 Attendance is locked after check-in/out. Records cannot be modified.
              </div>
            </div>

            {missedPickup && (
              <div style={{ ...s.card, background:C.redBg, borderColor:'#FECACA' }}>
                <div style={{ fontWeight:700, color:C.red, marginBottom:'0.5rem' }}>🚨 Missed Pickup Alert (PB-32)</div>
                <div style={{ color:C.red, fontSize:'0.875rem', marginBottom:'0.75rem' }}>Reporting missed pickup for: {missedPickup}</div>
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button style={{ ...s.submitBtn, background:C.red }} onClick={() => { alert('Missed pickup reported. Operations and parent notified. Penalty workflow triggered.'); setMissedPickup(null); }}>Confirm & Alert Ops</button>
                  <button style={s.cancelBtn} onClick={() => setMissedPickup(null)}>Cancel</button>
                </div>
              </div>
            )}

            {medicalFlag && (
              <div style={{ ...s.card, background:'rgba(37,99,235,0.06)', borderColor:'#BFDBFE' }}>
                <div style={{ fontWeight:700, color:C.blue, marginBottom:'0.5rem' }}>🏥 Medical Emergency Flagged (PB-35)</div>
                <div style={{ color:C.blue, fontSize:'0.875rem', marginBottom:'0.75rem' }}>Student: {medicalFlag} · Emergency workflow initiated. Separate van being arranged.</div>
                <button style={{ ...s.submitBtn, background:C.blue }} onClick={() => { alert('Medical alert sent. Parents and emergency ops notified. Priority van assigned.'); setMedicalFlag(null); }}>Confirm Sent</button>
              </div>
            )}
          </div>

          <div style={s.tripSide}>
            <div style={{ ...s.card, background:C.redBg, borderColor:'#FECACA', textAlign:'center' }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', marginBottom:'0.4rem', color:C.text }}>🚨 Emergency</div>
              <p style={{ color:C.text2, fontSize:'0.8rem', marginBottom:'1.25rem' }}>Press if you need immediate assistance</p>
              <button style={s.sosBtn} onClick={() => setSosTriggered(true)}>SOS ALERT</button>
            </div>

            <div style={s.card}>
              <div style={s.cardTitle}>🏥 Medical Emergency (PB-35)</div>
              <p style={{ color:C.text2, fontSize:'0.8rem', marginBottom:'1rem' }}>Flag a student medical emergency</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {activeTrip.students?.map(st => (
                  <button key={st.student_id} style={{ background:C.light, border:`1px solid ${C.border}`, color:C.dark, padding:'0.5rem', borderRadius:8, fontSize:'0.78rem', fontWeight:600 }}
                    onClick={() => setMedicalFlag(st.name)}>
                    🏥 Flag {st.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardTitle}>Trip Summary</div>
              {[['Total Students', activeTrip.students?.length || 0, C.text],['Checked In', activeTrip.students?.filter(s=>s.checked_in).length || 0, C.green],['Dropped Off', activeTrip.students?.filter(s=>s.checked_out).length || 0, C.text3]].map(([l,v,c]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:`1px solid ${C.border}`, fontSize:'0.875rem' }}>
                  <span style={{ color:C.text2 }}>{l}</span><span style={{ fontWeight:700, color:c }}>{v}</span>
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
  const [students, setStudents] = useState(DUMMY_STUDENTS);
  useEffect(() => { api.get('/students').then(setStudents).catch(() => {}); }, []);
  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>My Students ({students.length})</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1rem' }}>
        {students.map(st => (
          <div key={st.id} style={s.card}>
            <div style={{ display:'flex', gap:'0.875rem' }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:C.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0 }}>{st.name.charAt(0)}</div>
              <div>
                <div style={{ fontWeight:700, color:C.text, marginBottom:'0.2rem' }}>{st.name}</div>
                <div style={{ color:C.text3, fontSize:'0.78rem', marginBottom:'0.3rem' }}>{st.school} · {st.grade}</div>
                <div style={{ color:C.text2, fontSize:'0.75rem', marginBottom:'0.25rem' }}>📍 {st.pickup_address}</div>
                {st.parent_name && <div style={{ color:C.text3, fontSize:'0.75rem' }}>👨‍👩‍👧 {st.parent_name} · {st.parent_phone}</div>}
              </div>
            </div>
          </div>
        ))}
        {students.length === 0 && <div style={s.empty}>No students assigned yet.</div>}
      </div>
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────
function DriverHistory() {
  const [trips, setTrips] = useState(DUMMY_TRIPS);
  useEffect(() => { api.get('/trips').then(setTrips).catch(() => {}); }, []);
  const sc = { in_progress:C.green, completed:C.text3, scheduled:C.primary, cancelled:C.red };
  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>Trip History</h2>
      <div style={s.table}>
        <div style={{ ...s.tableHead, gridTemplateColumns:'1fr 2fr 1fr 1fr' }}><span>Date</span><span>Route</span><span>Status</span><span>Started</span></div>
        {trips.map(t => (
          <div key={t.id} style={{ ...s.tableRow, gridTemplateColumns:'1fr 2fr 1fr 1fr' }}>
            <span style={s.mono}>{t.date}</span>
            <span style={{ fontSize:'0.875rem' }}>{t.route || '—'}</span>
            <span style={{ ...s.statusTag, background:(sc[t.status]||C.primary)+'18', color:sc[t.status]||C.primary }}>{t.status?.replace('_',' ')}</span>
            <span style={s.mono}>{t.started_at ? new Date(t.started_at).toLocaleTimeString() : '—'}</span>
          </div>
        ))}
        {trips.length === 0 && <div style={s.empty}>No trips yet</div>}
      </div>
    </div>
  );
}

// ── Penalties (PB-41) ─────────────────────────────────────────────────────────
function DriverPenalties() {
  const [penalties] = useState(DUMMY_PENALTIES);
  const total = penalties.reduce((sum, p) => sum + parseInt(p.amount.replace('₹', '').replace(',', '')), 0);
  const statusColor = { applied:C.red, resolved:C.green };

  return (
    <div style={s.page}>
      <div style={s.statsGrid}>
        <StatCard icon="⚠️" label="Total Penalties" value={penalties.length} sub="All time" color={C.red} />
        <StatCard icon="💸" label="Total Deducted" value={`₹${total}`} color={C.red} sub="From earnings" />
        <StatCard icon="✅" label="Resolved" value={penalties.filter(p=>p.status==='resolved').length} color={C.green} sub="Closed cases" />
        <StatCard icon="⭐" label="Compliance Score" value="82%" color={C.primary} sub="Last 30 days" />
      </div>

      <div style={s.card}>
        <div style={{ ...s.card, background:'rgba(245,158,11,0.05)', marginBottom:0 }}>
          <div style={{ fontWeight:700, color:C.dark, marginBottom:'0.4rem' }}>💡 Improve Your Compliance Score</div>
          <p style={{ color:C.text2, fontSize:'0.875rem', lineHeight:1.6 }}>Arrive at pickup points on time, mark all students correctly, and report delays immediately to avoid penalties. Drivers with 95%+ compliance get a bonus incentive.</p>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {penalties.map(p => (
          <div key={p.id} style={{ ...s.card, borderLeft:`4px solid ${statusColor[p.status] || C.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontWeight:700, color:C.text, marginBottom:'0.25rem' }}>{p.type}</div>
                <div style={{ color:C.text2, fontSize:'0.875rem', marginBottom:'0.5rem' }}>{p.description}</div>
                <div style={{ color:C.text3, fontSize:'0.75rem' }}>{p.date}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.1rem', color:C.red }}>{p.amount}</div>
                <span style={{ ...s.statusTag, background: (statusColor[p.status]||C.primary)+'18', color: statusColor[p.status]||C.primary }}>{p.status}</span>
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
  const [form, setForm] = useState({ license_no: DUMMY_DRIVER.license_no, vehicle_no: DUMMY_DRIVER.vehicle_no, vehicle_model: DUMMY_DRIVER.vehicle_model, capacity: DUMMY_DRIVER.capacity, route: DUMMY_DRIVER.route });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/drivers/me').then(d => { setDriver(d); setForm({ license_no:d.license_no||'', vehicle_no:d.vehicle_no||'', vehicle_model:d.vehicle_model||'', capacity:d.capacity||10, route:d.route||'' }); }).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    await api.patch('/drivers/profile', form).catch(() => {});
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:C.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.25rem', flexShrink:0 }}>{driver?.name?.charAt(0)}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.2rem', color:C.text }}>{driver?.name}</div>
            <div style={{ color:C.text2, fontSize:'0.875rem' }}>{driver?.email}</div>
            <div style={{ color:C.text3, fontSize:'0.8rem' }}>{driver?.phone}</div>
          </div>
          <div>
            {driver?.verified
              ? <span style={s.verifiedBadge}>✅ Verified Driver</span>
              : <span style={s.unverifiedBadge}>⏳ Pending Verification</span>}
          </div>
        </div>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Update Vehicle & Route</h3>
        <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:'1rem', marginTop:'0.5rem' }}>
          <div style={s.formRow}>
            <Field label="License Number"><input style={s.input} value={form.license_no} onChange={e=>setForm(f=>({...f,license_no:e.target.value}))} /></Field>
            <Field label="Vehicle Number"><input style={s.input} value={form.vehicle_no} onChange={e=>setForm(f=>({...f,vehicle_no:e.target.value}))} /></Field>
          </div>
          <div style={s.formRow}>
            <Field label="Vehicle Model"><input style={s.input} value={form.vehicle_model} onChange={e=>setForm(f=>({...f,vehicle_model:e.target.value}))} /></Field>
            <Field label="Capacity"><input style={s.input} type="number" value={form.capacity} onChange={e=>setForm(f=>({...f,capacity:e.target.value}))} /></Field>
          </div>
          <Field label="Route"><input style={s.input} value={form.route} onChange={e=>setForm(f=>({...f,route:e.target.value}))} placeholder="e.g. Koramangala - Indiranagar" /></Field>
          <button type="submit" disabled={saving} style={s.submitBtn}>{saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
      <label style={{ fontSize:'0.72rem', color:C.text2, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  page: { display:'flex', flexDirection:'column', gap:'1.5rem' },
  loading: { color:C.text3, padding:'2rem', textAlign:'center' },
  statusBanner: { border:'1.5px solid', borderRadius:14, padding:'1.25rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  statusLabel: { color:C.text3, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.25rem' },
  statusValue: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1.1rem' },
  statusBtn: { padding:'0.6rem 1.5rem', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.875rem' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:'1rem' },
  card: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'1.5rem', boxShadow:'0 1px 4px rgba(245,158,11,0.06)' },
  cardTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', color:C.text, marginBottom:'0.5rem' },
  infoGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'1.25rem', marginTop:'0.5rem' },
  iLabel: { color:C.text3, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.2rem' },
  iValue: { color:C.text, fontWeight:600, fontSize:'0.875rem' },
  badge: { padding:'0.2rem 0.6rem', borderRadius:6, fontSize:'0.72rem', fontWeight:600 },
  liveBadge: { background:C.greenBg, color:C.green, padding:'0.25rem 0.6rem', borderRadius:99, fontSize:'0.7rem', fontWeight:700 },
  delayBtn: { background:C.light, border:`1px solid ${C.border}`, color:C.dark, padding:'0.45rem 0.875rem', borderRadius:8, fontSize:'0.78rem', fontWeight:600 },
  endTripBtn: { background:C.redBg, border:`1px solid #FECACA`, color:C.red, padding:'0.45rem 0.875rem', borderRadius:8, fontSize:'0.78rem', fontWeight:600 },
  startTripBtn: { background:C.primary, border:'none', color:'#fff', padding:'0.875rem 2.5rem', borderRadius:12, fontSize:'1rem', fontWeight:700 },
  tripLayout: { display:'flex', gap:'1.5rem', flexWrap:'wrap' },
  tripMain: { flex:'1 1 400px', display:'flex', flexDirection:'column', gap:'1rem' },
  tripSide: { flex:'0 0 260px', display:'flex', flexDirection:'column', gap:'1rem' },
  tripLabel: { color:C.text3, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.05em' },
  checkBtn: { padding:'0.3rem 0.6rem', borderRadius:6, border:'none', fontSize:'0.72rem', fontWeight:600 },
  sosBtn: { background:C.red, border:'none', color:'#fff', padding:'0.75rem 2rem', borderRadius:10, fontWeight:800, fontSize:'0.95rem', letterSpacing:'0.05em', width:'100%' },
  noTripBox: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'4rem 2rem', textAlign:'center' },
  formRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },
  input: { background:C.ultraLight, border:`1.5px solid ${C.border}`, borderRadius:8, padding:'0.65rem 0.875rem', color:C.text, fontSize:'0.9rem' },
  submitBtn: { background:C.primary, border:'none', color:'#fff', padding:'0.65rem 1.5rem', borderRadius:8, fontWeight:700 },
  cancelBtn: { background:'transparent', border:`1px solid ${C.border}`, color:C.text2, padding:'0.65rem 1.25rem', borderRadius:8 },
  table: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, overflow:'hidden' },
  tableHead: { display:'grid', padding:'0.875rem 1.25rem', background:C.light, fontSize:'0.72rem', color:C.dark, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:700 },
  tableRow: { display:'grid', padding:'0.875rem 1.25rem', borderTop:`1px solid ${C.border}`, fontSize:'0.875rem', color:C.text, alignItems:'center' },
  mono: { color:C.text3, fontFamily:'monospace', fontSize:'0.8rem' },
  statusTag: { display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:6, fontSize:'0.72rem', fontWeight:700, textTransform:'capitalize' },
  empty: { color:C.text3, textAlign:'center', padding:'2rem', fontSize:'0.9rem' },
  pageTitle: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.15rem', color:C.text },
  verifiedBadge: { background:C.greenBg, color:C.green, padding:'0.3rem 0.75rem', borderRadius:8, fontSize:'0.8rem', fontWeight:600 },
  unverifiedBadge: { background:C.light, color:C.dark, padding:'0.3rem 0.75rem', borderRadius:8, fontSize:'0.8rem', fontWeight:600 },
};
