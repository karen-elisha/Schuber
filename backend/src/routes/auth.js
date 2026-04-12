const router  = require('express').Router();
const supabase = require('../db');
const { authenticate: auth } = require('../middleware');

// ─────────────────────────────────────────────────────────────
// 🔐 LOGIN (demo accounts only — real users use Google OAuth)
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });

  res.json({ token: data.session.access_token, user: data.user });
});

// ─────────────────────────────────────────────────────────────
// 👤 GET CURRENT USER
// ─────────────────────────────────────────────────────────────
router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;