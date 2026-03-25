import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, ShieldCheck, Sparkles, ArrowRight, Github } from 'lucide-react';
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
        setError('Connection failed. Please verify your internet or try again.');
      }
    } finally {
      setLoading('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', width: '100vw', overflow: 'hidden', background: '#030014' }}>
      
      {/* LEFT: Premium Hero Section */}
      <div className="onboarding-hero" style={{ 
        flex: 1.2, 
        padding: '60px 100px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1
      }}>
          {/* Enhanced Background Auroras */}
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: '500px', height: '500px', background: 'rgba(139, 92, 246, 0.12)', borderRadius: '50%', filter: 'blur(120px)', animation: 'float 15s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'rgba(236, 72, 153, 0.08)', borderRadius: '50%', filter: 'blur(100px)', animation: 'float 12s ease-in-out infinite reverse' }} />
         
          <div className="animate-slide-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '30px', width: 'fit-content', marginBottom: '40px' }}>
             <Sparkles size={16} color="#c084fc" />
             <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Intelligence-First Portal</span>
          </div>

          <h1 style={{ fontSize: '5rem', fontWeight: 900, margin: 0, lineHeight: 1, letterSpacing: '-2px', color: '#fff' }} className="text-gradient">
            Your Mind,<br/>Perfectly<br/>Understood.
          </h1>
          <p style={{ fontSize: '1.3rem', color: '#64748b', marginTop: '32px', maxWidth: '520px', lineHeight: 1.7 }}>
            MindMitra bridges the gap between students and support using multi-dimensional emotional intelligence and deep encryption.
          </p>
          
          <div style={{ marginTop: '60px', display: 'flex', gap: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b98166' }}></div>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>Global Node Active</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 10px #818cf866' }}></div>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>End-to-End Secure</span>
             </div>
          </div>
      </div>

      {/* RIGHT: Auth Panel */}
      <div style={{ 
        flex: 0.8, 
        minWidth: '450px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(40px)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}></div>
        
        <div className="glass-card-trendy animate-slide-up" style={{ width: '100%', maxWidth: '440px', padding: '50px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
          
          <div className="animate-float" style={{ display: 'inline-flex', padding: '24px', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '35px', marginBottom: '32px', border: '1px solid rgba(129,140,248,0.2)', boxShadow: '0 0 40px rgba(129, 140, 248, 0.15)' }}>
            <HeartPulse size={56} color="#818cf8" />
          </div>

          <h2 style={{ fontSize: '2.2rem', marginBottom: '12px', fontWeight: 800, letterSpacing: '-0.5px' }}>Gateway Access</h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '40px', maxWidth: '300px', margin: '0 auto 40px' }}>
            Authenticate to sync your emotional telemetry.
          </p>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '14px', color: '#f87171', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
               <AlertCircle size={16} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              className="button-primary"
              disabled={!!loading}
              onClick={() => setShowAuthModal(true)}
              style={{ padding: '18px', fontSize: '1.1rem', borderRadius: '16px' }}
            >
              SECURE PORTAL LOGIN
            </button>

            <button
              className="button-google"
              disabled={!!loading}
              onClick={handleGoogle}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
                padding: '18px', borderRadius: '16px', fontSize: '1rem', fontWeight: 700
              }}
            >
              {loading === 'google' ? 'Syncing...' : (
                <>
                  <svg width="24" height="24" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.8 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.3C29.5 35.3 26.9 36 24 36c-5.2 0-9.6-3.2-11.3-7.8L6.1 33.4C9.4 39.5 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.4-2.5 4.4-4.5 5.8l6.2 5.3C37 39.3 44 34 44 24c0-1.2-.1-2.4-.4-3.5z"/>
                  </svg>
                  Connect with Google
                </>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '40px', color: '#475569', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span>Encrypted Node Sync</span>
          </div>
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
