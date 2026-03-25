import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Shield, Bell, Lock, Save, LogOut, 
  Settings as SettingsIcon, Mail, Phone, Heart,
  Sparkles, CheckCircle2
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/api/v1/checkin/emergency-contact`, {
        userId: currentUser.uid,
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update settings:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '100px 20px 40px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-slide-up" style={{ marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <SettingsIcon size={32} color="#818cf8" /> Account Settings
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Customize your experience and manage security preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        
        {/* Profile Card */}
        <div className="glass-card-trendy animate-slide-up" style={{ gridColumn: 'span 12', padding: '30px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -5, background: '#c084fc', filter: 'blur(20px)', opacity: 0.2, borderRadius: '50%' }}></div>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
               <User size={36} color="#fff" />
            </div>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{currentUser.displayName || 'Member'}</h2>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>{currentUser.email || 'Anonymous Access'}</p>
          </div>
          <button onClick={logout} className="glass-panel" style={{ marginLeft: 'auto', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Emergency Contact Form */}
        <div className="glass-card-trendy animate-slide-up" style={{ gridColumn: 'span 7', padding: '40px' }}>
          <h3 style={{ margin: '0 0 30px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={20} color="#34d399" /> Safety Net
          </h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Contact Name</label>
              <input 
                type="text" 
                className="input-field" 
                style={{ width: '100%' }}
                placeholder="Trustee name..."
                required
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>Phone Number</label>
              <input 
                type="tel" 
                className="input-field" 
                style={{ width: '100%' }}
                placeholder="+1 234 567 890"
                required
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})}
              />
            </div>
            <button className="button-primary" type="submit" disabled={loading} style={{ marginTop: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {success ? <><CheckCircle2 size={18} /> UPDATED</> : <><Save size={18} /> SAVE CHANGES</>}
            </button>
          </form>
        </div>

        {/* Privacy & Stats */}
        <div className="glass-card-trendy animate-slide-up" style={{ gridColumn: 'span 5', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Lock size={20} color="#f472b6" /> Security
            </h3>
            
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ margin: 0, color: '#f8fafc', fontWeight: 600 }}>End-to-End Encrypted</p>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Your chats are private and analyzed locally via Gemini Flash 1.5.</p>
            </div>

            <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} color="#fbbf24" /> Account ID: {currentUser.uid.slice(0, 12)}...
                </p>
            </div>
        </div>

      </div>

    </div>
  );
}
