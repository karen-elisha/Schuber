const router   = require('express').Router();
const supabase = require('../db');
const { authenticate: auth } = require('../middleware');

// ─────────────────────────────
// 📋 Get all drivers (admin)
// ─────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*, profiles(full_name, email)');

    if (error) throw error;
    res.json(drivers || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// 👤 Get own driver profile
// ─────────────────────────────
router.get('/me', auth, async (req, res) => {
  if (req.user.role !== 'driver')
    return res.status(403).json({ error: 'Forbidden' });

  try {
    const { data: driver, error } = await supabase
      .from('drivers')
      .select('*, profiles(full_name, email)')
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// 📍 Update GPS location
// ─────────────────────────────
router.patch('/location', auth, async (req, res) => {
  if (req.user.role !== 'driver')
    return res.status(403).json({ error: 'Forbidden' });

  const { lat, lng } = req.body;
  if (lat == null || lng == null)
    return res.status(400).json({ error: 'lat and lng are required' });

  try {
    const { error } = await supabase
      .from('drivers')
      .update({ lat, lng, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// 🔄 Update online status
// ─────────────────────────────
router.patch('/status', auth, async (req, res) => {
  if (req.user.role !== 'driver')
    return res.status(403).json({ error: 'Forbidden' });

  try {
    const { error } = await supabase
      .from('drivers')
      .update({ is_online: req.body.is_online })
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// ✏️ Update driver profile
// ─────────────────────────────
router.patch('/profile', auth, async (req, res) => {
  if (req.user.role !== 'driver')
    return res.status(403).json({ error: 'Forbidden' });

  const { license_no, vehicle_no, route } = req.body;

  try {
    const { error } = await supabase
      .from('drivers')
      .update({ license_no, vehicle_no, route, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;