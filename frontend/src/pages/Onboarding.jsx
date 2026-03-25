import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/auth/AuthModal';

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentUser, loginWithGoogle } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/checkin', { replace: true });
    }
  }, [currentUser, navigate]);

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
    <div style={{ minHeight: '100vh', display: 'flex', width: '100vw', overflow: 'hidden' }}>
      
      {/* LEFT: Premium Hero Section */}
      <div className="onboarding-hero" style={{ 
        flex: 1.2, 
        padding: '60px 80px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1
      }}>
         {/* Background Orbs */}
         <div style={{ position: 'absolute', top: '15%', right: '15%', width: '300px', height: '300px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '50%', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite', zIndex: -1 }} />
         <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '400px', height: '400px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '50%', filter: 'blur(90px)', animation: 'float 12s ease-in-out infinite reverse', zIndex: -1 }} />
         
         <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: 'fit-content', marginBottom: '30px' }}>
            <Sparkles size={16} color="#818cf8" />
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500, letterSpacing: '0.5px' }}>MindMitra 2.0 is Live</span>
         </div>

         <h1 style={{ fontSize: '4.5rem', fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-1px' }} className="text-gradient">
           Your Mind,<br/>Perfectly Understood.
         </h1>
         <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginTop: '24px', maxWidth: '480px', lineHeight: 1.6 }}>
           MindMitra is an ultra-intelligent, highly secure conversational AI designed exclusively to protect and empower college students.
         </p>
      </div>

      {/* RIGHT: Auth Panel */}
      <div style={{ 
        flex: 0.8, 
        minWidth: '400px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(30px)',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        padding: '40px',
        zIndex: 2
      }}>
        <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: '40px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          
          <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', marginBottom: '24px', boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)' }}>
            <HeartPulse size={48} color="#818cf8" />
          </div>

          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', marginTop: 0, color: '#f8fafc' }}>Welcome Back</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '32px' }}>
            Enter your secure portal to continue.
          </p>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', padding: '12px 14px', color: '#f87171', fontSize: '0.85rem', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              disabled={!!loading}
              onClick={() => setShowAuthModal(true)}
              style={{
                background: 'transparent', color: '#e2e8f0',
                border: '1px solid rgba(129,140,248,0.4)',
                padding: '16px', borderRadius: '12px', cursor: 'pointer',
                transition: 'all 0.2s ease', fontSize: '1rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.8)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)'; }}
            >
              Email Login / Registration
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <button
              className="button-google"
              disabled={!!loading}
              onClick={handleGoogle}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0', padding: '16px', borderRadius: '12px',
                cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '0.95rem', fontWeight: 600
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {loading === 'google' ? 'Signing in...' : (
                <>
                  <svg width="22" height="22" viewBox="0 0 48 48">
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px', color: '#475569', fontSize: '0.85rem' }}>
            <ShieldCheck size={16} />
            <span>100% HIPAA-Compliant Architecture</span>
          </div>
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
