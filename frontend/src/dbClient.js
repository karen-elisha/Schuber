/**
 * dbClient.js  —  Direct Supabase reads for the frontend
 *
 * WHY:  The Render backend sleeps after inactivity (cold starts = 10-30 s),
 *       so API calls fail and dashboards fall back to dummy data.
 *       This module reads directly from Supabase using the anon key,
 *       subject only to RLS policies (which allow users to read their own rows).
 *
 *       Write operations still go through the backend (for business logic).
 */

import { supabase } from './supabase';

// ── helpers ──────────────────────────────────────────────────────────────────

function q(table) { return supabase.from(table); }

// ── Parents ───────────────────────────────────────────────────────────────────

/** Get students belonging to this parent (by parent_id = user.id) */
export async function getMyStudents(parentId) {
  const { data, error } = await q('students')
    .select('*, drivers(id, vehicle_no, vehicle_model, route, is_online, rating, profiles(full_name, phone))')
    .eq('parent_id', parentId)
    .order('name');
  if (error) throw error;
  // Flatten driver info
  return (data || []).map(s => ({
    ...s,
    driver_name:  s.drivers?.profiles?.full_name || null,
    driver_phone: s.drivers?.profiles?.phone     || null,
    vehicle_no:   s.drivers?.vehicle_no          || null,
    vehicle_model:s.drivers?.vehicle_model       || null,
    van_status:   s.drivers?.is_online ? 'online' : 'offline',
    driver_rating:s.drivers?.rating              || null,
  }));
}

/** Get trips for a parent (via their students) */
export async function getMyTrips(parentId) {
  const { data: students } = await q('students').select('id').eq('parent_id', parentId);
  if (!students?.length) return [];
  const ids = students.map(s => s.id);
  const { data: ts } = await q('trip_students')
    .select('trip_id, checked_in, checked_out, trips(id, status, route, created_at, started_at, ended_at, drivers(profiles(full_name), vehicle_no))')
    .in('student_id', ids)
    .order('trip_id', { ascending: false })
    .limit(30);
  return (ts || []).map(ts => ({
    id:          ts.trips?.id,
    status:      ts.trips?.status,
    route:       ts.trips?.route,
    date:        ts.trips?.created_at?.split('T')[0],
    started_at:  ts.trips?.started_at,
    ended_at:    ts.trips?.ended_at,
    driver_name: ts.trips?.drivers?.profiles?.full_name,
    vehicle_no:  ts.trips?.drivers?.vehicle_no,
    checked_in:  ts.checked_in,
    checked_out: ts.checked_out,
  }));
}

/** Get notifications for current user */
export async function getMyNotifications(userId) {
  const { data, error } = await q('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

// ── Drivers ───────────────────────────────────────────────────────────────────

/** Get driver profile by user_id */
export async function getDriverProfile(userId) {
  const { data, error } = await q('drivers')
    .select('*, profiles(full_name, email, phone)')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return {
    id:            data.id,
    user_id:       data.user_id,
    name:          data.profiles?.full_name || 'Driver',
    email:         data.profiles?.email,
    phone:         data.profiles?.phone,
    vehicle_no:    data.vehicle_no,
    vehicle_model: data.vehicle_model,
    license_no:    data.license_no,
    capacity:      data.capacity,
    route:         data.route,
    lat:           data.lat,
    lng:           data.lng,
    status:        data.is_online ? 'online' : 'offline',
    verified:      data.verified || false,
    rating:        data.rating || 0,
  };
}

/** Get students assigned to a driver (by drivers.id) */
export async function getAssignedStudents(driverId) {
  const { data, error } = await q('students')
    .select('*, profiles!parent_id(full_name, phone, email)')
    .eq('driver_id', driverId)
    .order('name');
  if (error) throw error;
  return (data || []).map(s => ({
    id:            s.id,
    name:          s.name,
    school:        s.school,
    grade:         s.grade,
    pickup_address:s.pickup_address,
    drop_address:  s.drop_address,
    parent_name:   s.profiles?.full_name,
    parent_phone:  s.profiles?.phone,
    parent_email:  s.profiles?.email,
  }));
}

/** Get active trip for driver */
export async function getActiveTrip(driverId) {
  const { data, error } = await q('trips')
    .select('*, trip_students(*, students(name, school, grade, pickup_address))')
    .eq('driver_id', driverId)
    .eq('status', 'active')
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/** Get trip history for driver */
export async function getDriverTrips(driverId) {
  const { data, error } = await q('trips')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/** Get all drivers with profile info */
export async function getAllDrivers() {
  const { data, error } = await q('drivers')
    .select('*, profiles(full_name, email, phone)')
    .order('created_at');
  if (error) throw error;
  return (data || []).map(d => ({
    id:            d.id,
    user_id:       d.user_id,
    name:          d.profiles?.full_name || 'Unknown',
    email:         d.profiles?.email,
    phone:         d.profiles?.phone,
    vehicle_no:    d.vehicle_no,
    vehicle_model: d.vehicle_model,
    license_no:    d.license_no,
    capacity:      d.capacity,
    route:         d.route,
    lat:           d.lat,
    lng:           d.lng,
    status:        d.is_online ? 'online' : 'offline',
    verified:      d.verified || false,
    rating:        d.rating || 0,
  }));
}

/** Get all students (admin view) with parent + driver info */
export async function getAllStudents() {
  const { data, error } = await q('students')
    .select('*, parent:profiles!parent_id(full_name, phone, email), driver:drivers(id, vehicle_no, vehicle_model, profiles(full_name))')
    .order('name');
  if (error) throw error;
  return (data || []).map(s => ({
    ...s,
    parent_name:  s.parent?.full_name,
    parent_phone: s.parent?.phone,
    parent_email: s.parent?.email,
    driver_name:  s.driver?.profiles?.full_name,
    driver_vehicle: s.driver?.vehicle_no,
  }));
}

/** Get all trips (admin) */
export async function getAllTrips() {
  const { data, error } = await q('trips')
    .select('*, drivers(vehicle_no, profiles(full_name))')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map(t => ({
    id:          t.id,
    status:      t.status,
    route:       t.route,
    date:        t.created_at?.split('T')[0],
    started_at:  t.started_at,
    ended_at:    t.ended_at,
    driver_name: t.drivers?.profiles?.full_name,
    vehicle_no:  t.drivers?.vehicle_no,
  }));
}
