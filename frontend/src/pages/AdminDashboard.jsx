import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, CheckCircle2, AlertTriangle, Clock, RefreshCw, Activity, Terminal, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
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
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/v1/admin/alerts/${id}/resolve`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
    } catch (err) {
      console.error("Resolve failed:", err);
    }
  };

  const activeCount = alerts.filter(a => a.status === 'OPEN').length;

  return (
    <div style={{ minHeight: '100vh', padding: '100px 20px 60px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Trendy Bento Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card-trendy animate-slide-up" style={{ gridColumn: 'span 8', padding: '40px', display: 'flex', alignItems: 'center', gap: '30px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)' }}>
          <div style={{ position: 'relative' }}>
             <div style={{ position: 'absolute', inset: -10, background: '#ef4444', filter: 'blur(30px)', opacity: 0.2, borderRadius: '50%' }}></div>
             <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '24px', borderRadius: '30px', border: '1px solid rgba(239, 68, 68, 0.3)', position: 'relative' }}>
                <ShieldAlert color="#f87171" size={40} />
             </div>
          </div>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2.4rem', margin: 0 }}>Counselor Portal</h1>
            <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '1.1rem' }}>Active monitoring of distress indicators across campus.</p>
          </div>
        </div>

        <div className="glass-card-trendy animate-slide-up" style={{ gridColumn: 'span 4', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px 24px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>
               <div style={{ width: 12, height: 12, borderRadius: '50%', background: activeCount > 0 ? '#f87171' : '#10b981', boxShadow: activeCount > 0 ? '0 0 15px #f87171' : '0 0 15px #10b981' }} className={activeCount > 0 ? 'animate-pulse' : ''}></div>
               <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>{activeCount} ESCALATIONS</span>
            </div>
            <button onClick={fetchAlerts} className="glass-panel" style={{ width: '100%', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#818cf8', cursor: 'pointer' }}>
               <RefreshCw size={18} className={refreshing ? 'spin-animation' : ''} /> SYNC TELEMETRY
            </button>
        </div>
      </div>

      {/* Alert Feed Section */}
      <div className="glass-card-trendy animate-slide-up" style={{ padding: '40px', minHeight: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Terminal size={24} color="#818cf8" /> Live Risk Feed
            </h2>
            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '6px 16px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(239,68,68,0.2)' }}>HIGH PRIORITY ONLY</div>
            </div>
        </div>

        {loading ? (
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="breathing-circle">
                    <Activity size={32} color="#818cf8" />
                </div>
            </div>
        ) : alerts.length === 0 ? (
            <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '30px', borderRadius: '50%', marginBottom: '24px' }}>
                    <CheckCircle2 size={60} color="#34d399" />
                </div>
                <h3 style={{ fontSize: '2rem', color: '#34d399', marginBottom: '8px' }}>Operational Harmony</h3>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No active distress codes detected in the last cycle.</p>
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {alerts.map(alert => {
                    const isOpen = alert.status === 'OPEN';
                    return (
                        <div key={alert.id} className="glass-card-trendy" style={{ 
                            padding: '32px', 
                            background: isOpen ? 'rgba(239, 68, 68, 0.03)' : 'rgba(255,255,255,0.01)',
                            border: `1px solid ${isOpen ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
                            opacity: isOpen ? 1 : 0.6,
                            transition: 'all 0.4s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ background: isOpen ? '#ef4444' : '#10b981', padding: '6px 14px', borderRadius: '12px', color: '#fff', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px' }}>
                                        {isOpen ? 'EMERGENCY' : 'RESOLVED'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem' }}>
                                        <Clock size={14} /> {new Date(alert.created_at).toLocaleTimeString()}
                                    </div>
                                </div>
                                {isOpen && (
                                    <button onClick={() => handleResolve(alert.id)} className="button-primary" style={{ padding: '10px 24px', fontSize: '0.9rem', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                                        MARK INTERVENED
                                    </button>
                                )}
                            </div>
                            
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: isOpen ? '#f87171' : '#34d399' }}></div>
                                <p style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', lineHeight: '1.6', fontFamily: 'monospace' }}>
                                    {alert.message.replace('High-risk detected for user: ', '')}
                                </p>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: '#475569', fontSize: '0.85rem' }}>
                                    UID: <span style={{ color: '#818cf8', fontWeight: 700 }}>{alert.user_id}</span>
                                </div>
                                <div style={{ color: '#475569', fontSize: '0.85rem' }}>
                                    Session: {alert.id.slice(0, 8)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

    </div>
  );
}
