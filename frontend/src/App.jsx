import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import CheckIn from './pages/CheckIn';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';

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
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
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
