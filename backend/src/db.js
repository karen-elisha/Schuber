const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../schuber.db');
const db = new Database(DB_PATH);

// Enable WAL for performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('parent', 'driver', 'admin')),
    phone TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER NOT NULL,
    school TEXT NOT NULL,
    grade TEXT,
    pickup_address TEXT,
    van_id INTEGER,
    FOREIGN KEY(parent_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    license_no TEXT,
    vehicle_no TEXT,
    vehicle_model TEXT,
    capacity INTEGER DEFAULT 10,
    verified INTEGER DEFAULT 0,
    rating REAL DEFAULT 4.5,
    route TEXT,
    status TEXT DEFAULT 'offline' CHECK(status IN ('online', 'offline', 'on_trip')),
    lat REAL DEFAULT 12.9716,
    lng REAL DEFAULT 77.5946,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER NOT NULL,
    route TEXT,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','in_progress','completed','cancelled')),
    started_at DATETIME,
    completed_at DATETIME,
    date DATE DEFAULT (date('now')),
    FOREIGN KEY(driver_id) REFERENCES drivers(id)
  );

  CREATE TABLE IF NOT EXISTS trip_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    checked_in INTEGER DEFAULT 0,
    checked_in_at DATETIME,
    checked_out INTEGER DEFAULT 0,
    checked_out_at DATETIME,
    FOREIGN KEY(trip_id) REFERENCES trips(id),
    FOREIGN KEY(student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    type TEXT DEFAULT 'info',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) return;

  const hash = (p) => bcrypt.hashSync(p, 10);

  // Admin
  const admin = db.prepare(`INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)`);
  admin.run('Admin Schuber', 'admin@schuber.com', hash('admin123'), 'admin', '9000000000');

  // Parents
  const p1 = db.prepare(`INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)`).run(
    'Priya Sharma', 'priya@example.com', hash('parent123'), 'parent', '9811111111'
  );
  const p2 = db.prepare(`INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)`).run(
    'Rahul Mehta', 'rahul@example.com', hash('parent123'), 'parent', '9822222222'
  );

  // Drivers
  const d1 = db.prepare(`INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)`).run(
    'Suresh Kumar', 'suresh@example.com', hash('driver123'), 'driver', '9833333333'
  );
  const d2 = db.prepare(`INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)`).run(
    'Ramesh Patil', 'ramesh@example.com', hash('driver123'), 'driver', '9844444444'
  );

  db.prepare(`INSERT INTO drivers (user_id,license_no,vehicle_no,vehicle_model,capacity,verified,rating,route,status,lat,lng) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
    d1.lastInsertRowid, 'KA01-2024-1234', 'KA01AB1234', 'Maruti Omni', 10, 1, 4.8, 'Koramangala - Indiranagar', 'online', 12.9352, 77.6245
  );
  db.prepare(`INSERT INTO drivers (user_id,license_no,vehicle_no,vehicle_model,capacity,verified,rating,route,status,lat,lng) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
    d2.lastInsertRowid, 'KA02-2023-5678', 'KA02CD5678', 'Force Traveller', 12, 1, 4.6, 'HSR Layout - BTM Layout', 'on_trip', 12.9082, 77.6476
  );

  // Students
  const s1 = db.prepare(`INSERT INTO students (name,parent_id,school,grade,pickup_address,van_id) VALUES (?,?,?,?,?,?)`).run(
    'Aanya Sharma', p1.lastInsertRowid, 'Delhi Public School', 'Grade 5', '12 Rose Garden, Koramangala', 1
  );
  db.prepare(`INSERT INTO students (name,parent_id,school,grade,pickup_address,van_id) VALUES (?,?,?,?,?,?)`).run(
    'Arjun Sharma', p1.lastInsertRowid, 'Delhi Public School', 'Grade 3', '12 Rose Garden, Koramangala', 1
  );
  db.prepare(`INSERT INTO students (name,parent_id,school,grade,pickup_address,van_id) VALUES (?,?,?,?,?,?)`).run(
    'Kabir Mehta', p2.lastInsertRowid, 'Ryan International', 'Grade 7', '45 HSR Layout', 2
  );

  // Trips
  const t1 = db.prepare(`INSERT INTO trips (driver_id,route,status,started_at,date) VALUES (?,?,?,datetime('now'),date('now'))`).run(
    1, 'Morning Route A', 'in_progress'
  );
  db.prepare(`INSERT INTO trip_students (trip_id,student_id,checked_in,checked_in_at) VALUES (?,?,1,datetime('now'))`).run(t1.lastInsertRowid, s1.lastInsertRowid);

  // Notifications
  const notif = db.prepare(`INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)`);
  notif.run(p1.lastInsertRowid, 'Aanya boarded the van', 'Aanya Sharma has boarded van KA01AB1234 at 7:45 AM', 'success');
  notif.run(p1.lastInsertRowid, 'ETA Update', 'Van will arrive at school in approximately 15 minutes', 'info');
  notif.run(d1.lastInsertRowid, 'New student assigned', 'Aanya Sharma has been assigned to your route', 'info');

  console.log('✅ Database seeded with demo data');
}

module.exports = { db, seed };
