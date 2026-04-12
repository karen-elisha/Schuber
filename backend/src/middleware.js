
const supabase = require('./db');

async function authenticate(req, res, next) {
  // Support demo users (frontend sends X-Demo-Role header)
  const demoRole = req.headers['x-demo-role'];
  const demoUser = req.headers['x-demo-user'];
  if (demoRole && demoUser) {
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
