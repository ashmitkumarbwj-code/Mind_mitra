import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Activity, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CheckIn() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [drained, setDrained] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/v1/checkin/submit', {
        userId: currentUser?.uid || null,
        text,
        microJournaling: { wentWell, drained }
      });
      setResponse(res.data.data);
    } catch (error) {
      console.error('Checkin failed', error);
      alert('Failed to submit check-in. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  if (response) {
    const isRed = response.riskLevel === 'Red';
    const isAmber = response.riskLevel === 'Amber';
    const ringClass = isRed ? 'status-ring-red' : isAmber ? 'status-ring-amber' : 'status-ring-green';
    const textClass = isRed ? 'risk-red' : isAmber ? 'risk-amber' : 'risk-green';

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className={`glass-panel animate-slide-up ${ringClass}`} style={{ maxWidth: '500px', width: '100%', padding: '30px' }}>
          <h2 className={textClass} style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity /> AI Response
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '30px' }}>{response.aiResponse}</p>

          {isAmber && (
            <div style={{ background: 'rgba(251,191,36,0.1)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(251,191,36,0.2)' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#fbbf24' }}>💡 Suggested Activity</h4>
              <p style={{ margin: 0, color: '#e2e8f0' }}>{response.copingStrategy}</p>
            </div>
          )}

          {isRed && (
            <div style={{ background: 'rgba(248,113,113,0.1)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(248,113,113,0.3)' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#f87171' }}>🆘 You're Not Alone</h4>
              <p style={{ margin: 0, color: '#e2e8f0' }}>Please reach out to someone who can help. iCall: <strong>9152987821</strong></p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setResponse(null)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>
              New Check-In
            </button>
            <button onClick={() => navigate('/dashboard')} className="button-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const greeting = currentUser?.isAnonymous
    ? 'Hey there'
    : `Hey, ${currentUser?.displayName?.split(' ')[0] || 'there'}`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-slide-up" style={{ maxWidth: '600px', width: '100%', padding: '40px' }}>
        <h1 style={{ marginTop: 0, marginBottom: '6px' }}>Daily Check-In</h1>
        <p style={{ color: '#64748b', marginBottom: '28px', marginTop: 0 }}>{greeting}! How are you feeling today?</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <textarea
            className="input-field"
            style={{ width: '100%', minHeight: '120px', resize: 'vertical', boxSizing: 'border-box' }}
            placeholder="Dump it all here. I'm listening..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>✅ What went well?</label>
              <input type="text" className="input-field" style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="One small win..." value={wentWell} onChange={(e) => setWentWell(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>🪫 What drained you?</label>
              <input type="text" className="input-field" style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="A challenge faced..." value={drained} onChange={(e) => setDrained(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="button-primary" disabled={loading || !text}
            style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem' }}>
            {loading ? 'Analyzing with AI...' : <><Send size={18} /> Submit Check-In</>}
          </button>
        </form>
      </div>
    </div>
  );
}
