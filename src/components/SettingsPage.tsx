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
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb / Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 text-slate-600"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Settings className="text-slate-400" />
                Settings
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Manage your account, preferences, and support.
              </p>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-grow bg-slate-50 flex flex-col gap-8">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-1">Account</h3>
                
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    {auth.currentUser?.isAnonymous ? (
                      <p className="text-sm font-medium text-slate-800">
                        Signed in as Guest <span className="text-slate-500 text-xs ml-1">#Guest{auth.currentUser?.uid.substring(0, 5).toUpperCase()}</span>
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-slate-800">Synced with {auth.currentUser?.email || 'Google'}</p>
                    )}
                    <p className="text-xs text-slate-500">Connected</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/80 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">Sign out of your account on this device.</span>
                <button
                  onClick={() => { onBack(); logout(); }}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2"
                >
                  Log Out
                </button>
              </div>
            </div>

            <SupportForm />

            <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-1">Delete Data</h3>
                <p className="text-sm text-slate-500">
                  Permanently remove your job applications. This action is not reversible, so please continue with caution.
                </p>
              </div>
              <div className="bg-red-50/50 border-t border-red-100 px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-red-600 font-medium">Proceed with caution.</span>
                <button
                  onClick={() => { onBack(); onClearData(); }}
                  disabled={isSyncing}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-red-500 text-slate-50 shadow hover:bg-red-500/90 h-9 px-4 py-2"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
