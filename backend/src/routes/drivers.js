const router = require('express').Router();
const { db } = require('../db');
const { auth } = require('../middleware');

router.get('/', auth, (req, res) => {
  const drivers = db.prepare(`
    SELECT d.*, u.name, u.email, u.phone
    FROM drivers d JOIN users u ON d.user_id = u.id
  `).all();
  res.json(drivers);
});

router.get('/me', auth, (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Forbidden' });
  const driver = db.prepare(`SELECT d.*, u.name, u.email, u.phone FROM drivers d JOIN users u ON d.user_id = u.id WHERE d.user_id = ?`).get(req.user.id);
  res.json(driver);
});

router.patch('/location', auth, (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Forbidden' });
  const { lat, lng } = req.body;
  const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(req.user.id);
  db.prepare('UPDATE drivers SET lat = ?, lng = ? WHERE id = ?').run(lat, lng, driver.id);
  res.json({ success: true });
});

router.patch('/status', auth, (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Forbidden' });
  const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(req.user.id);
  db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run(req.body.status, driver.id);
  res.json({ success: true });
});

router.patch('/profile', auth, (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Forbidden' });
  const { license_no, vehicle_no, vehicle_model, capacity, route } = req.body;
  const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(req.user.id);
  db.prepare('UPDATE drivers SET license_no=?, vehicle_no=?, vehicle_model=?, capacity=?, route=? WHERE id=?').run(
    license_no, vehicle_no, vehicle_model, capacity, route, driver.id
  );
  res.json({ success: true });
});

module.exports = router;
