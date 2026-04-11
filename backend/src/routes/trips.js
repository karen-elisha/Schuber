const router = require('express').Router();
const { db } = require('../db');
const { auth } = require('../middleware');

// Get trips for current user
router.get('/', auth, (req, res) => {
  const { role, id } = req.user;
  let trips;
  if (role === 'driver') {
    const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(id);
    if (!driver) return res.json([]);
    trips = db.prepare(`
      SELECT t.*, u.name as driver_name, d.vehicle_no, d.vehicle_model
      FROM trips t
      JOIN drivers d ON t.driver_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE t.driver_id = ?
      ORDER BY t.date DESC LIMIT 20
    `).all(driver.id);
  } else if (role === 'parent') {
    trips = db.prepare(`
      SELECT DISTINCT t.*, u.name as driver_name, d.vehicle_no, d.vehicle_model, d.rating
      FROM trips t
      JOIN drivers d ON t.driver_id = d.id
      JOIN users u ON d.user_id = u.id
      JOIN trip_students ts ON t.id = ts.trip_id
      JOIN students s ON ts.student_id = s.id
      WHERE s.parent_id = ?
      ORDER BY t.date DESC LIMIT 20
    `).all(id);
  } else {
    trips = db.prepare(`
      SELECT t.*, u.name as driver_name, d.vehicle_no
      FROM trips t
      JOIN drivers d ON t.driver_id = d.id
      JOIN users u ON d.user_id = u.id
      ORDER BY t.date DESC LIMIT 50
    `).all();
  }
  res.json(trips);
});

// Get active trip details with students
router.get('/active', auth, (req, res) => {
  const { role, id } = req.user;
  let trip;
  if (role === 'driver') {
    const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(id);
    if (!driver) return res.json(null);
    trip = db.prepare(`SELECT * FROM trips WHERE driver_id = ? AND status = 'in_progress'`).get(driver.id);
  } else if (role === 'parent') {
    trip = db.prepare(`
      SELECT DISTINCT t.*, u.name as driver_name, d.vehicle_no, d.vehicle_model, d.lat, d.lng, d.rating, d.phone as driver_phone
      FROM trips t
      JOIN drivers d ON t.driver_id = d.id
      JOIN users u ON d.user_id = u.id
      JOIN trip_students ts ON t.id = ts.trip_id
      JOIN students s ON ts.student_id = s.id
      WHERE s.parent_id = ? AND t.status = 'in_progress'
    `).get(id);
  }
  if (!trip) return res.json(null);
  const students = db.prepare(`
    SELECT ts.*, s.name, s.school, s.grade
    FROM trip_students ts
    JOIN students s ON ts.student_id = s.id
    WHERE ts.trip_id = ?
  `).all(trip.id);
  res.json({ ...trip, students });
});

// Start a trip (driver)
router.post('/start', auth, (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Forbidden' });
  const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(req.user.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  const existing = db.prepare(`SELECT id FROM trips WHERE driver_id = ? AND status = 'in_progress'`).get(driver.id);
  if (existing) return res.status(409).json({ error: 'Trip already in progress' });

  const trip = db.prepare(`INSERT INTO trips (driver_id, route, status, started_at) VALUES (?, ?, 'in_progress', datetime('now'))`).run(driver.id, req.body.route || 'Morning Route');
  db.prepare(`UPDATE drivers SET status = 'on_trip' WHERE id = ?`).run(driver.id);

  // Assign students on this driver's route
  const students = db.prepare(`SELECT id FROM students WHERE van_id = ?`).all(driver.id);
  const ins = db.prepare(`INSERT INTO trip_students (trip_id, student_id) VALUES (?, ?)`);
  students.forEach(s => ins.run(trip.lastInsertRowid, s.id));

  res.json({ id: trip.lastInsertRowid, status: 'in_progress' });
});

// Complete trip (driver)
router.post('/:id/complete', auth, (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Forbidden' });
  db.prepare(`UPDATE trips SET status = 'completed', completed_at = datetime('now') WHERE id = ?`).run(req.params.id);
  const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(req.user.id);
  db.prepare(`UPDATE drivers SET status = 'online' WHERE id = ?`).run(driver.id);
  res.json({ success: true });
});

// Check in student
router.post('/:id/checkin/:studentId', auth, (req, res) => {
  db.prepare(`UPDATE trip_students SET checked_in = 1, checked_in_at = datetime('now') WHERE trip_id = ? AND student_id = ?`).run(req.params.id, req.params.studentId);
  res.json({ success: true });
});

// Check out student
router.post('/:id/checkout/:studentId', auth, (req, res) => {
  db.prepare(`UPDATE trip_students SET checked_out = 1, checked_out_at = datetime('now') WHERE trip_id = ? AND student_id = ?`).run(req.params.id, req.params.studentId);
  res.json({ success: true });
});

module.exports = router;
