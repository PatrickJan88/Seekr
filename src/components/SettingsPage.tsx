import React from 'react';
import { ArrowLeft, Settings, Trash2, LogOut, CheckCircle } from 'lucide-react';
import { auth, logout } from '../lib/firebase';
import { SupportForm } from './SupportForm';

interface SettingsPageProps {
  onBack: () => void;
  onClearData: () => void;
  isSyncing: boolean;
}

export function SettingsPage({ onBack, onClearData, isSyncing }: SettingsPageProps) {
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
    <div className="min-h-screen bg-[#faf9f7] font-sans text-[#121722] pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb / Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white rounded-full transition-colors flex items-center gap-2 text-[#777c86] hover:text-[#121722] border border-transparent hover:border-[#efefef] cursor-pointer"
            >
              <ArrowLeft size={20} />
              <span className="font-medium text-xs">Back to Dashboard</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#efefef] overflow-hidden shadow-2xs divide-y divide-[#efefef]">
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#121722] flex items-center gap-3">
                <Settings className="text-[#0068f9]" />
                Settings
              </h1>
              <p className="text-[#777c86] text-xs mt-1">
                Manage your account, preferences, and support.
              </p>
            </div>
          </div>
          
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
                onClick={() => { onBack(); logout(); }}
                className="inline-flex items-center justify-center rounded-full text-xs font-medium transition-all border border-[#efefef] bg-white text-[#121722] shadow-2xs hover:bg-[#faf9f7] h-8 px-4 cursor-pointer self-start sm:self-center"
              >
                Log Out
              </button>
            </div>
          </div>

          <div className="p-6">
            <SupportForm />
          </div>

          <div className="p-6">
            <h3 className="text-sm font-semibold text-[#121722] mb-1">Delete Data</h3>
            <p className="text-xs text-[#777c86] mb-4">
              Permanently remove your job applications. This action is not reversible, so please continue with caution.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-50/50 border border-red-100 rounded-2xl">
              <span className="text-xs text-red-600 font-medium">Proceed with caution.</span>
              <button
                onClick={() => { onBack(); onClearData(); }}
                disabled={isSyncing}
                className="inline-flex items-center justify-center rounded-full text-xs font-medium transition-all bg-red-600 hover:bg-red-700 text-white shadow-2xs h-8 px-4 cursor-pointer self-start sm:self-center"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-[#777c86] font-medium">
          Version 2.0.0
        </div>
      </div>
    </div>
  );
}
