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
      .select('*, profiles(full_name, email, phone)');

    if (error) throw error;

    // Flatten for frontend
    const result = (drivers || []).map(d => ({
      id: d.id,
      user_id: d.user_id,
      name: d.profiles?.full_name || 'Unknown',
      email: d.profiles?.email || '',
      phone: d.profiles?.phone || '',
      vehicle_no: d.vehicle_no,
      vehicle_model: d.vehicle_model,
      license_no: d.license_no,
      capacity: d.capacity,
      route: d.route,
      lat: d.lat,
      lng: d.lng,
      status: d.is_online ? 'online' : 'offline',
      verified: d.verified || false,
      rating: d.rating || 0,
    }));

    res.json(result);
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
      .select('*, profiles(full_name, email, phone)')
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;

    // Flatten for frontend
    res.json({
      id: driver.id,
      user_id: driver.user_id,
      name: driver.profiles?.full_name || req.user.full_name || 'Driver',
      email: driver.profiles?.email || req.user.email,
      phone: driver.profiles?.phone || '',
      vehicle_no: driver.vehicle_no,
      vehicle_model: driver.vehicle_model,
      license_no: driver.license_no,
      capacity: driver.capacity,
      route: driver.route,
      lat: driver.lat,
      lng: driver.lng,
      status: driver.is_online ? 'online' : 'offline',
      verified: driver.verified || false,
      rating: driver.rating || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// ✏️ Update own driver profile (full update)
// ─────────────────────────────
router.patch('/me', auth, async (req, res) => {
  if (req.user.role !== 'driver')
    return res.status(403).json({ error: 'Forbidden' });

  const { phone, vehicle_model, capacity, route } = req.body;

  try {
    // Update driver record
    const updateData = {};
    if (vehicle_model) updateData.vehicle_model = vehicle_model;
    if (capacity) updateData.capacity = parseInt(capacity) || 12;
    if (route) updateData.route = route;
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length > 1) {
      await supabase
        .from('drivers')
        .update(updateData)
        .eq('user_id', req.user.id);
    }

    // Update phone in profile
    if (phone) {
      await supabase
        .from('profiles')
        .update({ phone, updated_at: new Date().toISOString() })
        .eq('id', req.user.id);
    }

    res.json({ success: true });
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
    // Frontend sends { status: 'online'|'offline' }
    const status = req.body.status;
    const isOnline = status === 'online';

    const { error } = await supabase
      .from('drivers')
      .update({ is_online: isOnline, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// ✏️ Update driver profile (license, vehicle, route)
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