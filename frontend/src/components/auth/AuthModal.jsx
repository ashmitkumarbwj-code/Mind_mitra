import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const navigate = useNavigate();
  const { loginWithEmail, registerWithEmail, setError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const validate = () => {
    if (!email) return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email.';
    if (!password || password.length < 6) return 'Password must be at least 6 characters.';
    if (mode === 'register' && !name.trim()) return 'Name is required.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setLocalError(validationError);

    setLoading(true);
    setLocalError('');
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
      onClose();
      navigate('/checkin');
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password.'
        : err.code === 'auth/email-already-in-use' ? 'Email already registered.'
        : err.code === 'auth/network-request-failed' ? 'Network error. Check your connection.'
        : 'Authentication failed. Please try again.';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        animation: 'slideUpFade 0.3s ease'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-panel" style={{ maxWidth: '420px', width: '90%', padding: '36px' }}>
        
        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px', marginBottom: '28px' }}>
          {['login', 'register'].map((m) => (
            <button key={m}
              onClick={() => { setMode(m); setLocalError(''); }}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s ease',
                background: mode === m ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                color: mode === m ? '#fff' : '#94a3b8',
              }}
            >
              {m === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {mode === 'register' && (
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text" placeholder="Full Name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="email" placeholder="Email Address" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '36px', paddingRight: '40px', boxSizing: 'border-box' }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {localError && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>
              {localError}
            </div>
          )}

          <button type="submit" className="button-primary" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', marginTop: '4px' }}>
            {loading ? 'Please wait...' : mode === 'login'
              ? <><LogIn size={18} /> Login</>
              : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <button onClick={onClose}
          style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', marginTop: '16px', cursor: 'pointer', fontSize: '0.85rem' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
