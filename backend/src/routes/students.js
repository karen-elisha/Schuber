const router   = require('express').Router();
const supabase = require('../db');
const { authenticate: auth } = require('../middleware');

// ─────────────────────────────
// 📋 Get students
// ─────────────────────────────
router.get('/', auth, async (req, res) => {
  const { role, id } = req.user;

  try {
    if (role === 'parent') {
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', id);

      if (error) throw error;
      return res.json(students || []);

    } else if (role === 'driver') {
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', id)
        .single();

      if (!driver) return res.json([]);

      // Get students who have been on trips with this driver
      const { data: tripStudents } = await supabase
        .from('trip_students')
        .select('student_id, trips!inner(driver_id)')
        .eq('trips.driver_id', driver.id);

      if (!tripStudents?.length) return res.json([]);

      const studentIds = [...new Set(tripStudents.map(ts => ts.student_id))];
      const { data: students, error } = await supabase
        .from('students')
        .select('*, profiles(full_name)')
        .in('id', studentIds);

      if (error) throw error;
      return res.json(students || []);

    } else {
      // Admin — get all students
      const { data: students, error } = await supabase
        .from('students')
        .select('*, profiles(full_name)');

      if (error) throw error;
      return res.json(students || []);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// ➕ Add student (parent only)
// ─────────────────────────────
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'parent')
    return res.status(403).json({ error: 'Forbidden' });

  const { name, school, grade } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const { data: student, error } = await supabase
      .from('students')
      .insert({ name, school, grade, parent_id: req.user.id })
      .select()
      .single();

    if (error) throw error;
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// 🔔 Get notifications
// ─────────────────────────────
router.get('/notifications', auth, async (req, res) => {
  try {
    const { data: notifs, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(notifs || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// ✅ Mark notification read
// ─────────────────────────────
router.patch('/notifications/:id/read', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;