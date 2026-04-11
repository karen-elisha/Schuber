// backend/src/db.js  — Replace SQLite with Supabase
// npm install @supabase/supabase-js
 
const { createClient } = require('@supabase/supabase-js');
 
const supabaseUrl  = process.env.SUPABASE_URL;
const supabaseKey  = process.env.SUPABASE_SERVICE_KEY; // service_role key (backend only)
 
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
}
 
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});
 
module.exports = supabase;
 