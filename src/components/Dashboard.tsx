import React, { useState, useEffect, useRef } from 'react';
import { JobApplication, JobStatus } from '../types';
import { getApplications, addApplication, updateApplication, deleteApplication, addApplicationsBatch, deleteAllApplications } from '../db/applications';
import { Kanban } from './Kanban';
import { Analytics } from './Analytics';
import { SankeyChart } from './SankeyChart';
import { JobForm } from './JobForm';
import { FileUpload } from './FileUpload';
import * as XLSX from 'xlsx';
import { exportCsv } from '../lib/csv';
import { Footer } from './Footer';
import { NotificationCenter } from './NotificationCenter';
import { Plus, Download, Upload, LayoutDashboard, BarChart3, LogOut, Loader2, Calendar, Trash2, Settings, X, Twitter, Github, Linkedin } from 'lucide-react';
import { auth, logout } from '../lib/firebase';
import Papa from 'papaparse';
import { addNotification } from '../lib/notifications';
import { toast } from 'sonner';

import { NotificationsPage } from './NotificationsPage';

export function Dashboard() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncLockRef = useRef(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [view, setView] = useState<'sankey' | 'kanban' | 'analytics' | 'notifications'>('sankey');
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isFormOpen || showClearConfirm || isSettingsOpen || !!deleteConfirmId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    }
  }, [isFormOpen, showClearConfirm, isSettingsOpen, deleteConfirmId]);

  useEffect(() => {
    if (auth.currentUser) {
      loadData();
    }
  }, [auth.currentUser]);

  useEffect(() => {
    if (!applications.length || !auth.currentUser) return;
    
    let isChecking = false;
    const checkReminders = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const now = new Date();
        let updated = false;
        
        for (const app of applications) {
          if (!app.nextInterviewDate || app.reminder === 'none' || app.reminderSent || !app.reminder) {
            continue;
          }

          const interviewTime = new Date(app.nextInterviewDate).getTime();
          let reminderTime = interviewTime;

          if (app.reminder === '15 mins') reminderTime -= 15 * 60 * 1000;
          else if (app.reminder === '1 hour') reminderTime -= 60 * 60 * 1000;
          else if (app.reminder === '2 hours') reminderTime -= 2 * 60 * 60 * 1000;
          else if (app.reminder === '1 day') reminderTime -= 24 * 60 * 60 * 1000;
          else if (app.reminder === '2 days') reminderTime -= 2 * 24 * 60 * 60 * 1000;
          else if (app.reminder === 'custom') {
            if (app.customReminderDate) {
              // Custom start date (midnight local time)
              const customStart = new Date(app.customReminderDate);
              reminderTime = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate()).getTime();
            }
          }

          // Trigger reminder if current time is past reminderTime and not yet past interviewTime
          // For custom reminders with end date, we trigger if within the date range.
          let shouldTrigger = false;
          
          if (app.reminder === 'custom') {
             if (app.customReminderDate) {
               // YYYY-MM-DD parsing in local time
               const [startYear, startMonth, startDay] = app.customReminderDate.split('-').map(Number);
               const start = new Date(startYear, startMonth - 1, startDay).getTime();
               let end = interviewTime;
               if (app.customReminderEndDate) {
                 const [endYear, endMonth, endDay] = app.customReminderEndDate.split('-').map(Number);
                 end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999).getTime();
               } else {
                 end = new Date(startYear, startMonth - 1, startDay, 23, 59, 59, 999).getTime();
               }
               
               if (now.getTime() >= start && now.getTime() <= end) {
                 shouldTrigger = true;
               }
             }
          } else {
            if (now.getTime() >= reminderTime && now.getTime() <= interviewTime) {
              shouldTrigger = true;
            } else if (now.getTime() > interviewTime) {
              // If it's already past the interview, just mark it as sent so we don't keep checking
              await updateApplication(app.id, { reminderSent: true });
              continue;
            }
          }

          if (shouldTrigger) {
            let msg = `Upcoming interview with ${app.company} at ${new Date(app.nextInterviewDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            if (now.getTime() > interviewTime) {
               // Ignore if it's already past the interview
               continue;
            }
            if (app.reminder !== 'custom') {
               msg = `Next interview with ${app.company} will begin in ${app.reminder} today`;
            } else {
               msg = `Reminder: Interview with ${app.company} is scheduled on ${new Date(app.nextInterviewDate).toLocaleDateString()}`;
            }
            
            toast(msg, {
              icon: '⏰',
            });
            
            await updateApplication(app.id, { reminderSent: true });
            await addNotification(auth.currentUser.uid, 'reminder', `Interview Reminder: ${app.company}`, msg);
            updated = true;
          }
        }
        
        if (updated) {
           loadData();
        }
      } catch (err) {
        console.error("Reminder check failed", err);
      } finally {
        isChecking = false;
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [applications]);

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
    setDeleteConfirmId(id);
  };

  const confirmDeleteApp = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteApplication(deleteConfirmId);
      setIsFormOpen(false);
      setEditingApp(null);
      setApplications(apps => apps.filter(a => a.id !== deleteConfirmId));
      toast.success('Application deleted successfully');
    } catch (err) {
      console.error('Error deleting', err);
      toast.error('Failed to delete application');
    } finally {
      setDeleteConfirmId(null);
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
      toast.success('All data cleared');
    } catch (err) {
      console.error('Error clearing data', err);
      toast.error('Failed to clear data');
    } finally {
      setIsSyncing(false);
      syncLockRef.current = false;
    }
  };

  const handleDataImport = async (file: File) => {
    if (syncLockRef.current) return;
    syncLockRef.current = true;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      let grid: any[][] = [];
      
      if (ext === 'csv') {
        grid = await new Promise<any[][]>((resolve, reject) => {
          Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data as any[][]),
            error: reject
          });
        });
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        grid = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
      } else {
        throw new Error('Unsupported file format');
      }

      if (!grid || grid.length === 0) {
        throw new Error("File is empty");
      }

      // Remove completely empty rows
      grid = grid.filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));
      if (grid.length === 0) throw new Error("File contains no data");


      const isHeader = (str: any) => {
        const s = String(str || '').toLowerCase().trim();
        return ['company', 'employer', 'organization', 'position', 'title', 'role', 'job title', 'status', 'stage', 'state', 'applied date', 'date', 'contact', 'notes'].some(h => s.includes(h));
      };

      // Find the header row index
      let headerRowIndex = 0;
      let maxHeaders = 0;
      
      for (let i = 0; i < Math.min(10, grid.length); i++) {
        const count = grid[i].filter(isHeader).length;
        if (count > maxHeaders) {
          maxHeaders = count;
          headerRowIndex = i;
        }
      }

      // If we couldn't find a clear header row, default to first row
      if (maxHeaders === 0) {
        headerRowIndex = 0;
      }

      let headers = (grid[headerRowIndex] || []).map(h => String(h || '').trim().toLowerCase());
      
      // If headers are completely missing or empty, generate fallback headers
      if (headers.filter(h => h).length === 0) {
        headers = ['company', 'position', 'status', 'applied date', 'notes', 'contact'];
      }
      
      let dataRows = grid.slice(headerRowIndex + 1);

      const imports = dataRows.map(row => {
        const normalized: any = {};
        headers.forEach((h, i) => {
          if (h) normalized[h] = row[i];
        });
        
        const company = normalized['company'] || normalized['company name'] || normalized['employer'] || normalized['organization'] || row[0] || 'Unknown';
        const position = normalized['position'] || normalized['job title'] || normalized['role'] || normalized['title'] || row[1] || 'Unknown';
        
        let st = String(normalized['status'] || normalized['stage'] || normalized['state'] || 'Applied').trim();
        st = st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
        if (!['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'].includes(st)) {
          st = 'Applied';
        }
        
        let appliedDate = normalized['applied date'] || normalized['applied_date'] || normalized['date applied'] || normalized['date'];
        
        if (typeof appliedDate === 'number') {
           const date = new Date(Math.round((appliedDate - 25569) * 86400 * 1000));
           appliedDate = date.toISOString();
        } else if (!appliedDate) {
           appliedDate = new Date().toISOString();
        } else {
           appliedDate = String(appliedDate);
        }
        
        return {
          company: String(company),
          position: String(position),
          status: st,
          appliedDate: appliedDate,
          userId: auth.currentUser!.uid
        };
      }).filter(item => item.company !== 'Unknown' || item.position !== 'Unknown');
      console.log('Processed imports:', imports);

      if (imports.length > 0) {
        await addApplicationsBatch(imports as any[]);
        await loadData();
        toast.success(`Imported ${imports.length} records successfully`);
        
        await addNotification(
          auth.currentUser!.uid,
          'job',
          'Import Successful',
          `Successfully imported ${imports.length} applications from ${file.name}.`
        );
        
        setShowImportModal(false);
        syncLockRef.current = false;
      } else {
        toast.info("No valid data found in file.");
      }
    } catch (err: any) {
      console.error('Import error', err);
      setSyncError(err.message || 'Failed to import data');
      toast.error('Failed to import data');
    } finally {
      setIsSyncing(false);
      syncLockRef.current = false;
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (view === 'notifications') {
    return <NotificationsPage onBack={() => setView('sankey')} />;
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
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2 gap-2"
            >
              <Plus size={16} />
              <span>New Application</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationCenter onViewAll={() => setView('notifications')} />
          <button onClick={() => setIsSettingsOpen(true)} title="Settings" className="w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all">
            <Settings size={16} />
          </button>
        </div>
      </header>

      <main className="p-6 w-full flex-grow flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setView('sankey')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === 'sankey' ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            >
              <LayoutDashboard size={16} />
              Flow Chart
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === 'kanban' ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            >
              <LayoutDashboard size={16} />
              Kanban
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${view === 'analytics' ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-3">
                            <button
                onClick={() => setShowImportModal(true)}
                disabled={isSyncing}
                className={`gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2 ${isSyncing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Import Data
              </button>
              <button
                onClick={() => exportCsv(applications)}
                disabled={applications.length === 0 || isSyncing}
                className={`gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2 ${applications.length === 0 || isSyncing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Download size={16} />
                Export
              </button>
            </div>
            {syncError && <div className="text-red-500 text-xs font-medium">{syncError}</div>}
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl p-12 shadow-sm text-center">
             <h3 className="text-xl font-bold text-slate-800 mb-2">No applications yet</h3>
             <p className="text-slate-500 max-w-md mb-6">You haven't tracked any job applications. Start by adding one manually or import from a CSV or PDF file.</p>
             <button
               onClick={() => { setEditingApp(null); setIsFormOpen(true); }}
               className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2 gap-2"
             >
               <Plus size={20} />
               <span>Add Your First Application</span>
             </button>
          </div>
        ) : view === 'sankey' ? (
          <SankeyChart applications={applications} />
        ) : view === 'kanban' ? (
          <Kanban applications={applications} onEdit={(app) => { setEditingApp(app); setIsFormOpen(true); }} onStatusChange={handleStatusChange} onDelete={handleDelete} />
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
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-slate-900 h-9 w-9 p-0 text-slate-500"
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
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2"
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
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-red-500 text-slate-50 shadow hover:bg-red-500/90 h-9 px-4 py-2"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      
            {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Import Data</h2>
              <button onClick={() => { setShowImportModal(false); syncLockRef.current = false; }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <FileUpload 
              label="Upload CSV or Excel"
              accept=".csv,.xlsx,.xls"
              maxFiles={1}
              onFilesChange={async (files) => {
                if (files.length > 0 && files[0].file) {
                  await handleDataImport(files[0].file);
                }
              }}
            />
            {isSyncing && (
              <div className="mt-4 flex flex-col items-center justify-center gap-2">
                <Loader2 className="animate-spin text-blue-500" size={24} />
                <span className="text-sm text-slate-500">Processing data...</span>
              </div>
            )}
            {syncError && (
               <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center">
                 {syncError}
               </div>
            )}
          </div>
        </div>
      )}
      
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-black text-slate-800 mb-2">Delete Application?</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Are you sure you want to delete this job application? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteApp}
                  className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
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
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2"
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
