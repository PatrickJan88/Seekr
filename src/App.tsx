/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { initAuth, googleSignIn, anonymousSignIn } from './lib/firebase';
import { User } from 'firebase/auth';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { Github, Linkedin } from 'lucide-react';

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => {
        setUser(u);
        setNeedsAuth(false);
        setLoading(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed the popup, silently ignore and let them try again
        console.log('Login popup closed by user');
      } else if (err.code === 'auth/unauthorized-domain') {
        alert('Authentication failed: This domain is not authorized in Firebase. Please go to your Firebase Console -> Authentication -> Settings -> Authorized domains, and add the current URL domain to the list.');
      } else if (err.message?.includes('Database is closing') || err.message?.includes('hidden')) {
        alert('Authentication failed because third-party storage is blocked in this preview iframe. Please click "Open in new tab" (the arrow icon at the top right) to log in and use the app.');
      } else {
        alert('Login failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAnonymousLogin = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    try {
      const result = await anonymousSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Anonymous login failed:', err);
      if (err.message?.includes('Database is closing') || err.message?.includes('hidden')) {
        alert('Authentication failed because third-party storage is blocked in this preview iframe. Please click "Open in new tab" (the arrow icon at the top right) to log in and use the app.');
      } else {
        alert('Anonymous login failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-900">Loading...</div>;
  }

  if (needsAuth || !user) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-2 border-slate-200">
            <img src="/assets/seekr%20logo%201.svg" alt="Seekr Logo" className="h-10 mx-auto mb-4" />
            <p className="text-slate-500 font-medium mb-8 text-sm">Track applications, sync interviews, and analyze your job search.</p>
            
            <div className="space-y-4">
              <button onClick={handleLogin} disabled={isLoggingIn} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all shadow-sm">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
              
              <button onClick={handleAnonymousLogin} disabled={isLoggingIn} className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm">
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
        <Footer
          logo={<img src="/assets/seekr%20logo%201.svg" alt="Seekr Logo" className="h-6" />}
          brandName=""
          socialLinks={[
            { icon: <Github size={18} />, href: "https://github.com/PatrickJan88", label: "GitHub" },
            { icon: <Linkedin size={18} />, href: "https://www.linkedin.com/in/pofei-r-79586395", label: "LinkedIn" },
            { icon: <img src="/assets/logo%20pofei.svg" alt="Pofei Logo" className="w-[18px] h-[18px]" />, href: "https://pofeiportfolio.vercel.app/", label: "Portfolio" }
          ]}
          mainLinks={[
            { href: "https://pofeiportfolio.vercel.app/", label: "🖋 Made by Pofei" }
          ]}
          legalLinks={[]}
          copyright={{
            text: "Disclaimer: This is an AI-generated coding project created solely for research and demonstration purposes. It is not a commercial product, and is not affiliated with any existing companies or trademarks utilizing the \"Seekr\" name.",
          }}
        />
      </div>
    );
  }

  return <Dashboard />;
}
