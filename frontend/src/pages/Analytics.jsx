import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, AlertCircle, ShieldAlert, HeartPulse, 
  Flame, CalendarCheck, MessageSquare, Activity,
  Smile, Meh, Frown, RefreshCw, WifiOff, Zap, Sparkles, Target
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RISK_COLORS = { 
  Green: '#10b981', 
  Amber: '#f59e0b', 
  Red: '#ef4444' 
};

const EMOTION_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb923c'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const risk = payload[0].payload.risk;
    const date = new Date(payload[0].payload.date).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit' });
    return (
      <div className="glass-panel" style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '16px' }}>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{date}</p>
        <p style={{ margin: '6px 0 0 0', color: RISK_COLORS[risk], fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} fill={RISK_COLORS[risk]} /> {risk} Risk
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
      if (!isBackground) setError("System link disrupted. Verify VITE_API_URL in deployment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handler = () => fetchData(true);
    const syncChannel = new BroadcastChannel('mindmitra_sync');
    syncChannel.onmessage = handler;
    window.addEventListener('checkin-complete', handler);
    return () => {
      syncChannel.close();
      window.removeEventListener('checkin-complete', handler);
    };
  }, [currentUser]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <div className="breathing-circle" style={{ width: '120px', height: '120px' }}>
        <Sparkles size={40} color="#818cf8" />
      </div>
      <div className="text-gradient" style={{ fontSize: '1.4rem', letterSpacing: '2px' }}>CALIBRATING INSIGHTS</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <div className="glass-card-trendy" style={{ padding: '40px', maxWidth: '500px' }}>
            <WifiOff size={60} color="#f87171" style={{ marginBottom: '24px', opacity: 0.8 }} />
            <h2 className="risk-red" style={{ fontSize: '2rem', marginBottom: '12px' }}>Connection Failure</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '32px' }}>{error}</p>
            <button className="button-primary" onClick={() => fetchData()} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <RefreshCw size={20} /> SYNC SYSTEM
            </button>
        </div>
     </div>
  );

  if (!data || data.checkinCount === 0) return (
     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <div className="glass-card-trendy animate-float" style={{ padding: '60px', maxWidth: '600px' }}>
            <div style={{ background: 'rgba(129, 140, 248, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <MessageSquare size={40} color="#818cf8" />
            </div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px', background: 'linear-gradient(to right, #fff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your Story Starts Here</h2>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '40px' }}>Your emotional journey is waiting to be mapped. Have your first conversation with MindMitra to unlock these analytics.</p>
            <button className="button-primary" onClick={() => navigate('/checkin')} style={{ padding: '16px 40px', fontSize: '1.2rem' }}>START FIRST CHECK-IN</button>
        </div>
     </div>
  );

  const riskColor = RISK_COLORS[data.currentRisk] || '#10b981';
  const RiskIcon = data.currentRisk === 'Red' ? Frown : data.currentRisk === 'Amber' ? Meh : Smile;

  return (
    <div style={{ minHeight: '100vh', padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* --- Top Header Card --- */}
      <div className="glass-card-trendy animate-slide-up" style={{ padding: '40px', marginBottom: '40px', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, ${riskColor}08 100%)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <div className="animate-float" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '-10px', background: riskColor, filter: 'blur(20px)', opacity: 0.2, borderRadius: '50%' }}></div>
                <div style={{ background: `${riskColor}20`, padding: '24px', borderRadius: '30px', border: `2px solid ${riskColor}40`, position: 'relative' }}>
                    <RiskIcon size={48} color={riskColor} />
                </div>
            </div>
            <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>Current Mental State</p>
                <h1 style={{ margin: '8px 0 0 0', fontSize: '3rem', color: riskColor, textShadow: `0 0 30px ${riskColor}40` }}>{data.currentRisk}</h1>
            </div>
        </div>
        
        <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Insight</p>
                <h2 style={{ margin: '5px 0 0 0', fontSize: '2.5rem', fontWeight: 800 }}>{data.checkinCount}</h2>
            </div>
            <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Consistency</p>
                <h2 style={{ margin: '5px 0 0 0', fontSize: '2.5rem', color: '#8b5cf6', fontWeight: 800 }}>{data.streak}d</h2>
            </div>
        </div>
      </div>

      {/* --- Grid Layout --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        
        {/* Main Trend Chart (Spans 8 cols) */}
        <div className="glass-card-trendy animate-slide-up" style={{ gridColumn: 'span 8', padding: '40px', minHeight: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TrendingUp size={24} color="#818cf8" /> Emotional Trajectory
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '20px' }}>
                    REAL-TIME SYNC ACTIVE
                </div>
            </div>
            
            <div style={{ height: '350px', width: '100%' }}>
                {graphData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={graphData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(str) => new Date(str).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                tick={{ fill: '#475569', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis domain={[-1.1, 1.1]} hide />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                            <Area 
                                type="monotone" 
                                dataKey="sentiment" 
                                stroke="#818cf8" 
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorSentiment)"
                                animationDuration={2000}
                                dot={(props) => {
                                    const risk = props.payload.risk;
                                    return <circle cx={props.cx} cy={props.cy} r={5} fill={RISK_COLORS[risk]} stroke="#111" strokeWidth={2} />
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569', gap: '20px' }}>
                        <div style={{ width: '200px', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: '40%', height: '100%', background: '#818cf8', borderRadius: '10px' }}></div>
                        </div>
                        Analysis requires more interaction data.
                    </div>
                )}
            </div>
        </div>

        {/* Emotion Mix (Spans 4 cols) */}
        <div className="glass-card-trendy animate-slide-up" style={{ gridColumn: 'span 4', padding: '40px' }}>
            <h3 style={{ margin: '0 0 30px 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={20} color="#f472b6" /> Emotion Mix
            </h3>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie data={data.emotionStats || []} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" nameKey="name">
                        {(data.emotionStats || []).map((_, i) => <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                {(data.emotionStats || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: EMOTION_COLORS[i % EMOTION_COLORS.length] }}></div>
                        {item.name}
                    </div>
                ))}
            </div>
        </div>

        {/* Intent Distribution (Spans 12 cols, wide view) */}
        <div className="glass-card-trendy animate-slide-up" style={{ gridColumn: 'span 12', padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Target size={22} color="#34d399" /> Intent Resonance
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Mapping psychological triggers across sessions</p>
            </div>
            
            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.emotionStats || []} margin={{ top: 0, right: 30, left: 0, bottom: 0 }} barGap={20}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }} />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={60}>
                        {(data.emotionStats || []).map((_, i) => <Cell key={i} fill={`url(#barGradient${i})`} />)}
                    </Bar>
                    <defs>
                        {(data.emotionStats || []).map((_, i) => (
                            <linearGradient key={i} id={`barGradient${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={EMOTION_COLORS[i % EMOTION_COLORS.length]} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={EMOTION_COLORS[i % EMOTION_COLORS.length]} stopOpacity={0.2} />
                            </linearGradient>
                        ))}
                    </defs>
                </BarChart>
            </ResponsiveContainer>
        </div>

      </div>

      {/* --- Pattern Alert Floating --- */}
      {data.patternAlert && (
          <div className="animate-slide-up" style={{ marginTop: '40px', position: 'relative' }}>
             <div style={{ position: 'absolute', inset: 0, background: data.patternAlert.level === 'RED' ? '#ef4444' : '#f59e0b', filter: 'blur(40px)', opacity: 0.1, borderRadius: '32px' }}></div>
             <div className="glass-card-trendy" style={{ padding: '30px 40px', display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', border: `1px solid ${data.patternAlert.level === 'RED' ? '#ef4444' : '#f59e0b'}33` }}>
                <div style={{ background: `${data.patternAlert.level === 'RED' ? '#ef4444' : '#f59e0b'}20`, padding: '16px', borderRadius: '20px' }}>
                    <ShieldAlert size={30} color={data.patternAlert.level === 'RED' ? '#f87171' : '#fbbf24'} />
                </div>
                <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', color: data.patternAlert.level === 'RED' ? '#f87171' : '#fbbf24' }}>{data.patternAlert.title}</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6' }}>{data.patternAlert.message}</p>
                </div>
             </div>
          </div>
      )}

    </div>
  );
}
