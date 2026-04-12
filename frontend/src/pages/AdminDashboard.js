import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import LiveMap from '../components/LiveMap';
import api from '../api';
import { getAllDrivers, getAllStudents, getAllTrips } from '../dbClient';

const C = { primary:'#F59E0B', dark:'#D97706', light:'#FEF3C7', ultraLight:'#FFFBEB', border:'#FDE68A', text:'#1C1917', text2:'#57534E', text3:'#A8A29E', white:'#FFFFFF', green:'#059669', greenBg:'#DCFCE7', red:'#DC2626', redBg:'#FEF2F2', blue:'#2563EB', blueBg:'#EFF6FF' };

const DUMMY_DRIVERS = [
  { id:1, name:'Suresh Kumar', email:'suresh@example.com', vehicle_no:'KA01AB1234', route:'Koramangala → DPS', status:'on_trip', verified:true, rating:4.8, lat:12.9388, lng:77.6285 },
  { id:2, name:'Ravi Shankar', email:'ravi@example.com', vehicle_no:'KA02CD5678', route:'Jayanagar → Ryan', status:'online', verified:true, rating:4.5, lat:12.9250, lng:77.6050 },
  { id:3, name:'Mohan Das', email:'mohan@example.com', vehicle_no:'KA03EF9012', route:'HSR → Inventure', status:'offline', verified:false, rating:4.1, lat:12.9100, lng:77.6400 },
];
const DUMMY_TRIPS = [
  { id:101, driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', route:'Koramangala → DPS', status:'in_progress', date:'2024-06-12' },
  { id:100, driver_name:'Ravi Shankar', vehicle_no:'KA02CD5678', route:'Jayanagar → Ryan', status:'completed', date:'2024-06-12' },
  { id:99,  driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', route:'Koramangala → DPS', status:'completed', date:'2024-06-11' },
];
const DUMMY_SOS = [
  { id:1, driver:'Suresh Kumar', vehicle:'KA01AB1234', time:'08:12 AM', location:'Near Silk Board', type:'Emergency', status:'active', lat:12.9180, lng:77.6230 },
  { id:2, driver:'Ravi Shankar', vehicle:'KA02CD5678', time:'Yesterday 07:50 AM', location:'BTM Layout', type:'Medical', status:'resolved', lat:12.9250, lng:77.6050 },
];
const DUMMY_ATTENDANCE = [
  { student:'Aanya Sharma', driver:'Suresh Kumar', date:'2024-06-12', checkin:'07:52 AM', checkout:'08:15 AM', status:'completed' },
  { student:'Rohan Mehta', driver:'Suresh Kumar', date:'2024-06-12', checkin:'08:01 AM', checkout:'08:15 AM', status:'completed' },
  { student:'Sia Nair', driver:'Ravi Shankar', date:'2024-06-12', checkin:'07:48 AM', checkout:null, status:'in_progress' },
  { student:'Arjun Patel', driver:'Ravi Shankar', date:'2024-06-12', checkin:null, checkout:null, status:'missed' },
];
const DUMMY_LOST = [
  { id:1, item:'Blue water bottle', student:'Aanya Sharma', driver:'Suresh Kumar', date:'2024-06-12', status:'found' },
  { id:2, item:'Purple school bag', student:'Sia Nair', driver:'Ravi Shankar', date:'2024-06-11', status:'searching' },
];

const navItems = [
  { path:'/admin', end:true, icon:'📊', label:'Overview' },
  { path:'/admin/fleet', icon:'🗺️', label:'Live Fleet' },
  { path:'/admin/drivers', icon:'🚌', label:'Drivers' },
  { path:'/admin/assign', icon:'🔗', label:'Assign Students' },
  { path:'/admin/trips', icon:'📋', label:'All Trips' },
  { path:'/admin/sos', icon:'🚨', label:'SOS Console' },
  { path:'/admin/attendance', icon:'📝', label:'Attendance Audit' },
  { path:'/admin/broadcast', icon:'📣', label:'Broadcast' },
  { path:'/admin/lostfound', icon:'🎒', label:'Lost & Found' },
  { path:'/admin/reports', icon:'📈', label:'Reports' },
];

export default function AdminDashboard() {
  const location = useLocation();
  const titles = { '/admin':'Overview', '/admin/fleet':'Live Fleet Map', '/admin/drivers':'Drivers', '/admin/assign':'Assign Students to Drivers', '/admin/trips':'All Trips', '/admin/sos':'SOS Console', '/admin/attendance':'Attendance Audit', '/admin/broadcast':'Parent Broadcast', '/admin/lostfound':'Lost & Found Tickets', '/admin/reports':'Daily Ops Report' };
  return (
    <Layout navItems={navItems} title={titles[location.pathname] || 'Admin'}>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="fleet" element={<AdminFleet />} />
        <Route path="drivers" element={<AdminDrivers />} />
        <Route path="assign" element={<AdminAssignStudents />} />
        <Route path="trips" element={<AdminTrips />} />
        <Route path="sos" element={<AdminSOS />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="broadcast" element={<AdminBroadcast />} />
        <Route path="lostfound" element={<AdminLostFound />} />
        <Route path="reports" element={<AdminReports />} />
      </Routes>
    </Layout>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function AdminOverview() {
  const [drivers, setDrivers] = useState(DUMMY_DRIVERS);
  const [trips, setTrips] = useState(DUMMY_TRIPS);
  useEffect(() => {
    getAllDrivers().then(setDrivers).catch(() => api.get('/drivers').then(setDrivers).catch(() => {}));
    getAllTrips().then(setTrips).catch(() => api.get('/trips').then(setTrips).catch(() => {}));
  }, []);
  const active = drivers.filter(d => d.status !== 'offline').length;
  const onTrip = trips.filter(t => t.status === 'in_progress').length;
  const done = trips.filter(t => t.status === 'completed').length;

  return (
    <div style={s.page}>
      <div style={s.statsGrid}>
        <StatCard icon="🚌" label="Total Drivers" value={drivers.length} sub={`${active} online now`} />
        <StatCard icon="🟢" label="Active Trips" value={onTrip} color={C.green} sub="In progress" />
        <StatCard icon="✅" label="Completed Today" value={done} color="#8B5CF6" sub="Trips" />
        <StatCard icon="🛡️" label="Verified Drivers" value={drivers.filter(d=>d.verified).length} color={C.primary} sub={`of ${drivers.length} total`} />
        <StatCard icon="🚨" label="Active SOS" value={DUMMY_SOS.filter(s=>s.status==='active').length} color={C.red} sub="Requires action" />
        <StatCard icon="📊" label="On-Time Rate" value="94%" color={C.green} sub="Today" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', flexWrap:'wrap' }}>
        <div style={s.card}>
          <h2 style={s.cardTitle}>Driver Status Overview</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.5rem' }}>
            {drivers.map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.6rem 0.75rem', background:C.ultraLight, borderRadius:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:C.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.75rem', flexShrink:0 }}>{d.name?.charAt(0)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:'0.875rem', color:C.text }}>{d.name}</div>
                  <div style={{ fontSize:'0.72rem', color:C.text3 }}>{d.vehicle_no} · {d.route}</div>
                </div>
                <span style={{ ...s.statusPill, background: d.status === 'on_trip' ? C.greenBg : d.status === 'online' ? C.light : '#F1F5F9', color: d.status === 'on_trip' ? C.green : d.status === 'online' ? C.dark : C.text3 }}>{d.status?.replace('_', ' ')}</span>
                <span style={{ ...s.statusPill, background: d.verified ? C.greenBg : C.redBg, color: d.verified ? C.green : C.red }}>{d.verified ? '✓' : '✗'}</span>
                <span style={{ fontSize:'0.8rem', color:C.primary, fontWeight:700 }}>⭐ {d.rating}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>Recent Trips</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.5rem' }}>
            {trips.slice(0,6).map(t => (
              <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0.75rem', background:C.ultraLight, borderRadius:10 }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.875rem', color:C.text }}>#{t.id} {t.driver_name}</div>
                  <div style={{ fontSize:'0.72rem', color:C.text3 }}>{t.route}</div>
                </div>
                <span style={{ ...s.statusPill, background: (t.status==='in_progress' ? C.greenBg : t.status==='completed' ? '#F1F5F9' : C.light), color: t.status==='in_progress' ? C.green : C.text3 }}>{t.status?.replace('_',' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fleet Map (PB-45) ─────────────────────────────────────────────────────────
function AdminFleet() {
  const [drivers] = useState(DUMMY_DRIVERS);
  const [selected, setSelected] = useState(null);

  return (
    <div style={s.page}>
      <div style={{ display:'flex', gap:'1rem', marginBottom:'0.5rem' }}>
        {[['🟢 On Trip',drivers.filter(d=>d.status==='on_trip').length],['🟡 Online',drivers.filter(d=>d.status==='online').length],['⚫ Offline',drivers.filter(d=>d.status==='offline').length]].map(([l,v]) => (
          <div key={l} style={{ ...s.card, flex:1, padding:'1rem', textAlign:'center' }}>
            <div style={{ fontSize:'0.75rem', color:C.text2, fontWeight:600 }}>{l}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:C.text }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 400px' }}>
          <div style={{ ...s.card, padding:0, overflow:'hidden' }}>
            <div style={{ padding:'0.875rem 1.25rem', borderBottom:`1px solid ${C.border}`, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.9rem', color:C.text, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              Live Fleet Map
              <span style={s.liveBadge}>● LIVE</span>
            </div>
            <LiveMap lat={12.9352} lng={77.6245} height={450} zoom={12}
              markers={drivers.map(d => ({ lat:d.lat, lng:d.lng, label:`🚌 ${d.vehicle_no}`, color: d.status === 'on_trip' ? C.green : d.status === 'online' ? C.primary : '#9CA3AF', size:16 }))} />
          </div>
        </div>
        <div style={{ flex:'0 0 260px', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {drivers.map(d => (
            <div key={d.id} style={{ ...s.card, cursor:'pointer', borderColor: selected?.id === d.id ? C.primary : C.border }}
              onClick={() => setSelected(d)}>
              <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:C.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0 }}>{d.name.charAt(0)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, color:C.text, fontSize:'0.875rem' }}>{d.name}</div>
                  <div style={{ fontSize:'0.72rem', color:C.text3 }}>{d.vehicle_no}</div>
                </div>
                <span style={{ ...s.statusPill, background: d.status === 'on_trip' ? C.greenBg : d.status === 'online' ? C.light : '#F1F5F9', color: d.status === 'on_trip' ? C.green : d.status === 'online' ? C.dark : C.text3 }}>{d.status?.replace('_',' ')}</span>
              </div>
              {selected?.id === d.id && (
                <div style={{ marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:'0.78rem', color:C.text2 }}>Route: {d.route}</div>
                  <div style={{ fontSize:'0.78rem', color:C.text2 }}>Rating: ⭐ {d.rating}</div>
                  <button style={{ ...s.submitBtn, fontSize:'0.75rem', padding:'0.4rem 0.875rem', marginTop:'0.5rem' }}>Reassign Van</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SOS Console (PB-48) ───────────────────────────────────────────────────────
function AdminSOS() {
  const [alerts, setAlerts] = useState(DUMMY_SOS);
  const [actionPanel, setActionPanel] = useState(null);

  const resolve = (id) => {
    setAlerts(a => a.map(al => al.id === id ? {...al, status:'resolved'} : al));
    setActionPanel(null);
  };

  return (
    <div style={s.page}>
      {alerts.filter(a=>a.status==='active').length > 0 && (
        <div style={{ background:C.redBg, border:`2px solid ${C.red}`, borderRadius:14, padding:'1rem 1.5rem' }}>
          <div style={{ fontWeight:800, color:C.red, fontSize:'1.1rem' }}>🚨 {alerts.filter(a=>a.status==='active').length} ACTIVE SOS ALERT{alerts.filter(a=>a.status==='active').length > 1 ? 'S' : ''}</div>
          <div style={{ color:C.red, fontSize:'0.875rem' }}>Immediate action required. See alerts below.</div>
        </div>
      )}

      <div style={s.statsGrid}>
        <StatCard icon="🚨" label="Active Alerts" value={alerts.filter(a=>a.status==='active').length} color={C.red} />
        <StatCard icon="✅" label="Resolved" value={alerts.filter(a=>a.status==='resolved').length} color={C.green} />
        <StatCard icon="⏱" label="Avg Response" value="4.2 min" color={C.primary} />
        <StatCard icon="📊" label="This Month" value={alerts.length} color={C.blue} />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        {alerts.map(alert => (
          <div key={alert.id} style={{ ...s.card, borderLeft:`5px solid ${alert.status === 'active' ? C.red : C.green}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
              <div>
                <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:'0.4rem' }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1rem', color:C.text }}>🚨 {alert.type} Emergency</span>
                  <span style={{ ...s.statusPill, background: alert.status === 'active' ? C.redBg : C.greenBg, color: alert.status === 'active' ? C.red : C.green, fontWeight:700 }}>{alert.status}</span>
                </div>
                <div style={{ color:C.text2, fontSize:'0.875rem' }}>Driver: {alert.driver} · {alert.vehicle}</div>
                <div style={{ color:C.text2, fontSize:'0.875rem' }}>Location: {alert.location}</div>
                <div style={{ color:C.text3, fontSize:'0.75rem', marginTop:'0.3rem' }}>Time: {alert.time}</div>
              </div>
              {alert.status === 'active' && (
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button style={{ ...s.submitBtn, background:C.blue, fontSize:'0.8rem', padding:'0.5rem 1rem' }}
                    onClick={() => setActionPanel(actionPanel === alert.id ? null : alert.id)}>
                    Action Panel
                  </button>
                  <button style={{ ...s.submitBtn, background:C.green, fontSize:'0.8rem', padding:'0.5rem 1rem' }}
                    onClick={() => resolve(alert.id)}>
                    Mark Resolved
                  </button>
                </div>
              )}
            </div>

            {actionPanel === alert.id && (
              <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:`1px solid ${C.border}` }}>
                <div style={s.cardTitle}>📋 Emergency SOP Checklist</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', marginTop:'0.5rem' }}>
                  {['✅ Contact driver immediately via call','✅ Notify parents of affected students','✅ Dispatch emergency van if needed','✅ Log incident in system','⬜ Arrange police escort if required','⬜ File incident report after resolution'].map((step, i) => (
                    <div key={i} style={{ display:'flex', gap:'0.5rem', fontSize:'0.875rem', color: step.startsWith('✅') ? C.green : C.text2, padding:'0.3rem 0' }}>
                      {step}
                    </div>
                  ))}
                </div>
                <button style={{ ...s.submitBtn, marginTop:'0.75rem', background:C.red }} onClick={() => resolve(alert.id)}>
                  Resolve & Close Alert
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Attendance Audit (PB-53) ──────────────────────────────────────────────────
function AdminAttendance() {
  const [records] = useState(DUMMY_ATTENDANCE);
  const statusColor = { completed:C.green, in_progress:C.primary, missed:C.red };

  return (
    <div style={s.page}>
      <div style={s.statsGrid}>
        <StatCard icon="✅" label="Completed" value={records.filter(r=>r.status==='completed').length} color={C.green} />
        <StatCard icon="🚌" label="In Progress" value={records.filter(r=>r.status==='in_progress').length} color={C.primary} />
        <StatCard icon="❌" label="Missed" value={records.filter(r=>r.status==='missed').length} color={C.red} />
        <StatCard icon="🔒" label="Audit Status" value="Locked" color={C.green} sub="Tamper-proof" />
      </div>

      <div style={{ ...s.card, background:'rgba(5,150,105,0.05)', borderColor:'#A7F3D0' }}>
        <div style={{ fontWeight:700, color:C.green, marginBottom:'0.25rem' }}>🔒 Attendance Audit Trail</div>
        <p style={{ color:C.text2, fontSize:'0.875rem' }}>All attendance records are immutable once logged. Any modification attempt is flagged and logged with timestamp and user ID. Compliant with PB-53.</p>
      </div>

      <div style={s.table}>
        <div style={{ ...s.tableHead, gridTemplateColumns:'1.5fr 1.5fr 1fr 1fr 1fr 1fr' }}>
          <span>Student</span><span>Driver</span><span>Date</span><span>Check-In</span><span>Drop-Off</span><span>Status</span>
        </div>
        {records.map((r, i) => (
          <div key={i} style={{ ...s.tableRow, gridTemplateColumns:'1.5fr 1.5fr 1fr 1fr 1fr 1fr' }}>
            <span style={{ fontWeight:600 }}>{r.student}</span>
            <span style={{ color:C.text2 }}>{r.driver}</span>
            <span style={s.mono}>{r.date}</span>
            <span style={{ color: r.checkin ? C.green : C.red, fontWeight:600 }}>{r.checkin || '—'}</span>
            <span style={{ color: r.checkout ? C.green : C.text3 }}>{r.checkout || '—'}</span>
            <span style={{ ...s.statusPill, background: (statusColor[r.status]||C.primary)+'18', color: statusColor[r.status]||C.primary }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Broadcast (PB-52) ─────────────────────────────────────────────────────────
function AdminBroadcast() {
  const [form, setForm] = useState({ type:'all', title:'', message:'' });
  const [sent, setSent] = useState(false);
  const [history] = useState([
    { id:1, title:'Route Change Notice', message:'Van KA01AB1234 route changed from tomorrow.', type:'all', sentAt:'2024-06-11 09:00 AM', recipients:45 },
    { id:2, title:'Holiday Notice', message:'No service on 15th June - Eid holiday.', type:'all', sentAt:'2024-06-10 05:00 PM', recipients:120 },
  ]);

  const sendMsg = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => { setSent(false); setForm({ type:'all', title:'', message:'' }); }, 3000);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h3 style={s.cardTitle}>📣 Send Parent Broadcast</h3>
        {sent ? (
          <div style={{ background:C.greenBg, border:`1px solid #A7F3D0`, color:C.green, padding:'1rem', borderRadius:10, fontWeight:700, textAlign:'center' }}>
            ✅ Broadcast sent successfully to all parents!
          </div>
        ) : (
          <form onSubmit={sendMsg} style={{ display:'flex', flexDirection:'column', gap:'1rem', marginTop:'0.75rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div style={s.field}>
                <label style={s.fieldLabel}>Target Audience</label>
                <select style={s.input} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  <option value="all">All Parents</option>
                  <option value="route_a">Route A Parents</option>
                  <option value="route_b">Route B Parents</option>
                  <option value="emergency">Emergency Contacts</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Message Type</label>
                <select style={s.input}>
                  <option>Push Notification</option>
                  <option>SMS</option>
                  <option>Both</option>
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.fieldLabel}>Message Title</label>
              <input style={s.input} required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Route change notice" />
            </div>
            <div style={s.field}>
              <label style={s.fieldLabel}>Message</label>
              <textarea style={{ ...s.input, minHeight:100, resize:'vertical' }} required value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="Write your message to parents..." />
            </div>
            <button type="submit" style={s.submitBtn}>📣 Send Broadcast</button>
          </form>
        )}
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Broadcast History</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'0.5rem' }}>
          {history.map(h => (
            <div key={h.id} style={{ padding:'0.875rem', background:C.ultraLight, borderRadius:10, border:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:700, color:C.text, marginBottom:'0.25rem' }}>{h.title}</div>
                  <div style={{ color:C.text2, fontSize:'0.875rem' }}>{h.message}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0, marginLeft:'1rem' }}>
                  <div style={{ ...s.statusPill, background:C.greenBg, color:C.green }}>Sent</div>
                  <div style={{ fontSize:'0.72rem', color:C.text3, marginTop:'0.3rem' }}>{h.recipients} recipients</div>
                </div>
              </div>
              <div style={{ fontSize:'0.72rem', color:C.text3, marginTop:'0.3rem' }}>Sent: {h.sentAt}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Lost & Found (PB-60) ──────────────────────────────────────────────────────
function AdminLostFound() {
  const [items, setItems] = useState(DUMMY_LOST);
  const statusColor = { found:C.green, searching:C.primary, resolved:C.text3 };

  return (
    <div style={s.page}>
      <div style={s.statsGrid}>
        <StatCard icon="🔍" label="Open Tickets" value={items.filter(i=>i.status!=='resolved').length} color={C.primary} />
        <StatCard icon="✅" label="Found & Returned" value={items.filter(i=>i.status==='found').length} color={C.green} />
        <StatCard icon="🔎" label="Still Searching" value={items.filter(i=>i.status==='searching').length} color={C.blue} />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {items.map(item => (
          <div key={item.id} style={{ ...s.card, borderLeft:`4px solid ${statusColor[item.status] || C.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, color:C.text, marginBottom:'0.25rem' }}>🎒 {item.item}</div>
                <div style={{ color:C.text2, fontSize:'0.875rem' }}>Student: {item.student} · Driver: {item.driver}</div>
                <div style={{ color:C.text3, fontSize:'0.75rem', marginTop:'0.25rem' }}>{item.date}</div>
              </div>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <span style={{ ...s.statusPill, background:(statusColor[item.status]||C.primary)+'18', color:statusColor[item.status]||C.primary }}>{item.status}</span>
                {item.status !== 'resolved' && (
                  <button style={{ ...s.submitBtn, fontSize:'0.75rem', padding:'0.4rem 0.875rem' }}
                    onClick={() => setItems(p => p.map(i => i.id === item.id ? {...i, status:'resolved'} : i))}>
                    Close Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reports (PB-61) ───────────────────────────────────────────────────────────
function AdminReports() {
  const today = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

  return (
    <div style={s.page}>
      <div style={{ ...s.card, background:'linear-gradient(135deg, #F59E0B, #D97706)', border:'none' }}>
        <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.8rem', marginBottom:'0.25rem' }}>Auto-Generated Report</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:'#fff' }}>Daily Operations Report</div>
        <div style={{ color:'rgba(255,255,255,0.9)', fontSize:'0.875rem' }}>{today}</div>
      </div>

      <div style={s.statsGrid}>
        {[['Total Trips', '6', C.text],['Completed', '5', C.green],['In Progress', '1', C.primary],['Cancelled', '0', C.text3],['Students Transported', '18', C.blue],['On-Time Rate', '94%', C.green],['SOS Alerts', '1', C.red],['Avg Driver Rating', '4.6 ⭐', C.primary]].map(([l,v,c]) => (
          <div key={l} style={{ ...s.card, textAlign:'center' }}>
            <div style={{ color:C.text3, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600, marginBottom:'0.3rem' }}>{l}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>Driver Performance</h3>
          {DUMMY_DRIVERS.map(d => (
            <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0', borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:'0.875rem', color:C.text, fontWeight:500 }}>{d.name}</div>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <div style={{ width:80, height:6, background:C.border, borderRadius:99, overflow:'hidden' }}>
                  <div style={{ width:`${d.rating/5*100}%`, height:'100%', background:C.primary, borderRadius:99 }} />
                </div>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:C.dark }}>⭐ {d.rating}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>Incident Summary</h3>
          {[['SOS Alerts',1,C.red],['Missed Pickups',0,C.text3],['Delays Reported',2,C.primary],['Lost Items',2,C.blue],['Complaints',0,C.text3]].map(([l,v,c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0', borderBottom:`1px solid ${C.border}`, fontSize:'0.875rem' }}>
              <span style={{ color:C.text2 }}>{l}</span>
              <span style={{ fontWeight:700, color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={s.cardTitle}>Export Report</h3>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button style={s.submitBtn} onClick={() => alert('PDF exported!')}>📄 Export PDF</button>
            <button style={{ ...s.submitBtn, background:C.green }} onClick={() => alert('CSV exported!')}>📊 Export CSV</button>
          </div>
        </div>
        <p style={{ color:C.text2, fontSize:'0.875rem' }}>Reports are auto-generated daily at 11:59 PM. Historical reports are available for the past 90 days. All records are immutable and audit-compliant.</p>
      </div>
    </div>
  );
}

// ── Drivers ───────────────────────────────────────────────────────────────────
function AdminDrivers() {
  const [drivers, setDrivers] = useState(DUMMY_DRIVERS);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/drivers').then(d => { if (Array.isArray(d) && d.length) setDrivers(d); }).catch(() => {});
  }, []);

  const verifyDriver = async (driver) => {
    const newVerified = !driver.verified;
    try {
      await api.patch(`/drivers/${driver.id}/verify`, { verified: newVerified });
      setDrivers(ds => ds.map(d => d.id === driver.id ? {...d, verified: newVerified} : d));
      setMsg(`✅ ${driver.name} ${newVerified ? 'verified' : 'unverified'} successfully`);
    } catch {
      setDrivers(ds => ds.map(d => d.id === driver.id ? {...d, verified: newVerified} : d));
      setMsg(`✅ Status updated (local only)`);
    }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>All Drivers ({drivers.length})</h2>
      {msg && <div style={{ padding:'0.75rem 1rem', borderRadius:10, background:C.greenBg, color:C.green, fontSize:'0.875rem', border:`1px solid #A7F3D0` }}>{msg}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:'1rem' }}>
        {drivers.map(d => (
          <div key={d.id} style={s.card}>
            <div style={{ display:'flex', gap:'0.875rem', marginBottom:'1rem' }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:C.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.1rem', flexShrink:0 }}>{d.name?.charAt(0)}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:C.text }}>{d.name}</div>
                <div style={{ color:C.text2, fontSize:'0.8rem' }}>{d.email}</div>
                <div style={{ fontSize:'0.72rem', color:C.text3 }}>{d.vehicle_no} · ⭐ {d.rating}</div>
                {d.route && <div style={{ fontSize:'0.72rem', color:C.text3, marginTop:'0.2rem' }}>📍 {d.route}</div>}
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.875rem' }}>
              <span style={{ ...s.statusPill, background: d.status === 'on_trip' ? C.greenBg : d.status === 'online' ? C.light : '#F1F5F9', color: d.status === 'on_trip' ? C.green : d.status === 'online' ? C.dark : C.text3 }}>{d.status?.replace('_',' ')}</span>
              <span style={{ ...s.statusPill, background: d.verified ? C.greenBg : C.redBg, color: d.verified ? C.green : C.red }}>{d.verified ? '✓ Verified' : '✗ Unverified'}</span>
              {d.capacity && <span style={{ ...s.statusPill, background: C.blueBg, color: C.blue }}>Capacity: {d.capacity}</span>}
            </div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button style={{ ...s.submitBtn, fontSize:'0.75rem', padding:'0.4rem 0.875rem', background: d.verified ? C.red : C.green }}
                onClick={() => verifyDriver(d)}>
                {d.verified ? '✗ Revoke' : '✓ Verify'}
              </button>
            </div>
          </div>
        ))}
        {drivers.length === 0 && <div style={s.empty}>No drivers registered</div>}
      </div>
    </div>
  );
}

// ── Assign Students ────────────────────────────────────────────────────────────
function AdminAssignStudents() {
  const [students, setStudents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assignments, setAssignments] = useState({});  // studentId → driverId
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    Promise.all([
      getAllStudents().catch(() => api.get('/students').catch(() => [])),
      getAllDrivers().catch(() => api.get('/drivers').catch(() => [])),
    ]).then(([sts, drvs]) => {
      const studentList = Array.isArray(sts) ? sts : [];
      const driverList  = Array.isArray(drvs) ? drvs : [];
      setStudents(studentList);
      setDrivers(driverList);
      // Pre-fill existing assignments
      const map = {};
      studentList.forEach(s => { if (s.driver_id) map[s.id] = s.driver_id; });
      setAssignments(map);
    }).finally(() => setLoading(false));
  }, []);

  const assign = async (studentId, driverId) => {
    setSaving(studentId);
    setAssignments(prev => ({ ...prev, [studentId]: driverId || '' }));
    try {
      await api.post('/drivers/assign-student', { student_id: studentId, driver_id: driverId || null });
      const driver = drivers.find(d => d.id === driverId);
      const student = students.find(s => s.id === studentId);
      setMsg(driverId
        ? `✅ ${student?.name} assigned to ${driver?.name}`
        : `✅ ${student?.name} unassigned`);
    } catch {
      setMsg('⚠️ Save failed — changes shown locally only');
    }
    setSaving(null);
    setTimeout(() => setMsg(''), 4000);
  };

  if (loading) return <div style={s.empty}>Loading students and drivers…</div>;

  return (
    <div style={s.page}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={s.pageTitle}>Assign Students to Drivers</h2>
        <div style={{ fontSize:'0.82rem', color:C.text3 }}>{students.length} students · {drivers.length} drivers</div>
      </div>

      {msg && (
        <div style={{ padding:'0.75rem 1rem', borderRadius:10, background: msg.startsWith('✅') ? C.greenBg : '#FEF3C7', color: msg.startsWith('✅') ? C.green : '#92400E', fontSize:'0.875rem', border:`1px solid ${msg.startsWith('✅') ? '#A7F3D0' : C.border}` }}>{msg}</div>
      )}

      {students.length === 0 ? (
        <div style={{ ...s.card, textAlign:'center', color:C.text3 }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>🎒</div>
          <div style={{ fontWeight:600 }}>No students registered yet</div>
          <div style={{ fontSize:'0.85rem', marginTop:'0.5rem' }}>Parents need to add their children first via the Parent Dashboard.</div>
        </div>
      ) : (
        <div style={s.table}>
          <div style={{ ...s.tableHead, gridTemplateColumns:'2fr 1.5fr 2fr 1.5fr 1fr' }}>
            <span>Student</span><span>School / Grade</span><span>Parent</span><span>Assigned Driver</span><span>Status</span>
          </div>
          {students.map(st => {
            const assignedDriverId = assignments[st.id] || '';
            const assignedDriver   = drivers.find(d => d.id === assignedDriverId);
            return (
              <div key={st.id} style={{ ...s.tableRow, gridTemplateColumns:'2fr 1.5fr 2fr 1.5fr 1fr', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600, color:C.text }}>{st.name}</div>
                  {st.pickup_address && <div style={{ fontSize:'0.72rem', color:C.text3 }}>📍 {st.pickup_address}</div>}
                </div>
                <div>
                  <div style={{ fontWeight:500, color:C.text2, fontSize:'0.85rem' }}>{st.school || '—'}</div>
                  {st.grade && <div style={{ fontSize:'0.72rem', color:C.text3 }}>{st.grade}</div>}
                </div>
                <div style={{ fontSize:'0.82rem', color:C.text2 }}>{st.parent_name || st.parent_email || '—'}</div>
                <select
                  style={{ ...s.input, fontSize:'0.82rem', padding:'0.4rem 0.6rem', cursor:'pointer', opacity: saving === st.id ? 0.6 : 1 }}
                  value={assignedDriverId}
                  disabled={saving === st.id}
                  onChange={e => assign(st.id, e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} · {d.vehicle_no}</option>
                  ))}
                </select>
                <span style={{ ...s.statusPill, background: assignedDriver ? C.greenBg : C.light, color: assignedDriver ? C.green : C.text3, textAlign:'center' }}>
                  {saving === st.id ? '⏳' : assignedDriver ? '✓ Assigned' : 'None'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {drivers.length === 0 && (
        <div style={{ ...s.card, background:'#FEF3C7', borderColor:C.border, color:'#92400E', fontSize:'0.875rem' }}>
          ⚠️ No drivers found. Ask drivers to register and get verified first.
        </div>
      )}
    </div>
  );
}

// ── Trips ─────────────────────────────────────────────────────────────────────
function AdminTrips() {
  const [trips, setTrips] = useState(DUMMY_TRIPS);
  useEffect(() => { api.get('/trips').then(setTrips).catch(() => {}); }, []);
  const sc = { in_progress:C.green, completed:C.text3, scheduled:C.primary, cancelled:C.red };

  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>All Trips</h2>
      <div style={s.table}>
        <div style={{ ...s.tableHead, gridTemplateColumns:'0.5fr 1.5fr 1fr 2fr 1fr 1fr' }}>
          <span>ID</span><span>Driver</span><span>Vehicle</span><span>Route</span><span>Status</span><span>Date</span>
        </div>
        {trips.map(t => (
          <div key={t.id} style={{ ...s.tableRow, gridTemplateColumns:'0.5fr 1.5fr 1fr 2fr 1fr 1fr' }}>
            <span style={s.mono}>#{t.id}</span>
            <span style={{ fontWeight:500 }}>{t.driver_name}</span>
            <span style={{ ...s.mono, color:C.dark }}>{t.vehicle_no}</span>
            <span style={{ color:C.text2, fontSize:'0.8rem' }}>{t.route || '—'}</span>
            <span style={{ ...s.statusPill, background:(sc[t.status]||C.primary)+'18', color:sc[t.status]||C.primary }}>{t.status?.replace('_',' ')}</span>
            <span style={s.mono}>{t.date}</span>
          </div>
        ))}
        {trips.length === 0 && <div style={s.empty}>No trips yet</div>}
      </div>
    </div>
  );
}

const s = {
  page: { display:'flex', flexDirection:'column', gap:'1.5rem' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:'1rem' },
  card: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'1.5rem', boxShadow:'0 1px 4px rgba(245,158,11,0.06)' },
  cardTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', color:C.text, marginBottom:'0.5rem' },
  statusPill: { padding:'0.2rem 0.6rem', borderRadius:6, fontSize:'0.72rem', fontWeight:700, textTransform:'capitalize', display:'inline-block' },
  liveBadge: { background:C.greenBg, color:C.green, padding:'0.25rem 0.6rem', borderRadius:99, fontSize:'0.7rem', fontWeight:700 },
  table: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, overflow:'hidden' },
  tableHead: { display:'grid', padding:'0.875rem 1.25rem', background:C.light, fontSize:'0.72rem', color:C.dark, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:700 },
  tableRow: { display:'grid', padding:'0.875rem 1.25rem', borderTop:`1px solid ${C.border}`, fontSize:'0.875rem', color:C.text, alignItems:'center' },
  mono: { color:C.text3, fontFamily:'monospace', fontSize:'0.8rem' },
  empty: { color:C.text3, textAlign:'center', padding:'2rem', fontSize:'0.9rem' },
  pageTitle: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.15rem', color:C.text },
  submitBtn: { background:C.primary, border:'none', color:'#fff', padding:'0.65rem 1.5rem', borderRadius:8, fontWeight:700, fontSize:'0.875rem' },
  field: { display:'flex', flexDirection:'column', gap:'0.35rem' },
  fieldLabel: { fontSize:'0.72rem', color:C.text2, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' },
  input: { background:C.ultraLight, border:`1.5px solid ${C.border}`, borderRadius:8, padding:'0.65rem 0.875rem', color:C.text, fontSize:'0.9rem' },
};