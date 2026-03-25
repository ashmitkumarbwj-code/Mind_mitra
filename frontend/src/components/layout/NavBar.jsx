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
    try {
        await logout();
        navigate('/');
    } catch (err) {
        console.error("Logout failed:", err);
    } finally {
        setLoggingOut(false);
    }
  };

  const isActive = (path) => location.pathname === path;
  const displayName = currentUser.isAnonymous
    ? 'Anonymous User'
    : currentUser.displayName || currentUser.email?.split('@')[0] || 'Member';

  return (
    <nav style={{
      position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)',
      width: 'max-content', maxWidth: 'calc(100% - 40px)', 
      zIndex: 999,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(20px)',
      -webkit-backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '24px',
      padding: '8px 20px',
      display: 'flex', alignItems: 'center', gap: '20px',
      height: '54px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
    }}>
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '0 8px' }}
        onClick={() => navigate('/checkin')}
      >
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -5, background: '#818cf8', filter: 'blur(10px)', opacity: 0.3, borderRadius: '50%' }}></div>
            <HeartPulse size={20} color="#818cf8" style={{ position: 'relative' }} />
        </div>
        <span className="text-gradient" style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.5px' }}>MindMitra</span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '16px' }}>
        {[
          { path: '/checkin', label: 'Chat', icon: <ClipboardEdit size={16} /> },
          { path: '/analytics', label: 'Analytics', icon: <LayoutDashboard size={16} /> },
          { path: '/admin', label: 'Counselor', icon: <ShieldAlert size={16} /> },
          { path: '/settings', label: 'Settings', icon: <SettingsIcon size={16} /> },
        ].map(({ path, label, icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '12px', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: isActive(path) ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: isActive(path) ? '#fff' : '#94a3b8',
              boxShadow: isActive(path) ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {React.cloneElement(icon, { color: isActive(path) ? '#818cf8' : 'currentColor' })}
            <span style={{ display: isActive(path) ? 'inline' : 'none' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* User + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
          <div style={{ position: 'relative' }}>
            {currentUser.photoURL
              ? <img src={currentUser.photoURL} alt="avatar" style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(129,140,248,0.4)' }} />
              : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(129,140,248,0.3)' }}>
                  <User size={14} color="#fff" />
                </div>
            }
          </div>
          <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'none' }}>
            {displayName}
          </span>
        </div>
        
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="glass-panel"
          style={{
            padding: '8px', borderRadius: '12px', border: '1px solid rgba(248,113,113,0.3)',
            background: 'rgba(248,113,113,0.1)', color: '#f87171',
            cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
