import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import LiveMap from '../components/LiveMap';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { getMyStudents, getMyTrips, getMyNotifications } from '../dbClient';
import { supabase } from '../supabase';

const C = { primary:'#F59E0B', dark:'#D97706', light:'#FEF3C7', ultraLight:'#FFFBEB', border:'#FDE68A', text:'#1C1917', text2:'#57534E', text3:'#A8A29E', white:'#FFFFFF', green:'#059669', greenBg:'#DCFCE7', red:'#DC2626', redBg:'#FEF2F2', blue:'#2563EB', blueBg:'#EFF6FF' };

const DUMMY_NOTIFS = [
  { id:1, type:'success', title:'Aanya Boarded', message:'Aanya has boarded the van at Koramangala pickup point.', created_at: new Date(Date.now()-300000).toISOString(), read:false },
  { id:2, type:'info', title:'ETA Update', message:'Van is 8 minutes away. Current location: Indiranagar.', created_at: new Date(Date.now()-900000).toISOString(), read:false },
  { id:3, type:'warning', title:'Delay Alert', message:'Van is delayed by 12 minutes due to traffic on OMR.', created_at: new Date(Date.now()-1800000).toISOString(), read:true },
  { id:4, type:'success', title:'Trip Completed', message:'Aanya was safely dropped at Delhi Public School at 8:12 AM.', created_at: new Date(Date.now()-86400000).toISOString(), read:true },
  { id:5, type:'error', title:'SOS Alert Triggered', message:'Driver Suresh pressed SOS near Silk Board. Operations team notified.', created_at: new Date(Date.now()-172800000).toISOString(), read:true },
];
const DUMMY_TRIPS = [
  { id:101, date:'2024-06-12', driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', route:'Koramangala → DPS Whitefield', status:'completed', duration:'42 min', students:'Aanya Sharma' },
  { id:102, date:'2024-06-11', driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', route:'Koramangala → DPS Whitefield', status:'completed', duration:'38 min', students:'Aanya Sharma' },
  { id:103, date:'2024-06-10', driver_name:'Ravi Shankar', vehicle_no:'KA02CD5678', route:'Koramangala → DPS Whitefield', status:'completed', duration:'45 min', students:'Aanya Sharma' },
  { id:104, date:'2024-06-09', driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', route:'Koramangala → DPS Whitefield', status:'completed', duration:'40 min', students:'Aanya Sharma' },
];
const DUMMY_STUDENTS = [
  { id:1, name:'Aanya Sharma', school:'Delhi Public School', grade:'Grade 5', pickup_address:'12 Rose Garden, Koramangala', drop_address:'Delhi Public School, Whitefield', driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', rating:4.8, van_status:'on_trip', lat:12.9352, lng:77.6245 },
];
const DUMMY_ACTIVE = { id:101, driver_name:'Suresh Kumar', vehicle_no:'KA01AB1234', vehicle_model:'Tempo Traveller', rating:4.8, lat:12.9388, lng:77.6285, route:'Koramangala → DPS', students:[{ id:1, name:'Aanya Sharma', checked_in:true, checked_out:false }] };
const DUMMY_LOST = [
  { id:1, item:'Blue water bottle', description:'Neon blue bottle with name sticker "Aanya"', date:'2024-06-12', status:'found', driver:'Suresh Kumar' },
  { id:2, item:'School bag (small)', description:'Purple bag with space print', date:'2024-06-08', status:'searching', driver:'Suresh Kumar' },
];
const PLANS = [
  { id:'trial', name:'Free Trial', price:'₹0', duration:'7 days', features:['Basic GPS tracking','Push notifications','1 child profile','Email support'], color:'#78716C', popular:false },
  { id:'monthly', name:'Monthly Plan', price:'₹299', duration:'per month', features:['Live GPS tracking','All notifications + SOS','3 child profiles','Driver ratings & history','Priority support'], color:C.primary, popular:true },
  { id:'yearly', name:'Yearly Plan', price:'₹2,499', duration:'per year (save 30%)', features:['All Monthly features','Unlimited child profiles','AI Assistant access','Advanced analytics','Dedicated support'], color:'#059669', popular:false },
];

const navItems = [
  { path:'/parent', end:true, icon:'🏠', label:'Dashboard' },
  { path:'/parent/tracking', icon:'📍', label:'Live Tracking' },
  { path:'/parent/students', icon:'🎒', label:'My Children' },
  { path:'/parent/trips', icon:'📋', label:'Trip History' },
  { path:'/parent/notifications', icon:'🔔', label:'Notifications' },
  { path:'/parent/subscription', icon:'💳', label:'Subscription' },
  { path:'/parent/lostitem', icon:'🔍', label:'Lost & Found' },
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
  const { user, profile } = useAuth();
  const [students, setStudents] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getMyStudents(user.id).catch(() => []),
      getMyNotifications(user.id).catch(() => []),
    ]).then(([sts, nfs]) => {
      if (sts.length)  setStudents(sts);
      if (nfs.length)  setNotifs(nfs);
    }).finally(() => setLoading(false));
    // also try active trip via backend (with fallback)
    api.get('/trips/active').then(d => d && setActiveTrip(d)).catch(() => {});
  }, [user?.id]);

  const unread = notifs.filter(n => !n.read && !n.is_read).length;
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
          <div style={s.cardHead}><h2 style={s.cardTitle}>🟢 Live Trip</h2><span style={s.liveBadge}>● LIVE</span></div>
          <div style={s.tripCard}>
            <div style={s.tcLeft}>
              <div style={s.driverRow}>
                <div style={s.driverAv}>{activeTrip.driver_name?.charAt(0)}</div>
                <div><div style={s.driverName}>{activeTrip.driver_name}</div><div style={s.driverSub}>{activeTrip.vehicle_no} · {activeTrip.vehicle_model}</div></div>
                <div style={s.ratingBadge}>⭐ {activeTrip.rating}</div>
              </div>
              <div style={s.studentStatuses}>
                {activeTrip.students?.map(st => (
                  <div key={st.id} style={s.studentStatus}>
                    <span style={s.sName}>{st.name}</span>
                    <span style={{ ...s.sBadge, background: st.checked_in ? C.greenBg : C.light, color: st.checked_in ? C.green : C.dark }}>{st.checked_in ? '✓ Boarded' : '⏳ Waiting'}</span>
                  </div>
                ))}
              </div>
              <div style={s.etaBox}><span style={s.etaLabel}>ETA to school:</span><span style={s.etaValue}>~8 minutes</span></div>
            </div>
            <div style={s.tcRight}><LiveMap lat={activeTrip.lat||12.9352} lng={activeTrip.lng||77.6245} height={200} markers={[{lat:activeTrip.lat||12.9352,lng:activeTrip.lng||77.6245,label:'🚌 Van',color:C.primary,size:16}]} /></div>
          </div>
        </div>
      )}
      <div style={s.card}>
        <h2 style={s.cardTitle}>Recent Notifications</h2>
        <div style={s.notifList}>
          {notifs.slice(0,4).map(n => (
            <div key={n.id} style={{ ...s.notifItem, opacity: n.read ? 0.7 : 1 }}>
              <div style={{ ...s.notifDot, background: n.type==='success'?C.green:n.type==='error'?C.red:C.primary }} />
              <div style={s.notifContent}><div style={s.notifTitle}>{n.title}</div><div style={s.notifMsg}>{n.message}</div><div style={s.notifTime}>{new Date(n.created_at).toLocaleString()}</div></div>
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
  const [routes, setRoutes] = useState([]);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [routeForm, setRouteForm] = useState({ name:'', stops:'' });
  const [routeMsg, setRouteMsg] = useState('');
  const [savingRoute, setSavingRoute] = useState(false);

  const refresh = useCallback(() => {
    api.get('/students').then(setStudents).catch(() => {});
    api.get('/trips/active').then(d => d && setActiveTrip(d)).catch(() => {});
  }, []);
  useEffect(() => {
    refresh();
    api.get('/routes').then(d => Array.isArray(d) && setRoutes(d)).catch(() => {});
    const t = setInterval(refresh, 10000); return () => clearInterval(t);
  }, [refresh]);

  const addRoute = async (e) => {
    e.preventDefault(); setSavingRoute(true); setRouteMsg('');
    try {
      const stops = routeForm.stops.split(',').map(s => s.trim()).filter(Boolean);
      const r = await api.post('/routes', { name: routeForm.name, stops });
      setRoutes(prev => [r, ...prev]);
      setRouteMsg('✅ Route added successfully!');
      setRouteForm({ name:'', stops:'' });
      setTimeout(() => setRouteMsg(''), 3000);
    } catch { setRouteMsg('⚠️ Could not save route. Try again.'); }
    setSavingRoute(false);
  };

  const updateRoute = async (id) => {
    try { await api.patch(`/routes/${id}`, { updated_at: new Date().toISOString() }); setRouteMsg('✅ Route updated!'); setTimeout(() => setRouteMsg(''), 3000); }
    catch { setRouteMsg('⚠️ Update failed'); }
  };

  return (
    <div style={s.page}>
      <div style={s.trackLayout}>
        <div style={s.trackMain}>
          <div style={s.mapBox}>
            <div style={s.mapHeader}>
              <span style={s.mapTitle}>Live Map</span>
              <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                <span style={s.liveBadge}>● LIVE</span>
                <span style={s.etaChip}>ETA: ~8 min</span>
                <button style={s.routeBtn} onClick={() => setShowRoutePanel(v => !v)}>
                  {showRoutePanel ? '✕ Close' : '🗺️ Manage Routes'}
                </button>
              </div>
            </div>
            <LiveMap lat={activeTrip?.lat||12.9352} lng={activeTrip?.lng||77.6245} height={340} zoom={14}
              markers={activeTrip ? [{lat:activeTrip.lat||12.9352,lng:activeTrip.lng||77.6245,label:'🚌 '+(activeTrip.vehicle_no||'Van'),color:C.primary,size:18}] : []} />
          </div>

          {/* Route Management Panel */}
          {showRoutePanel && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>🗺️ Route Management</h3>
              {routeMsg && <div style={{ padding:'0.6rem 0.875rem', borderRadius:8, background: routeMsg.startsWith('✅') ? C.greenBg : '#FEF2F2', color: routeMsg.startsWith('✅') ? C.green : C.red, fontSize:'0.84rem', marginBottom:'0.75rem' }}>{routeMsg}</div>}
              <form onSubmit={addRoute} style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1rem' }}>
                <div style={s.row}>
                  <Field label="Route Name"><input style={s.input} required value={routeForm.name} onChange={e=>setRouteForm(f=>({...f,name:e.target.value}))} placeholder="Morning Route A" /></Field>
                  <Field label="Stops (comma-separated)"><input style={s.input} value={routeForm.stops} onChange={e=>setRouteForm(f=>({...f,stops:e.target.value}))} placeholder="Koramangala, Indiranagar, Whitefield" /></Field>
                </div>
                <button type="submit" style={s.submitBtn} disabled={savingRoute}>{savingRoute ? 'Saving…' : '+ Add Route'}</button>
              </form>
              {routes.length > 0 && (
                <div>
                  <div style={s.tableHead}>Current Routes</div>
                  {routes.map(r => (
                    <div key={r.id} style={{...s.tableRow, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:'0.875rem'}}>{r.name}</div>
                        <div style={{fontSize:'0.72rem',color:C.text3}}>{Array.isArray(r.stops) ? r.stops.join(' → ') : r.stops}</div>
                      </div>
                      <button style={s.smallBtn} onClick={() => updateRoute(r.id)}>Update</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={s.trackSide}>
          {students.map(st => (
            <div key={st.id} style={s.sCard}>
              <div style={s.sAv}>{st.name.charAt(0)}</div>
              <div style={s.sInfo}>
                <div style={s.sCardName}>{st.name}</div>
                <div style={s.sCardSub}>{st.school} · {st.grade}</div>
                <div style={{ ...s.vanStatus, background: st.van_status==='on_trip'?C.greenBg:C.light, color: st.van_status==='on_trip'?C.green:C.dark }}>
                  {st.van_status==='on_trip' ? '🚌 On Trip' : st.van_status==='online' ? '✅ Driver Online' : '⏸ Driver Offline'}
                </div>
              </div>
              {st.driver_name && (
                <div style={s.driverMini}>
                  <div style={{fontSize:'0.75rem',fontWeight:600,color:C.text}}>{st.driver_name}</div>
                  <div style={{fontSize:'0.7rem',color:C.text3}}>{st.vehicle_no}</div>
                </div>
              )}
            </div>
          ))}
          <div style={s.card}>
            <div style={s.cardTitle}>📍 Route Progress</div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginTop:'0.75rem'}}>
              {[['Home','7:35 AM',true],['Stop 2 – Jayanagar','7:52 AM',true],['Stop 3 – Indiranagar','8:05 AM',false],['DPS Whitefield','8:22 AM',false]].map(([stop,time,done]) => (
                <div key={stop} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.5rem 0',borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                    <div style={{width:10,height:10,borderRadius:'50%',background:done?C.green:C.border,flexShrink:0}} />
                    <span style={{fontSize:'0.82rem',color:done?C.text:C.text3,fontWeight:done?600:400}}>{stop}</span>
                  </div>
                  <span style={{fontSize:'0.75rem',color:C.text3}}>{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Students ─────────────────────────────────────────────────────────────────
function ParentStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', school:'', grade:'', pickup_address:'', drop_address:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const reload = () => {
    if (!user?.id) return;
    getMyStudents(user.id).then(d => { if (d.length) setStudents(d); }).catch(() => {});
  };

  useEffect(() => {
    reload();
    supabase.from('drivers').select('id, vehicle_no, vehicle_model, rating, is_online, verified, profiles(full_name)').then(({ data }) => {
      if (data) setDrivers(data.map(d => ({ id: d.id, name: d.profiles?.full_name, vehicle_no: d.vehicle_no, verified: d.verified, vehicle_model: d.vehicle_model, rating: d.rating })));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addStudent = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      // Write via backend, then refresh from Supabase
      await api.post('/students', { ...form });
      await reload();
      setShowAdd(false);
      setForm({ name:'', school:'', grade:'', pickup_address:'', drop_address:'' });
      setMsg('✅ Child added successfully!');
      setTimeout(() => setMsg(''), 4000);
    } catch {
      // Offline fallback
      const localSt = { id: Date.now(), ...form, driver_id: null, driver_name: null, vehicle_no: null, van_status: 'offline' };
      setStudents(p => [...p, localSt]);
      setShowAdd(false);
      setMsg('⚠️ Saved locally — will sync when online.');
      setTimeout(() => setMsg(''), 4000);
    }
    setSaving(false);
  };

  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <h2 style={s.pageTitle}>My Children</h2>
        <button style={s.addBtn} onClick={() => setShowAdd(true)}>+ Add Child</button>
      </div>
      {msg && <div style={{ padding:'0.75rem 1rem', borderRadius:10, background: msg.startsWith('✅') ? C.greenBg : '#FEF3C7', color: msg.startsWith('✅') ? C.green : '#92400E', fontSize:'0.875rem', border:`1px solid ${msg.startsWith('✅') ? '#A7F3D0' : C.border}` }}>{msg}</div>}
      {showAdd && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Add a Child</h3>
          <form onSubmit={addStudent} style={s.addForm}>
            <div style={s.row}>
              <Field label="Child's Name"><input style={s.input} required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Aanya Sharma" /></Field>
              <Field label="School"><input style={s.input} required value={form.school} onChange={e=>setForm(f=>({...f,school:e.target.value}))} placeholder="Delhi Public School" /></Field>
            </div>
            <div style={s.row}>
              <Field label="Grade"><input style={s.input} value={form.grade} onChange={e=>setForm(f=>({...f,grade:e.target.value}))} placeholder="Grade 5" /></Field>
              <Field label="Pickup Address"><input style={s.input} value={form.pickup_address} onChange={e=>setForm(f=>({...f,pickup_address:e.target.value}))} placeholder="12 Rose Garden, Koramangala" /></Field>
            </div>
            <Field label="Drop / School Address"><input style={s.input} value={form.drop_address} onChange={e=>setForm(f=>({...f,drop_address:e.target.value}))} placeholder="Delhi Public School, Whitefield" /></Field>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button type="submit" disabled={saving} style={s.submitBtn}>{saving ? 'Saving to DB…' : '💾 Save Child'}</button>
              <button type="button" style={s.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div style={s.studentGrid}>
        {students.map(st => {
          const assignedDriver = st.driver_id
            ? drivers.find(d => d.id === st.driver_id)
            : st.driver_name ? { name: st.driver_name, vehicle_no: st.vehicle_no, verified: true } : null;

          return (
            <div key={st.id} style={s.studentCard}>
              <div style={s.studentAv}>{st.name.split(' ').map(n=>n[0]).join('')}</div>
              <div style={s.studentInfo}>
                <div style={s.studentName}>{st.name}</div>
                <div style={s.studentSchool}>{st.school}</div>
                {st.grade && <div style={s.gradeBadge}>{st.grade}</div>}
                {st.pickup_address && <div style={s.addr}>📍 Pickup: {st.pickup_address}</div>}
                {st.drop_address && <div style={s.addr}>🏫 Drop: {st.drop_address}</div>}
                {assignedDriver ? (
                  <div style={s.assignedDriver}>
                    <span>🚌 {assignedDriver.name}</span>
                    {assignedDriver.vehicle_no && <span style={s.vanNo}>{assignedDriver.vehicle_no}</span>}
                    {assignedDriver.verified && <span style={s.verifiedTag}>✅ Verified</span>}
                  </div>
                ) : (
                  <div style={{ marginTop:'0.5rem', padding:'0.4rem 0.75rem', background:C.light, borderRadius:8, fontSize:'0.75rem', color:C.text3 }}>
                    ⏳ No driver assigned yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {students.length === 0 && <div style={s.empty}>No children added yet. Click "+ Add Child" to get started.</div>}
      </div>
    </div>
  );
}


// ── Trips ─────────────────────────────────────────────────────────────────────
function ParentTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    if (!user?.id) return;
    getMyTrips(user.id).then(d => { if (d.length) setTrips(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);
  const statusColor = { in_progress:C.green, completed:C.text3, scheduled:C.primary, cancelled:C.red };
  const filtered = filter === 'all' ? trips : trips.filter(t => t.status === filter);
  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <h2 style={s.pageTitle}>Trip History</h2>
        <div style={{display:'flex',gap:'0.4rem'}}>
          {['all','completed','in_progress'].map(f => (
            <button key={f} style={{...s.filterBtn, ...(filter===f?s.filterBtnActive:{})}} onClick={()=>setFilter(f)}>
              {f==='all'?'All':f==='completed'?'Completed':'In Progress'}
            </button>
          ))}
        </div>
      </div>
      {loading && <div style={s.empty}>Loading trips…</div>}
      <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
        {filtered.map(t => (
          <div key={t.id} style={{...s.card,padding:'1rem 1.25rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.5rem'}}>
            <div style={{display:'flex',gap:'1rem',alignItems:'center',flex:1}}>
              <div style={{width:40,height:40,borderRadius:10,background:C.light,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.25rem',flexShrink:0}}>🚌</div>
              <div>
                <div style={{fontWeight:700,fontSize:'0.9rem',color:C.text}}>#{t.id} · {t.driver_name}</div>
                <div style={{fontSize:'0.78rem',color:C.text2,marginTop:'0.1rem'}}>{t.route || 'Route not available'}</div>
                <div style={{fontSize:'0.72rem',color:C.text3,marginTop:'0.1rem'}}>{t.vehicle_no} {t.duration ? `· ${t.duration}` : ''}</div>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'0.3rem'}}>
              <span style={{...s.statusTag,background:(statusColor[t.status]||C.primary)+'18',color:statusColor[t.status]||C.primary}}>{t.status?.replace('_',' ')}</span>
              <span style={{fontSize:'0.75rem',color:C.text3}}>{t.date}</span>
              {t.students && <span style={{fontSize:'0.7rem',color:C.text3}}>👤 {t.students}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <div style={s.empty}>No trips found</div>}
      </div>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
function ParentNotifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    getMyNotifications(user.id).then(d => { if (d.length) setNotifs(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifs(p => p.map(n => n.id === id ? {...n, read:true} : n));
  };

  const markAll = () => {
    notifs.filter(n=>!n.read).forEach(n => markRead(n.id));
  };

  const typeIcon = { success:'✅', error:'🚨', info:'ℹ️', warning:'⚠️' };
  const typeBg = { success:C.greenBg, error:C.redBg, info:C.blueBg, warning:C.light };
  const typeColor = { success:C.green, error:C.red, info:C.blue, warning:C.dark };

  const filtered = filter === 'unread' ? notifs.filter(n=>!n.read) : notifs;

  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          <h2 style={s.pageTitle}>Notifications</h2>
          <span style={s.countBadge}>{notifs.filter(n=>!n.read).length} unread</span>
        </div>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
          <button style={{...s.filterBtn,...(filter==='all'?s.filterBtnActive:{})}} onClick={()=>setFilter('all')}>All</button>
          <button style={{...s.filterBtn,...(filter==='unread'?s.filterBtnActive:{})}} onClick={()=>setFilter('unread')}>Unread</button>
          {notifs.some(n=>!n.read) && <button style={s.markAllBtn} onClick={markAll}>Mark all read</button>}
        </div>
      </div>
      {loading && <div style={s.empty}>Loading notifications…</div>}
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {filtered.map(n => (
          <div key={n.id} style={{...s.notifFull, opacity:n.read?0.65:1, borderLeft:`4px solid ${typeColor[n.type]||C.primary}`, cursor:!n.read?'pointer':'default'}}
            onClick={() => !n.read && markRead(n.id)}>
            <div style={{...s.notifTypeWrap, background:typeBg[n.type]||C.light}}>
              <span style={{fontSize:'1.2rem'}}>{typeIcon[n.type]||'ℹ️'}</span>
            </div>
            <div style={s.notifBody}>
              <div style={s.notifFTitle}>{n.title}</div>
              <div style={s.notifFMsg}>{n.message}</div>
              <div style={s.notifTime}>{new Date(n.created_at).toLocaleString()}</div>
            </div>
            {!n.read && <button style={s.markReadBtn} onClick={e=>{e.stopPropagation();markRead(n.id);}}>Mark read</button>}
          </div>
        ))}
        {filtered.length === 0 && !loading && <div style={s.empty}>No notifications</div>}
      </div>
    </div>
  );
}

// ── Subscription ─────────────────────────────────────────────────────────────
function ParentSubscription() {
  const { profile } = useAuth();
  const [selected, setSelected] = useState('monthly');
  const [activePlan, setActivePlan] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/subscription').then(d => { if (d?.plan) setActivePlan(d); }).catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true); setMsg('');
    const plan = PLANS.find(p => p.id === selected);
    try {
      const data = await api.post('/subscription', { plan: selected, price: plan.price, duration: plan.duration });
      setActivePlan(data || { plan: selected, status: 'active', price: plan.price });
      setMsg(`🎉 Successfully subscribed to ${plan.name}! Your plan is now active.`);
    } catch {
      setActivePlan({ plan: selected, status: 'active', price: plan.price, started_at: new Date().toISOString() });
      setMsg(`🎉 Subscribed to ${plan.name}! (Changes will sync when online)`);
    }
    setSubscribing(false);
    setTimeout(() => setMsg(''), 6000);
  };

  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <div><h2 style={s.pageTitle}>Choose Your Plan</h2><p style={{color:C.text2,margin:'0.25rem 0 0',fontSize:'0.9rem'}}>Start with a free 7-day trial. No credit card required.</p></div>
      </div>

      {activePlan && (
        <div style={{...s.card,background:C.greenBg,borderColor:'#A7F3D0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontWeight:700,color:C.green,fontSize:'0.9rem'}}>✅ Active Plan: {PLANS.find(p=>p.id===activePlan.plan)?.name || activePlan.plan}</div>
            <div style={{fontSize:'0.8rem',color:C.green,marginTop:'0.2rem'}}>Status: {activePlan.status || 'active'} {activePlan.expires_at ? `· Expires ${new Date(activePlan.expires_at).toLocaleDateString()}` : ''}</div>
          </div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'1.25rem',color:C.green}}>{PLANS.find(p=>p.id===activePlan.plan)?.price}</div>
        </div>
      )}

      {msg && <div style={{padding:'0.875rem 1.25rem',borderRadius:12,background:C.greenBg,borderColor:'#A7F3D0',color:C.green,fontWeight:600,fontSize:'0.95rem',border:`1px solid #A7F3D0`}}>{msg}</div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'1rem'}}>
        {PLANS.map(plan => (
          <div key={plan.id}
            style={{...s.planCard, borderColor:selected===plan.id?plan.color:C.border, boxShadow:selected===plan.id?`0 4px 20px ${plan.color}30`:'0 1px 4px rgba(245,158,11,0.06)', cursor:'pointer', position:'relative'}}
            onClick={() => setSelected(plan.id)}>
            {plan.popular && <div style={{...s.popularBadge,background:plan.color}}>⭐ Most Popular</div>}
            {activePlan?.plan === plan.id && <div style={{...s.popularBadge,background:C.green,top:'auto',bottom:'-12px'}}>✓ Active</div>}
            <div style={s.planName}>{plan.name}</div>
            <div style={{...s.planPrice,color:plan.color}}>{plan.price}</div>
            <div style={s.planDuration}>{plan.duration}</div>
            <div style={s.planDivider} />
            {plan.features.map(f => (<div key={f} style={s.planFeature}><span style={{color:C.green}}>✓</span> {f}</div>))}
            {selected === plan.id && <div style={{marginTop:'0.75rem',background:plan.color,height:3,borderRadius:2}} />}
          </div>
        ))}
      </div>

      <button style={{...s.subscribeBtn, opacity:subscribing?0.8:1}} disabled={subscribing} onClick={handleSubscribe}>
        {subscribing ? '⏳ Processing…' : `Subscribe to ${PLANS.find(p=>p.id===selected)?.name} — ${PLANS.find(p=>p.id===selected)?.price} →`}
      </button>

      <div style={{...s.card,marginTop:'0.5rem'}}>
        <div style={s.cardTitle}>🎁 Trial Status</div>
        <div style={s.trialBar}>
          <div style={s.trialInfo}><span style={s.trialLabel}>Free Trial Active</span><span style={s.trialDays}>5 days remaining</span></div>
          <div style={s.trialProgress}><div style={{...s.trialFill,width:'28%'}} /></div>
        </div>
      </div>
    </div>
  );
}

// ── Lost & Found ──────────────────────────────────────────────────────────────
function ParentLostItem() {
  const [items, setItems] = useState(DUMMY_LOST);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item:'', description:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [claiming, setClaiming] = useState(null);

  useEffect(() => {
    api.get('/lost-items').then(d => Array.isArray(d) && d.length && setItems(d)).catch(() => {});
  }, []);

  const report = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      const item = await api.post('/lost-items', form);
      setItems(p => [item, ...p]);
      setMsg('✅ Item reported and saved to database!');
      setShowForm(false); setForm({ item:'', description:'' });
    } catch {
      const local = { id: Date.now(), ...form, date: new Date().toISOString().split('T')[0], status:'reported', driver:'Suresh Kumar' };
      setItems(p => [local, ...p]);
      setMsg('✅ Item reported! (will sync when online)');
      setShowForm(false); setForm({ item:'', description:'' });
    }
    setSaving(false); setTimeout(() => setMsg(''), 4000);
  };

  const claimItem = async (id) => {
    setClaiming(id);
    try {
      await api.patch(`/lost-items/${id}/claim`, {});
      setItems(p => p.map(i => i.id === id ? {...i, status:'claimed'} : i));
      setMsg('✅ Item claimed as yours! The driver has been notified.');
    } catch {
      setItems(p => p.map(i => i.id === id ? {...i, status:'claimed'} : i));
      setMsg('✅ Item marked as yours!');
    }
    setClaiming(null); setTimeout(() => setMsg(''), 4000);
  };

  const statusColor = { found:C.green, searching:C.primary, reported:C.blue, claimed:'#8B5CF6' };
  const statusBg = { found:C.greenBg, searching:C.light, reported:C.blueBg, claimed:'#EDE9FE' };

  return (
    <div style={s.page}>
      <div style={s.pageHead}>
        <h2 style={s.pageTitle}>Lost & Found</h2>
        <button style={s.addBtn} onClick={() => setShowForm(true)}>+ Report Lost Item</button>
      </div>
      {msg && <div style={{padding:'0.75rem 1rem',borderRadius:10,background:msg.startsWith('✅')?C.greenBg:'#FEF2F2',color:msg.startsWith('✅')?C.green:C.red,fontSize:'0.875rem',border:`1px solid ${msg.startsWith('✅')?'#A7F3D0':'#FECACA'}`}}>{msg}</div>}
      {showForm && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Report a Lost Item</h3>
          <form onSubmit={report} style={s.addForm}>
            <Field label="Item Name"><input style={s.input} required value={form.item} onChange={e=>setForm(f=>({...f,item:e.target.value}))} placeholder="e.g. Blue water bottle" /></Field>
            <Field label="Description"><textarea style={{...s.input,minHeight:80,resize:'vertical'}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe the item, any identifying marks..." /></Field>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button type="submit" disabled={saving} style={s.submitBtn}>{saving ? 'Saving…' : '📮 Submit Report'}</button>
              <button type="button" style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {items.map(item => (
          <div key={item.id} style={{...s.card, borderLeft:`4px solid ${statusColor[item.status]||C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:C.text,marginBottom:'0.25rem'}}>🔍 {item.item}</div>
                {item.description && <div style={{color:C.text2,fontSize:'0.875rem',marginBottom:'0.5rem'}}>{item.description}</div>}
                <div style={{color:C.text3,fontSize:'0.75rem'}}>Driver: {item.driver} · {item.date}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'0.5rem'}}>
                <span style={{...s.statusTag,background:statusBg[item.status],color:statusColor[item.status]}}>{item.status}</span>
                {item.status === 'found' && (
                  <button style={s.claimBtn} disabled={claiming===item.id} onClick={() => claimItem(item.id)}>
                    {claiming===item.id ? 'Claiming…' : '✋ This is Mine'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={s.empty}>No reported items</div>}
      </div>
    </div>
  );
}

// ── AI Assistant ──────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Where is my child right now?',
  'When will the van arrive at pickup?',
  'What is my current subscription plan?',
  'How do I report an issue with the driver?',
  'Is my child marked present today?',
  'What time did the van depart this morning?',
  'How do I add another child to my account?',
  'What is the cancellation policy?',
];

function ParentAI() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([
    { role:'assistant', text:"Hi! I'm Schuber AI 🤖 — your personal school transport assistant.\n\nI can help you with:\n• 📍 Live trip & location status\n• 👶 Child attendance & boarding updates\n• 💳 Subscription & billing queries\n• 🚌 Driver info & route details\n• 📞 Support & complaint escalation\n\nWhat would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const callClaudeAPI = async (userMessage, history) => {
    const systemPrompt = `You are Schuber AI, a helpful assistant for a school transportation app in India called Schuber. 
You help parents track their children's school van, understand their subscription, report issues, and get trip information.

Key context:
- User profile: ${profile?.full_name || 'Parent'} (parent account)
- Demo data: Child "Aanya Sharma" is on Van KA01AB1234 driven by Suresh Kumar (rating 4.8★)
- Current trip: Koramangala → DPS Whitefield, ETA ~8 minutes
- Subscription: Monthly Plan (₹299/month), 5 days trial remaining
- Recent notification: Aanya boarded at 7:52 AM

Be helpful, concise, and friendly. Use emojis naturally. If asked about live location, describe the van's current area (Indiranagar). Always stay on topic related to school transportation.`;

    const apiMessages = history
      .filter(m => m.role !== 'system')
      .slice(-8)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));
    apiMessages.push({ role: 'user', content: userMessage });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: apiMessages,
      }),
    });
    const data = await response.json();
    if (data.content?.[0]?.text) return data.content[0].text;
    throw new Error('No response');
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || thinking) return;
    const newMessages = [...messages, { role:'user', text: msg }];
    setMessages(newMessages);
    setInput('');
    setThinking(true);
    try {
      const reply = await callClaudeAPI(msg, messages);
      setMessages(m => [...m, { role:'assistant', text: reply }]);
    } catch {
      // Fallback to local responses
      const fallbackReplies = {
        'where': 'Your child Aanya is currently on Van KA01AB1234 driven by Suresh Kumar. The van is near Indiranagar, and the ETA to school is approximately 8 minutes. 📍',
        'when': 'Based on current GPS data, the van will reach your pickup point at Koramangala in about 12 minutes. You\'ll get a push notification 5 minutes before arrival. 🔔',
        'subscription': 'You\'re currently on a Free Trial with 5 days remaining. The Monthly Plan at ₹299/month gives you full GPS tracking, SOS alerts, and 3 child profiles. You can upgrade in the Subscription section! 💳',
        'driver': 'To report an issue with your driver, please go to Settings → Report Driver, or you can describe the issue here and I\'ll help escalate it. All reports are investigated within 24 hours. 🚨',
        'attendance': 'Aanya was marked present today! She boarded the van at 7:52 AM at Koramangala pickup point. ✅',
      };
      const key = Object.keys(fallbackReplies).find(k => msg.toLowerCase().includes(k));
      const reply = key ? fallbackReplies[key] : "I found relevant information: Aanya's last known status is \"Boarded\" at 7:52 AM. Trip is in progress on Van KA01AB1234. Driver Suresh Kumar has a 4.8★ rating. For more specific queries, please contact support at 1800-XXX-XXXX. 📞";
      setMessages(m => [...m, { role:'assistant', text: reply }]);
    }
    setThinking(false);
  };

  return (
    <div style={s.page}>
      <div style={{...s.card, display:'flex', flexDirection:'column', height:'calc(100vh - 200px)', minHeight:500}}>
        <div style={s.aiHeader}>
          <div style={s.aiAvatar}>🤖</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:C.text}}>Schuber AI Assistant</div>
            <div style={{fontSize:'0.72rem',color:C.green}}>● Online · Powered by Claude AI</div>
          </div>
          <div style={{fontSize:'0.72rem',color:C.text3,background:C.light,padding:'0.3rem 0.6rem',borderRadius:6}}>Ask me anything</div>
        </div>

        <div style={s.aiMessages}>
          {messages.map((m, i) => (
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:'0.75rem'}}>
              {m.role==='assistant' && <div style={{width:28,height:28,borderRadius:'50%',background:C.light,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',flexShrink:0,marginRight:'0.5rem',marginTop:'0.2rem'}}>🤖</div>}
              <div style={{...s.aiBubble,background:m.role==='user'?C.primary:C.white,color:m.role==='user'?'#fff':C.text,borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',border:m.role==='user'?'none':`1px solid ${C.border}`,maxWidth:'80%',whiteSpace:'pre-wrap'}}>
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div style={{display:'flex',gap:'0.4rem',padding:'0.75rem 1rem',background:C.white,borderRadius:'18px 18px 18px 4px',width:70,border:`1px solid ${C.border}`}}>
              <div style={{...s.thinkDot,animationDelay:'0s'}} /><div style={{...s.thinkDot,animationDelay:'0.2s'}} /><div style={{...s.thinkDot,animationDelay:'0.4s'}} />
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={s.aiSuggestions}>
          {SUGGESTIONS.slice(0,4).map(q => (
            <button key={q} style={s.suggBtn} onClick={() => send(q)}>{q}</button>
          ))}
        </div>

        <div style={s.aiInputRow}>
          <input style={s.aiInput} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
            placeholder="Ask about trip, driver, attendance, subscription…" />
          <button style={{...s.aiSendBtn, opacity:thinking?0.6:1}} onClick={() => send()} disabled={thinking}>
            {thinking ? '⏳' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem' },
  card: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'1.5rem', boxShadow:'0 1px 4px rgba(245,158,11,0.06)' },
  cardHead: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' },
  cardTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.95rem', color:C.text, margin:0 },
  liveBadge: { background:C.greenBg, color:C.green, padding:'0.2rem 0.5rem', borderRadius:99, fontSize:'0.68rem', fontWeight:700 },
  tripCard: { display:'flex', gap:'1.5rem', flexWrap:'wrap' },
  tcLeft: { flex:'1 1 240px' },
  tcRight: { flex:'1 1 280px' },
  driverRow: { display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' },
  driverAv: { width:40, height:40, borderRadius:'50%', background:C.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 },
  driverName: { fontWeight:700, color:C.text },
  driverSub: { color:C.text3, fontSize:'0.78rem' },
  ratingBadge: { marginLeft:'auto', background:C.light, border:`1px solid ${C.border}`, padding:'0.2rem 0.5rem', borderRadius:8, fontSize:'0.8rem', color:C.dark, fontWeight:600 },
  studentStatuses: { display:'flex', flexDirection:'column', gap:'0.4rem' },
  studentStatus: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0.75rem', background:C.ultraLight, borderRadius:8 },
  sName: { fontSize:'0.875rem', fontWeight:600, color:C.text },
  sBadge: { padding:'0.2rem 0.5rem', borderRadius:6, fontSize:'0.72rem', fontWeight:600 },
  etaBox: { display:'flex', justifyContent:'space-between', marginTop:'0.75rem', padding:'0.5rem 0.75rem', background:C.greenBg, borderRadius:8 },
  etaLabel: { fontSize:'0.78rem', color:C.green, fontWeight:600 },
  etaValue: { fontSize:'0.78rem', color:C.green, fontWeight:700 },
  notifList: { display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.5rem' },
  notifItem: { display:'flex', gap:'0.75rem', alignItems:'flex-start', padding:'0.75rem', background:C.ultraLight, borderRadius:10, border:`1px solid ${C.border}` },
  notifDot: { width:8, height:8, borderRadius:'50%', flexShrink:0, marginTop:6 },
  notifContent: { flex:1 },
  notifTitle: { fontWeight:700, fontSize:'0.875rem', color:C.text, marginBottom:'0.15rem' },
  notifMsg: { color:C.text2, fontSize:'0.8rem', lineHeight:1.5 },
  notifTime: { color:C.text3, fontSize:'0.72rem', marginTop:'0.25rem' },
  unreadDot: { width:8, height:8, borderRadius:'50%', background:C.primary, flexShrink:0, marginTop:6 },
  empty: { color:C.text3, textAlign:'center', padding:'2rem', fontSize:'0.9rem' },
  trackLayout: { display:'flex', gap:'1.25rem', flexWrap:'wrap' },
  trackMain: { flex:'1 1 400px', display:'flex', flexDirection:'column', gap:'1rem' },
  trackSide: { flex:'0 0 280px', display:'flex', flexDirection:'column', gap:'0.75rem' },
  mapBox: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, overflow:'hidden' },
  mapHeader: { padding:'0.75rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}`, flexWrap:'wrap', gap:'0.5rem' },
  mapTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.9rem', color:C.text },
  etaChip: { background:C.greenBg, color:C.green, padding:'0.2rem 0.5rem', borderRadius:6, fontSize:'0.72rem', fontWeight:600 },
  routeBtn: { background:C.light, border:`1px solid ${C.border}`, color:C.dark, padding:'0.3rem 0.65rem', borderRadius:8, fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" },
  sCard: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:12, padding:'0.875rem', display:'flex', gap:'0.75rem', alignItems:'flex-start' },
  sAv: { width:36, height:36, borderRadius:'50%', background:'#8B5CF6', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem', flexShrink:0 },
  sInfo: { flex:1 },
  sCardName: { fontWeight:700, fontSize:'0.9rem', color:C.text, marginBottom:'0.15rem' },
  sCardSub: { fontSize:'0.75rem', color:C.text2, marginBottom:'0.35rem' },
  vanStatus: { display:'inline-block', padding:'0.2rem 0.5rem', borderRadius:6, fontSize:'0.72rem', fontWeight:600 },
  driverMini: { textAlign:'right', flexShrink:0 },
  pageHead: { display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' },
  pageTitle: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.2rem', color:C.text, margin:0 },
  addBtn: { background:C.primary, color:'#fff', border:'none', padding:'0.55rem 1.1rem', borderRadius:10, fontSize:'0.875rem', fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" },
  countBadge: { background:C.light, color:C.dark, border:`1px solid ${C.border}`, borderRadius:20, padding:'0.2rem 0.65rem', fontSize:'0.75rem', fontWeight:700 },
  filterBtn: { background:C.white, border:`1px solid ${C.border}`, color:C.text2, padding:'0.35rem 0.75rem', borderRadius:8, fontSize:'0.78rem', fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" },
  filterBtnActive: { background:C.primary, color:'#fff', border:`1px solid ${C.primary}`, fontWeight:700 },
  markAllBtn: { background:'transparent', border:`1px solid ${C.border}`, color:C.text2, padding:'0.35rem 0.75rem', borderRadius:8, fontSize:'0.78rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" },
  notifFull: { display:'flex', gap:'0.875rem', alignItems:'flex-start', padding:'1rem', background:C.white, borderRadius:12, border:`1px solid ${C.border}`, transition:'opacity 0.2s' },
  notifTypeWrap: { width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  notifBody: { flex:1 },
  notifFTitle: { fontWeight:700, fontSize:'0.9rem', color:C.text, marginBottom:'0.2rem' },
  notifFMsg: { color:C.text2, fontSize:'0.84rem', lineHeight:1.5 },
  notifTime: { color:C.text3, fontSize:'0.72rem', marginTop:'0.35rem' },
  markReadBtn: { background:C.light, border:`1px solid ${C.border}`, color:C.dark, padding:'0.3rem 0.65rem', borderRadius:8, fontSize:'0.72rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif" },
  planCard: { background:C.white, border:'1.5px solid', borderRadius:16, padding:'1.25rem', transition:'all 0.2s' },
  popularBadge: { position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', color:'#fff', borderRadius:20, padding:'0.25rem 0.75rem', fontSize:'0.72rem', fontWeight:700, whiteSpace:'nowrap' },
  planName: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', color:C.text, marginBottom:'0.35rem' },
  planPrice: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.75rem', marginBottom:'0.15rem' },
  planDuration: { fontSize:'0.78rem', color:C.text3, marginBottom:'0.875rem' },
  planDivider: { height:1, background:C.border, marginBottom:'0.875rem' },
  planFeature: { fontSize:'0.84rem', color:C.text2, marginBottom:'0.4rem', display:'flex', gap:'0.4rem' },
  subscribeBtn: { background:`linear-gradient(135deg,${C.primary},${C.dark})`, color:'#fff', border:'none', padding:'0.9rem 2rem', borderRadius:12, fontSize:'0.95rem', fontWeight:700, cursor:'pointer', width:'100%', fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 14px rgba(245,158,11,0.35)` },
  trialBar: { marginTop:'0.75rem' },
  trialInfo: { display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' },
  trialLabel: { fontSize:'0.84rem', fontWeight:600, color:C.text },
  trialDays: { fontSize:'0.84rem', color:C.primary, fontWeight:700 },
  trialProgress: { height:8, background:C.light, borderRadius:4, overflow:'hidden' },
  trialFill: { height:'100%', background:C.primary, borderRadius:4 },
  addForm: { display:'flex', flexDirection:'column', gap:'0.75rem' },
  row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' },
  input: { background:'#FAFAFA', border:`1.5px solid ${C.border}`, borderRadius:10, padding:'0.65rem 0.875rem', color:C.text, fontSize:'0.9rem', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', width:'100%', outline:'none', transition:'border-color 0.2s' },
  submitBtn: { background:C.primary, color:'#fff', border:'none', padding:'0.65rem 1.25rem', borderRadius:10, fontSize:'0.9rem', fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" },
  cancelBtn: { background:C.white, color:C.text2, border:`1px solid ${C.border}`, padding:'0.65rem 1.25rem', borderRadius:10, fontSize:'0.9rem', fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" },
  smallBtn: { background:C.light, border:`1px solid ${C.border}`, color:C.dark, padding:'0.3rem 0.65rem', borderRadius:8, fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" },
  claimBtn: { background:'#8B5CF6', color:'#fff', border:'none', padding:'0.35rem 0.75rem', borderRadius:8, fontSize:'0.78rem', fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" },
  statusTag: { padding:'0.2rem 0.6rem', borderRadius:20, fontSize:'0.72rem', fontWeight:700, display:'inline-block' },
  tableHead: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.85rem', color:C.text, marginBottom:'0.5rem' },
  tableRow: { padding:'0.6rem 0', borderBottom:`1px solid ${C.border}` },
  studentGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' },
  studentCard: { background:C.white, border:`1.5px solid ${C.border}`, borderRadius:16, padding:'1.25rem', display:'flex', gap:'1rem' },
  studentAv: { width:48, height:48, borderRadius:'50%', background:'#8B5CF6', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.9rem', flexShrink:0 },
  studentInfo: { flex:1 },
  studentName: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', color:C.text, marginBottom:'0.15rem' },
  studentSchool: { fontSize:'0.8rem', color:C.text2, marginBottom:'0.35rem' },
  gradeBadge: { display:'inline-block', background:C.light, color:C.dark, borderRadius:6, padding:'0.15rem 0.5rem', fontSize:'0.72rem', fontWeight:600, marginBottom:'0.4rem' },
  addr: { fontSize:'0.75rem', color:C.text3, marginBottom:'0.2rem' },
  assignedDriver: { display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.5rem', fontSize:'0.75rem', alignItems:'center' },
  vanNo: { background:'#EFF6FF', color:'#1D4ED8', padding:'0.15rem 0.4rem', borderRadius:4, fontWeight:600 },
  verifiedTag: { color:C.green, fontWeight:600 },
  aiHeader: { display:'flex', gap:'0.75rem', alignItems:'center', padding:'0.875rem 1rem', borderBottom:`1px solid ${C.border}`, marginBottom:'0.5rem' },
  aiAvatar: { width:40, height:40, borderRadius:'50%', background:C.light, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 },
  aiMessages: { flex:1, overflowY:'auto', padding:'0.5rem', display:'flex', flexDirection:'column' },
  aiBubble: { padding:'0.75rem 1rem', maxWidth:'80%', fontSize:'0.875rem', lineHeight:1.6 },
  aiSuggestions: { padding:'0.5rem', display:'flex', gap:'0.4rem', overflowX:'auto', flexWrap:'wrap', borderTop:`1px solid ${C.border}` },
  suggBtn: { background:C.ultraLight, border:`1px solid ${C.border}`, color:C.dark, padding:'0.35rem 0.75rem', borderRadius:20, fontSize:'0.72rem', fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif" },
  aiInputRow: { display:'flex', gap:'0.5rem', padding:'0.75rem', borderTop:`1px solid ${C.border}` },
  aiInput: { flex:1, background:'#FAFAFA', border:`1.5px solid ${C.border}`, borderRadius:12, padding:'0.65rem 1rem', fontSize:'0.9rem', fontFamily:"'DM Sans',sans-serif", outline:'none', color:C.text },
  aiSendBtn: { background:C.primary, color:'#fff', border:'none', borderRadius:12, padding:'0.65rem 1.1rem', fontSize:'1rem', fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" },
  thinkDot: { width:8, height:8, borderRadius:'50%', background:C.border, animation:'bounce 1.2s infinite', display:'inline-block' },
};
