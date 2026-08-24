import React, { useState } from 'react';
import { Footer } from './Footer';
import { Github, Linkedin } from 'lucide-react';
import { ArrowLeft, Settings, Trash2, LogOut, CheckCircle } from 'lucide-react';
import { auth, logout } from '../lib/firebase';
import { SupportForm } from './SupportForm';

interface SettingsPageProps {
  trackingSystem?: 'industry' | 'academic';
  setTrackingSystem?: (sys: 'industry' | 'academic') => void;
  onBack: () => void;
  onClearData: () => void;
  isSyncing: boolean;
}

export function SettingsPage({ onBack, onClearData, isSyncing, trackingSystem = 'industry', setTrackingSystem }: SettingsPageProps) {

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.delete();
        logout();
      }
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        alert("This operation is sensitive and requires recent authentication. Please log in again before retrying.");
        logout();
      } else {
        alert("Failed to delete account. Please try again.");
      }
    }
  };

  const isAnon = auth.currentUser?.isAnonymous;
  const email = auth.currentUser?.email;
  const uid = auth.currentUser?.uid;
  
  let initial = 'U';
  let seedStr = 'user';
  
  if (isAnon) {
    initial = 'G';
    seedStr = uid || 'guest';
  } else if (email) {
    initial = email.charAt(0).toUpperCase();
    seedStr = email;
  }

  const colorPalettes = [
    { bg: 'bg-[#deebff]', text: 'text-[#0747a6]', border: 'border-[#b3d4ff]' },
    { bg: 'bg-[#eae6ff]', text: 'text-[#403294]', border: 'border-[#c0b6f2]' },
    { bg: 'bg-[#e3fcef]', text: 'text-[#006644]', border: 'border-[#abf5d1]' },
    { bg: 'bg-[#fffae6]', text: 'text-[#172b4d]', border: 'border-[#ffe380]' },
    { bg: 'bg-[#ffebe6]', text: 'text-[#bf2600]', border: 'border-[#ffbdad]' },
    { bg: 'bg-[#e6fcff]', text: 'text-[#0052cc]', border: 'border-[#b3f5ff]' },
  ];

  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const avatarColor = colorPalettes[Math.abs(hash) % colorPalettes.length];

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative overflow-y-auto custom-scrollbar">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-[#121722] mb-1">Account</h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 pt-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border} border rounded-full flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 select-none`}>
                  {initial}
                </div>
                <div>
                  {auth.currentUser?.isAnonymous ? (
                    <p className="text-xs font-semibold text-[#121722]">
                      Signed in as Guest <span className="text-[#777c86] font-normal text-[11px] ml-1">#Guest{auth.currentUser?.uid.substring(0, 5).toLowerCase()}</span>
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-[#121722]">Synced with {auth.currentUser?.email || 'Google'}</p>
                  )}
                  <p className="text-[11px] text-[#777c86]">Connected</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center justify-center rounded-full text-xs font-medium transition-all border border-[#efefef] bg-white text-[#121722] shadow-2xs hover:bg-[#faf9f7] h-8 px-4 cursor-pointer self-start sm:self-center"
              >
                Log Out
              </button>
            </div>
          </div>

          
          <div className="p-6">
            <h3 className="text-sm font-semibold text-[#121722] mb-1">Tracking System</h3>
            <p className="text-[13px] text-[#777c86] mb-4">
              Switch between Industry and Academic job markets. This changes the default database and job suggestions.
            </p>
            <div className="flex items-center gap-4">
              <select 
                value={trackingSystem} 
                onChange={(e) => setTrackingSystem?.(e.target.value as any)}
                className="w-full sm:w-64 px-3.5 py-2 border border-[#efefef] rounded-lg bg-white focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-[13px] text-[#121722] cursor-pointer"
              >
                <option value="industry">Industry Seekr</option>
                <option value="academic">Academic Seekr</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            <SupportForm />
          </div>
          
          
          <div className="p-6 flex flex-col gap-8">
            {/* Delete Data */}
            <div className="border border-red-200 rounded-lg overflow-hidden shadow-2xs">
              <div className="p-5 bg-white">
                <h4 className="text-[15px] font-bold text-[#121722] mb-1">Delete Data</h4>
                <p className="text-[13px] text-[#777c86]">
                  Permanently remove your job applications. This action is not reversible, so please continue with caution.
                </p>
              </div>
              <div className="px-5 py-3.5 bg-red-50 flex items-center justify-end border-t border-red-100">
                <button
                  onClick={() => { onBack(); onClearData(); }}
                  disabled={isSyncing}
                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium px-4 py-2 rounded-[6px] transition-colors text-[13px] shadow-sm cursor-pointer"
                >
                  Clear All Data
                </button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="border border-red-200 rounded-lg overflow-hidden shadow-2xs">
              <div className="p-5 bg-white">
                <h4 className="text-[15px] font-bold text-[#121722] mb-1">Delete Account</h4>
                <p className="text-[13px] text-[#777c86]">
                  Permanently remove your Personal Account and all of its contents from the Seekr platform. This action is not reversible, so please continue with caution.
                </p>
              </div>
              <div className="px-5 py-3.5 bg-red-50 flex items-center justify-end border-t border-red-100">
                <button
                  onClick={() => setShowDeleteAccountConfirm(true)}
                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium px-4 py-2 rounded-[6px] transition-colors text-[13px] shadow-sm cursor-pointer"
                >
                  Delete Personal Account
                </button>
              </div>
            </div>
          </div>

        </div>
        
        <div className="mt-auto pt-12">
          <div className="text-center text-xs text-[#777c86] font-medium mb-8">
            Version 3.0.0
          </div>
          <Footer
            logo={<img src="/assets/seekr%20logo%201.webp" alt="Seekr Logo" className="h-6" />}
            brandName=""
            socialLinks={[
              { icon: <Github size={18} />, href: "https://github.com/PatrickJan88/Seekr/blob/main/README.md", label: "GitHub" },
              { icon: <Linkedin size={18} />, href: "https://www.linkedin.com/in/pofei-r-79586395", label: "LinkedIn" },
              { icon: <img src="/assets/logo%20pofei.svg" alt="Pofei Logo" className="w-[18px] h-[18px]" />, href: "https://pofeiportfolio.vercel.app/", label: "Portfolio" }
            ]}
            mainLinks={[]}
            legalLinks={[]}
            copyright={{
              text: "Disclaimer: This is an AI-generated coding project created solely for research and demonstration purposes. It is not a commercial product, and is not affiliated with any existing companies or trademarks utilizing the \"Seekr\" name.",
            }}
          />
    
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
             <h3 className="text-lg font-bold text-[#121722] mb-2">Log Out</h3>
             <p className="text-[13px] text-[#777c86] mb-6">Are you sure you want to log out of your account?</p>
             <div className="flex justify-end gap-3">
               <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 rounded-full font-medium text-[13px] text-[#777c86] hover:bg-[#faf9f7] transition-colors cursor-pointer">Cancel</button>
               <button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="px-4 py-2 rounded-full font-medium text-[13px] bg-[#121722] text-white hover:bg-black transition-colors cursor-pointer">Log Out</button>
             </div>
          </div>
        </div>
      )}

      {showDeleteAccountConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
             <h3 className="text-lg font-bold text-[#121722] mb-2">Delete Account</h3>
             <p className="text-[13px] text-[#777c86] mb-6">This action cannot be undone. This will permanently delete your account and remove your data from our servers.</p>
             <div className="flex justify-end gap-3">
               <button onClick={() => setShowDeleteAccountConfirm(false)} className="px-4 py-2 rounded-[6px] font-medium text-[13px] text-[#777c86] hover:bg-[#faf9f7] transition-colors cursor-pointer border border-transparent hover:border-[#efefef]">Cancel</button>
               <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-[6px] font-medium text-[13px] bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors cursor-pointer shadow-sm">Delete Account</button>
             </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
