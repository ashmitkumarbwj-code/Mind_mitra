import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, AlertCircle, ShieldAlert, HeartPulse, 
  Flame, CalendarCheck, MessageSquare, Activity 
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RISK_COLORS = { Green: '#34d399', Amber: '#fbbf24', Red: '#f87171' };
const EMOTION_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb923c'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>{label}</p>
        <p style={{ margin: '4px 0 0 0', color: '#818cf8', fontWeight: 700, fontSize: '1.1rem' }}>
          {payload[0].value !== null ? payload[0].value : 'No data'}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/v1/dashboard/user?userId=${currentUser.uid}&_t=${Date.now()}`);
        setData(res.data.data);
      } catch (err) {
        console.error('Dashboard fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [currentUser]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <HeartPulse size={40} color="#818cf8" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="text-gradient" style={{ fontSize: '1.1rem' }}>Analyzing your emotional patterns...</div>
    </div>
  );

  if (!data || data.checkinCount === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', padding: '40px' }}>
      <HeartPulse size={56} color="#818cf8" />
      <h2 style={{ color: '#e2e8f0', margin: 0 }}>No Data Yet</h2>
      <p style={{ color: '#64748b', textAlign: 'center', maxWidth: '400px' }}>Your dashboard will come alive after your first check-in. Start one now!</p>
      <button className="button-primary" onClick={() => navigate('/checkin')}>Start My First Check-In</button>
    </div>
  );

  const displayName = currentUser?.isAnonymous ? 'there' : currentUser?.displayName?.split(' ')[0] || 'there';
  const riskColor = RISK_COLORS[data.currentRisk] || '#34d399';
  const RiskIcon = data.currentRisk === 'Red' ? ShieldAlert : data.currentRisk === 'Amber' ? AlertCircle : TrendingUp;

  const sentimentLabel = data.avgSentiment > 0.5 ? '😊 Positive' : data.avgSentiment < -0.5 ? '😔 Low' : '😐 Neutral';

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Hey {displayName} 👋</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Here's your emotional wellness report for this week</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${riskColor}16`, padding: '10px 20px', borderRadius: '20px', border: `1px solid ${riskColor}55` }}>
          <RiskIcon size={18} color={riskColor} />
          <span style={{ color: riskColor, fontWeight: 700 }}>{data.currentRisk} Status</span>
        </div>
      </div>

      {/* ── Pattern Alert ──────────────────────────── */}
      {data.patternAlert && (
        <div style={{
          background: data.patternAlert.level === 'RED' ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
          border: `1px solid ${data.patternAlert.level === 'RED' ? '#f87171' : '#fbbf24'}55`,
          borderLeft: `4px solid ${data.patternAlert.level === 'RED' ? '#f87171' : '#fbbf24'}`,
          borderRadius: '12px', padding: '16px 20px', marginBottom: '28px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <AlertCircle size={22} color={data.patternAlert.level === 'RED' ? '#f87171' : '#fbbf24'} />
          <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem' }}>{data.patternAlert.message}</p>
        </div>
      )}

      {/* ── Stat Cards ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Check-Ins (7 Days)', value: data.checkinCount, icon: <CalendarCheck size={22} color="#818cf8" />, suffix: 'sessions' },
          { label: 'Day Streak', value: data.streak, icon: <Flame size={22} color="#fb923c" />, suffix: 'days' },
          { label: 'Avg Mood', value: `${data.avgSentiment ?? 0}`, icon: <Activity size={22} color="#34d399" />, suffix: sentimentLabel },
          { label: 'Top Emotion', value: data.topIntent, icon: <HeartPulse size={22} color="#f472b6" />, suffix: 'this week' },
        ].map(({ label, value, icon, suffix }) => (
          <div key={label} className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
              {icon}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{suffix}</div>
          </div>
        ))}
      </div>

      {/* ── Mood Trend Graph ───────────────────────── */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="#818cf8" /> 7-Day Mood Trend
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.moodTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
            <YAxis domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3}
              dot={{ fill: '#818cf8', r: 5, strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#a5b4fc' }}
              connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[[-2, 'Crisis'], [-1, 'Low'], [0, 'Neutral'], [1, 'Good'], [2, 'Great']].map(([v, l]) => (
            <span key={v} style={{ fontSize: '0.75rem', color: '#64748b' }}>{v}: {l}</span>
          ))}
        </div>
      </div>

      {/* ── Emotion + Risk Grid ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>

        {/* Emotion Distribution */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="#f472b6" /> Emotion Breakdown
          </h2>
          {data.emotionStats?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={data.emotionStats} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={4} dataKey="value" nameKey="name">
                    {data.emotionStats.map((_, i) => <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} check-ins`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                {data.emotionStats.map((e, i) => (
                  <span key={e.name} style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px', background: `${EMOTION_COLORS[i]}22`, color: EMOTION_COLORS[i], border: `1px solid ${EMOTION_COLORS[i]}44` }}>
                    {e.name} ({e.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', paddingTop: '40px' }}>No emotion data yet</p>
          )}
        </div>

        {/* Risk Level + Daily Activity bar */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#34d399" /> Daily Check-In Activity
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.moodTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short' })} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(val) => [`${val} check-ins`, 'Activity']} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
          {/* Risk Legend */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {Object.entries(RISK_COLORS).map(([level, color]) => (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: data.currentRisk === level ? `0 0 8px ${color}` : 'none' }} />
                <span style={{ fontSize: '0.8rem', color: data.currentRisk === level ? color : '#64748b', fontWeight: data.currentRisk === level ? 700 : 400 }}>{level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Entries ─────────────────────────── */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="#60a5fa" /> Recent Check-Ins
        </h2>
        {data.recentEntries?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.recentEntries.map((entry, i) => {
              const color = RISK_COLORS[entry.riskLevel] || '#34d399';
              return (
                <div key={i} style={{
                  background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '14px 16px',
                  borderLeft: `3px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.4' }}>
                      "{entry.message?.substring(0, 120)}{entry.message?.length > 120 ? '...' : ''}"
                    </p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(entry.date).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: `${color}22`, color: color }}>{entry.riskLevel}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{entry.intent}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: entry.sentiment > 0 ? '#34d399' : entry.sentiment < 0 ? '#f87171' : '#94a3b8', minWidth: '40px', textAlign: 'right' }}>
                    {entry.sentiment > 0 ? `+${entry.sentiment}` : entry.sentiment}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No recent entries</p>
        )}
      </div>

    </div>
  );
}
