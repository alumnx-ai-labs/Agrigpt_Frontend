import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, firestore } from '../services/firebase';
import { 
  signInWithPopup, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles } from 'lucide-react';

/* ----------------------------------------
   DEV: Suppress COOP Console Spam
   ---------------------------------------- */
if (process.env.NODE_ENV === 'development') {
  const origError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Cross-Origin-Opener-Policy')) return;
    origError.apply(console, args);
  };
}

const BACKEND_URL = 'https://agrigpt-backend-rag.onrender.com';
const HEARTBEAT_MS = 30_000;

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Refs
  const sessionIdRef = useRef(null);
  const mountedRef = useRef(true);
  const heartbeatTimerRef = useRef(null);
  const didNavigateRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const storedSid = localStorage.getItem('sessionId');
    if (storedSid) sessionIdRef.current = storedSid;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user && !didNavigateRef.current) {
        try {
            await registerUserInBackend(user.email);
        } catch (err) {
            console.warn("Backend registration skipped:", err);
        }

        didNavigateRef.current = true;
        navigate('/consultant', { replace: true });
        
        handlePostSignIn(user).catch(err => console.warn("Session warning:", err));
      }
    });

    return () => {
      mountedRef.current = false;
      unsub();
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [navigate]);

  // --- Backend & Firebase Logic ---
  const registerUserInBackend = async (userEmail) => {
    if (!userEmail) return;
    try {
        const response = await fetch(`${BACKEND_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });
        if (response.status === 404) return;
    } catch (error) {
        console.error("Backend registration failed:", error);
    }
  };

  const handlePostSignIn = async (user) => {
    if (!user) return;
    if (!navigator.onLine) return;
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        role: 'user'
      }, { merge: true });
      
      const uid = user.uid;
      let sid = sessionIdRef.current;
      if (!sid) {
        sid = uuidv4();
        sessionIdRef.current = sid;
        localStorage.setItem('sessionId', sid);
      }
      await setDoc(doc(firestore, 'userSessions', uid, 'sessions', sid), {
        lastSeen: serverTimestamp(),
        device: navigator.userAgent
      }, { merge: true });

    } catch (e) {
      console.warn('Session setup skipped:', e.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      if (e.code !== 'auth/popup-closed-by-user') setError('Google login failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a1f1c] flex items-center justify-center font-sans selection:bg-green-500/30">
      
      {/* --- BACKGROUND FX --- */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.15),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(5,150,105,0.1),transparent_60%)]" />
      </div>

      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-green-500/20 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30rem] h-[30rem] bg-emerald-600/10 rounded-full blur-[128px] animate-float" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* --- MAIN CARD --- */}
      <div className="relative z-10 w-full max-w-md px-6">
        
        {/* Glow behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-[2rem] blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
        
        <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
          
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

          <div className="p-10 flex flex-col items-center text-center">
            
            {/* Logo Container (Clean - No Orbiting Dot) */}
            <div className="mb-10 relative group">
              <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
              <div className="relative w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-500 border border-white/20">
                <span className="text-5xl filter drop-shadow-md">🌾</span>
              </div>
            </div>

            {/* Typography */}
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
              AgriGPT
            </h1>
            <p className="text-green-100/60 text-sm mb-12 max-w-[280px] leading-relaxed">
              Your intelligent AI companion for modern, sustainable agriculture.
            </p>

            {/* Error Message */}
            {error && (
              <div className="w-full bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center gap-4 bg-white text-[#0a1f1c] font-bold py-4 px-6 rounded-2xl hover:bg-green-50 transition-all duration-300 transform active:scale-[0.98] shadow-xl shadow-black/20 overflow-hidden"
            >
              {/* Button Shine */}
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[25deg] group-hover:animate-shine" />
              
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0a1f1c]/30 border-t-[#0a1f1c] rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Footer Text */}
            <div className="mt-10 flex items-center justify-center gap-2 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Powered by Alumnx AI Labs</span>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        @keyframes shine {
          100% { left: 125%; }
        }
        .animate-float { animation: float 10s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .group-hover\\:animate-shine:hover { animation: shine 0.75s; }
      `}</style>
    </div>
  );
}