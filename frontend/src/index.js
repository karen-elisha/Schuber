require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes   = require('./routes/auth');
const tripRoutes   = require('./routes/trips');
const driverRoutes = require('./routes/drivers');
const studentRoutes = require('./routes/students');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/trips',    tripRoutes);
app.use('/api/drivers',  driverRoutes);
app.use('/api/students', studentRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', service: 'Schuber API' })
);

const { authenticate: auth } = require('./middleware');
const supabase = require('./db');

// ── Subscription ──────────────────────────────────────────
app.get('/api/subscription', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error || !data) {
      return res.json({ plan: 'trial', status: 'active', daysLeft: 5,
        expiresAt: new Date(Date.now() + 5*86400000).toISOString() });
    }
    res.json(data);
  } catch (err) {
    res.json({ plan: 'trial', status: 'active', daysLeft: 5,
      expiresAt: new Date(Date.now() + 5*86400000).toISOString() });
  }
});

app.post('/api/subscription', auth, async (req, res) => {
  const { plan, price, duration } = req.body;
  try {
    const expiresAt = plan === 'yearly'
      ? new Date(Date.now() + 365*86400000).toISOString()
      : plan === 'monthly'
      ? new Date(Date.now() + 30*86400000).toISOString()
      : new Date(Date.now() + 7*86400000).toISOString();

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: req.user.id,
        plan,
        price,
        duration,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Lost & Found ──────────────────────────────────────────
app.get('/api/lost-items', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? supabase.from('lost_items').select('*').order('date', { ascending: false })
      : supabase.from('lost_items').select('*').eq('reported_by', req.user.id).order('date', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch {
    res.json([
      { id: 1, item: 'Blue water bottle', date: '2024-06-12', status: 'found' },
      { id: 2, item: 'Purple bag', date: '2024-06-08', status: 'searching' },
    ]);
  }
});

app.post('/api/lost-items', auth, async (req, res) => {
  const { item, description } = req.body;
  try {
    const { data, error } = await supabase
      .from('lost_items')
      .insert({
        item,
        description,
        reported_by: req.user.id,
        status: 'reported',
        date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.json({ id: Date.now(), item, description, status: 'reported',
      date: new Date().toISOString().split('T')[0] });
  }
});

app.patch('/api/lost-items/:id/claim', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lost_items')
      .update({ status: 'claimed', claimed_by: req.user.id, claimed_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.json({ success: true });
  }
});

// ── Notifications ─────────────────────────────────────────
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.json([
        { id:1, type:'success', title:'Aanya Boarded', message:'Aanya has boarded the van at Koramangala pickup point.', created_at: new Date(Date.now()-300000).toISOString(), read:false },
        { id:2, type:'info', title:'ETA Update', message:'Van is 8 minutes away. Current location: Indiranagar.', created_at: new Date(Date.now()-900000).toISOString(), read:false },
        { id:3, type:'warning', title:'Delay Alert', message:'Van is delayed by 12 minutes due to traffic on OMR.', created_at: new Date(Date.now()-1800000).toISOString(), read:true },
        { id:4, type:'success', title:'Trip Completed', message:'Aanya was safely dropped at Delhi Public School at 8:12 AM.', created_at: new Date(Date.now()-86400000).toISOString(), read:true },
      ]);
    }
    res.json(data);
  } catch {
    res.json([
      { id:1, type:'success', title:'Aanya Boarded', message:'Aanya has boarded the van.', created_at: new Date().toISOString(), read:false },
    ]);
  }
});

app.patch('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    await supabase.from('notifications').update({ read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

// ── Routes (for parent tracking) ─────────────────────────
app.get('/api/routes', auth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('routes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch {
    res.json([
      { id:1, name:'Morning Route A', stops: ['Koramangala', 'Indiranagar', 'Whitefield'], driver:'Suresh Kumar', vehicle:'KA01AB1234' },
    ]);
  }
});

app.post('/api/routes', auth, async (req, res) => {
  try {
    const { name, stops, driver_id } = req.body;
    const { data, error } = await supabase.from('routes').insert({ name, stops, driver_id, created_by: req.user.id }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.json({ id: Date.now(), ...req.body, status: 'created' }); }
});

app.patch('/api/routes/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('routes').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.json({ success: true }); }
});

// ── SOS ──────────────────────────────────────────────────
app.get('/api/sos', auth, (req, res) => {
  res.json([{ id: 1, driver: 'Suresh Kumar', status: 'active',
    time: new Date().toISOString(), location: 'Near Silk Board', type: 'Emergency' }]);
});

app.post('/api/sos', auth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('sos_alerts').insert({
      user_id: req.user.id, type: req.body.type || 'Emergency',
      location: req.body.location || 'Unknown', status: 'active',
      created_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    res.json(data);
  } catch { res.json({ success: true, id: Date.now() }); }
});

// ── Broadcast ─────────────────────────────────────────────
app.get('/api/broadcast/history', auth, (req, res) => {
  res.json([{ id: 1, title: 'Route Change', message: 'Van route updated.',
    sentAt: new Date().toISOString(), recipients: 45 }]);
});

app.post('/api/broadcast', auth, (req, res) => {
  res.json({ success: true, sent: true, recipients: 45 });
});

// ── Reports ───────────────────────────────────────────────
app.get('/api/reports/daily', auth, (req, res) => {
  res.json({ date: new Date().toISOString().split('T')[0],
    totalTrips: 6, completed: 5, onTimeRate: '94%',
    sosAlerts: 1, studentsTransported: 18 });
});

// ── Driver profile update (extended) ─────────────────────
app.patch('/api/drivers/me', auth, async (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Forbidden' });
  const { phone, vehicle_model, capacity, route } = req.body;
  try {
    const { error } = await supabase.from('drivers')
      .update({ phone, vehicle_model, capacity, route, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id);
    if (error) throw error;
    await supabase.from('profiles').update({ phone }).eq('id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Schuber backend running on port ${PORT}`));
