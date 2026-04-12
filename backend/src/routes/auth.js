const router   = require('express').Router();
const supabase  = require('../db');
const { authenticate: auth } = require('../middleware');

// ─────────────────────────────────────────────────────────────
// 🔐 LOGIN
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
// 📝 REGISTER — uses admin.createUser so email is auto-confirmed
//               No confirmation email sent, no rate limits.
//               Email format validated here in JS.
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, full_name, role = 'parent', phone = '' } = req.body;

  // ── JS validation ────────────────────────────────────────────
  if (!email || !password || !full_name)
    return res.status(400).json({ error: 'Name, email and password are required.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ error: 'Please enter a valid email address.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  if (!['parent', 'driver', 'admin'].includes(role))
    return res.status(400).json({ error: 'Invalid role.' });

  try {
    // ── Create user with admin key — email auto-confirmed, no email sent ──
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,          // mark as confirmed immediately
      user_metadata: { full_name, phone, role },
    });

    if (authErr) {
      // Handle duplicate user gracefully
      if (authErr.message.toLowerCase().includes('already been registered') ||
          authErr.message.toLowerCase().includes('already registered') ||
          authErr.code === 'email_exists') {
        return res.status(409).json({ error: 'This email is already registered. Please sign in.' });
      }
      return res.status(400).json({ error: authErr.message });
    }

    const userId = authData.user.id;

    // ── Upsert profile row ────────────────────────────────────────
    await supabase.from('profiles')
      .upsert({ id: userId, role, full_name, email, phone }, { onConflict: 'id' });

    // ── If driver, create drivers row ─────────────────────────────
    if (role === 'driver') {
      await supabase.from('drivers').insert({
        user_id:  userId,
        verified: false,
        is_online:false,
        rating:   0,
        capacity: 12,
      }).catch(() => {}); // ignore if already exists
    }

    // ── Sign in immediately to return a session token ─────────────
    const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr || !session?.session) {
      // User created but couldn't get session — return user info without token
      return res.status(201).json({
        message: 'Account created! Please sign in.',
        user: authData.user,
        token: null,
      });
    }

    res.status(201).json({
      message: 'Account created successfully!',
      user:    session.user,
      token:   session.session.access_token,
    });

  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 👤 GET CURRENT USER
// ─────────────────────────────────────────────────────────────
router.get('/me', auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;