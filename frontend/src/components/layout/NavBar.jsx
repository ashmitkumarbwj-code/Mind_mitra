import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HeartPulse, LayoutDashboard, ClipboardEdit, LogOut, User, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';

export default function NavBar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!currentUser) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const displayName = currentUser.isAnonymous
    ? 'Anonymous User'
    : currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const avatar = currentUser.photoURL;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '60px'
    }}>
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        onClick={() => navigate('/checkin')}
      >
        <HeartPulse size={22} color="#818cf8" />
        <span className="text-gradient" style={{ fontWeight: 700, fontSize: '1.1rem' }}>MindMitra</span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {[
          { path: '/checkin', label: 'Chat', icon: <ClipboardEdit size={16} /> },
          { path: '/analytics', label: 'Analytics', icon: <LayoutDashboard size={16} /> },
          { path: '/admin', label: 'Counselor', icon: <ShieldAlert size={16} color="#f87171" /> },
          { path: '/settings', label: 'Settings', icon: <SettingsIcon size={16} /> },
        ].map(({ path, label, icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              background: isActive(path) ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: isActive(path) ? '#818cf8' : '#94a3b8',
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* User + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
          {avatar
            ? <img src={avatar} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(129,140,248,0.4)' }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} color="#818cf8" />
              </div>
          }
          <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)',
            background: 'rgba(248,113,113,0.05)', color: '#f87171',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.05)'}
        >
          <LogOut size={15} />
          {loggingOut ? '...' : 'Logout'}
        </button>
      </div>
    </nav>
  );
}
