const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { auth, SECRET } = require('../middleware');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
});

router.post('/register', (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)').run(name, email, hashed, role, phone || null);

  if (role === 'driver') {
    db.prepare('INSERT INTO drivers (user_id) VALUES (?)').run(result.lastInsertRowid);
  }

  const token = jwt.sign({ id: result.lastInsertRowid, role, name, email }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: result.lastInsertRowid, name, email, role, phone } });
});

router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,phone,created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
