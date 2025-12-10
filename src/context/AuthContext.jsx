// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase'; // <-- your firebase auth export
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // `loading` means "we're waiting for Firebase to tell us the initial auth state"
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth changes
  useEffect(() => {
    // Start listening to firebase auth. The callback runs immediately with current state.
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // store a minimal user object (avoid storing entire firebaseUser which has functions)
        const u = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        };
        setUser(u);
        // optional: cache so UI can show something quickly if app reloads
        try { localStorage.setItem('agrigpt_user', JSON.stringify(u)); } catch (e) {}
      } else {
        setUser(null);
        try { localStorage.removeItem('agrigpt_user'); } catch (e) {}
      }

      // mark initialization done on the first callback (whether user is present or not)
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // sign out wrapper
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will update state and clear localStorage
    } catch (e) {
      console.error('signOut error', e);
    }
  };

  // keep a local login helper (if you used it before for a fake email login)
  const loginLocal = (email) => {
    const userData = { email, loginTime: new Date().toISOString() };
    setUser(userData);
    try { localStorage.setItem('agrigpt_user', JSON.stringify(userData)); } catch (e) {}
    return true;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    signOut,
    loginLocal
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
