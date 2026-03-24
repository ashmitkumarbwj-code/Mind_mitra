import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const saveUserProfile = async (user, extraData = {}) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) {
      await setDoc(userRef, {
        user_id: user.uid,
        name: user.displayName || extraData.name || 'Anonymous',
        email: user.email || null,
        is_anonymous: user.isAnonymous,
        photo_url: user.photoURL || null,
        created_at: new Date().toISOString(),
        ...extraData
      });
    }
  } catch (err) {
    // Firestore may not be set up yet — this is non-critical for MVP
    console.warn('Could not save user profile to Firestore:', err.message);
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loginWithEmail = async (email, password) => {
    setError('');
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const registerWithEmail = async (email, password, name) => {
    setError('');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await saveUserProfile(result.user, { name, is_anonymous: false });
    return result.user;
  };

  const loginWithGoogle = async () => {
    setError('');
    const result = await signInWithPopup(auth, googleProvider);
    await saveUserProfile(result.user, { is_anonymous: false });
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    }, (err) => {
      console.error('Auth state error:', err);
      setLoading(false); // Always unblock render even on error
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    setError,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout
  };

  // Show a full-page loading state instead of null
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        color: '#818cf8', fontSize: '1.1rem', gap: '12px', flexDirection: 'column'
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span>Loading MindMitra...</span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
