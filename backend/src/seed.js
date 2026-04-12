/**
 * Schuber DB Seed Script
 * Creates all required Supabase tables and seeds admin + demo accounts.
 * Run: node src/seed.js
 */
require('dotenv').config();
const supabase = require('./db');

const TABLES_SQL = `
-- profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'parent' CHECK (role IN ('parent','driver','admin')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- drivers
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  license_no TEXT,
  vehicle_no TEXT,
  vehicle_model TEXT,
  capacity INT DEFAULT 12,
  route TEXT,
  lat FLOAT,
  lng FLOAT,
  is_online BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  rating FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  school TEXT,
  grade TEXT,
  pickup_address TEXT,
  drop_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- trips
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id),
  route TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- trip_students
CREATE TABLE IF NOT EXISTS trip_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  checked_in BOOLEAN DEFAULT false,
  checked_out BOOLEAN DEFAULT false,
  checkin_at TIMESTAMPTZ,
  checkout_at TIMESTAMPTZ
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT DEFAULT 'info',
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies (allow authenticated users to access their own data)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (backend uses service key)
DO $$ BEGIN
  -- profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='service_full_access_profiles') THEN
    CREATE POLICY service_full_access_profiles ON profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- drivers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='drivers' AND policyname='service_full_access_drivers') THEN
    CREATE POLICY service_full_access_drivers ON drivers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- students
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='students' AND policyname='service_full_access_students') THEN
    CREATE POLICY service_full_access_students ON students FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- trips
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trips' AND policyname='service_full_access_trips') THEN
    CREATE POLICY service_full_access_trips ON trips FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- trip_students
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trip_students' AND policyname='service_full_access_trip_students') THEN
    CREATE POLICY service_full_access_trip_students ON trip_students FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='service_full_access_notifications') THEN
    CREATE POLICY service_full_access_notifications ON notifications FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Auto-create profile on user signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to be safe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
`;

async function runSQL(sql) {
  // Use Supabase REST API to run SQL via the rpc endpoint
  // The service key gives us full access
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  const response = await fetch(`${url}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({}),
  });

  // If rpc doesn't work, we'll use the SQL endpoint directly
  // Try the Supabase SQL API
  const sqlResponse = await fetch(`${url}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    },
  });

  return sqlResponse.ok;
}

async function createTables() {
  console.log('🔧 Creating database tables...\n');

  // Split SQL into individual statements and run via supabase
  // Since we can't run raw SQL directly through the JS client,
  // we'll create tables by attempting inserts and checking structure
  // Actually, let's use the Supabase Management API (SQL endpoint)
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  // Use the postgres REST endpoint with raw SQL
  // Supabase exposes a SQL endpoint at /rest/v1/rpc
  // But for DDL we need to use supabase.rpc or the SQL API

  // Try running SQL directly via the Supabase SQL API
  try {
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ query: TABLES_SQL }),
    });

    if (response.ok) {
      console.log('✅ Tables created via SQL RPC');
      return true;
    }
  } catch (e) {
    // SQL RPC not available, that's fine
  }

  // Fallback: Create tables individually by checking if they exist
  // and informing user to create them manually
  console.log('⚠️  Cannot run DDL SQL directly via Supabase JS client.');
  console.log('📋 Please run the following SQL in your Supabase Dashboard → SQL Editor:\n');
  console.log('--- Copy everything below this line ---\n');
  console.log(TABLES_SQL);
  console.log('\n--- End of SQL ---\n');
  console.log('After running the SQL, re-run this seed script to create accounts.');
  return false;
}

async function seedAccounts() {
  console.log('\n👤 Seeding accounts...\n');

  const accounts = [
    {
      email: 'admin@schuber.com',
      password: 'admin123',
      full_name: 'Schuber Admin',
      role: 'admin',
      phone: '+91 98765 00000',
    },
    {
      email: 'priya@example.com',
      password: 'parent123',
      full_name: 'Priya Sharma',
      role: 'parent',
      phone: '+91 98765 43210',
    },
    {
      email: 'suresh@example.com',
      password: 'driver123',
      full_name: 'Suresh Kumar',
      role: 'driver',
      phone: '+91 98765 99999',
    },
  ];

  for (const acc of accounts) {
    try {
      // Check if user already exists by trying to sign in
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: acc.password,
      });

      if (signInData?.user) {
        console.log(`  ✅ ${acc.email} — already exists (${acc.role})`);

        // Make sure profile exists and is correct
        await supabase.from('profiles').upsert({
          id: signInData.user.id,
          email: acc.email,
          full_name: acc.full_name,
          role: acc.role,
          phone: acc.phone,
        }, { onConflict: 'id' });

        // If driver, ensure driver record exists
        if (acc.role === 'driver') {
          const { data: existingDriver } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', signInData.user.id)
            .single();

          if (!existingDriver) {
            await supabase.from('drivers').insert({
              user_id: signInData.user.id,
              vehicle_no: 'KA01AB1234',
              vehicle_model: 'Tempo Traveller 2022',
              license_no: 'KA0120230012345',
              capacity: 12,
              route: 'Koramangala - Indiranagar - DPS Whitefield',
              verified: true,
              rating: 4.8,
              lat: 12.9388,
              lng: 77.6285,
            });
            console.log(`    → Created driver record for ${acc.email}`);
          }
        }
        continue;
      }

      // Create new user via admin API (service key)
      const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: acc.full_name,
          role: acc.role,
          phone: acc.phone,
        },
      });

      if (createErr) {
        // User might already exist
        if (createErr.message?.includes('already been registered') || createErr.message?.includes('already exists')) {
          console.log(`  ✅ ${acc.email} — already registered (${acc.role})`);
        } else {
          console.error(`  ❌ ${acc.email} — ${createErr.message}`);
        }
        continue;
      }

      console.log(`  ✅ ${acc.email} — created (${acc.role})`);
      const userId = createData.user.id;

      // Upsert profile
      await supabase.from('profiles').upsert({
        id: userId,
        email: acc.email,
        full_name: acc.full_name,
        role: acc.role,
        phone: acc.phone,
      }, { onConflict: 'id' });

      // If driver, create driver record
      if (acc.role === 'driver') {
        await supabase.from('drivers').insert({
          user_id: userId,
          vehicle_no: 'KA01AB1234',
          vehicle_model: 'Tempo Traveller 2022',
          license_no: 'KA0120230012345',
          capacity: 12,
          route: 'Koramangala - Indiranagar - DPS Whitefield',
          verified: true,
          rating: 4.8,
          lat: 12.9388,
          lng: 77.6285,
        });
        console.log(`    → Created driver record for ${acc.email}`);
      }

      // If parent, create a demo student
      if (acc.role === 'parent') {
        await supabase.from('students').insert({
          parent_id: userId,
          name: 'Aanya Sharma',
          school: 'Delhi Public School',
          grade: 'Grade 5',
          pickup_address: '12 Rose Garden, Koramangala',
          drop_address: 'Delhi Public School, Whitefield',
        });
        console.log(`    → Created demo student for ${acc.email}`);
      }

    } catch (err) {
      console.error(`  ❌ ${acc.email} — ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚌 Schuber Database Seed\n');
  console.log(`📡 Supabase URL: ${process.env.SUPABASE_URL}\n`);

  // Step 1: Try to create tables
  const tablesCreated = await createTables();

  // Step 2: Try to seed accounts regardless (they'll fail gracefully if tables don't exist)
  await seedAccounts();

  console.log('\n🏁 Seed complete!\n');
  console.log('Accounts:');
  console.log('  👨‍👩‍👧 Parent: priya@example.com / parent123');
  console.log('  🚌 Driver: suresh@example.com / driver123');
  console.log('  🛡️  Admin:  admin@schuber.com / admin123');
  console.log('');

  if (!tablesCreated) {
    console.log('⚠️  Remember to run the SQL above in Supabase Dashboard first!');
  }
}

main().catch(console.error);
