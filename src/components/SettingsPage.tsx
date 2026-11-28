import React, { useState, useEffect, useRef } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Footer } from './Footer';
import { 
  Github, 
  Linkedin, 
  Check, 
  ChevronDown,
  ChevronRight,
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
import { getRoleCategories, getRoleLabel, isRoleInTrackingSystem } from '../data/roles';
import { computeDropdownAlign, DropdownAlign } from '../lib/utils';

interface SettingsPageProps {
  trackingSystem?: 'industry' | 'academic';
  setTrackingSystem?: (sys: 'industry' | 'academic') => void;
  selectedRole?: string;
  setSelectedRole?: (role: string) => void;
  onBack: () => void;
  onClearData: () => void;
  isSyncing: boolean;
  isDemo?: boolean;
}

export function SettingsPage({ 
  onBack, 
  onClearData, 
  isSyncing, 
  isDemo = false, 
  trackingSystem = 'industry', 
  setTrackingSystem,
  selectedRole = '',
  setSelectedRole
}: SettingsPageProps) {

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showDeleteResumeConfirm, setShowDeleteResumeConfirm] = useState(false);
  const roleTriggerRef = useRef<HTMLButtonElement>(null);
  const [roleAlign, setRoleAlign] = useState<DropdownAlign>('start');

  // My Resume state
  const [storedResume, setStoredResume] = useState<UserResume | null>(() => getStoredLocalResume(auth.currentUser?.uid));
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showScannedText, setShowScannedText] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setStoredResume(null);
        return;
      }
      const resume = await getUserResume(uid);
      if (resume) {
        setStoredResume(resume);
      } else {
        setStoredResume(null);
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

    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast.error('Please sign in to upload your master CV.');
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

      const saved = await saveUserResume(uid, {
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

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setStoredResume(null);
      setShowDeleteResumeConfirm(false);
      return;
    }

    try {
      await deleteUserResume(uid, storedResume?.id);
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
        toast.error('This operation requires recent authentication. Please log in again before retrying.');
        logout();
      } else {
        toast.error('Failed to delete account. Please try again.');
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
    <div className="relative w-full flex-1 flex flex-col">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col gap-4 sm:gap-5">
        {/* Account Card */}
        <section className="bg-white border border-[#efefef] rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-[#121722] mb-1">Account</h3>
              {isAnon ? (
                <p className="text-[13px] text-[#777c86]">
                  Signed in as <span className="font-semibold text-[#121722]">Guest</span>{' '}
                  <span className="text-xs tabular-nums">#Guest{auth.currentUser?.uid.substring(0, 5).toLowerCase()}</span>
                </p>
              ) : (
                <p className="text-[13px] text-[#777c86] truncate">
                  Synced with <span className="font-semibold text-[#121722]">{auth.currentUser?.email || 'Google'}</span>
                </p>
              )}
              <p className="text-xs text-[#777c86] mt-0.5">Connected</p>
            </div>

            <div className={`w-11 h-11 ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border} border rounded-full flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 select-none`}>
              {initial}
            </div>
          </div>

          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[#faf9f7] border-t border-[#efefef] flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#777c86]">
              {isAnon
                ? 'Guest accounts are automatically removed after 30 days of inactivity.'
                : 'Signed in with Google authentication.'}
            </p>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="inline-flex items-center justify-center rounded-lg text-[13px] font-semibold transition-all bg-[#0068f9] hover:bg-[#024bb1] text-white shadow-2xs h-[38px] px-5 cursor-pointer shrink-0"
            >
              Log Out
            </button>
          </div>
        </section>

        {/* Tracking System Card */}
        <section className="bg-white border border-[#efefef] rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5">
            <h3 className="text-[15px] font-bold text-[#121722] mb-1">Tracking System</h3>
            <p className="text-[13px] text-[#777c86] leading-relaxed mb-3.5">
              Switch between Industry and Academic job markets. This changes the default database and job suggestions.
            </p>

            <div role="radiogroup" aria-label="Tracking System" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'industry' as const,
                  label: 'Industry Seekr',
                  description: 'Tech, startups & corporate',
                },
                {
                  id: 'academic' as const,
                  label: 'Academic Seekr',
                  description: 'Universities & research labs',
                },
              ].map(({ id, label, description }) => {
                const isSelected = trackingSystem === id;
                return (
                  <label
                    key={id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#faf9f7] border-[#0068f9] ring-1 ring-[#0068f9]/15'
                        : 'bg-white border-[#efefef] hover:bg-[#faf9f7] hover:border-[#d4d4d8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="settings-tracking-system"
                      value={id}
                      checked={isSelected}
                      onChange={() => setTrackingSystem?.(id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[#0068f9] bg-white'
                          : 'border-[#d4d4d8] bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#0068f9]" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#121722] leading-snug">{label}</p>
                      <p className="text-[11px] text-[#777c86] mt-0.5">{description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        {/* Role Card */}
        <section className="bg-white border border-[#efefef] rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5">
            <h3 className="text-[15px] font-bold text-[#121722] mb-1">Role</h3>
            <p className="text-[13px] text-[#777c86] leading-relaxed mb-3.5">
              Select your primary role. This customizes the default job posts and suggestions in the Job Market.
            </p>

            <DropdownMenu.Root
              onOpenChange={(open) => {
                if (open) setRoleAlign(computeDropdownAlign(roleTriggerRef.current, 260));
              }}
            >
              <DropdownMenu.Trigger asChild>
                <button
                  ref={roleTriggerRef}
                  type="button"
                  className="flex items-center justify-between w-full sm:w-72 h-[38px] bg-[#faf9f7] border border-[#efefef] rounded-lg text-[13px] px-4 focus:outline-none focus:ring-2 focus:ring-[#0068f9] shadow-2xs hover:bg-[#f3f2ef] transition-all cursor-pointer"
                >
                  <span className="text-[#121722] font-medium truncate">
                    {getRoleLabel(selectedRole, trackingSystem)}
                  </span>
                  <ChevronDown size={14} className="text-[#777c86] shrink-0 ml-2" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-[100] min-w-[260px] max-w-[calc(100vw-32px)] max-h-[60vh] overflow-y-auto bg-white rounded-2xl border border-[#efefef] shadow-xl p-1.5 animate-in fade-in-80 zoom-in-95"
                  sideOffset={6}
                  align={roleAlign}
                  collisionPadding={16}
                >
                  <DropdownMenu.Item
                    className="flex items-center justify-between px-3.5 py-2.5 text-[13px] text-[#121722] rounded-[10px] cursor-pointer hover:bg-[#faf9f7] outline-none select-none transition-colors"
                    onClick={() => {
                      setSelectedRole?.('');
                      toast.success('Role reset to All Roles (Default)');
                    }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#121722]">All Roles (Default)</p>
                      <p className="text-[11px] text-[#777c86]">No role filtering applied by default</p>
                    </div>
                    {!selectedRole && <Check size={16} className="text-[#0068f9] shrink-0 ml-2" />}
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="h-px bg-[#efefef] my-1 mx-2" />

                  {Object.entries(getRoleCategories(trackingSystem)).map(([category, roles]) => {
                    const hasActiveRole = roles.some(r => r.value === selectedRole);

                    return (
                      <DropdownMenu.Sub key={category}>
                        <DropdownMenu.SubTrigger className="flex items-center justify-between px-3.5 py-2.5 text-[13px] text-[#121722] rounded-[10px] cursor-pointer hover:bg-[#faf9f7] outline-none select-none data-[state=open]:bg-[#faf9f7] transition-colors">
                          <span className="font-medium truncate">{category}</span>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {hasActiveRole && <Check size={14} className="text-[#0068f9]" />}
                            <ChevronRight size={14} className="text-[#a5a5a5]" />
                          </div>
                        </DropdownMenu.SubTrigger>

                        <DropdownMenu.Portal>
                          <DropdownMenu.SubContent
                            className="z-[100] min-w-[260px] max-w-[calc(100vw-32px)] max-h-[50vh] overflow-y-auto bg-white rounded-2xl border border-[#efefef] shadow-lg p-1.5 animate-in fade-in-80 zoom-in-95"
                            sideOffset={4}
                            collisionPadding={16}
                          >
                            {roles.map(role => (
                              <DropdownMenu.Item
                                key={role.value}
                                className="flex items-center justify-between px-3 py-2 text-[13px] text-[#121722] rounded-[10px] cursor-pointer hover:bg-[#faf9f7] outline-none select-none transition-colors"
                                onClick={() => {
                                  setSelectedRole?.(role.value);
                                  toast.success(`Role set to ${role.label}`);
                                }}
                              >
                                <span className="font-medium">{role.label}</span>
                                {selectedRole === role.value && <Check size={14} className="text-[#0068f9] shrink-0 ml-2" />}
                              </DropdownMenu.Item>
                            ))}
                          </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Sub>
                    );
                  })}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {selectedRole && (
            <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[#faf9f7] border-t border-[#efefef] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole?.('');
                  toast.success('Role reset to All Roles (Default)');
                }}
                className="inline-flex items-center justify-center h-[38px] px-4 rounded-lg text-[13px] font-medium text-[#121722] bg-white hover:bg-[#f3f2ef] border border-[#efefef] shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                Reset Role
              </button>
            </div>
          )}
        </section>

        {/* My Resume Card */}
        <section className="bg-white border border-[#efefef] rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-[15px] font-bold text-[#121722]">My Resume</h3>
              {storedResume && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Default CV
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#777c86] leading-relaxed mb-3.5">
              Seekr scans the text from your uploaded document to track your profile and power customized AI evaluations, job-matching scores, and tailored recommendations.
            </p>

            {storedResume ? (
              <div className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-3.5 sm:p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#efefef] text-[#0068f9] flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[13px] font-bold text-[#121722] truncate max-w-md">
                        {storedResume.fileName}
                      </h4>
                      <span className="text-[11px] font-medium text-[#777c86] bg-white border border-[#efefef] px-2 py-0.5 rounded-[4px] shadow-2xs tabular-nums">
                        {(storedResume.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#777c86] mt-1 flex-wrap">
                      <span>Uploaded {new Date(storedResume.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {showScannedText && (
                  <div className="mt-3.5 pt-3.5 border-t border-[#efefef] animate-in fade-in duration-150">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#121722]">
                        Scanned CV Content (Indexed for Evaluation &amp; Match Analysis)
                      </span>
                      <span className="text-[11px] text-[#777c86] tabular-nums">
                        {storedResume.cvText.split(/\s+/).filter(Boolean).length} words &bull; {storedResume.cvText.length} characters
                      </span>
                    </div>
                    <div className="bg-white border border-[#efefef] rounded-lg p-3 max-h-56 overflow-y-auto font-mono text-[11px] text-[#121722] leading-relaxed whitespace-pre-wrap select-text custom-scrollbar">
                      {storedResume.cvText || '(No text extracted from this document)'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#efefef] hover:border-[#0068f9] bg-[#faf9f7] rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[120px]"
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
                  <div className="w-10 h-10 rounded-full bg-white border border-[#efefef] text-[#0068f9] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    {isUploadingResume ? (
                      <RefreshCw size={20} className="animate-spin text-[#0068f9]" />
                    ) : (
                      <Upload size={20} />
                    )}
                  </div>
                  <p className="text-[13px] font-semibold text-[#121722]">
                    {isUploadingResume ? 'Scanning & processing CV...' : 'Upload your CV (PDF)'}
                  </p>
                  <p className="text-xs text-[#777c86] mt-0.5 max-w-sm mx-auto">
                    Drag &amp; drop your PDF file here, or click to browse. Max 10MB.
                  </p>
                </label>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[#faf9f7] border-t border-[#efefef] flex flex-wrap items-center justify-between gap-3">
            {storedResume ? (
              <>
                <p className="text-xs text-[#777c86]">
                  Automatically used by AI Evaluator and Resume Tailoring tools.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {storedResume.pdfBase64 && (
                    <button
                      type="button"
                      onClick={downloadStoredPdf}
                      className="inline-flex items-center justify-center h-[38px] px-3.5 rounded-lg text-[13px] font-medium text-[#121722] bg-white hover:bg-[#f3f4f6] border border-[#efefef] transition-colors shadow-2xs cursor-pointer"
                      title="Download stored PDF"
                    >
                      Download
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowScannedText(!showScannedText)}
                    className="inline-flex items-center justify-center h-[38px] px-3.5 rounded-lg text-[13px] font-medium text-[#0068f9] bg-white hover:bg-[#e8f1ff] border border-[#efefef] transition-colors shadow-2xs cursor-pointer"
                  >
                    {showScannedText ? 'Hide' : 'View'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteResumeConfirm(true)}
                    className="inline-flex items-center justify-center h-[38px] px-3.5 rounded-lg text-[13px] font-medium text-[#dc2626] bg-white hover:bg-red-50 border border-red-200 transition-colors shadow-2xs cursor-pointer"
                    title="Delete stored CV"
                  >
                    Delete
                  </button>
                  <label
                    htmlFor="settings-cv-replace"
                    className="inline-flex items-center justify-center rounded-lg text-[13px] font-semibold bg-[#0068f9] hover:bg-[#024bb1] text-white shadow-2xs h-[38px] px-4 cursor-pointer transition-colors"
                  >
                    <span>{isUploadingResume ? 'Uploading...' : 'Replace'}</span>
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
              </>
            ) : (
              <>
                <p className="text-xs text-[#777c86]">
                  Supported format: PDF up to 10MB.
                </p>
                <label
                  htmlFor="settings-cv-empty-upload"
                  className="inline-flex items-center justify-center rounded-lg text-[13px] font-semibold bg-[#0068f9] hover:bg-[#024bb1] text-white shadow-2xs h-[38px] px-5 cursor-pointer transition-colors shrink-0"
                >
                  {isUploadingResume ? 'Uploading...' : 'Upload CV'}
                </label>
              </>
            )}
          </div>
        </section>

        {/* Customer Support Card */}
        <SupportForm />

        {/* Delete Data Card */}
        <section className="bg-white border border-red-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5">
            <h3 className="text-[15px] font-bold text-[#121722] mb-1">Delete Data</h3>
            <p className="text-[13px] text-[#777c86] leading-relaxed">
              Permanently remove your job applications. This action is not reversible, so please continue with caution.
            </p>
          </div>
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-red-50 border-t border-red-100 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-red-700/80">
              This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => { onBack(); onClearData(); }}
              disabled={isSyncing}
              className="inline-flex items-center justify-center h-[38px] bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold px-4 rounded-lg transition-colors text-[13px] shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
            >
              Clear All Data
            </button>
          </div>
        </section>

        {/* Delete Account Card */}
        <section className="bg-white border border-red-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5">
            <h3 className="text-[15px] font-bold text-[#121722] mb-1">Delete Account</h3>
            <p className="text-[13px] text-[#777c86] leading-relaxed">
              Permanently remove your Personal Account and all of its contents from the Seekr platform. This action is not reversible, so please continue with caution.
            </p>
          </div>
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-red-50 border-t border-red-100 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-red-700/80">
              Your account and associated records will be permanently erased.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteAccountConfirm(true)}
              className="inline-flex items-center justify-center h-[38px] bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold px-4 rounded-lg transition-colors text-[13px] shadow-2xs cursor-pointer shrink-0"
            >
              Delete Personal Account
            </button>
          </div>
        </section>

        {/* Version & Footer */}
        <div className="mt-auto pt-3 pb-2">
          <div className="text-center text-xs text-[#777c86] font-medium mb-6">
            Version 4.5.0
          </div>
          <Footer
            flush
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
          <div className="bg-white border border-[#efefef] rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#121722] mb-2">Log Out</h3>
            <p className="text-[13px] text-[#777c86] mb-6 leading-relaxed">Are you sure you want to log out of your account?</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="h-[38px] px-4 rounded-lg font-medium text-[13px] text-[#777c86] hover:text-[#121722] hover:bg-[#faf9f7] border border-transparent hover:border-[#efefef] transition-colors cursor-pointer">Cancel</button>
              <button type="button" onClick={() => { setShowLogoutConfirm(false); logout(); }} className="h-[38px] px-5 rounded-lg font-semibold text-[13px] bg-[#0068f9] text-white hover:bg-[#024bb1] transition-all shadow-2xs cursor-pointer">Log Out</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccountConfirm && (
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[var(--sidebar-offset,0px)] bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in duration-200">
          <div className="bg-white border border-[#efefef] rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#121722] mb-2">Delete Account</h3>
            <p className="text-[13px] text-[#777c86] mb-6 leading-relaxed">This action cannot be undone. This will permanently delete your account and remove your data from our servers.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteAccountConfirm(false)} className="h-[38px] px-4 rounded-lg font-medium text-[13px] text-[#777c86] hover:text-[#121722] hover:bg-[#faf9f7] border border-transparent hover:border-[#efefef] transition-colors cursor-pointer">Cancel</button>
              <button type="button" onClick={handleDeleteAccount} className="h-[38px] px-4 rounded-lg font-semibold text-[13px] bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors cursor-pointer shadow-2xs">Delete Account</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteResumeConfirm && (
        <div className="fixed top-0 bottom-0 right-0 left-0 md:left-[var(--sidebar-offset,0px)] bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in duration-200">
          <div className="bg-white border border-[#efefef] rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#121722] mb-2">Delete CV</h3>
            <p className="text-[13px] text-[#777c86] mb-6 leading-relaxed">
              Are you sure you want to remove your stored CV? The AI Evaluator will no longer have your pre-loaded CV until you upload a new one.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteResumeConfirm(false)}
                className="h-[38px] px-4 rounded-lg font-medium text-[13px] text-[#777c86] hover:text-[#121722] hover:bg-[#faf9f7] border border-transparent hover:border-[#efefef] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStoredResume}
                className="h-[38px] px-4 rounded-lg font-semibold text-[13px] bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors cursor-pointer shadow-2xs"
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
