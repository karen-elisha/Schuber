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

// ── Extra endpoints ──────────────────────────────────────────
const { authenticate: auth } = require('./middleware');

app.get('/api/subscription', auth, (req, res) => {
  res.json({ plan: 'trial', status: 'active', daysLeft: 5,
    expiresAt: new Date(Date.now() + 5*86400000).toISOString() });
});

app.get('/api/lost-items', auth, (req, res) => {
  res.json([
    { id: 1, item: 'Blue water bottle', date: '2024-06-12', status: 'found' },
    { id: 2, item: 'Purple bag',        date: '2024-06-08', status: 'searching' },
  ]);
});

app.post('/api/lost-items', auth, (req, res) => {
  res.json({ id: Date.now(), ...req.body, status: 'reported',
    date: new Date().toISOString().split('T')[0] });
});

app.get('/api/sos', auth, (req, res) => {
  res.json([{ id: 1, driver: 'Suresh Kumar', status: 'active',
    time: new Date().toISOString(), location: 'Near Silk Board', type: 'Emergency' }]);
});

app.get('/api/broadcast/history', auth, (req, res) => {
  res.json([{ id: 1, title: 'Route Change', message: 'Van route updated.',
    sentAt: new Date().toISOString(), recipients: 45 }]);
});

app.post('/api/broadcast', auth, (req, res) => {
  res.json({ success: true, sent: true, recipients: 45 });
});

app.get('/api/reports/daily', auth, (req, res) => {
  res.json({ date: new Date().toISOString().split('T')[0],
    totalTrips: 6, completed: 5, onTimeRate: '94%',
    sosAlerts: 1, studentsTransported: 18 });
});

app.listen(PORT, () => console.log(`Schuber backend running on port ${PORT}`));