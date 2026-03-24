import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/auth/AuthModal';

export default function Onboarding() {
  const navigate = useNavigate();
  const { loginAnonymously, loginWithGoogle } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const handleAnonymous = async () => {
    setLoading('anon');
    setError('');
    try {
      await loginAnonymously();
      navigate('/checkin');
    } catch (err) {
      setError('Could not sign in anonymously. Please try again.');
    } finally {
      setLoading('');
    }
  };

  const handleGoogle = async () => {
    setLoading('google');
    setError('');
    try {
      await loginWithGoogle();
      navigate('/checkin');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-slide-up" style={{ maxWidth: '480px', width: '100%', padding: '40px', textAlign: 'center' }}>
        
        {/* Logo */}
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
          <HeartPulse size={48} color="#818cf8" />
        </div>

        {/* Title */}
        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '12px', marginTop: 0 }}>MindMitra</h1>
        <p style={{ color: '#cbd5e1', fontSize: '1rem', marginBottom: '36px', lineHeight: '1.7' }}>
          Your daily mental health companion. Check in safely, understand your emotions, and get the support you need.
        </p>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* 1. Continue Anonymously */}
          <button
            className="button-primary"
            disabled={!!loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', fontSize: '1rem' }}
            onClick={handleAnonymous}
          >
            {loading === 'anon' ? 'Signing in...' : <><ArrowRight size={20} /> Continue Anonymously</>}
          </button>

          {/* 2. Login / Registration */}
          <button
            disabled={!!loading}
            onClick={() => setShowAuthModal(true)}
            style={{
              background: 'transparent', color: '#e2e8f0',
              border: '1px solid rgba(129,140,248,0.4)',
              padding: '16px', borderRadius: '8px', cursor: 'pointer',
              transition: 'all 0.2s ease', fontSize: '1rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Login / Registration
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#475569', fontSize: '0.8rem' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* 3. Continue with Google */}
          <button
            disabled={!!loading}
            onClick={handleGoogle}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0', padding: '14px', borderRadius: '8px',
              cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '0.95rem', fontWeight: 500
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            {loading === 'google' ? 'Signing in...' : (
              <>
                {/* Google G SVG */}
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.8 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.3C29.5 35.3 26.9 36 24 36c-5.2 0-9.6-3.2-11.3-7.8L6.1 33.4C9.4 39.5 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.4-2.5 4.4-4.5 5.8l6.2 5.3C37 39.3 44 34 44 24c0-1.2-.1-2.4-.4-3.5z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '28px', color: '#64748b', fontSize: '0.85rem' }}>
          <ShieldCheck size={15} />
          <span>100% Private & Secure</span>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
