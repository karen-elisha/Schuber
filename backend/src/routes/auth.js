const router = require('express').Router();
const supabase = require('../db');

// ✅ Use correct middleware
const { authenticate: auth } = require('../middleware');

// ─────────────────────────────
// 🔐 LOGIN (Supabase)
// ─────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  res.json({
    token: data.session.access_token,
    user: data.user
  });
});


// ─────────────────────────────
// 📝 REGISTER (Supabase)
// ─────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({
    message: "User registered",
    user: data.user
  });
});


// ─────────────────────────────
// 👤 GET CURRENT USER
// ─────────────────────────────
router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;