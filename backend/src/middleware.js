
const supabase = require('./db');

async function authenticate(req, res, next) {
  // Support demo users (frontend sends X-Demo-Role header)
  const demoRole = req.headers['x-demo-role'];
  const demoUser = req.headers['x-demo-user'];
  if (demoRole && demoUser) {
    // Map demo IDs to real database user IDs
    const DEMO_EMAILS = {
      'demo-parent-001': 'priya@example.com',
      'demo-driver-001': 'suresh@example.com',
      'demo-admin-001':  'admin@schuber.com',
      'parent': 'priya@example.com',
      'driver': 'suresh@example.com',
      'admin':  'admin@schuber.com',
    };

    const email = DEMO_EMAILS[demoUser] || DEMO_EMAILS[demoRole];
    if (email) {
      // Look up real user ID from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profile) {
        req.user = {
          id: profile.id,
          role: profile.role || demoRole,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
        };
        return next();
      }
    }

    // Fallback: use demo profile without real ID
    const DEMO_PROFILES = {
      'demo-parent-001': { id:'demo-parent-001', role:'parent', full_name:'Priya Sharma', email:'priya@example.com' },
      'demo-driver-001': { id:'demo-driver-001', role:'driver', full_name:'Suresh Kumar', email:'suresh@example.com' },
      'demo-admin-001':  { id:'demo-admin-001',  role:'admin',  full_name:'Schuber Admin', email:'admin@schuber.com' },
    };
    const profile = DEMO_PROFILES[demoUser] || { id: demoUser, role: demoRole, full_name: 'Demo User', email: 'demo@schuber.com' };
    req.user = profile;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  req.user = { ...user, ...profile };
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
