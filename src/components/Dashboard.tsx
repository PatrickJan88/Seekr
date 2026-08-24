import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JobApplication, JobStatus } from '../types';
import { getApplications, addApplication, updateApplication, deleteApplication, addApplicationsBatch, deleteAllApplications } from '../db/applications';
import { Kanban } from './Kanban';
import { Analytics } from './Analytics';
import { GlobalMarket } from './GlobalMarket';
import { SankeyChart } from './SankeyChart';
import { JobForm } from './JobForm';
import { FileUpload } from './FileUpload';

import * as XLSX from 'xlsx';
import { exportCsv } from '../lib/csv';
import { Footer } from './Footer';
import { NotificationCenter } from './NotificationCenter';
import { CommandSearch } from './CommandSearch';
import { Plus, Download, Upload, LayoutDashboard, BarChart3, LogOut, Loader2, Calendar, Trash2, Settings, X, Twitter, Github, Linkedin, Globe } from 'lucide-react';
import { auth, logout } from '../lib/firebase';
import Papa from 'papaparse';
import { addNotification } from '../lib/notifications';
import { toast } from 'sonner';
import { DEMO_APPLICATIONS } from '../data/seekrDemoData';

import { NotificationsPage } from './NotificationsPage';
import { SettingsPage } from './SettingsPage';
import { CVMatchAssessment } from './CVMatchAssessment';
import { EvaluateHistoryPage } from './EvaluateHistoryPage';
import { SidebarNav } from './SidebarNav';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sparkles } from 'lucide-react';

interface DashboardProps {
  isDemo?: boolean;
}

// Keep track of which apps have already triggered an auto-ghosting notification in this session
const recentlyGhostedIds = new Set<string>();

export function Dashboard({ isDemo = false }: DashboardProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncLockRef = useRef(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState<'sankey' | 'kanban' | 'analytics' | 'cv-match' | 'notifications' | 'settings' | 'eval-history' | 'global-market'>('sankey');
  const [trackingSystem, setTrackingSystem] = useState<'industry' | 'academic'>('industry');

  const filteredApplications = useMemo(() => {
    return applications.filter(app => (app.trackingSystem || 'industry') === trackingSystem);
  }, [applications, trackingSystem]);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [nestedBreadcrumb, setNestedBreadcrumb] = useState<{label: string; onBack: () => void} | null>(null);

  useEffect(() => {
    setNestedBreadcrumb(null);
  }, [view]);

  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e /*: KeyboardEvent*/) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target && e.target.isContentEditable)
      ) {
        return;
      }

      // Check for Cmd+N (Mac), Ctrl+N (Windows), or just N
      if ((e.metaKey && e.key.toLowerCase() === 'n') || 
          (e.ctrlKey && e.key.toLowerCase() === 'n') ||
          (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        e.preventDefault();
        setIsFormOpen(true);
        setEditingApp(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, []);


  const handleLocationSelect = (country: string | null) => {
    setLocationFilter(country);
    if (country) setView('kanban');
  };

  useEffect(() => {
    if (isFormOpen || showClearConfirm || !!deleteConfirmId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    }
  }, [isFormOpen, showClearConfirm, deleteConfirmId]);

  useEffect(() => {
    if (isDemo || auth.currentUser) {
      loadData();
    }
  }, [auth.currentUser, isDemo]);

  useEffect(() => {
    if (!applications.length || !auth.currentUser || isDemo) return;
    
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
            await addNotification(auth.currentUser!.uid, 'reminder', `Interview Reminder: ${app.company}`, msg);
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
  }, [applications, isDemo]);

  const applyAutoGhosting = async (data: JobApplication[]): Promise<JobApplication[]> => {
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const activeStatuses = ['Wishlist', 'Applied', 'Screening', 'Technical', 'Final'];
    
    let changed = false;
    let ghostedCount = 0;
    
    const updatedData = await Promise.all(data.map(async (app) => {
      if (activeStatuses.includes(app.status)) {
        // Use appliedDate if available, fallback to createdAt, or default to 0 if none exist
        const startDate = app.appliedDate ? new Date(app.appliedDate).getTime() : 
                          app.createdAt ? app.createdAt : 0;
        const lastUpdate = app.updatedAt || startDate;
        
        if (lastUpdate > 0 && (now - lastUpdate > SIXTY_DAYS_MS)) {
          changed = true;
          
          if (!recentlyGhostedIds.has(app.id)) {
            ghostedCount++;
            recentlyGhostedIds.add(app.id);
          }

          const ghostedApp = { ...app, status: 'Ghosted' as JobStatus };
          if (auth.currentUser) {
            try {
              await updateApplication(app.id, { status: 'Ghosted' });
            } catch (err) {
              console.error('Failed to auto-update Ghosted status for app:', app.id, err);
            }
          }
          return ghostedApp;
        }
      }
      return app;
    }));

    if (ghostedCount > 0) {
      const title = ghostedCount === 1 ? 'Application Ghosted' : `${ghostedCount} Applications Ghosted`;
      const msg = ghostedCount === 1 
        ? '1 application was automatically moved to Ghosted due to 60 days of inactivity.' 
        : `${ghostedCount} applications were automatically moved to Ghosted due to 60 days of inactivity.`;
      
      if (auth.currentUser) {
        await addNotification(auth.currentUser.uid, 'status_update', title, msg);
      }
      toast.info(msg);
    }

    return updatedData;
  };

  const loadData = async () => {
    if (isDemo) {
      setLoading(true);
      try {
        const local = localStorage.getItem('seekr_demo_applications');
        let data: JobApplication[] = [];
        if (local) {
          try {
            const parsed: JobApplication[] = JSON.parse(local);
            data = parsed.map((app, idx) => {
              if (DEMO_APPLICATIONS[idx] && app.id === DEMO_APPLICATIONS[idx].id) {
                return {
                  ...app,
                  company: DEMO_APPLICATIONS[idx].company,
                  notes: DEMO_APPLICATIONS[idx].notes
                };
              }
              return app;
            });
          } catch {
            data = DEMO_APPLICATIONS;
          }
        } else {
          data = DEMO_APPLICATIONS;
        }

        setApplications(data);
      } catch (err) {
        console.error('Failed to load demo applications', err);
        setApplications(DEMO_APPLICATIONS);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!auth.currentUser) return;
    try {
      console.log('Loading applications...');
      const data = await getApplications(auth.currentUser.uid);
      console.log(`Loaded ${data.length} applications.`);
      
      const validStatuses = ['Wishlist', 'Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];
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
      
      const updatedData = await applyAutoGhosting(normalizedData);
      setApplications(updatedData);
    } catch (err) {
      console.error('Failed to load apps', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    if (isDemo) {
      const updated = applications.map(a => a.id === appId ? { ...a, status: newStatus as any } : a);
      setApplications(updated);
      try {
        localStorage.setItem('seekr_demo_applications', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving demo state', e);
      }
      toast.success('Status updated (Demo Mode)');
      return;
    }

    try {
      await updateApplication(appId, { status: newStatus as any });
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus as any } : a));
      toast.success(`Application status updated successfully`);
    } catch (err) {
      console.error('Error updating status', err);
      toast.error('Failed to update status');
    }
  };

  const handleAddToWishlist = async (appData: Partial<JobApplication>) => {
    if (isDemo) {
      toast.info('Demo Mode: Adding applications is restricted in this portfolio preview.');
      return;
    }
    if (!auth.currentUser) return;
    try {
      const newApp = await addApplication({ ...appData, userId: auth.currentUser.uid } as any);
      setApplications(apps => [newApp, ...apps]);
      toast.success(`Added ${appData.company} to Wishlist`);
    } catch (err) {
      console.error('Error adding to wishlist', err);
      toast.error('Failed to add to wishlist');
    }
  };

  const handleSave = async (appData: Partial<JobApplication>) => {
    if (isDemo) {
      toast.info('Demo Mode: Adding and editing applications is restricted in this portfolio preview.');
      setIsFormOpen(false);
      setEditingApp(null);
      return;
    }

    if (!auth.currentUser) return;
    try {
      if (editingApp) {
        await updateApplication(editingApp.id, appData);
        setApplications(apps => apps.map(a => a.id === editingApp.id ? { ...a, ...appData } as JobApplication : a));
        toast.success('Application updated successfully');
      } else {
        const newApp = await addApplication({ ...appData, userId: auth.currentUser.uid } as any);
        setApplications(apps => [newApp, ...apps]);
        toast.success('Application saved successfully');
      }
      setIsFormOpen(false);
      setEditingApp(null);
    } catch (err) {
      console.error('Error saving', err);
      toast.error('Failed to save application');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (isDemo) {
      toast.info('Demo Mode: Deleting applications is restricted in this portfolio preview.');
      return;
    }
    setDeleteConfirmId(id);
  };

  const confirmDeleteApp = async () => {
    if (!deleteConfirmId) return;
    if (isDemo) {
      toast.info('Demo Mode: Deleting applications is restricted in this portfolio preview.');
      setDeleteConfirmId(null);
      return;
    }

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
    if (isDemo) {
      localStorage.removeItem('seekr_demo_applications');
      setApplications(DEMO_APPLICATIONS);
      toast.success('Demo sample data reset to initial 12 European applications!');
      return;
    }
    setShowClearConfirm(true);
  };

  const confirmClearData = async () => {
    if (isDemo) {
      localStorage.removeItem('seekr_demo_applications');
      setApplications(DEMO_APPLICATIONS);
      setShowClearConfirm(false);
      toast.success('Demo sample data reset to initial 12 European applications!');
      return;
    }

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
        const firstSheetName = workbook?.SheetNames?.[0];
        if (!firstSheetName) throw new Error("No sheets found in Excel file");
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
        
        const company = normalized['company'] || normalized['company name'] || normalized['employer'] || normalized['organization'] || (row && row[0]) || 'Unknown';
        const position = normalized['position'] || normalized['job title'] || normalized['role'] || normalized['title'] || (row && row[1]) || 'Unknown';
        
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
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <Loader2 className="animate-spin text-[#0068f9]" size={48} />
      </div>
    );
  }

  if (view === 'notifications') {
    return <NotificationsPage onBack={() => setView('sankey')} />;
  }

  

  

  const viewTitles: Record<string, string> = {
    'sankey': 'Overview',
    'global-market': 'Job Market',
    'kanban': 'My Applications',
    'analytics': 'Analytics',
    'cv-match': 'AI Evaluator',
    'settings': 'Settings',
    'notifications': 'Notifications',
    'eval-history': 'Evaluation History'
  };
  const displayTitle = viewTitles[view] || view.replace('-', ' ');
  return (
    <div className="flex w-full h-screen bg-[#faf9f7] overflow-hidden text-[#121722] font-sans">
      {/* Sidebar */}
      <div className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-white border-r border-[#efefef] z-20 ${isSidebarOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none'}`}>
        <SidebarNav
            trackingSystem={trackingSystem}
            setTrackingSystem={setTrackingSystem}
           className="w-[260px] border-none bg-transparent"
           activeId={view}
           onSelect={(id) => setView(id as any)}
           isDemo={isDemo}
           onImport={() => isDemo ? toast.info('Demo Mode: Importing data is disabled in this portfolio preview.') : setShowImportModal(true)}
           onExport={() => exportCsv(applications)}
           onNew={() => { setEditingApp(null); setIsFormOpen(true); }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative bg-[#faf9f7] z-10">
         {/* Top Navbar */}
         <header className="h-16 border-b border-[#efefef] flex items-center px-6 md:px-8 justify-between bg-white shrink-0 z-30 sticky top-0">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="p-1.5 rounded-md text-[#a5a5a5] hover:bg-[#faf9f7] hover:text-[#121722] transition-colors cursor-pointer -ml-1.5"
             >
               {isSidebarOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
             </button>
             <div className="flex items-center gap-2 text-[13px] text-[#777c86] ml-2 border-l border-transparent pl-2">
               {nestedBreadcrumb ? (
                 <>
                   <span 
                     className="hidden sm:inline-block hover:text-[#121722] cursor-pointer transition-colors"
                     onClick={() => nestedBreadcrumb.onBack()}
                   >
                     {displayTitle}
                   </span>
                   <span className="hidden sm:inline-block text-[#d1d5db]">/</span>
                   <span className="font-semibold text-[#121722] truncate capitalize">{nestedBreadcrumb.label}</span>
                 </>
               ) : (
                 <span className="font-semibold text-[#121722] truncate capitalize">{displayTitle}</span>
               )}
             </div>
           </div>
           
           <div className="flex items-center gap-3">
             <CommandSearch applications={applications} onSelectApplication={(app) => { setEditingApp(app); setIsFormOpen(true); }} />
             <NotificationCenter onViewAll={() => setView('notifications')} />
           </div>
         </header>

         {/* Content Scrollable Area */}
         <main className="flex-1 overflow-y-auto bg-[#faf9f7] p-6 md:p-8 w-full flex flex-col custom-scrollbar relative">
            {view === 'sankey' && <SankeyChart applications={filteredApplications} onAdd={() => { setEditingApp(null); setIsFormOpen(true); }} />}
            {view === 'global-market' && <GlobalMarket isDemo={isDemo} onAddToWishlist={handleSave} trackingSystem={trackingSystem} />}
            {view === 'kanban' && <Kanban applications={filteredApplications} onEdit={(app) => { setEditingApp(app); setIsFormOpen(true); }} onStatusChange={handleStatusChange as any} onDelete={handleDelete} locationFilter={locationFilter} onLocationSelect={handleLocationSelect} />}
            {view === 'analytics' && <Analytics applications={filteredApplications} onLocationSelect={handleLocationSelect} />}
            {view === 'cv-match' && <CVMatchAssessment applications={filteredApplications} trackingSystem={trackingSystem} onAddToWishlist={handleSave} onViewHistory={() => setView('eval-history')} setNestedBreadcrumb={setNestedBreadcrumb} />}
            {view === 'notifications' && <NotificationsPage onBack={() => setView('sankey')} />}
            {view === 'settings' && <SettingsPage onBack={() => setView('sankey')} onClearData={handleClearData} isSyncing={isSyncing} trackingSystem={trackingSystem} setTrackingSystem={setTrackingSystem} />}
            {view === 'eval-history' && <EvaluateHistoryPage onBack={() => setView('cv-match')} applications={filteredApplications} onAddToWishlist={handleSave} />}
         </main>
      </div>
      
      {isFormOpen && (
        <JobForm
          initialData={editingApp || undefined}
          trackingSystem={trackingSystem}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingApp(null); }}
          onDelete={handleDelete}
          isDemo={isDemo}
        />
      )}
      
      
      {showImportModal && (
        <div className="fixed inset-0 bg-[#121722]/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#efefef] shadow-lg w-full max-w-md overflow-hidden flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#121722]">Import Data</h2>
              <button onClick={() => { setShowImportModal(false); syncLockRef.current = false; }} className="text-[#a5a5a5] hover:text-[#121722] transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <FileUpload 
              label="Upload CSV or Excel"
              accept=".csv,.xlsx,.xls"
              maxFiles={1}
              isDemo={isDemo}
              onFilesChange={async (files) => {
                if (isDemo) {
                  toast.info('Demo Mode: Data import is disabled in this portfolio preview.');
                  return;
                }
                if (files.length > 0 && files[0].file) {
                  await handleDataImport(files[0].file);
                }
              }}
            />
            {isSyncing && (
              <div className="mt-4 flex flex-col items-center justify-center gap-2">
                <Loader2 className="animate-spin text-[#0068f9]" size={24} />
                <span className="text-sm text-[#777c86]">Processing data...</span>
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
        <div className="fixed inset-0 bg-[#121722]/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#efefef] shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#121722] mb-2">Delete Application?</h2>
              <p className="text-[#777c86] mb-6 text-sm">
                Are you sure you want to delete this job application? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-all border border-[#efefef] bg-white text-[#121722] hover:bg-[#faf9f7] h-9 px-5 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteApp}
                  className="px-5 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors flex items-center gap-2 cursor-pointer text-sm"
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
        <div className="fixed inset-0 bg-[#121722]/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#efefef] shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#121722] mb-2">Clear All Data?</h2>
              <p className="text-[#777c86] mb-6 text-sm">
                Are you sure you want to delete all your job applications? This action is permanent and cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-all border border-[#efefef] bg-white text-[#121722] hover:bg-[#faf9f7] h-9 px-5 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmClearData}
                  className="px-5 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors flex items-center gap-2 cursor-pointer text-sm"
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
