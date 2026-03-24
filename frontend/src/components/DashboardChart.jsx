import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LineChart as ChartIcon } from 'lucide-react';

export default function DashboardChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', textAlign: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '50%', marginBottom: '16px' }}>
          <ChartIcon size={40} color="#818cf8" opacity={0.5} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', color: '#cbd5e1' }}>No Data Yet</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '250px' }}>Complete your first mental health check-in to unlock your mood trend graph.</p>
      </div>
    );
  }

  // Define custom tooltip for better UI
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const moodLabel = score > 1 ? "Very Calm/Happy" : score > 0 ? "Neutral/Good" : score > -1 ? "Stressed" : "Severe Crisis";
      return (
        <div style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
          <p style={{ margin: '0 0 4px 0', color: '#818cf8', fontWeight: 600 }}>{new Date(label).toLocaleDateString([], {month: 'short', day: 'numeric'})}</p>
          <p style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700 }}>{moodLabel}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis 
          dataKey="date" 
          stroke="#475569" 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis 
          stroke="#475569" 
          domain={[-2, 2]} 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          tickFormatter={(v) => {
            if (v === 2) return 'Happy';
            if (v === 0) return 'Neutral';
            if (v === -2) return 'Stressed';
            return '';
          }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="score" 
          stroke="#a5b4fc" 
          strokeWidth={4}
          fillOpacity={1} 
          fill="url(#colorScore)" 
          activeDot={{ r: 8, fill: '#c084fc', stroke: '#fff', strokeWidth: 2, boxShadow: '0 0 10px rgba(192, 132, 252, 0.8)' }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
