const router  = require('express').Router();
const supabase = require('../db');
const { authenticate: auth } = require('../middleware');

// ─────────────────────────────
// 📋 Get trips for current user
// ─────────────────────────────
router.get('/', auth, async (req, res) => {
  const { role, id } = req.user;

  try {
    if (role === 'driver') {
      const { data: driver } = await supabase
        .from('drivers').select('id').eq('user_id', id).single();
      if (!driver) return res.json([]);

      const { data: trips } = await supabase
        .from('trips').select('*').eq('driver_id', driver.id)
        .order('created_at', { ascending: false }).limit(20);
      return res.json(trips || []);

    } else if (role === 'parent') {
      const { data: students } = await supabase
        .from('students').select('id').eq('parent_id', id);
      if (!students?.length) return res.json([]);

      const studentIds = students.map(s => s.id);
      const { data: tripStudents } = await supabase
        .from('trip_students').select('trip_id').in('student_id', studentIds);
      if (!tripStudents?.length) return res.json([]);

      const tripIds = [...new Set(tripStudents.map(ts => ts.trip_id))];
      const { data: trips } = await supabase
        .from('trips').select('*').in('id', tripIds)
        .order('created_at', { ascending: false }).limit(20);
      return res.json(trips || []);

    } else {
      const { data: trips } = await supabase
        .from('trips').select('*')
        .order('created_at', { ascending: false }).limit(50);
      return res.json(trips || []);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// 🚍 Active trip
// ─────────────────────────────
router.get('/active', auth, async (req, res) => {
  const { role, id } = req.user;

  try {
    let trip = null;

    if (role === 'driver') {
      const { data: driver } = await supabase
        .from('drivers').select('id').eq('user_id', id).single();
      if (!driver) return res.json(null);

      const { data } = await supabase
        .from('trips').select('*')
        .eq('driver_id', driver.id).eq('status', 'active').single();
      trip = data;

    } else if (role === 'parent') {
      const { data: students } = await supabase
        .from('students').select('id').eq('parent_id', id);
      if (!students?.length) return res.json(null);

      const studentIds = students.map(s => s.id);
      const { data: tripStudents } = await supabase
        .from('trip_students').select('trip_id').in('student_id', studentIds);
      if (!tripStudents?.length) return res.json(null);

      const tripIds = [...new Set(tripStudents.map(ts => ts.trip_id))];
      const { data } = await supabase
        .from('trips').select('*')
        .in('id', tripIds).eq('status', 'active').single();
      trip = data;
    }

    if (!trip) return res.json(null);

    const { data: students } = await supabase
      .from('trip_students')
      .select('*, students(name, school, grade)')
      .eq('trip_id', trip.id);

    res.json({ ...trip, students: students || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// ▶️ Start trip
// ─────────────────────────────
router.post('/start', auth, async (req, res) => {
  if (req.user.role !== 'driver')
    return res.status(403).json({ error: 'Forbidden' });

  try {
    const { data: driver } = await supabase
      .from('drivers').select('id').eq('user_id', req.user.id).single();
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const { data: existing } = await supabase
      .from('trips').select('id')
      .eq('driver_id', driver.id).eq('status', 'active').single();
    if (existing) return res.status(409).json({ error: 'Trip already in progress' });

    const { data: trip } = await supabase
      .from('trips')
      .insert({ driver_id: driver.id, status: 'active', started_at: new Date().toISOString() })
      .select().single();

    await supabase.from('drivers')
      .update({ is_online: true }).eq('id', driver.id);

    res.json({ id: trip.id, status: 'active' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// ✅ Complete trip
// ─────────────────────────────
router.post('/:id/complete', auth, async (req, res) => {
  if (req.user.role !== 'driver')
    return res.status(403).json({ error: 'Forbidden' });

  try {
    await supabase.from('trips')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', req.params.id);

    const { data: driver } = await supabase
      .from('drivers').select('id').eq('user_id', req.user.id).single();

    await supabase.from('drivers')
      .update({ is_online: false }).eq('id', driver.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// 📍 Check-in
// ─────────────────────────────
router.post('/:id/checkin/:studentId', auth, async (req, res) => {
  try {
    await supabase.from('trip_students')
      .update({ checked_in: true, checkin_at: new Date().toISOString() })
      .eq('trip_id', req.params.id)
      .eq('student_id', req.params.studentId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// 📍 Check-out
// ─────────────────────────────
router.post('/:id/checkout/:studentId', auth, async (req, res) => {
  try {
    await supabase.from('trip_students')
      .update({ checked_out: true, checkout_at: new Date().toISOString() })
      .eq('trip_id', req.params.id)
      .eq('student_id', req.params.studentId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;