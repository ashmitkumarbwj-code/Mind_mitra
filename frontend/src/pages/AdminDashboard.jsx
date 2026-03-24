import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, CheckCircle2, AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchAlerts = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE}/api/v1/admin/alerts`);
      setAlerts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 30 seconds for live monitoring
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/v1/admin/alerts/${id}/resolve`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
    } catch (err) {
      alert("Failed to resolve alert.");
    }
  };

  const activeCount = alerts.filter(a => a.status === 'OPEN').length;

  return (
    <div style={{ minHeight: '100vh', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Panel */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)' }}>
            <ShieldAlert color="#f87171" size={32} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#f8fafc' }}>Counselor Operations Control</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>Live tracking of high-risk campus distress signals.</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: activeCount > 0 ? '#f87171' : '#10b981', boxShadow: activeCount > 0 ? '0 0 10px #f87171' : '0 0 10px #10b981' }} className={activeCount > 0 ? 'animate-pulse' : ''} />
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{activeCount} Active Escalations</span>
          </div>

          <button 
            onClick={fetchAlerts} 
            disabled={refreshing}
            className="glass-panel hover-glow"
            style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center' }}
          >
            <RefreshCw size={20} color="#a5b4fc" className={refreshing ? 'spin-animation' : ''} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color="#fbbf24" /> Escalation Queue
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading campus telemetry...</div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px dashed rgba(16,185,129,0.3)' }}>
            <CheckCircle2 size={48} color="#34d399" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#10b981', margin: '0 0 8px 0', fontSize: '1.4rem' }}>Campus is Safe</h3>
            <p style={{ color: '#94a3b8', margin: 0 }}>There are no active risk escalations at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {alerts.map(alert => {
              const isOpen = alert.status === 'OPEN';
              return (
                <div key={alert.id} style={{ 
                    background: isOpen ? 'rgba(239, 68, 68, 0.05)' : 'rgba(15, 23, 42, 0.4)',
                    borderLeft: `4px solid ${isOpen ? '#f87171' : '#34d399'}`,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.3s ease',
                    opacity: isOpen ? 1 : 0.6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', color: isOpen ? '#f87171' : '#34d399', background: isOpen ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                          {isOpen ? 'CRITICAL RISK' : 'RESOLVED'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                          <Clock size={12} />
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>
                        User Token: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{alert.user_id}</code>
                      </div>
                    </div>
                    {isOpen && (
                      <button 
                        onClick={() => handleResolve(alert.id)}
                        className="button-primary hover-glow"
                        style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <CheckCircle2 size={16} /> Mark Intervened
                      </button>
                    )}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                     <p style={{ margin: 0, color: '#f8fafc', fontStyle: 'italic', fontSize: '1.05rem', lineHeight: '1.5' }}>"{alert.message.replace('High-risk detected for user: ', '')}"</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  );
}
