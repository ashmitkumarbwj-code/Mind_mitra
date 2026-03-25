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
  Smile, Meh, Frown, RefreshCw, WifiOff
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
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (isBackground = false) => {
    if (!currentUser) return;
    if (!isBackground) {
        setLoading(true);
        setError(null);
    }
    try {
      console.log(`[ANALYTICS] Fetching data for UID: ${currentUser.uid}`);
      
      const [statsRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/api/v1/dashboard/user?userId=${currentUser.uid}&_t=${Date.now()}`),
        axios.get(`${API_BASE}/api/v1/checkin/history?userId=${currentUser.uid}&_t=${Date.now()}`)
      ]);
      
      const dashboardData = statsRes.data.data;
      const historyData = historyRes.data.data || [];
      
      const formattedTrend = historyData.map(item => ({
        date: new Date(item.createdAt).toISOString(),
        sentiment: item.sentimentScore || 0,
        risk: item.riskLevel || 'Unknown'
      })).reverse();

      setGraphData([...formattedTrend]);
      setData(dashboardData);
      
    } catch (err) {
      console.error('[ANALYTICS] Fetch error:', err);
      if (!isBackground) setError("Unable to connect to your health center. Please check your internet or retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const handler = () => {
        console.log("[ANALYTICS] checkin-complete received. Refreshing graph...");
        fetchData(true);
    };

    const syncChannel = new BroadcastChannel('mindmitra_sync');
    syncChannel.onmessage = handler;
    window.addEventListener('checkin-complete', handler);
    
    return () => {
      syncChannel.close();
      window.removeEventListener('checkin-complete', handler);
    };
  }, [currentUser]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <HeartPulse size={40} color="#818cf8" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="text-gradient" style={{ fontSize: '1.1rem' }}>Updating your mood trends...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <WifiOff size={48} color="#f87171" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: '#f87171', marginBottom: '8px' }}>Connection Issue</h2>
        <p style={{ color: '#94a3b8', maxWidth: '400px' }}>{error}</p>
        <button onClick={() => fetchData()} style={{ marginTop: '24px', background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: '1px solid #f8717133', padding: '10px 24px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Retry Sync
        </button>
     </div>
  );

  if (!data || data.checkinCount === 0) return (
     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <MessageSquare size={48} color="#475569" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: '#f8fafc', marginBottom: '8px' }}>No Data Yet</h2>
        <p style={{ color: '#94a3b8', maxWidth: '400px' }}>Start a conversation with MindMitra to see your emotional trends and insights here.</p>
        <button onClick={() => navigate('/checkin')} style={{ marginTop: '24px', background: '#818cf8', color: 'white', padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>Start Chatting</button>
     </div>
  );

  const riskColor = RISK_COLORS[data.currentRisk] || '#34d399';
  const RiskIcon = data.currentRisk === 'Red' ? Frown : data.currentRisk === 'Amber' ? Meh : Smile;

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '1100px', margin: '0 auto' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: `${riskColor}15`, padding: '16px', borderRadius: '18px', border: `1px solid ${riskColor}33` }}>
            <RiskIcon size={32} color={riskColor} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Dominant Emotion</p>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: riskColor }}>{data.currentRisk}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Total Check-Ins</p>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '2rem', color: '#f8fafc' }}>{data.checkinCount}</h2>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Consistency Score</p>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#818cf8' }}>{data.streak} Day Streak</h2>
            </div>
            <Flame size={28} color="#fb923c" style={{ marginLeft: 'auto' }} />
        </div>
      </div>

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

      <div className="glass-panel animate-dashboard-refresh" key={graphData.length} style={{ padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 32px 0', fontSize: '1.2rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={20} color="#818cf8" className="animate-pulse" /> {`Mood Trend (Last ${graphData.length} Entries)`}
        </h2>
        <div style={{ height: '300px', width: '100%' }}>
          {graphData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                  domain={[-1, 1]} 
                  ticks={[-1, 0, 1]} 
                  tickFormatter={(val) => val === 1 ? 'Positive' : val === 0 ? 'Neutral' : 'Negative'}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sentiment" 
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
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
               Trend will appear after your 2nd check-in.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="#f472b6" /> Weekly Emotion Mix
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.emotionStats || []} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                paddingAngle={5} dataKey="value" nameKey="name">
                {(data.emotionStats || []).map((_, i) => <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#34d399" /> Intent Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.emotionStats || []}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {(data.emotionStats || []).map((_, i) => <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
