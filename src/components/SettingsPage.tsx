import React, { useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Footer } from './Footer';
import { 
  Github, 
  Linkedin, 
  Briefcase, 
  GraduationCap, 
  Check, 
  ChevronDown,
  FileText,
  Upload,
  RefreshCw
} from 'lucide-react';
import { auth, logout } from '../lib/firebase';
import { SupportForm } from './SupportForm';
import { toast } from 'sonner';
import { extractTextFromPDF, fileToBase64 } from '../lib/pdf';
import { 
  getUserResume, 
  saveUserResume, 
  deleteUserResume, 
  getStoredLocalResume, 
  RESUME_UPDATED_EVENT 
} from '../db/resumes';
import { UserResume } from '../types';

interface SettingsPageProps {
  trackingSystem?: 'industry' | 'academic';
  setTrackingSystem?: (sys: 'industry' | 'academic') => void;
  onBack: () => void;
  onClearData: () => void;
  isSyncing: boolean;
  isDemo?: boolean;
}

export function SettingsPage({ onBack, onClearData, isSyncing, isDemo = false, trackingSystem = 'industry', setTrackingSystem }: SettingsPageProps) {

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showDeleteResumeConfirm, setShowDeleteResumeConfirm] = useState(false);

  // My Resume state
  const [storedResume, setStoredResume] = useState<UserResume | null>(() => getStoredLocalResume(auth.currentUser?.uid));
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showScannedText, setShowScannedText] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      const resume = await getUserResume(auth.currentUser?.uid || 'guest');
      if (resume) {
        setStoredResume(resume);
      }
    };
    fetchResume();

    const handleResumeUpdated = (e: any) => {
      setStoredResume(e.detail as UserResume | null);
    };

    window.addEventListener(RESUME_UPDATED_EVENT, handleResumeUpdated);
    return () => {
      window.removeEventListener(RESUME_UPDATED_EVENT, handleResumeUpdated);
    };
  }, [auth.currentUser?.uid]);

  const handleSettingsCvUpload = async (file: File) => {
    if (isDemo) {
      toast.info('Demo Mode: Uploading new CV is restricted in this view-only portfolio preview.');
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF format CV.');
      return;
    }

    setIsUploadingResume(true);
    toast.loading('Scanning & extracting CV text...', { id: 'settings-resume-upload' });

    try {
      let extractedText = '';
      let base64 = '';
      try {
        extractedText = await extractTextFromPDF(file);
      } catch (err) {
        console.warn('PDF text extraction fallback:', err);
      }

      try {
        base64 = await fileToBase64(file);
      } catch (err) {
        console.warn('PDF base64 fallback:', err);
      }

      const saved = await saveUserResume(auth.currentUser?.uid || 'guest', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/pdf',
        cvText: extractedText,
        pdfBase64: base64,
      });

      setStoredResume(saved);
      toast.success('CV uploaded & scanned! Saved to My Resume.', { id: 'settings-resume-upload' });
    } catch (err: any) {
      console.error('Failed to upload CV in Settings:', err);
      toast.error('Failed to upload CV: ' + (err.message || 'unknown error'), { id: 'settings-resume-upload' });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDeleteStoredResume = async () => {
    if (isDemo) {
      toast.info('Demo Mode: Deleting stored CV is restricted in this view-only portfolio preview.');
      setShowDeleteResumeConfirm(false);
      return;
    }

    try {
      await deleteUserResume(auth.currentUser?.uid || 'guest', storedResume?.id);
      setStoredResume(null);
      setShowDeleteResumeConfirm(false);
      setShowScannedText(false);
      toast.info('CV removed from your profile');
    } catch (err) {
      console.error('Failed to delete CV:', err);
      toast.error('Failed to delete CV');
    }
  };

  const downloadStoredPdf = () => {
    if (!storedResume?.pdfBase64) {
      toast.info('PDF binary not cached locally; extracted text is active.');
      return;
    }
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${storedResume.pdfBase64}`;
    link.download = storedResume.fileName || 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading CV PDF');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSettingsCvUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDemo) {
      toast.info('Demo Mode: Account actions are restricted in this view-only portfolio preview.');
      setShowDeleteAccountConfirm(false);
      return;
    }

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
                className="inline-flex items-center justify-center rounded-full text-xs font-semibold transition-all bg-[#0068f9] hover:bg-[#024bb1] text-white shadow-2xs h-9 px-6 py-2 cursor-pointer self-start sm:self-center"
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
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center justify-between w-full sm:w-64 h-11 bg-white border border-[#efefef] rounded-full text-xs sm:text-sm px-4 focus:outline-none focus:ring-2 focus:ring-[#0068f9] shadow-2xs hover:bg-[#faf9f7] transition-all cursor-pointer">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {trackingSystem === 'academic' ? (
                        <GraduationCap className="text-[#0068f9] shrink-0" size={16} />
                      ) : (
                        <Briefcase className="text-[#0068f9] shrink-0" size={16} />
                      )}
                      <span className="text-[#121722] font-medium truncate">
                        {trackingSystem === 'academic' ? 'Academic Seekr' : 'Industry Seekr'}
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-[#777c86] shrink-0 ml-2" />
                  </button>
                </DropdownMenu.Trigger>
                
                <DropdownMenu.Portal>
                  <DropdownMenu.Content 
                    className="z-[100] min-w-[240px] bg-white rounded-2xl border border-[#efefef] shadow-lg p-1.5 animate-in fade-in-80 zoom-in-95"
                    sideOffset={6}
                    align="start"
                  >
                    <DropdownMenu.Item 
                      className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none transition-colors"
                      onClick={() => setTrackingSystem?.('industry')}
                    >
                      <Briefcase size={15} className="text-[#777c86] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#121722]">Industry Seekr</p>
                        <p className="text-[11px] text-[#777c86]">Tech, startups & corporate</p>
                      </div>
                      {trackingSystem === 'industry' && <Check size={16} className="ml-auto text-[#0068f9] shrink-0" />}
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Item 
                      className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-[#121722] rounded-xl cursor-pointer hover:bg-[#faf9f7] outline-none select-none transition-colors mt-0.5"
                      onClick={() => setTrackingSystem?.('academic')}
                    >
                      <GraduationCap size={15} className="text-[#777c86] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#121722]">Academic Seekr</p>
                        <p className="text-[11px] text-[#777c86]">Universities & research labs</p>
                      </div>
                      {trackingSystem === 'academic' && <Check size={16} className="ml-auto text-[#0068f9] shrink-0" />}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>

          {/* MY RESUME SECTION */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#121722]">My Resume</h3>
                  {storedResume && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Default CV
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[#777c86] mt-1.5 leading-relaxed">
                  Seekr scans the text from your uploaded document to track your profile and power customized AI evaluations, job-matching scores, and tailored recommendations.
                </p>
              </div>

              {storedResume && (
                <div className="flex items-center gap-2 shrink-0">
                  <label
                    htmlFor="settings-cv-replace"
                    className="inline-flex items-center justify-center rounded-full text-xs font-semibold bg-[#0068f9] hover:bg-[#024bb1] text-white shadow-2xs h-9 px-4 py-2 cursor-pointer transition-colors"
                  >
                    <span>Replace</span>
                    <input
                      id="settings-cv-replace"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      disabled={isUploadingResume}
                      onChange={(e) => e.target.files?.[0] && handleSettingsCvUpload(e.target.files[0])}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Resume Display Card or Upload Zone */}
            {storedResume ? (
              <div className="bg-[#faf9f7] border border-[#efefef] rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#efefef] text-[#0068f9] flex items-center justify-center shrink-0 shadow-2xs">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#121722] truncate max-w-md">
                          {storedResume.fileName}
                        </h4>
                        <span className="text-[11px] font-medium text-[#777c86] bg-white border border-[#efefef] px-2 py-0.5 rounded-md shadow-2xs">
                          {(storedResume.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#777c86] mt-1.5 flex-wrap">
                        <span>Uploaded {new Date(storedResume.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {storedResume.pdfBase64 && (
                      <button
                        type="button"
                        onClick={downloadStoredPdf}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium text-[#121722] bg-white hover:bg-[#f3f4f6] border border-[#efefef] transition-colors shadow-2xs cursor-pointer"
                        title="Download stored PDF"
                      >
                        <span>Download</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowScannedText(!showScannedText)}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium text-[#0068f9] bg-white hover:bg-[#e8f1ff] border border-[#efefef] transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>{showScannedText ? 'Hide' : 'View'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteResumeConfirm(true)}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
                      title="Delete stored CV"
                    >
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Scanned Text Preview */}
                {showScannedText && (
                  <div className="mt-4 pt-4 border-t border-[#efefef] animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#121722]">
                        Scanned CV Content (Indexed for Evaluation & Match Analysis)
                      </span>
                      <span className="text-[11px] text-[#777c86]">
                        {storedResume.cvText.split(/\s+/).filter(Boolean).length} words • {storedResume.cvText.length} characters
                      </span>
                    </div>
                    <div className="bg-white border border-[#efefef] rounded-xl p-3 max-h-60 overflow-y-auto font-mono text-[11px] text-[#121722] leading-relaxed whitespace-pre-wrap select-text custom-scrollbar">
                      {storedResume.cvText || '(No text extracted from this document)'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#efefef] hover:border-[#0068f9] bg-[#faf9f7] rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px]"
              >
                <input
                  id="settings-cv-empty-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  disabled={isUploadingResume}
                  onChange={(e) => e.target.files?.[0] && handleSettingsCvUpload(e.target.files[0])}
                />
                <label htmlFor="settings-cv-empty-upload" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#efefef] text-[#0068f9] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    {isUploadingResume ? (
                      <RefreshCw size={22} className="animate-spin text-[#0068f9]" />
                    ) : (
                      <Upload size={22} />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#121722]">
                    {isUploadingResume ? 'Scanning & processing CV...' : 'Upload your CV (PDF)'}
                  </p>
                  <p className="text-xs text-[#777c86] mt-1 max-w-sm mx-auto">
                    Drag & drop your PDF file here, or click to browse. Max 10MB.
                  </p>
                </label>
              </div>
            )}
          </div>

          <div className="p-6">
            <h3 className="text-sm font-semibold text-[#121722] mb-1">Interview Preparation Automation</h3>
            <p className="text-[13px] text-[#777c86] mb-4">
              Generate structured, resume-grounded interview prep for saved tailored resumes automatically.
            </p>
            <label className="flex items-center gap-3 cursor-pointer select-none bg-[#faf9f7] border border-[#efefef] p-4 rounded-xl max-w-md">
              <input
                type="checkbox"
                defaultChecked={localStorage.getItem('auto_generate_interview_prep') !== 'false'}
                onChange={(e) => {
                  localStorage.setItem('auto_generate_interview_prep', e.target.checked ? 'true' : 'false');
                  toast.success(e.target.checked ? 'Automatic interview prep generation enabled' : 'Automatic interview prep generation disabled');
                }}
                className="w-4 h-4 text-[#0068f9] rounded focus:ring-[#0068f9] accent-[#0068f9]"
              />
              <div className="text-xs">
                <span className="font-semibold text-[#121722] block">Enable Automatic Generation</span>
                <span className="text-[#777c86] text-[11px]">Auto-craft deep prep guide whenever match evaluation is completed</span>
              </div>
            </label>
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
                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium px-4 py-2 rounded-full transition-colors text-[13px] shadow-sm cursor-pointer"
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
                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium px-4 py-2 rounded-full transition-colors text-[13px] shadow-sm cursor-pointer"
                >
                  Delete Personal Account
                </button>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-12">
            <div className="text-center text-xs text-[#777c86] font-medium mb-8">
              Version 4.0.0
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
          </div>
        </div>
      
      {showLogoutConfirm && (
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[var(--sidebar-offset,0px)] bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#121722] mb-2">Log Out</h3>
            <p className="text-[13px] text-[#777c86] mb-6">Are you sure you want to log out of your account?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 rounded-full font-medium text-[13px] text-[#777c86] hover:bg-[#faf9f7] transition-colors cursor-pointer">Cancel</button>
              <button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="px-5 py-2 rounded-full font-semibold text-xs bg-[#0068f9] text-white hover:bg-[#024bb1] transition-all shadow-2xs cursor-pointer">Log Out</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccountConfirm && (
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[var(--sidebar-offset,0px)] bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
             <h3 className="text-lg font-bold text-[#121722] mb-2">Delete Account</h3>
             <p className="text-[13px] text-[#777c86] mb-6">This action cannot be undone. This will permanently delete your account and remove your data from our servers.</p>
             <div className="flex justify-end gap-3">
               <button onClick={() => setShowDeleteAccountConfirm(false)} className="px-4 py-2 rounded-full font-medium text-[13px] text-[#777c86] hover:bg-[#faf9f7] transition-colors cursor-pointer border border-transparent hover:border-[#efefef]">Cancel</button>
               <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-full font-medium text-[13px] bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors cursor-pointer shadow-sm">Delete Account</button>
             </div>
          </div>
        </div>
      )}

      {showDeleteResumeConfirm && (
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[var(--sidebar-offset,0px)] bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#121722] mb-2">Delete CV</h3>
            <p className="text-[13px] text-[#777c86] mb-6">
              Are you sure you want to remove your stored CV? The AI Evaluator will no longer have your pre-loaded CV until you upload a new one.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteResumeConfirm(false)} 
                className="px-4 py-2 rounded-full font-medium text-[13px] text-[#777c86] hover:bg-[#faf9f7] transition-colors cursor-pointer border border-transparent hover:border-[#efefef]"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteStoredResume} 
                className="px-4 py-2 rounded-full font-semibold text-xs bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors cursor-pointer shadow-sm"
              >
                Delete CV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
