import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import LiveMap from '../components/LiveMap';
import api from '../api';

const C = { primary:'#F59E0B', dark:'#D97706', light:'#FEF3C7', ultraLight:'#FFFBEB', border:'#FDE68A', text:'#1C1917', text2:'#57534E', text3:'#A8A29E', white:'#FFFFFF', green:'#059669', greenBg:'#DCFCE7', red:'#DC2626', redBg:'#FEF2F2', blue:'#2563EB', blueBg:'#EFF6FF' };

// ── dummy data ──────────────────────────────────────────────────────────────
const DUMMY_NOTIFS = [
  { id:1, type:'success', title:'Aanya Boarded', message:'Aanya has boarded the van at Koramangala pickup point.', created_at: new Date(Date.now()-300000).toISOString(), read:0 },
  { id:2, type:'info', title:'ETA Update', message:'Van is 8 minutes away. Current location: Indiranagar.', created_at: new Date(Date.now()-900000).toISOString(), read:0 },
  { id:3, type:'warning', title:'Delay Alert', message:'Van is delayed by 12 minutes due to traffic on OMR.', created_at: new Date(Date.now()-1800000).toISOString(), read:1 },
  { id:4, type:'success', title:'Trip Completed', message:'Aanya was safely dropped at Delhi Public School at 8:12 AM.', created_at: new Date(Date.now()-86400000).toISOString(), read:1 },
  { id:5, type:'error', title:'SOS Alert Triggered', message:'Driver Suresh pressed SOS near Silk Board. Operations team notified.', created_at: new Date(Date.now()-172800000).toISOString(), read:1 },
];
const DUMMY_TRIPS = [
  { id:101, date:'2024-06-12', driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', route:'Koramangala → DPS Whitefield', status:'completed' },
  { id:102, date:'2024-06-11', driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', route:'Koramangala → DPS Whitefield', status:'completed' },
  { id:103, date:'2024-06-10', driver_name:'Ravi Shankar', vehicle_no:'KA02CD5678', route:'Koramangala → DPS Whitefield', status:'completed' },
];
const DUMMY_STUDENTS = [
  { id:1, name:'Aanya Sharma', school:'Delhi Public School', grade:'Grade 5', pickup_address:'12 Rose Garden, Koramangala', drop_address:'Delhi Public School, Whitefield', driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', rating:4.8, van_status:'on_trip', lat:12.9352, lng:77.6245 },
];
const DUMMY_ACTIVE = { id:101, driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', vehicle_model:'Tempo Traveller', rating:4.8, lat:12.9388, lng:77.6285, route:'Koramangala → DPS', students:[{ id:1, name:'Aanya Sharma', checked_in:true, checked_out:false }] };

const navItems = [
  { path:'/parent', end:true, icon:'🏠', label:'Dashboard' },
  { path:'/parent/tracking', icon:'📍', label:'Live Tracking' },
  { path:'/parent/students', icon:'🎒', label:'My Children' },
  { path:'/parent/trips', icon:'📋', label:'Trip History' },
  { path:'/parent/notifications', icon:'🔔', label:'Notifications' },
  { path:'/parent/subscription', icon:'💳', label:'Subscription' },
  { path:'/parent/lostitem', icon:'🎒', label:'Lost & Found' },
  { path:'/parent/ai', icon:'🤖', label:'AI Assistant' },
];

export default function ParentDashboard() {
  const location = useLocation();
  const titles = { '/parent':'Dashboard', '/parent/tracking':'Live Tracking', '/parent/students':'My Children', '/parent/trips':'Trip History', '/parent/notifications':'Notifications', '/parent/subscription':'Subscription', '/parent/lostitem':'Lost & Found', '/parent/ai':'AI Assistant' };
  return (
    <Layout navItems={navItems} title={titles[location.pathname] || 'Dashboard'}>
      <Routes>
        <Route index element={<ParentHome />} />
        <Route path="tracking" element={<ParentTracking />} />
        <Route path="students" element={<ParentStudents />} />
        <Route path="trips" element={<ParentTrips />} />
        <Route path="notifications" element={<ParentNotifications />} />
        <Route path="subscription" element={<ParentSubscription />} />
        <Route path="lostitem" element={<ParentLostItem />} />
        <Route path="ai" element={<ParentAI />} />
      </Routes>
    </Layout>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────────
function ParentHome() {
  const [students, setStudents] = useState(DUMMY_STUDENTS);
  const [activeTrip, setActiveTrip] = useState(DUMMY_ACTIVE);
  const [notifs, setNotifs] = useState(DUMMY_NOTIFS);

  useEffect(() => {
    api.get('/students').then(setStudents).catch(() => {});
    api.get('/trips/active').then(setActiveTrip).catch(() => {});
    api.get('/students/notifications').then(setNotifs).catch(() => {});
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={s.page}>
      <div style={s.statsGrid}>
        <StatCard icon="🎒" label="Children" value={students.length} sub="Registered students" />
        <StatCard icon="🚌" label="Active Trip" value={activeTrip ? 'In Progress' : 'No Trip'} color={activeTrip ? C.green : C.text3} sub={activeTrip ? `Van ${activeTrip.vehicle_no}` : 'All safe at home'} />
        <StatCard icon="🔔" label="Unread Alerts" value={unread} color={C.primary} sub="Today" />
        <StatCard icon="⭐" label="Driver Rating" value={students[0]?.rating ?? '4.8'} color="#8B5CF6" sub="Average rating" />
      </div>

      {activeTrip && (
        <div style={s.card}>
          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>🟢 Live Trip</h2>
            <span style={s.liveBadge}>● LIVE</span>
          </div>
          <div style={s.tripCard}>
            <div style={s.tcLeft}>
              <div style={s.driverRow}>
                <div style={s.driverAv}>{activeTrip.driver_name?.charAt(0)}</div>
                <div>
                  <div style={s.driverName}>{activeTrip.driver_name}</div>
                  <div style={s.driverSub}>{activeTrip.vehicle_no} · {activeTrip.vehicle_model}</div>
                </div>
                <div style={s.ratingBadge}>⭐ {activeTrip.rating}</div>
              </div>
              <div style={s.studentStatuses}>
                {activeTrip.students?.map(st => (
                  <div key={st.id} style={s.studentStatus}>
                    <span style={s.sName}>{st.name}</span>
                    <span style={{ ...s.sBadge, background: st.checked_in ? C.greenBg : C.light, color: st.checked_in ? C.green : C.dark }}>
                      {st.checked_in ? '✓ Boarded' : '⏳ Waiting'}
                    </span>
                  </div>
                ))}
              </div>
              <div style={s.etaBox}>
                <span style={s.etaLabel}>ETA to school:</span>
                <span style={s.etaValue}>~8 minutes</span>
              </div>
            </div>
            <div style={s.tcRight}>
              <LiveMap lat={activeTrip.lat || 12.9352} lng={activeTrip.lng || 77.6245} height={200}
                markers={[{ lat: activeTrip.lat || 12.9352, lng: activeTrip.lng || 77.6245, label: '🚌 Van', color: C.primary, size: 16 }]} />
            </div>
          </div>
        </div>
      )}

      <div style={s.card}>
        <h2 style={s.cardTitle}>Recent Notifications</h2>
        <div style={s.notifList}>
          {notifs.slice(0, 5).map(n => (
            <div key={n.id} style={{ ...s.notifItem, opacity: n.read ? 0.7 : 1 }}>
              <div style={{ ...s.notifDot, background: n.type === 'success' ? C.green : n.type === 'error' ? C.red : C.primary }} />
              <div style={s.notifContent}>
                <div style={s.notifTitle}>{n.title}</div>
                <div style={s.notifMsg}>{n.message}</div>
                <div style={s.notifTime}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.read && <div style={s.unreadDot} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tracking ─────────────────────────────────────────────────────────────────
function ParentTracking() {
  const [students, setStudents] = useState(DUMMY_STUDENTS);
  const [activeTrip, setActiveTrip] = useState(DUMMY_ACTIVE);
  const refresh = useCallback(() => {
    api.get('/students').then(setStudents).catch(() => {});
    api.get('/trips/active').then(setActiveTrip).catch(() => {});
  }, []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 10000); return () => clearInterval(t); }, [refresh]);

  return (
    <div style={s.page}>
      <div style={s.trackLayout}>
        <div style={s.trackMain}>
          <div style={s.mapBox}>
            <div style={s.mapHeader}>
              <span style={s.mapTitle}>Live Map</span>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <span style={s.liveBadge}>● LIVE</span>
                <span style={s.etaChip}>ETA: ~8 min</span>
              </div>
            </div>
            <LiveMap lat={activeTrip?.lat || 12.9352} lng={activeTrip?.lng || 77.6245} height={400} zoom={14}
              markers={activeTrip ? [{ lat: activeTrip.lat || 12.9352, lng: activeTrip.lng || 77.6245, label: '🚌 ' + (activeTrip.vehicle_no || 'Van'), color: C.primary, size: 18 }] : []} />
          </div>
        </div>
        <div style={s.trackSide}>
          {students.map(st => (
            <div key={st.id} style={s.sCard}>
              <div style={s.sAv}>{st.name.charAt(0)}</div>
              <div style={s.sInfo}>
                <div style={s.sCardName}>{st.name}</div>
                <div style={s.sCardSub}>{st.school} · {st.grade}</div>
                <div style={{ ...s.vanStatus, background: st.van_status === 'on_trip' ? C.greenBg : C.light, color: st.van_status === 'on_trip' ? C.green : C.dark }}>
                  {st.van_status === 'on_trip' ? '🚌 On Trip' : st.van_status === 'online' ? '✅ Driver Online' : '⏸ Driver Offline'}
                </div>
              </div>
              {st.driver_name && (
                <div style={s.driverMini}>
                  <div style={{ fontSize:'0.75rem', fontWeight:600, color:C.text }}>{st.driver_name}</div>
                  <div style={{ fontSize:'0.7rem', color:C.text3 }}>{st.vehicle_no}</div>
                </div>
              )}
            </div>
          ))}
          <div style={s.card}>
            <div style={s.cardTitle}>📍 Route Progress</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.75rem' }}>
              {[['Home', '7:35 AM', true],['Stop 2 – Jayanagar', '7:52 AM', true],['Stop 3 – Indiranagar', '8:05 AM', false],['DPS Whitefield', '8:22 AM', false]].map(([stop, time, done]) => (
                <div key={stop} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background: done ? C.green : C.border, flexShrink:0 }} />
                    <span style={{ fontSize:'0.82rem', color: done ? C.text : C.text3, fontWeight: done ? 600 : 400 }}>{stop}</span>
                  </div>
                  <span style={{ fontSize:'0.75rem', color:C.text3 }}>{time}</span>
                </div>
              ))}
            </div>
          </div>
          {!activeTrip && <div style={{ ...s.card, color:C.text2, fontSize:'0.875rem', lineHeight:1.6 }}>No active trip right now. Your children are safe at home 🏠</div>}
        </div>
      </div>
    </div>
  );
}

// ── Students ─────────────────────────────────────────────────────────────────
function ParentStudents() {
  const [students, setStudents] = useState(DUMMY_STUDENTS);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', school:'', grade:'', pickup_address:'', drop_address:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/students').then(setStudents).catch(() => {}); }, []);

  const addStudent = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const st = await api.post('/students', form);
      setStudents(p => [...p, st]);
      setShowAdd(false); setForm({ name:'', school:'', grade:'', pickup_address:'', drop_address:'' });
    } catch {}
    setSaving(false);
  };

  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <h2 style={s.pageTitle}>My Children</h2>
        <button style={s.addBtn} onClick={() => setShowAdd(true)}>+ Add Child</button>
      </div>

      {showAdd && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Add a Child</h3>
          <form onSubmit={addStudent} style={s.addForm}>
            <div style={s.formRow}>
              <Field label="Child's Name"><input style={s.input} required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Aanya Sharma" /></Field>
              <Field label="School"><input style={s.input} required value={form.school} onChange={e => setForm(f=>({...f,school:e.target.value}))} placeholder="Delhi Public School" /></Field>
            </div>
            <div style={s.formRow}>
              <Field label="Grade"><input style={s.input} value={form.grade} onChange={e => setForm(f=>({...f,grade:e.target.value}))} placeholder="Grade 5" /></Field>
              <Field label="Pickup Address (PB-04)"><input style={s.input} value={form.pickup_address} onChange={e => setForm(f=>({...f,pickup_address:e.target.value}))} placeholder="12 Rose Garden, Koramangala" /></Field>
            </div>
            <Field label="Drop / School Address (PB-05)"><input style={s.input} value={form.drop_address} onChange={e => setForm(f=>({...f,drop_address:e.target.value}))} placeholder="Delhi Public School, Whitefield" /></Field>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button type="submit" disabled={saving} style={s.submitBtn}>{saving ? 'Saving...' : 'Add Child'}</button>
              <button type="button" style={s.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={s.studentGrid}>
        {students.map(st => (
          <div key={st.id} style={s.studentCard}>
            <div style={s.studentAv}>{st.name.split(' ').map(n=>n[0]).join('')}</div>
            <div style={s.studentInfo}>
              <div style={s.studentName}>{st.name}</div>
              <div style={s.studentSchool}>{st.school}</div>
              {st.grade && <div style={s.gradeBadge}>{st.grade}</div>}
              {st.pickup_address && <div style={s.addr}>📍 Pickup: {st.pickup_address}</div>}
              {st.drop_address && <div style={s.addr}>🏫 Drop: {st.drop_address}</div>}
              {st.driver_name && (
                <div style={s.assignedDriver}>
                  <span>🚌 {st.driver_name}</span>
                  <span style={s.vanNo}>{st.vehicle_no}</span>
                  <span style={s.verifiedTag}>✅ Verified</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {students.length === 0 && <div style={s.empty}>No children added yet.</div>}
      </div>
    </div>
  );
}

// ── Trips ────────────────────────────────────────────────────────────────────
function ParentTrips() {
  const [trips, setTrips] = useState(DUMMY_TRIPS);
  useEffect(() => { api.get('/trips').then(setTrips).catch(() => {}); }, []);
  const statusColor = { in_progress:C.green, completed:C.text3, scheduled:C.primary, cancelled:C.red };

  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>Trip History</h2>
      <div style={s.table}>
        <div style={{ ...s.tableHead, gridTemplateColumns:'1fr 1.5fr 1fr 2fr 1fr' }}>
          <span>Date</span><span>Driver</span><span>Vehicle</span><span>Route</span><span>Status</span>
        </div>
        {trips.map(t => (
          <div key={t.id} style={{ ...s.tableRow, gridTemplateColumns:'1fr 1.5fr 1fr 2fr 1fr' }}>
            <span style={s.mono}>{t.date}</span>
            <span style={{ fontWeight:500 }}>{t.driver_name}</span>
            <span style={s.vanTag}>{t.vehicle_no}</span>
            <span style={s.routeTxt}>{t.route || '—'}</span>
            <span style={{ ...s.statusTag, background: (statusColor[t.status] || C.primary)+'18', color: statusColor[t.status] || C.primary }}>{t.status?.replace('_',' ')}</span>
          </div>
        ))}
        {trips.length === 0 && <div style={s.empty}>No trips yet</div>}
      </div>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
function ParentNotifications() {
  const [notifs, setNotifs] = useState(DUMMY_NOTIFS);
  useEffect(() => { api.get('/students/notifications').then(setNotifs).catch(() => {}); }, []);

  const markRead = async (id) => {
    await api.patch(`/students/notifications/${id}/read`).catch(()=>{});
    setNotifs(p => p.map(n => n.id === id ? {...n, read:1} : n));
  };

  const typeIcon = { success:'✅', error:'🚨', info:'ℹ️', warning:'⚠️' };
  const typeBg = { success:C.greenBg, error:C.redBg, info:C.blueBg, warning:C.light };
  const typeColor = { success:C.green, error:C.red, info:C.blue, warning:C.dark };

  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <h2 style={s.pageTitle}>Notifications</h2>
        <span style={s.countBadge}>{notifs.filter(n=>!n.read).length} unread</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {notifs.map(n => (
          <div key={n.id} style={{ ...s.notifFull, opacity: n.read ? 0.65 : 1, borderLeft: `4px solid ${typeColor[n.type] || C.primary}` }}
            onClick={() => !n.read && markRead(n.id)}>
            <div style={{ ...s.notifTypeWrap, background: typeBg[n.type] || C.light }}>
              <span style={{ fontSize:'1.2rem' }}>{typeIcon[n.type] || 'ℹ️'}</span>
            </div>
            <div style={s.notifBody}>
              <div style={s.notifFTitle}>{n.title}</div>
              <div style={s.notifFMsg}>{n.message}</div>
              <div style={s.notifTime}>{new Date(n.created_at).toLocaleString()}</div>
            </div>
            {!n.read && <button style={s.markReadBtn} onClick={() => markRead(n.id)}>Mark read</button>}
          </div>
        ))}
        {notifs.length === 0 && <div style={s.empty}>No notifications</div>}
      </div>
    </div>
  );
}

// ── Subscription (PB-07 + PB-08) ─────────────────────────────────────────────
const PLANS = [
  { id:'trial', name:'Free Trial', price:'₹0', duration:'7 days', features:['Basic GPS tracking','Push notifications','1 child profile','Email support'], badge:'Try Free', color:'#78716C', popular:false },
  { id:'monthly', name:'Monthly Plan', price:'₹299', duration:'per month', features:['Live GPS tracking','All notifications + SOS','3 child profiles','Driver ratings & history','Priority support'], badge:'Most Popular', color:C.primary, popular:true },
  { id:'yearly', name:'Yearly Plan', price:'₹2,499', duration:'per year (save 30%)', features:['All Monthly features','Unlimited child profiles','AI Assistant access','Advanced analytics','Dedicated support'], badge:'Best Value', color:'#059669', popular:false },
];

function ParentSubscription() {
  const [selected, setSelected] = useState('monthly');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>Choose Your Plan</h2>
      <p style={{ color:C.text2, marginBottom:'1.5rem' }}>Start with a free 7-day trial. No credit card required.</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{ ...s.planCard, borderColor: selected === plan.id ? plan.color : C.border, boxShadow: selected === plan.id ? `0 4px 20px ${plan.color}30` : '0 1px 4px rgba(245,158,11,0.08)' }}
            onClick={() => setSelected(plan.id)}>
            {plan.popular && <div style={{ ...s.popularBadge, background: plan.color }}>⭐ {plan.badge}</div>}
            <div style={s.planName}>{plan.name}</div>
            <div style={{ ...s.planPrice, color: plan.color }}>{plan.price}</div>
            <div style={s.planDuration}>{plan.duration}</div>
            <div style={s.planDivider} />
            {plan.features.map(f => (
              <div key={f} style={s.planFeature}><span style={{ color:C.green }}>✓</span> {f}</div>
            ))}
          </div>
        ))}
      </div>

      {subscribed ? (
        <div style={{ ...s.card, background:C.greenBg, borderColor:'#A7F3D0', color:C.green, textAlign:'center', fontWeight:700, fontSize:'1.1rem' }}>
          🎉 Successfully subscribed! Your plan is active.
        </div>
      ) : (
        <button style={s.subscribeBtn} onClick={handleSubscribe}>
          Subscribe to {PLANS.find(p=>p.id===selected)?.name} →
        </button>
      )}

      <div style={{ ...s.card, marginTop:'1.5rem' }}>
        <div style={s.cardTitle}>🎁 Current Trial Status</div>
        <div style={s.trialBar}>
          <div style={s.trialInfo}>
            <span style={s.trialLabel}>Free Trial Active</span>
            <span style={s.trialDays}>5 days remaining</span>
          </div>
          <div style={s.trialProgress}>
            <div style={{ ...s.trialFill, width:'28%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lost & Found (PB-19) ──────────────────────────────────────────────────────
const DUMMY_LOST = [
  { id:1, item:'Blue water bottle', description:'Neon blue bottle with name sticker "Aanya"', date:'2024-06-12', status:'found', driver:'Suresh Kumar' },
  { id:2, item:'School bag (small)', description:'Purple bag with space print', date:'2024-06-08', status:'searching', driver:'Suresh Kumar' },
];

function ParentLostItem() {
  const [items, setItems] = useState(DUMMY_LOST);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item:'', description:'' });

  const report = (e) => {
    e.preventDefault();
    setItems(p => [...p, { id: Date.now(), ...form, date: new Date().toISOString().split('T')[0], status:'reported', driver:'Suresh Kumar' }]);
    setShowForm(false); setForm({ item:'', description:'' });
  };

  const statusColor = { found:C.green, searching:C.primary, reported:C.blue };
  const statusBg = { found:C.greenBg, searching:C.light, reported:C.blueBg };

  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <h2 style={s.pageTitle}>Lost & Found</h2>
        <button style={s.addBtn} onClick={() => setShowForm(true)}>+ Report Lost Item</button>
      </div>

      {showForm && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Report a Lost Item</h3>
          <form onSubmit={report} style={s.addForm}>
            <Field label="Item Name"><input style={s.input} required value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))} placeholder="e.g. Blue water bottle" /></Field>
            <Field label="Description"><textarea style={{ ...s.input, minHeight:80, resize:'vertical' }} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe the item, any identifying marks..." /></Field>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button type="submit" style={s.submitBtn}>Submit Report</button>
              <button type="button" style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {items.map(item => (
          <div key={item.id} style={{ ...s.card, borderLeft:`4px solid ${statusColor[item.status] || C.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontWeight:700, color:C.text, marginBottom:'0.25rem' }}>🎒 {item.item}</div>
                <div style={{ color:C.text2, fontSize:'0.875rem', marginBottom:'0.5rem' }}>{item.description}</div>
                <div style={{ color:C.text3, fontSize:'0.75rem' }}>Driver: {item.driver} · {item.date}</div>
              </div>
              <span style={{ ...s.statusTag, background: statusBg[item.status], color: statusColor[item.status] }}>{item.status}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={s.empty}>No reported items</div>}
      </div>
    </div>
  );
}

// ── AI Assistant (PB-22) ──────────────────────────────────────────────────────
const FAQ_DATA = [
  { q:'Where is my child right now?', a:'Your child Aanya is currently on Van KA01AB1234 driven by Suresh Kumar. The van is near Indiranagar, ETA to school is approximately 8 minutes.' },
  { q:'When will the van arrive at pickup?', a:'Based on current GPS data, the van will reach your pickup point at Koramangala in about 12 minutes. You will get a push notification 5 minutes before arrival.' },
  { q:'How do I report an issue with the driver?', a:'You can report issues by going to Settings → Report Driver, or calling our ops team at 1800-XXX-XXXX. All reports are investigated within 24 hours.' },
  { q:'What is the cancellation policy?', a:'You can cancel your subscription anytime before the next billing cycle. Refunds are processed within 5–7 business days as per our policy.' },
];

function ParentAI() {
  const [messages, setMessages] = useState([
    { role:'assistant', text:'Hi! I\'m Schuber AI 🤖. I can help you with trip status, driver info, attendance, subscription, and more. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = React.useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(m => [...m, { role:'user', text: msg }]);
    setInput('');
    setThinking(true);

    await new Promise(r => setTimeout(r, 900));

    const faq = FAQ_DATA.find(f => f.q.toLowerCase().includes(msg.toLowerCase().substring(0,10)) || msg.toLowerCase().includes(f.q.toLowerCase().substring(0,10)));
    const reply = faq?.a || 'I found relevant information: Your child\'s last known status is "Boarded" at 7:52 AM. Trip is in progress. Driver Suresh Kumar has a 4.8★ rating. For more specific queries, please contact our support team.';

    setMessages(m => [...m, { role:'assistant', text: reply }]);
    setThinking(false);
  };

  return (
    <div style={s.page}>
      <div style={{ ...s.card, display:'flex', flexDirection:'column', height:'70vh' }}>
        <div style={s.aiHeader}>
          <div style={s.aiAvatar}>🤖</div>
          <div>
            <div style={{ fontWeight:700, color:C.text }}>Schuber AI Assistant</div>
            <div style={{ fontSize:'0.75rem', color:C.green }}>● Online</div>
          </div>
        </div>

        <div style={s.aiMessages}>
          {messages.map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom:'0.75rem' }}>
              <div style={{ ...s.aiBubble, background: m.role === 'user' ? C.primary : C.white, color: m.role === 'user' ? '#fff' : C.text, borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', border: m.role === 'user' ? 'none' : `1px solid ${C.border}` }}>
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div style={{ display:'flex', gap:'0.4rem', padding:'0.75rem 1rem', background:C.white, borderRadius:'18px 18px 18px 4px', width:70, border:`1px solid ${C.border}` }}>
              <div style={{ ...s.thinkDot, animationDelay:'0s' }} /><div style={{ ...s.thinkDot, animationDelay:'0.2s' }} /><div style={{ ...s.thinkDot, animationDelay:'0.4s' }} />
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={s.aiSuggestions}>
          {FAQ_DATA.map(f => (
            <button key={f.q} style={s.suggBtn} onClick={() => send(f.q)}>{f.q}</button>
          ))}
        </div>

        <div style={s.aiInputRow}>
          <input style={s.aiInput} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about trip, driver, attendance..." />
          <button style={s.aiSendBtn} onClick={() => send()}>Send →</button>
        </div>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
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
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem' },
  card: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'1.5rem', boxShadow:'0 1px 4px rgba(245,158,11,0.06)' },
  cardHead: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' },
  cardTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', color:C.text },
  liveBadge: { background:C.greenBg, color:C.green, padding:'0.25rem 0.6rem', borderRadius:99, fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.05em' },
  tripCard: { display:'flex', gap:'1.5rem', flexWrap:'wrap' },
  tcLeft: { flex:'1 1 240px' },
  tcRight: { flex:'1 1 280px' },
  driverRow: { display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' },
  driverAv: { width:40, height:40, borderRadius:'50%', background:C.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 },
  driverName: { fontWeight:700, color:C.text },
  driverSub: { color:C.text3, fontSize:'0.78rem' },
  ratingBadge: { marginLeft:'auto', background:C.light, border:`1px solid ${C.border}`, padding:'0.25rem 0.6rem', borderRadius:8, fontSize:'0.8rem', color:C.dark, fontWeight:600 },
  studentStatuses: { display:'flex', flexDirection:'column', gap:'0.4rem' },
  studentStatus: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0.75rem', background:C.ultraLight, borderRadius:8 },
  sName: { fontSize:'0.875rem', fontWeight:600, color:C.text },
  sBadge: { padding:'0.2rem 0.6rem', borderRadius:6, fontSize:'0.75rem', fontWeight:600 },
  etaBox: { display:'flex', justifyContent:'space-between', marginTop:'0.75rem', padding:'0.5rem 0.75rem', background:C.greenBg, borderRadius:8 },
  etaLabel: { fontSize:'0.78rem', color:C.green, fontWeight:600 },
  etaValue: { fontSize:'0.78rem', color:C.green, fontWeight:700 },
  notifList: { display:'flex', flexDirection:'column', gap:'0.6rem' },
  notifItem: { display:'flex', gap:'0.75rem', alignItems:'flex-start', padding:'0.75rem', background:C.ultraLight, borderRadius:10, border:`1px solid ${C.border}` },
  notifDot: { width:8, height:8, borderRadius:'50%', flexShrink:0, marginTop:6 },
  notifContent: { flex:1 },
  notifTitle: { fontWeight:700, fontSize:'0.875rem', color:C.text, marginBottom:'0.2rem' },
  notifMsg: { color:C.text2, fontSize:'0.8rem', lineHeight:1.5 },
  notifTime: { color:C.text3, fontSize:'0.72rem', marginTop:'0.25rem' },
  unreadDot: { width:8, height:8, borderRadius:'50%', background:C.primary, flexShrink:0, marginTop:6 },
  empty: { color:C.text3, textAlign:'center', padding:'2rem', fontSize:'0.9rem' },
  trackLayout: { display:'flex', gap:'1.5rem', flexWrap:'wrap' },
  trackMain: { flex:'1 1 400px' },
  trackSide: { flex:'0 0 280px', display:'flex', flexDirection:'column', gap:'0.75rem' },
  mapBox: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, overflow:'hidden' },
  mapHeader: { padding:'0.875rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}` },
  mapTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.9rem', color:C.text },
  etaChip: { background:C.greenBg, color:C.green, padding:'0.2rem 0.6rem', borderRadius:6, fontSize:'0.75rem', fontWeight:600 },
  sCard: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:12, padding:'1rem', display:'flex', gap:'0.75rem', alignItems:'flex-start' },
  sAv: { width:36, height:36, borderRadius:'50%', background:'#8B5CF6', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem', flexShrink:0 },
  sInfo: { flex:1 },
  sCardName: { fontWeight:700, fontSize:'0.9rem', color:C.text, marginBottom:'0.15rem' },
  sCardSub: { color:C.text3, fontSize:'0.75rem', marginBottom:'0.4rem' },
  vanStatus: { display:'inline-block', padding:'0.2rem 0.5rem', borderRadius:6, fontSize:'0.72rem', fontWeight:600 },
  driverMini: { flexShrink:0, textAlign:'right' },
  pageHead: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  pageTitle: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.15rem', color:C.text },
  addBtn: { background:C.primary, border:'none', color:'#fff', padding:'0.5rem 1.25rem', borderRadius:8, fontWeight:700, fontSize:'0.875rem' },
  addForm: { display:'flex', flexDirection:'column', gap:'1rem', marginTop:'0.5rem' },
  formRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },
  input: { background:C.ultraLight, border:`1.5px solid ${C.border}`, borderRadius:8, padding:'0.65rem 0.875rem', color:C.text, fontSize:'0.9rem' },
  submitBtn: { background:C.primary, border:'none', color:'#fff', padding:'0.65rem 1.5rem', borderRadius:8, fontWeight:700 },
  cancelBtn: { background:'transparent', border:`1px solid ${C.border}`, color:C.text2, padding:'0.65rem 1.25rem', borderRadius:8 },
  studentGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1rem' },
  studentCard: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:'1.5rem', display:'flex', gap:'1rem' },
  studentAv: { width:48, height:48, borderRadius:'50%', background:C.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.9rem', flexShrink:0 },
  studentInfo: { flex:1 },
  studentName: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', color:C.text, marginBottom:'0.2rem' },
  studentSchool: { color:C.text2, fontSize:'0.8rem', marginBottom:'0.5rem' },
  gradeBadge: { display:'inline-block', background:'rgba(139,92,246,0.1)', color:'#7C3AED', padding:'0.15rem 0.5rem', borderRadius:6, fontSize:'0.72rem', marginBottom:'0.5rem' },
  addr: { color:C.text3, fontSize:'0.75rem', marginBottom:'0.3rem' },
  assignedDriver: { display:'flex', gap:'0.5rem', alignItems:'center', fontSize:'0.78rem', color:C.green, marginTop:'0.3rem' },
  vanNo: { color:C.text3, fontFamily:'monospace' },
  verifiedTag: { background:C.greenBg, color:C.green, padding:'0.1rem 0.4rem', borderRadius:5, fontSize:'0.68rem', fontWeight:600 },
  table: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, overflow:'hidden' },
  tableHead: { display:'grid', padding:'0.875rem 1.25rem', background:C.light, fontSize:'0.72rem', color:C.dark, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:700 },
  tableRow: { display:'grid', padding:'0.875rem 1.25rem', borderTop:`1px solid ${C.border}`, fontSize:'0.875rem', color:C.text, alignItems:'center' },
  mono: { color:C.text3, fontFamily:'monospace', fontSize:'0.8rem' },
  vanTag: { fontFamily:'monospace', fontSize:'0.8rem', color:C.dark, fontWeight:600 },
  routeTxt: { color:C.text2, fontSize:'0.8rem' },
  statusTag: { display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:6, fontSize:'0.72rem', fontWeight:700, textTransform:'capitalize' },
  countBadge: { background:C.light, color:C.dark, padding:'0.3rem 0.8rem', borderRadius:99, fontSize:'0.78rem', fontWeight:700 },
  notifFull: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:12, padding:'1rem', display:'flex', gap:'0.875rem', alignItems:'flex-start', cursor:'pointer' },
  notifTypeWrap: { width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  notifBody: { flex:1 },
  notifFTitle: { fontWeight:700, color:C.text, marginBottom:'0.25rem' },
  notifFMsg: { color:C.text2, fontSize:'0.875rem', lineHeight:1.5 },
  markReadBtn: { background:C.light, border:`1px solid ${C.border}`, color:C.dark, padding:'0.3rem 0.75rem', borderRadius:7, fontSize:'0.75rem', fontWeight:600, flexShrink:0 },
  planCard: { background:C.white, border:'2px solid', borderRadius:16, padding:'1.5rem', cursor:'pointer', position:'relative', transition:'box-shadow 0.2s' },
  popularBadge: { position:'absolute', top:-12, right:16, color:'#fff', padding:'0.2rem 0.75rem', borderRadius:99, fontSize:'0.72rem', fontWeight:700 },
  planName: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.1rem', color:C.text, marginBottom:'0.5rem', marginTop:'0.5rem' },
  planPrice: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'2rem', lineHeight:1 },
  planDuration: { color:C.text3, fontSize:'0.78rem', marginBottom:'1rem' },
  planDivider: { height:1, background:C.border, marginBottom:'1rem' },
  planFeature: { color:C.text2, fontSize:'0.875rem', marginBottom:'0.5rem', display:'flex', gap:'0.4rem' },
  subscribeBtn: { background:C.primary, border:'none', color:'#fff', padding:'0.875rem 2.5rem', borderRadius:12, fontSize:'1rem', fontWeight:700, alignSelf:'flex-start' },
  trialBar: { marginTop:'0.75rem' },
  trialInfo: { display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' },
  trialLabel: { fontSize:'0.875rem', color:C.text2 },
  trialDays: { fontSize:'0.875rem', fontWeight:700, color:C.primary },
  trialProgress: { height:8, background:C.light, borderRadius:99, overflow:'hidden' },
  trialFill: { height:'100%', background:C.primary, borderRadius:99 },
  aiHeader: { display:'flex', gap:'0.75rem', alignItems:'center', marginBottom:'1rem', paddingBottom:'1rem', borderBottom:`1px solid ${C.border}` },
  aiAvatar: { width:40, height:40, borderRadius:'50%', background:C.light, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' },
  aiMessages: { flex:1, overflowY:'auto', padding:'0.5rem 0', display:'flex', flexDirection:'column' },
  aiBubble: { maxWidth:'75%', padding:'0.75rem 1rem', fontSize:'0.875rem', lineHeight:1.6 },
  thinkDot: { width:6, height:6, borderRadius:'50%', background:C.primary, animation:'pulse 1.4s ease-in-out infinite' },
  aiSuggestions: { display:'flex', gap:'0.5rem', flexWrap:'wrap', padding:'0.75rem 0', borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, marginBottom:'0.75rem' },
  suggBtn: { background:C.light, border:`1px solid ${C.border}`, color:C.dark, padding:'0.35rem 0.75rem', borderRadius:99, fontSize:'0.75rem', fontWeight:500 },
  aiInputRow: { display:'flex', gap:'0.5rem' },
  aiInput: { flex:1, background:C.ultraLight, border:`1.5px solid ${C.border}`, borderRadius:10, padding:'0.65rem 1rem', color:C.text, fontSize:'0.9rem' },
  aiSendBtn: { background:C.primary, border:'none', color:'#fff', padding:'0.65rem 1.25rem', borderRadius:10, fontWeight:700 },
};
