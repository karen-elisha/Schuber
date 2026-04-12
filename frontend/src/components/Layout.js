import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children, navItems, title }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'User';
  const role = profile?.role || 'user';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  return (
    <div style={s.shell}>
      <style>{`
        .nav-link-item { text-decoration: none !important; }
        .nav-link-item:hover { background: #FEF3C7 !important; color: #92400E !important; }
        .logout-btn:hover { background: #FDE68A !important; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <aside style={{ ...s.sidebar, width: collapsed ? 64 : 224 }}>
        <div style={s.sideTop}>
          {!collapsed && (
            <div style={s.logoText}>🚌 <span style={{color:'#F59E0B'}}>Schu</span>ber</div>
          )}
          {collapsed && <div style={{fontSize:'1.2rem'}}>🚌</div>}
          <button style={s.collapseBtn} onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav style={s.nav}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className="nav-link-item"
              style={({ isActive }) => ({
                ...s.navItem,
                ...(isActive ? s.navActive : {}),
                justifyContent: collapsed ? 'center' : 'flex-start',
              })}>
              <span style={s.navIcon}>{item.icon}</span>
              {!collapsed && <span style={s.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ ...s.sideBottom, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{...s.userChip, cursor: 'pointer'}} onClick={() => !collapsed && setShowProfile(v => !v)}>
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} style={{...s.avatar, objectFit:'cover'}} />
              : <div style={s.avatar}>{initials}</div>
            }
            {!collapsed && (
              <div style={s.userInfo}>
                <div style={s.userName}>{displayName}</div>
                <div style={s.userRole}>{role}</div>
              </div>
            )}
          </div>
          {!collapsed && showProfile && (
            <div style={s.profileDropdown}>
              <div style={s.profileEmail}>{profile?.email || user?.email}</div>
              {profile?.phone && <div style={s.profilePhone}>📞 {profile.phone}</div>}
              <div style={s.profileRole}>Role: {role}</div>
              <hr style={{border:'none',borderTop:'1px solid #FDE68A',margin:'0.5rem 0'}}/>
              <button className="logout-btn" style={s.logoutBtn} onClick={handleLogout}>🚪 Sign out</button>
            </div>
          )}
          {!collapsed && !showProfile && (
            <button className="logout-btn" style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
          )}
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <h1 style={s.pageTitle}>{title}</h1>
          <div style={s.headerRight}>
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} style={{...s.headerAvatar, objectFit:'cover'}} />
              : <div style={s.headerAvatar}>{initials}</div>
            }
            <div>
              <div style={s.headerName}>{displayName}</div>
              <div style={s.headerRole}>{role}</div>
            </div>
            <button style={s.headerLogout} onClick={handleLogout}>Sign out</button>
          </div>
        </header>
        <div style={s.content}>{children}</div>
      </main>
    </div>
  );
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: '#FFFBF0', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  sidebar: { background: '#FFFFFF', borderRight: '2px solid #FDE68A', display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' },
  sideTop: { padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #FEF3C7', flexShrink: 0 },
  logoText: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#1C1917' },
  collapseBtn: { background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nav: { flex: 1, padding: '0.875rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' },
  navItem: { display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.6rem 0.75rem', borderRadius: 10, color: '#78716C', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s' },
  navActive: { background: '#FEF3C7', color: '#92400E', fontWeight: 700 },
  navIcon: { fontSize: '1.1rem', flexShrink: 0 },
  navLabel: { whiteSpace: 'nowrap' },
  sideBottom: { padding: '1rem', borderTop: '1px solid #FEF3C7', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  userChip: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 },
  userInfo: { overflow: 'hidden', flex: 1 },
  userName: { fontSize: '0.8rem', fontWeight: 600, color: '#1C1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: '0.7rem', color: '#A8A29E', textTransform: 'capitalize' },
  profileDropdown: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '0.75rem', fontSize: '0.8rem', animation: 'slideIn 0.15s ease' },
  profileEmail: { color: '#57534E', fontWeight: 500, marginBottom: '0.25rem', wordBreak: 'break-all' },
  profilePhone: { color: '#78716C', marginBottom: '0.25rem' },
  profileRole: { color: '#A8A29E', textTransform: 'capitalize', marginBottom: '0.25rem' },
  logoutBtn: { background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '0.4rem 0.75rem', borderRadius: 7, fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
  header: { padding: '1rem 2rem', borderBottom: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(245,158,11,0.08)' },
  pageTitle: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1C1917', margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  headerAvatar: { width: 34, height: 34, borderRadius: '50%', background: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 },
  headerName: { fontSize: '0.85rem', fontWeight: 600, color: '#1C1917' },
  headerRole: { fontSize: '0.72rem', color: '#A8A29E', textTransform: 'capitalize' },
  headerLogout: { background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '0.4rem 0.875rem', borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  content: { flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' },
};
