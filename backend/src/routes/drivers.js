const router   = require('express').Router();
const supabase = require('../db');
const { authenticate: auth } = require('../middleware');

// ─────────────────────────────
// 📋 Get all drivers (admin/parent)
// ─────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*, profiles(full_name, email, phone)');

    if (error) throw error;

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

    if (error || !driver) {
      // Driver record may not exist yet — return profile info
      return res.json({
        id: null, user_id: req.user.id,
        name: req.user.full_name || 'Driver',
        email: req.user.email, phone: req.user.phone || '',
        vehicle_no: null, vehicle_model: null, license_no: null,
        capacity: 12, route: null, lat: null, lng: null,
        status: 'offline', verified: false, rating: 0,
      });
    }

    res.json({
      id: driver.id,
      user_id: driver.user_id,
      name: driver.profiles?.full_name || req.user.full_name || 'Driver',
      email: driver.profiles?.email || req.user.email,
      phone: driver.profiles?.phone || req.user.phone || '',
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
// ✏️ Update own driver profile
// ─────────────────────────────
router.patch('/me', auth, async (req, res) => {
  if (req.user.role !== 'driver')
    return res.status(403).json({ error: 'Forbidden' });

  const { phone, vehicle_model, capacity, route, license_no, vehicle_no } = req.body;

  try {
    const updateData = { updated_at: new Date().toISOString() };
    if (vehicle_model !== undefined) updateData.vehicle_model = vehicle_model;
    if (vehicle_no !== undefined) updateData.vehicle_no = vehicle_no;
    if (license_no !== undefined) updateData.license_no = license_no;
    if (capacity !== undefined) updateData.capacity = parseInt(capacity) || 12;
    if (route !== undefined) updateData.route = route;

    await supabase.from('drivers').update(updateData).eq('user_id', req.user.id);

    if (phone) {
      await supabase.from('profiles').update({ phone }).eq('id', req.user.id);
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
    return res.status(400).json({ error: 'lat and lng required' });

  try {
    await supabase.from('drivers')
      .update({ lat, lng, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id);
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
    const status = req.body.status;
    const isOnline = status === 'online';

    const { error } = await supabase.from('drivers')
      .update({ is_online: isOnline, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// ✅ Verify/unverify driver (admin)
// ─────────────────────────────
router.patch('/:id/verify', auth, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  const { verified } = req.body;
  try {
    const { error } = await supabase.from('drivers')
      .update({ verified: !!verified, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, verified: !!verified });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// 👤 Get students assigned to this driver
// ─────────────────────────────
router.get('/:id/students', auth, async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*, profiles!parent_id(full_name, phone, email)')
      .eq('driver_id', req.params.id);

    if (error) throw error;

    const result = (students || []).map(s => ({
      id: s.id,
      name: s.name,
      school: s.school,
      grade: s.grade,
      pickup_address: s.pickup_address,
      drop_address: s.drop_address,
      parent_name: s.profiles?.full_name || 'Parent',
      parent_phone: s.profiles?.phone || '',
      parent_email: s.profiles?.email || '',
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// 📋 Assign student to driver (admin)
// ─────────────────────────────
router.post('/assign-student', auth, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  const { student_id, driver_id } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id required' });

  try {
    const { data, error } = await supabase
      .from('students')
      .update({ driver_id: driver_id || null })
      .eq('id', student_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, student: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;