import React, { useEffect, useState, lazy, Suspense } from 'react';
import axios from 'axios';
import { TrendingUp, AlertCircle, ShieldAlert, HeartPulse } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LazyDashboardChart = lazy(() => import('../components/DashboardChart'));
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/v1/dashboard/user?userId=${currentUser.uid}&_t=${Date.now()}`);
        setData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [currentUser]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <HeartPulse size={36} color="#818cf8" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="text-gradient" style={{ fontSize: '1.1rem' }}>Loading your insights...</div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ color: '#f87171' }}>Could not load insights. Make sure the backend is running.</div>
      <button className="button-primary" onClick={() => navigate('/checkin')}>Start a Check-In</button>
    </div>
  );

  const riskColor = data.currentRiskStatus === 'Red' ? '#f87171' : data.currentRiskStatus === 'Amber' ? '#fbbf24' : '#34d399';
  const RiskIcon = data.currentRiskStatus === 'Red' ? ShieldAlert : data.currentRiskStatus === 'Amber' ? AlertCircle : TrendingUp;

  const displayName = currentUser?.isAnonymous ? 'Anonymous' : currentUser?.displayName?.split(' ')[0] || 'there';

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Hey {displayName} 👋</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Here's a look at your emotional trends</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px', border: `1px solid ${riskColor}44` }}>
          <RiskIcon size={18} color={riskColor} />
          <span style={{ color: riskColor, fontWeight: 600 }}>{data.currentRiskStatus} Status</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', animationDelay: '0.1s' }}>
          <p style={{ color: '#64748b', marginTop: 0, marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Dominant Emotion</p>
          <div className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 700 }}>{data.topIntent}</div>
        </div>
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', animationDelay: '0.2s' }}>
          <p style={{ color: '#64748b', marginTop: 0, marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Activities Completed</p>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{data.activitiesCompleted} <span style={{ fontSize: '1rem', color: '#64748b' }}>steps</span></div>
        </div>
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', animationDelay: '0.3s' }}>
          <p style={{ color: '#64748b', marginTop: 0, marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Burnout Level</p>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: data.burnoutScore > 50 ? '#fbbf24' : '#818cf8' }}>{data.burnoutScore}%</div>
        </div>
      </div>

      {/* Alerts Section (if any) */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', marginBottom: '28px', border: '1px solid rgba(248, 113, 113, 0.2)', background: 'rgba(248, 113, 113, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldAlert size={20} color="#f87171" />
            <h3 style={{ margin: 0, color: '#f87171' }}>Recent Security & Welfare Alerts</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.alerts.map(alert => (
              <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.9rem' }}>
                <span style={{ color: '#cbd5e1' }}>{alert.message}</span>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{new Date(alert.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood Chart */}
      <div className="glass-panel animate-slide-up" style={{ padding: '30px', animationDelay: '0.4s' }}>
        <h2 style={{ marginTop: 0, marginBottom: '30px' }}>Mood Trend (Last 7 Days)</h2>
        <div style={{ height: '300px' }}>
          <Suspense fallback={<div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'}}>Loading chart...</div>}>
            <LazyDashboardChart data={data.trends} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
