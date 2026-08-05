import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus } from '../types';
import { getApplications, addApplication, updateApplication, deleteApplication, addApplicationsBatch, deleteAllApplications } from '../db/applications';
import { Kanban } from './Kanban';
import { Analytics } from './Analytics';
import { SankeyChart } from './SankeyChart';
import { JobForm } from './JobForm';
import { exportCsv } from '../lib/csv';
import { Footer } from './Footer';
import { Plus, Download, Upload, LayoutDashboard, BarChart3, LogOut, Loader2, Calendar, Trash2, Settings, X, Twitter, Github, Linkedin } from 'lucide-react';
import { auth, logout, getAccessToken } from '../lib/firebase';
import Papa from 'papaparse';

export function Dashboard() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [view, setView] = useState<'sankey' | 'kanban' | 'analytics'>('sankey');
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isFormOpen || showClearConfirm || isSettingsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    }
  }, [isFormOpen, showClearConfirm, isSettingsOpen]);

  useEffect(() => {
    if (auth.currentUser) {
      loadData();
    }
  }, [auth.currentUser]);

  const loadData = async () => {
    if (!auth.currentUser) return;
    try {
      console.log('Loading applications...');
      const data = await getApplications(auth.currentUser.uid);
      console.log(`Loaded ${data.length} applications.`);
      
      const validStatuses = ['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];
      const normalizedData = data.map(app => {
        let st: string = app.status;
        if (st) {
          st = st.trim();
          st = st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
        }
        if (!validStatuses.includes(st)) {
          st = 'Applied';
        }
        return { ...app, status: st as JobStatus };
      });
      
      setApplications(normalizedData);
    } catch (err) {
      console.error('Failed to load apps', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await updateApplication(appId, { status: newStatus as any });
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus as any } : a));
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  const handleSave = async (appData: Partial<JobApplication>) => {
    if (!auth.currentUser) return;
    try {
      if (editingApp) {
        await updateApplication(editingApp.id, appData);
        setApplications(apps => apps.map(a => a.id === editingApp.id ? { ...a, ...appData } as JobApplication : a));
      } else {
        const newApp = await addApplication({ ...appData, userId: auth.currentUser.uid } as any);
        setApplications(apps => [newApp, ...apps]);
      }
      setIsFormOpen(false);
      setEditingApp(null);
    } catch (err) {
      console.error('Error saving', err);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id);
      setIsFormOpen(false);
      setEditingApp(null);
      setApplications(apps => apps.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting', err);
      throw err;
    }
  };

  const handleClearData = async () => {
    setShowClearConfirm(true);
  };

  const confirmClearData = async () => {
    if (!auth.currentUser) return;
    setIsSyncing(true);
    setShowClearConfirm(false);
    try {
      await deleteAllApplications(auth.currentUser.uid);
      setApplications([]);
      localStorage.clear();
    } catch (err) {
      console.error('Error clearing data', err);
      alert('Failed to clear data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsSyncing(true);
    setSyncError(null);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        if (!auth.currentUser) {
          setIsSyncing(false);
          setSyncError("User not logged in");
          return;
        }
        try {
          const imports = results.data.filter((row: any) => row.Company || row.company).map((row: any) => {
            let st = (row.Status || row.status || 'Applied').trim();
            st = st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
            if (!['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'].includes(st)) {
              st = 'Applied';
            }
            return {
              company: row.Company || row.company || 'Unknown',
              position: row.Position || row.position || 'Unknown',
              status: st,
              appliedDate: row.Applied_Date || row.appliedDate || new Date().toISOString(),
              userId: auth.currentUser!.uid
            };
          });
          
          if (imports.length > 0) {
            await addApplicationsBatch(imports as any[]);
          }
          await loadData();
          alert('Imported successfully');
        } catch (err: any) {
          console.error('Import error', err);
          setSyncError(err.message || 'Failed to import data');
          alert('Failed to import data');
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  if (loading) {
  

  return (
      <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/assets/seekr%20logo%201.svg" alt="Seekr Logo" className="h-8" />
          </div>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <button 
              onClick={() => { setEditingApp(null); setIsFormOpen(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              <span>New Application</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSettingsOpen(true)} title="Settings" className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-[1400px] mx-auto w-full flex-grow flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setView('sankey')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${view === 'sankey' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <LayoutDashboard size={16} />
              Flow Chart
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${view === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <LayoutDashboard size={16} />
              Kanban
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${view === 'analytics' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-3">
              <label className={`flex items-center gap-2 cursor-pointer border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold text-sm text-slate-600 transition-colors ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {isSyncing ? 'Importing...' : 'Import CSV'}
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} disabled={isSyncing} />
              </label>
              <label className={`flex items-center gap-2 cursor-pointer border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold text-sm text-slate-600 transition-colors ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {isSyncing ? 'Syncing...' : 'Sync PDF Data'}
                <input type="file" accept=".pdf" className="hidden" onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !auth.currentUser || isSyncing) return;
                  
                  setIsSyncing(true);
                  setSyncError(null);
                  
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    try {
                      const base64Data = (event.target?.result as string).split(',')[1];
                      const res = await fetch('/api/extract-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pdfBase64: base64Data })
                      });
                      if (!res.ok) {
                        const txt = await res.text();
                        throw new Error(txt);
                      }
                      const data = await res.json();
                      
                      const appsToImport = data.applications.map((app: any) => ({
                         ...app,
                         appliedDate: new Date().toISOString(),
                         userId: auth.currentUser!.uid,
                      }));
                      if (appsToImport.length > 0) {
                        await addApplicationsBatch(appsToImport);
                        await loadData();
                        alert(`Successfully synced ${appsToImport.length} records from PDF!`);
                      } else {
                        alert('No job applications found in PDF.');
                      }
                    } catch(err: any) {
                      console.error(err);
                      setSyncError(err.message || 'Failed to sync PDF');
                      alert('Failed to sync PDF');
                    } finally {
                      setIsSyncing(false);
                    }
                  };
                  reader.readAsDataURL(file);
                }} disabled={isSyncing} />
              </label>
              <button
                onClick={() => exportCsv(applications)}
                disabled={applications.length === 0 || isSyncing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${applications.length === 0 || isSyncing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
              >
                <Download size={16} />
                Export
              </button>
            </div>
            {syncError && <div className="text-red-500 text-xs font-medium">{syncError}</div>}
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center bg-white border-2 border-slate-200 rounded-2xl p-12 shadow-sm text-center">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
               <Plus size={32} />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">No applications yet</h3>
             <p className="text-slate-500 max-w-md mb-6">You haven't tracked any job applications. Start by adding one manually or import from a CSV or PDF file.</p>
             <button
               onClick={() => { setEditingApp(null); setIsFormOpen(true); }}
               className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
             >
               <Plus size={20} />
               <span>Add Your First Application</span>
             </button>
          </div>
        ) : view === 'sankey' ? (
          <SankeyChart applications={applications} />
        ) : view === 'kanban' ? (
          <Kanban applications={applications} onEdit={(app) => { setEditingApp(app); setIsFormOpen(true); }} onStatusChange={handleStatusChange} />
        ) : (
          <Analytics applications={applications} />
        )}
      </main>

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

      {isFormOpen && (
        <JobForm
          initialData={editingApp || undefined}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingApp(null); }}
          onDelete={handleDelete}
        />
      )}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Settings</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow bg-slate-50 flex flex-col gap-8">
              
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">Account Integration</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Manage your connected Google account and authentication settings.
                  </p>
                  
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
                    onClick={() => { setIsSettingsOpen(false); logout(); }}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>

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
                    onClick={() => { setIsSettingsOpen(false); handleClearData(); }}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-red-600 border border-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-black text-slate-800 mb-2">Clear All Data?</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Are you sure you want to delete all your job applications? This action is permanent and cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmClearData}
                  className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Yes, Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
