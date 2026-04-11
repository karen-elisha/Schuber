const router = require('express').Router();
const { db } = require('../db');
const { auth } = require('../middleware');

router.get('/', auth, (req, res) => {
  const { role, id } = req.user;
  let students;
  if (role === 'parent') {
    students = db.prepare(`
      SELECT s.*, d.vehicle_no, d.vehicle_model, d.status as van_status, d.lat, d.lng, u.name as driver_name, u.phone as driver_phone
      FROM students s
      LEFT JOIN drivers d ON s.van_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE s.parent_id = ?
    `).all(id);
  } else if (role === 'driver') {
    const driver = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(id);
    if (!driver) return res.json([]);
    students = db.prepare(`
      SELECT s.*, u.name as parent_name, u.phone as parent_phone
      FROM students s
      JOIN users u ON s.parent_id = u.id
      WHERE s.van_id = ?
    `).all(driver.id);
  } else {
    students = db.prepare(`SELECT s.*, u.name as parent_name FROM students s JOIN users u ON s.parent_id = u.id`).all();
  }
  res.json(students);
});

router.post('/', auth, (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });
  const { name, school, grade, pickup_address } = req.body;
  const result = db.prepare('INSERT INTO students (name,parent_id,school,grade,pickup_address) VALUES (?,?,?,?,?)').run(
    name, req.user.id, school, grade, pickup_address
  );
  res.json({ id: result.lastInsertRowid, name, school, grade, pickup_address });
});

router.get('/notifications', auth, (req, res) => {
  const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  res.json(notifs);
});

router.patch('/notifications/:id/read', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
