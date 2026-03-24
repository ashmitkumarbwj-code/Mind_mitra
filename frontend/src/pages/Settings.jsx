import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, User, Phone, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const fetchUserData = async () => {
      try {
        // We can get the user data from the dashboard endpoint or a dedicated one.
        // For simplicity, let's assume we can fetch it.
        const res = await axios.get(`http://localhost:5000/api/v1/dashboard/user?userId=${currentUser.uid}`);
        if (res.data.data.user) {
          setName(res.data.data.user.emergency_contact_name || '');
          setPhone(res.data.data.user.emergency_contact_phone || '');
        }
      } catch (err) {
        console.error('Failed to fetch user settings', err);
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await axios.put('http://localhost:5000/api/v1/checkin/emergency-contact', {
        userId: currentUser.uid,
        name,
        phone
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-slide-up" style={{ maxWidth: '480px', width: '100%', padding: '40px' }}>
        <h1 style={{ marginTop: 0, marginBottom: '8px' }}>Safety Settings</h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          Assign a trusted contact. We'll only reach out if you've been inactive for over 15 days or in a crisis.
        </p>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '12px', color: '#f87171', fontSize: '0.9rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
              <User size={16} /> Contact Name
            </label>
            <input
              type="text"
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="e.g. Best Friend, Parent..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
              <Phone size={16} /> Contact Phone
            </label>
            <input
              type="tel"
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="+91 XXXXX XXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ background: 'rgba(129, 140, 248, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(129, 140, 248, 0.1)', display: 'flex', gap: '12px' }}>
            <ShieldAlert size={24} color="#818cf8" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
              Your privacy is priority. This data is encrypted and used ONLY for your safety.
            </p>
          </div>

          <button
            type="submit"
            className="button-primary"
            disabled={loading}
            style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', marginTop: '12px' }}
          >
            {loading ? 'Saving...' : success ? <><CheckCircle size={20} /> Saved Successfully</> : <><Save size={20} /> Update Safety Contact</>}
          </button>
        </form>
      </div>
    </div>
  );
}
