require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { authenticate: auth } = require('./middleware');
const authRoutes   = require('./routes/auth');
const tripRoutes   = require('./routes/trips');
const driverRoutes = require('./routes/drivers');
const studentRoutes = require('./routes/students');
const supabase = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/trips',    tripRoutes);
app.use('/api/drivers',  driverRoutes);
app.use('/api/students', studentRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', service: 'Schuber API' })
);

// ─── Notifications ───────────────────────────────────────────────────────────
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
});

app.patch('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

// ─── Subscription ────────────────────────────────────────────────────────────
app.get('/api/subscription', auth, (req, res) => {
  res.json({
    plan: 'trial', status: 'active', daysLeft: 5,
    expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
  });
});

app.post('/api/subscription', auth, (req, res) => {
  const { plan, price, duration } = req.body;
  res.json({
    plan, status: 'active', price, duration,
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  });
});

// ─── Lost Items ──────────────────────────────────────────────────────────────
app.get('/api/lost-items', auth, (req, res) => {
  res.json([
    { id: 1, item: 'Blue water bottle', date: '2024-06-12', status: 'found', driver: 'Suresh Kumar', description: 'Neon blue bottle with name sticker "Aanya"' },
    { id: 2, item: 'Purple bag', date: '2024-06-08', status: 'searching', driver: 'Suresh Kumar', description: 'Purple bag with space print' },
  ]);
});

app.post('/api/lost-items', auth, (req, res) => {
  res.json({
    id: Date.now(), ...req.body, status: 'reported',
    date: new Date().toISOString().split('T')[0],
    driver: 'Suresh Kumar',
  });
});

app.patch('/api/lost-items/:id/claim', auth, (req, res) => {
  res.json({ success: true, status: 'claimed' });
});

// ─── SOS ─────────────────────────────────────────────────────────────────────
app.get('/api/sos', auth, (req, res) => {
  res.json([{
    id: 1, driver: 'Suresh Kumar', status: 'active',
    time: new Date().toISOString(), location: 'Near Silk Board', type: 'Emergency',
    vehicle: 'KA01AB1234',
  }]);
});

app.post('/api/sos', auth, async (req, res) => {
  const { type, location } = req.body;
  // Create a notification for admin
  try {
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      type: 'error',
      title: '🚨 SOS Alert',
      message: `${type || 'Emergency'} reported at ${location || 'current location'}. Driver: ${req.user.full_name || 'Unknown'}`,
    });
  } catch (e) {}
  res.json({ success: true, id: Date.now(), status: 'active' });
});

// ─── Broadcast ───────────────────────────────────────────────────────────────
app.get('/api/broadcast/history', auth, (req, res) => {
  res.json([{
    id: 1, title: 'Route Change', message: 'Van route updated.',
    sentAt: new Date().toISOString(), recipients: 45,
  }]);
});

app.post('/api/broadcast', auth, (req, res) => {
  res.json({ success: true, sent: true, recipients: 45 });
});

// ─── Reports ─────────────────────────────────────────────────────────────────
app.get('/api/reports/daily', auth, (req, res) => {
  res.json({
    date: new Date().toISOString().split('T')[0],
    totalTrips: 6, completed: 5, onTimeRate: '94%',
    sosAlerts: 1, studentsTransported: 18,
  });
});

// ─── Routes (for parent tracking page) ───────────────────────────────────────
app.get('/api/routes', auth, (req, res) => {
  res.json([
    { id: 1, name: 'Morning Route A', stops: ['Koramangala', 'Indiranagar', 'DPS Whitefield'] },
    { id: 2, name: 'Evening Route A', stops: ['DPS Whitefield', 'Indiranagar', 'Koramangala'] },
  ]);
});

app.post('/api/routes', auth, (req, res) => {
  const { name, stops } = req.body;
  res.json({ id: Date.now(), name, stops, created_at: new Date().toISOString() });
});

app.patch('/api/routes/:id', auth, (req, res) => {
  res.json({ success: true, updated_at: new Date().toISOString() });
});

// ─── Start server ────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚌 Schuber backend running on port ${PORT}`));