import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, AlertCircle, ShieldAlert, HeartPulse, 
  Flame, CalendarCheck, MessageSquare, Activity,
  Smile, Meh, Frown
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RISK_COLORS = { Green: '#34d399', Amber: '#fbbf24', Red: '#f87171' };
const EMOTION_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb923c'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const risk = payload[0].payload.risk;
    const date = new Date(payload[0].payload.date).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit' });
    return (
      <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem' }}>{date}</p>
        <p style={{ margin: '4px 0 0 0', color: RISK_COLORS[risk], fontWeight: 700, fontSize: '1rem' }}>
          {risk} Level
        </p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async (isBackground = false) => {
    if (!currentUser) return;
    if (!isBackground) setLoading(true);
    try {
      console.log(`[ANALYTICS] Fetching data for UID: ${currentUser.uid}`);
      const res = await axios.get(`${API_BASE}/api/v1/dashboard/user?userId=${currentUser.uid}&_t=${Date.now()}`);
      console.log('[ANALYTICS] API Response Data:', res.data.data);
      setData(res.data.data);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(false);
    
    const syncChannel = new BroadcastChannel('mindmitra_sync');
    const onRefresh = () => fetchDashboard(true);
    
    syncChannel.onmessage = onRefresh;
    window.addEventListener('checkin-complete', onRefresh);
    
    return () => {
      syncChannel.close();
      window.removeEventListener('checkin-complete', onRefresh);
    };
  }, [currentUser]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <HeartPulse size={40} color="#818cf8" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="text-gradient" style={{ fontSize: '1.1rem' }}>Updating your mood trends...</div>
    </div>
  );

  if (!data) return null;

  const riskColor = RISK_COLORS[data.currentRisk] || '#34d399';
  const RiskIcon = data.currentRisk === 'Red' ? Frown : data.currentRisk === 'Amber' ? Meh : Smile;

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* ── Stats Row ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Dominant Emotion Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: `${riskColor}15`, padding: '16px', borderRadius: '18px', border: `1px solid ${riskColor}33` }}>
            <RiskIcon size={32} color={riskColor} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Dominant Emotion</p>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: riskColor }}>{data.currentRisk}</h2>
          </div>
        </div>

        {/* Check-in Count Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Total Check-Ins</p>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', color: '#f8fafc' }}>{data.checkinCount}</h2>
        </div>

        {/* Streak/Activity Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Consistency Score</p>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#818cf8' }}>{data.streak} Day Streak</h2>
            </div>
            <Flame size={28} color="#fb923c" style={{ marginLeft: 'auto' }} />
        </div>
      </div>

      {/* ── Pattern Alert (High Contrast) ────────────── */}
      {data.patternAlert && (
        <div className="animate-slide-up" style={{
          background: data.patternAlert.level === 'RED' ? 'rgba(239,68,68,0.06)' : 'rgba(251,191,36,0.06)',
          border: `1px solid ${data.patternAlert.level === 'RED' ? '#f87171' : '#fbbf24'}33`,
          borderRadius: '16px', padding: '20px 24px', marginBottom: '28px',
          display: 'flex', alignItems: 'flex-start', gap: '16px',
          boxShadow: `0 4px 20px ${data.patternAlert.level === 'RED' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)'}`
        }}>
          <AlertCircle size={24} color={data.patternAlert.level === 'RED' ? '#f87171' : '#fbbf24'} style={{ marginTop: '2px' }} />
          <div>
            <h3 style={{ margin: '0 0 6px 0', color: data.patternAlert.level === 'RED' ? '#f87171' : '#fbbf24', fontSize: '1.1rem' }}>
              {data.patternAlert.title || "Mood Pattern Detected"}
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>{data.patternAlert.message}</p>
          </div>
        </div>
      )}

      {/* ── Mood Trend Graph (Discrete) ────────────── */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 32px 0', fontSize: '1.2rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={20} color="#818cf8" /> Mood Trend (Last {data.riskTrend?.length || 0} Entries)
        </h2>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.riskTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
                }}
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 2]} 
                ticks={[0, 1, 2]} 
                tickFormatter={(val) => val === 2 ? 'Green' : val === 1 ? 'Amber' : 'Red'}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                width={70}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="level" 
                stroke="#6366f1" 
                strokeWidth={4}
                dot={(props) => {
                   const risk = props.payload.risk;
                   return (
                     <circle 
                       cx={props.cx} 
                       cy={props.cy} 
                       r={6} 
                       fill={RISK_COLORS[risk]} 
                       stroke="rgba(255,255,255,0.2)" 
                       strokeWidth={2} 
                     />
                   );
                }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Secondary Analysis Grid ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Emotion Mix */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="#f472b6" /> Weekly Emotion Mix
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.emotionStats} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                paddingAngle={5} dataKey="value" nameKey="name">
                {data.emotionStats.map((_, i) => <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Summary */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#34d399" /> Intervention Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Coping Strategies Logged', value: `${data.burnoutScore}% Engagement`, color: '#818cf8' },
              { label: 'Self-Harm Filters Tripped', value: data.alerts?.length || 0, color: '#f87171' },
              { label: 'Proactive Outreach', value: data.patternAlert ? '1 Pending' : '0 Required', color: '#fbbf24' }
            ].map((stat, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{stat.label}</span>
                <span style={{ color: stat.color, fontWeight: 700 }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
