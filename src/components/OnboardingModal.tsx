import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Layers, 
  FileText, 
  Check, 
  Upload, 
  X, 
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '../lib/firebase';
import { extractTextFromPDF, fileToBase64 } from '../lib/pdf';
import { saveUserResume } from '../db/resumes';
import { UserResume } from '../types';
import { getRoleCategories } from '../data/roles';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingSystem: 'industry' | 'academic';
  setTrackingSystem: (sys: 'industry' | 'academic') => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  storedResume: UserResume | null;
  setStoredResume: (resume: UserResume | null) => void;
  isDemo?: boolean;
}

export function OnboardingModal({
  isOpen,
  onClose,
  trackingSystem,
  setTrackingSystem,
  selectedRole,
  setSelectedRole,
  setStoredResume,
  isDemo = false,
}: OnboardingModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  // Keep step 3 strictly blank initially during onboarding - only show a CV if the user uploaded it in this modal
  const [uploadedCvInModal, setUploadedCvInModal] = useState<UserResume | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
      setUploadedCvInModal(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Select Seekr",
      icon: Briefcase,
    },
    {
      title: "Target Role",
      icon: Layers,
    },
    {
      title: "Upload CV",
      icon: FileText,
    },
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF format CV.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setIsUploadingCv(true);
    toast.loading('Processing CV and extracting text...', { id: 'onboarding-cv-upload' });

    try {
      let extractedText = '';
      let base64 = '';

      try {
        extractedText = await extractTextFromPDF(file);
      } catch (err) {
        console.warn('PDF text extraction issue:', err);
      }

      try {
        base64 = await fileToBase64(file);
      } catch (err) {
        console.warn('PDF base64 issue:', err);
      }

      const uid = isDemo ? 'demo' : (auth.currentUser?.uid || 'guest');
      const saved = await saveUserResume(uid, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/pdf',
        cvText: extractedText,
        pdfBase64: base64,
      });

      setUploadedCvInModal(saved);
      setStoredResume(saved);
      toast.success('CV uploaded and saved to My Resume.', { id: 'onboarding-cv-upload' });
    } catch (err: any) {
      toast.error('Failed to upload CV: ' + (err.message || 'unknown error'), { id: 'onboarding-cv-upload' });
    } finally {
      setIsUploadingCv(false);
    }
  };

  const roleCategories = getRoleCategories(trackingSystem);

  const formatCategorySentenceCase = (name: string): string => {
    if (!name) return '';
    if (name.toUpperCase() === 'QA') return 'QA';
    const lower = name.toLowerCase();
    const formatted = lower.charAt(0).toUpperCase() + lower.slice(1);
    return formatted.replace(/\bqa\b/gi, 'QA');
  };

  const handleDone = () => {
    toast.success("All set! You’re ready to take your next role!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white border border-[#efefef] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header with Title, Close, and Stepper */}
        <div className="px-6 py-4 md:px-7 md:py-4.5 border-b border-[#efefef] relative bg-white shrink-0">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-base sm:text-lg font-bold text-[#121722]">
              Set up your career preferences
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#777c86] hover:text-[#121722] hover:bg-[#faf9f7] transition-colors cursor-pointer border border-transparent hover:border-[#efefef]"
              title="Close and skip"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="relative flex items-center justify-between w-full max-w-md mx-auto">
            {/* Background Line */}
            <div
              className="absolute h-0.5 bg-[#efefef]"
              style={{ left: "16.67%", right: "16.67%", top: "16px" }}
            />

            {/* Animated Active Line */}
            <motion.div
              className="absolute h-0.5 bg-[#0068f9] origin-left"
              style={{ left: "16.67%", right: "16.67%", top: "16px" }}
              initial={{ scaleX: 0 }}
              animate={{
                scaleX: activeStep / (steps.length - 1),
              }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />

            {steps.map((step, idx) => {
              const isCompleted = idx < activeStep;
              const isActive = idx === activeStep;
              return (
                <div
                  key={step.title}
                  className="flex flex-col items-center flex-1 relative group cursor-pointer"
                  onClick={() => setActiveStep(idx)}
                >
                  <motion.div
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 relative z-10 ${
                      isCompleted
                        ? "bg-[#0068f9] text-white shadow-2xs"
                        : isActive
                        ? "bg-[#0068f9] text-white shadow-md ring-4 ring-[#0068f9]/15"
                        : "bg-[#faf9f7] text-[#777c86] border border-[#efefef]"
                    }`}
                    animate={{
                      scale: isActive ? 1.05 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    ) : (
                      <step.icon className="w-3.5 h-3.5" />
                    )}
                  </motion.div>

                  {/* Step Title without description text */}
                  <div className="mt-3.5 text-center select-none">
                    <p
                      className={`text-xs font-semibold transition-colors duration-300 ${
                        isActive || isCompleted
                          ? "text-[#121722]"
                          : "text-[#777c86]"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-7 bg-[#faf9f7] custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pt-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card 1: Industry Seekr */}
                  <div
                    onClick={() => setTrackingSystem('industry')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative bg-white shadow-2xs hover:shadow-sm ${
                      trackingSystem === 'industry'
                        ? 'border-[#0068f9] ring-2 ring-[#0068f9]/15'
                        : 'border-[#efefef] hover:border-[#121722]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h4 className="text-base sm:text-lg font-bold text-[#121722]">Industry Seekr</h4>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                        trackingSystem === 'industry'
                          ? 'border-[#0068f9] bg-[#0068f9] text-white'
                          : 'border-[#d0d0d0] bg-white'
                      }`}>
                        {trackingSystem === 'industry' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="inline-block text-[11px] font-semibold text-[#0068f9] bg-blue-50/70 px-2 py-0.5 rounded-md">
                      Tech, Startups & Corporate
                    </span>
                    <p className="text-xs text-[#777c86] mt-2.5 leading-relaxed">
                      For engineers, designers, product leaders, data teams, and corporate technology professionals.
                    </p>
                  </div>

                  {/* Card 2: Academic Seekr */}
                  <div
                    onClick={() => setTrackingSystem('academic')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative bg-white shadow-2xs hover:shadow-sm ${
                      trackingSystem === 'academic'
                        ? 'border-[#0068f9] ring-2 ring-[#0068f9]/15'
                        : 'border-[#efefef] hover:border-[#121722]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h4 className="text-base sm:text-lg font-bold text-[#121722]">Academic Seekr</h4>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                        trackingSystem === 'academic'
                          ? 'border-[#0068f9] bg-[#0068f9] text-white'
                          : 'border-[#d0d0d0] bg-white'
                      }`}>
                        {trackingSystem === 'academic' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="inline-block text-[11px] font-semibold text-[#0068f9] bg-blue-50/70 px-2 py-0.5 rounded-md">
                      Universities & Research Labs
                    </span>
                    <p className="text-xs text-[#777c86] mt-2.5 leading-relaxed">
                      For postdocs, PhD candidates, faculty professors, lecturers, and scientific researchers.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5 pt-1"
              >
                {/* Option for All Roles (Default) */}
                <label 
                  onClick={() => setSelectedRole('')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between bg-white shadow-2xs ${
                    !selectedRole
                      ? 'border-[#0068f9] ring-2 ring-[#0068f9]/15'
                      : 'border-[#efefef] hover:border-[#121722]/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="onboarding-role" 
                      checked={!selectedRole} 
                      onChange={() => setSelectedRole('')} 
                      className="sr-only" 
                    />
                    <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all ${
                      !selectedRole
                        ? 'border-[#0068f9] bg-white ring-2 ring-[#0068f9]/20'
                        : 'border-[#c8ccd0] bg-white'
                    }`}>
                      {!selectedRole && <span className="w-2 h-2 rounded-full bg-[#0068f9]" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#121722]">All Roles (Default)</p>
                      <p className="text-[11px] text-[#777c86]">Browse all positions across the market</p>
                    </div>
                  </div>
                </label>

                {/* Categories & Roles grouped by parent category name */}
                <div className="space-y-4 max-h-[360px] sm:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(roleCategories).map(([category, roles]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs font-semibold text-[#777c86] px-1">
                        {formatCategorySentenceCase(category)}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {roles.map((role) => {
                          const isSelected = selectedRole === role.value;
                          return (
                            <label
                              key={role.value}
                              onClick={() => setSelectedRole(role.value)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 bg-white shadow-2xs ${
                                isSelected
                                  ? 'border-[#0068f9] ring-2 ring-[#0068f9]/15 bg-blue-50/20'
                                  : 'border-[#efefef] hover:border-[#121722]/20'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="onboarding-role" 
                                checked={isSelected} 
                                onChange={() => setSelectedRole(role.value)} 
                                className="sr-only" 
                              />
                              <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-[#0068f9] bg-white ring-2 ring-[#0068f9]/20'
                                  : 'border-[#c8ccd0] bg-white'
                              }`}>
                                {isSelected && <span className="w-2 h-2 rounded-full bg-[#0068f9]" />}
                              </div>
                              <span className={`text-xs truncate ${
                                isSelected ? 'font-semibold text-[#121722]' : 'text-[#525866]'
                              }`}>
                                {role.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pt-1"
              >
                {uploadedCvInModal ? (
                  <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#121722]">
                        {uploadedCvInModal.fileName}
                      </h4>
                      <p className="text-xs text-[#777c86] mt-0.5">
                        Uploaded CV • {(uploadedCvInModal.fileSize / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <label 
                      htmlFor="onboarding-cv-replace"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#efefef] hover:border-[#121722]/30 text-xs font-semibold text-[#121722] shadow-2xs hover:bg-[#faf9f7] transition-all cursor-pointer"
                    >
                      <Upload size={14} />
                      Replace CV
                    </label>
                    <input
                      id="onboarding-cv-replace"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      disabled={isUploadingCv}
                      onChange={handleCvUpload}
                    />
                  </div>
                ) : (
                  <label
                    htmlFor="onboarding-cv-upload-input"
                    className={`border-2 border-dashed border-[#d0e1fd] hover:border-[#0068f9] bg-white hover:bg-blue-50/30 rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center shadow-2xs block ${
                      isUploadingCv ? 'opacity-70 pointer-events-none' : ''
                    }`}
                  >
                    <input
                      id="onboarding-cv-upload-input"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      disabled={isUploadingCv}
                      onChange={handleCvUpload}
                    />
                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-[#d0e1fd] text-[#0068f9] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      {isUploadingCv ? (
                        <RefreshCw size={22} className="animate-spin text-[#0068f9]" />
                      ) : (
                        <Upload size={22} />
                      )}
                    </div>
                    <span className="text-sm font-bold text-[#121722] block">
                      {isUploadingCv ? 'Extracting CV text...' : 'Upload your CV (PDF)'}
                    </span>
                    <span className="text-xs text-[#777c86] mt-1 max-w-sm mx-auto block leading-relaxed">
                      Drag & drop your PDF file here, or click to browse. Max 10MB.
                    </span>
                  </label>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-3.5 sm:px-7 sm:py-3.5 bg-white border-t border-[#efefef] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-full text-xs font-semibold text-[#121722] border border-[#efefef] hover:bg-[#faf9f7] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-2xs"
          >
            Back
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#777c86] hover:text-[#121722] transition-colors cursor-pointer"
            >
              Skip
            </button>

            {activeStep === steps.length - 1 ? (
              <button
                type="button"
                onClick={handleDone}
                className="px-6 py-2 rounded-full text-xs font-semibold bg-[#0068f9] hover:bg-[#024bb1] text-white shadow-2xs transition-all cursor-pointer"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 rounded-full text-xs font-semibold bg-[#0068f9] hover:bg-[#024bb1] text-white shadow-2xs transition-all cursor-pointer"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
