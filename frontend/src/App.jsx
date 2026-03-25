import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import CheckIn from './pages/CheckIn';
import Analytics from './pages/Analytics';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

// Guard: redirect unauthenticated users back to onboarding
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/" replace />;
}

import NavBar from './components/layout/NavBar';

function AppRoutes() {
  return (
    <>
      <NavBar />
      <div style={{ paddingTop: '60px' }}>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/checkin" element={<PrivateRoute><CheckIn /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  React.useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const x = (e.clientX / window.innerWidth) * 100;
          const y = (e.clientY / window.innerHeight) * 100;
          document.documentElement.style.setProperty('--mouse-x', `${x}%`);
          document.documentElement.style.setProperty('--mouse-y', `${y}%`);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="app-container" style={{ minHeight: '100vh', width: '100%' }}>
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
