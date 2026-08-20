import React, { useState, useEffect } from 'react';
import { JobApplication } from '../types';
import { extractTextFromPDF, fileToBase64 } from '../lib/pdf';
import { addEvaluation } from '../db/evaluations';
import { auth } from '../lib/firebase';
import AgentAvatar from './AgentAvatar';
import PersonaOrbCarousel, { TECH_ROLES } from './PersonaOrbCarousel';
import { InlineLoader } from 'generative-loaders';
import 'generative-loaders/styles.css';
import { 
  FileCheck, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Copy, 
  Check, 
  FileText, 
  ArrowRight,
  RefreshCw,
  ChevronDown,
  Info,
  LoaderCircleIcon,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from './ui/stepper';

interface CVMatchAssessmentProps {
  applications: JobApplication[];
  isDemo?: boolean;
  onAddToWishlist?: (appData: Partial<JobApplication>) => void;
  onViewHistory?: () => void;
}

export interface MatchResult {
  company_name?: string;
  score: number;
  matchCategory: 'High Match' | 'Medium Match' | 'Low Match';
  strengths: string[];
  gaps: string[];
  actionable_polish: string;
  interview_questions: string[];
}

export function CVMatchAssessment({ applications, isDemo = false, onAddToWishlist, onViewHistory }: CVMatchAssessmentProps) {
  const DEMO_RESULT: MatchResult = {
    company_name: 'TechFlow Solutions',
    score: 88,
    matchCategory: 'High Match',
    strengths: [
      'Strong React & TypeScript experience aligned with Frontend Developer requirements',
      'Demonstrated expertise in building design systems and state management solutions',
      'Proven track record of optimizing client-side performance and bundle sizes'
    ],
    gaps: [
      'Limited explicit mention of automated E2E testing framework experience (e.g., Playwright / Cypress)',
      'Could elaborate more on GraphQL vs REST API integration details'
    ],
    actionable_polish: 'Reframe basic task descriptions into high-impact metric accomplishments (e.g., "Improved page load speed by 35% through code-splitting and memoization"). Detail experience with modern UI libraries and state architecture.',
    interview_questions: [
      'How do you approach state management in large-scale React applications?',
      'Can you walk us through a complex web performance optimization project you delivered?',
      'How do you collaborate with UX designers to implement accessible design tokens?'
    ]
  };

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [targetRole, setTargetRole] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState(isDemo ? 'Senior Frontend Engineer with 5+ years experience in React, TypeScript, and modern CSS architecture.' : '');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [cvInputMode, setCvInputMode] = useState<'upload' | 'text'>('upload');
  
  const [jdSource, setJdSource] = useState<'custom' | 'application'>('custom');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [jobDescription, setJobDescription] = useState(isDemo ? 'Looking for a Senior Frontend Developer skilled in React 18, TypeScript, Tailwind CSS, and performance optimization.' : '');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Agent thinking...');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingText('Agent thinking...');
      let tick = 0;
      interval = setInterval(() => {
        tick++;
        if (tick === 1) {
          setLoadingText('Agent evaluating...');
        } else if (tick === 2) {
          setLoadingText('Agent shaping...');
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const [result, setResult] = useState<MatchResult | null>(null);
  const [copiedPolish, setCopiedPolish] = useState(false);
  const [showCvTextPreview, setShowCvTextPreview] = useState(false);

  // Handle PDF Upload
  const handleFileUpload = async (file: File) => {
    if (isDemo) {
      toast.info('Demo Mode: File upload is disabled in demo preview. Sample CV text is pre-loaded below or you can paste text.');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF format CV.');
      return;
    }

    setCvFile(file);
    setIsExtractingPdf(true);
    try {
      const extractedText = await extractTextFromPDF(file);
      setCvText(extractedText);
      toast.success('CV PDF text extracted successfully!');
    } catch (err) {
      console.warn('Browser PDF text extraction fell back to server PDF parsing', err);
      toast.info('PDF attached. AI server will analyze document directly.');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleRemoveCvFile = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCvFile(null);
    setCvText('');
    setShowCvTextPreview(false);
    const inputEl = document.getElementById('cv-file-upload') as HTMLInputElement;
    if (inputEl) inputEl.value = '';
    toast.info('Uploaded CV removed');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle Application selection
  const handleSelectApplication = (appId: string) => {
    setSelectedAppId(appId);
    const app = applications.find(a => a.id === appId);
    if (app) {
      const formattedJd = `Job Title: ${app.position}
Company: ${app.company}
Status: ${app.status}
Location: ${app.location || 'Not specified'}
Work Model: ${app.workType || 'Not specified'}

Notes & Requirements:
${app.notes || 'No extra description provided.'}`;
      setJobDescription(formattedJd);
    }
  };

  const validateStep = (step: number) => {
    if (step === 1) return !!targetRole;
    if (step === 2) return !!cvText || !!cvFile;
    if (step === 3) return !!jobDescription.trim();
    return false;
  };

  // Submit AI Match Request
  const handleAnalyzeMatch = async () => {
    if (isDemo) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setResult(DEMO_RESULT);
        toast.success('Demo Mode: Simulated AI match evaluation generated!');
      }, 1200);
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please provide or select a Job Description.');
      return;
    }
    if (!cvText && !cvFile) {
      toast.error('Please upload or paste your CV text.');
      return;
    }

    setIsLoading(true);

    try {
      let pdfBase64 = '';
      if (cvFile && !cvText) {
        pdfBase64 = await fileToBase64(cvFile);
      }

      const res = await fetch('/api/cv-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          cvText,
          pdfBase64,
          jobDescription
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate assessment');
      }

      const data: MatchResult = await res.json();
      setResult(data);
      toast.success('CV Match analysis completed!');
      
      if (auth.currentUser) {
        try {
          await addEvaluation({
            userId: auth.currentUser.uid,
            role: targetRole,
            jobDescription,
            result: data
          });
        } catch (e) {
          console.error("Failed to save evaluation history", e);
        }
      }
    } catch (err: any) {
      console.error('CV Match Error:', err);
      toast.error(err.message || 'Error conducting AI analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPolishToClipboard = () => {
    if (!result?.actionable_polish) return;
    navigator.clipboard.writeText(result.actionable_polish);
    setCopiedPolish(true);
    toast.success('Actionable Polish guidelines copied to clipboard!');
    setTimeout(() => setCopiedPolish(false), 2000);
  };

  // Helper for gauge colors
  const getCategoryStyles = (score: number) => {
    if (score >= 80) {
      return {
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ringColor: '#10b981', // emerald-500
        textColor: 'text-emerald-600',
        label: 'High Match'
      };
    } else if (score >= 60) {
      return {
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        ringColor: '#f59e0b', // amber-500
        textColor: 'text-amber-600',
        label: 'Medium Match'
      };
    } else {
      return {
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        ringColor: '#f43f5e', // rose-500
        textColor: 'text-rose-600',
        label: 'Low Match'
      };
    }
  };

  const steps = [
    { title: 'Select AI Evaluator', description: 'Target Persona' },
    { title: 'Upload CV', description: 'PDF or Raw Text' },
    { title: 'Job Description', description: 'JD Analysis' },
  ];

  const selectedRoleObj = TECH_ROLES.find(r => r.id === targetRole);

  return (
    <div className="w-full space-y-6">

      {/* If Result exists, show Bento Grid Overview. Else show Step Guided Workflow */}
      {result ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Bar Navigation in Results */}
          <div className="bg-white border border-[#efefef] rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AgentAvatar seed={targetRole} size={38} animated={true} />
              <div>
                <h3 className="text-sm font-bold text-[#121722]">
                  Match Analysis for {targetRole}
                </h3>
                <p className="text-xs text-[#777c86]">
                  Evaluated using domain-specific reasoning engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setTargetRole('');
                  setCurrentStep(1);
                }}
                className="px-4 py-2 rounded-full border border-[#efefef] bg-white text-[#121722] hover:bg-[#faf9f7] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ArrowRight size={14} className="rotate-180" />
                <span>Re-Evaluate</span>
              </button>
              {onAddToWishlist && (
                <button
                  type="button"
                  onClick={() => {
                    onAddToWishlist({
                      company: result.company_name || 'Unknown Company',
                      position: targetRole,
                      status: 'Wishlist',
                      notes: `Added from CV Evaluation. Score: ${result.score}%`,
                    });
                  }}
                  className="px-4 py-2 rounded-full border border-[#0068f9]/20 bg-[#e8f1ff] text-[#0068f9] hover:bg-[#d1e4ff] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Sparkles size={14} />
                  <span>Add to Wishlist</span>
                </button>
              )}
            </div>
          </div>

          {/* Bento Grid Design */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento Card 1: Score & Persona Overview (Col 4) */}
            <div className="md:col-span-4 bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col items-center justify-between text-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between border-b border-[#efefef] pb-3 mb-4">
                <span className="text-xs font-bold text-[#777c86]">
                  Score overview
                </span>
                {(() => {
                  const styles = getCategoryStyles(result.score);
                  return (
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${styles.badgeBg}`}>
                      {result.matchCategory || styles.label}
                    </span>
                  );
                })()}
              </div>

              {/* Score Circular Ring */}
              {(() => {
                const styles = getCategoryStyles(result.score);
                const strokeDasharray = 283;
                const strokeDashoffset = strokeDasharray - (strokeDasharray * result.score) / 100;

                return (
                  <div className="relative w-40 h-40 flex items-center justify-center my-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="text-[#f2f2f2]"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        strokeWidth="10"
                        stroke={styles.ringColor}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className={`text-4xl font-extrabold tracking-tight ${styles.textColor}`}>
                        {result.score}%
                      </span>
                      <span className="text-xs font-semibold text-[#777c86]">
                        Match rate
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-4 pt-4 border-t border-[#efefef] w-full flex items-center justify-center gap-2">
                <AgentAvatar seed={targetRole} size={28} />
                <span className="text-xs font-bold text-[#121722]">{targetRole} Lens</span>
              </div>
            </div>

            {/* Bento Card 2: Strategic Bullet Point Polish (Col 8) */}
            <div className="md:col-span-8 bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col justify-between relative overflow-hidden isolate space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#e8f1ff] border border-[#0068f9]/20 flex items-center justify-center text-[#0068f9]">
                    <Sparkles size={16} />
                  </div>
                  <h4 className="text-sm font-bold tracking-tight text-[#121722]">
                    Actionable bullet-point polish
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={copyPolishToClipboard}
                  className="text-xs font-medium text-[#121722] bg-white hover:bg-[#faf9f7] border border-[#efefef] shadow-2xs px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPolish ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedPolish ? 'Copied' : 'Copy guidelines'}</span>
                </button>
              </div>

              <div className="bg-[#f4f8ff] border border-[#0068f9]/20 rounded-2xl p-4.5 text-[#121722] text-xs sm:text-sm leading-relaxed font-normal">
                {result.actionable_polish}
              </div>

              <div className="flex items-center gap-2 text-xs text-[#777c86] font-medium">
                <Info size={14} className="text-[#0068f9]" />
                <span>Reframe basic task descriptions into high-impact metric accomplishments.</span>
              </div>
            </div>

            {/* Bento Card 3: Strongest Alignments (Col 6) */}
            <div className="md:col-span-6 bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#efefef] pb-3">
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <h4 className="text-xs font-bold text-[#121722]">
                  Strongest technical alignments
                </h4>
              </div>

              <ul className="space-y-2.5">
                {result.strengths.map((item, idx) => (
                  <li key={idx} className="text-xs text-[#121722] bg-[#faf9f7] border border-[#efefef] rounded-xl p-3 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                    <span className="leading-relaxed font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bento Card 4: Competency & Evidence Gaps (Col 6) */}
            <div className="md:col-span-6 bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#efefef] pb-3">
                <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle size={18} />
                </div>
                <h4 className="text-xs font-bold text-[#121722]">
                  Competency & evidence gaps
                </h4>
              </div>

              <ul className="space-y-2.5">
                {result.gaps.map((item, idx) => (
                  <li key={idx} className="text-xs text-[#121722] bg-[#faf9f7] border border-[#efefef] rounded-xl p-3 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                    <span className="leading-relaxed font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bento Card 5: Forecasted Role Interview Questions (Col 12) */}
            <div className="md:col-span-12 bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#efefef] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#f4f0ff] text-[#6736eb] flex items-center justify-center">
                    <HelpCircle size={18} />
                  </div>
                  <h4 className="text-xs font-bold text-[#121722]">
                    Forecasted {targetRole} interview questions
                  </h4>
                </div>
                <span className="text-xs font-semibold text-[#777c86]">
                  3 tailored scenario questions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.interview_questions.map((q, idx) => (
                  <div key={idx} className="bg-[#faf9f7] border border-[#efefef] rounded-2xl p-4 space-y-2 hover:border-[#0068f9]/40 transition-all">
                    <span className="w-6 h-6 rounded-full bg-[#0068f9]/10 text-[#0068f9] font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-[#121722] font-medium leading-relaxed pt-1">
                      {q}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* STEPPER GUIDED FORM WORKFLOW */
        <Stepper
          value={currentStep}
          onValueChange={(val) => {
            if (val <= currentStep || validateStep(currentStep)) {
              setCurrentStep(val);
            }
          }}
          orientation="vertical"
          indicators={{
            completed: <Check className="size-3.5" />,
            loading: <LoaderCircleIcon className="size-3.5 animate-spin" />,
          }}
          className="flex flex-col md:flex-row gap-6 items-stretch w-full"
        >
          {/* STEPPER SIDEBAR NAV - LEFT SIDE */}
          <div className="w-full md:w-60 lg:w-64 shrink-0 bg-white border border-[#efefef] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col self-stretch justify-between min-h-[520px] md:h-[520px]">
            <StepperNav className="w-full flex-1 flex flex-col justify-between py-2">
              {steps.map((step, index) => (
                <React.Fragment key={index}>
                  <StepperItem step={index + 1} className="relative flex items-center w-full z-10">
                    <StepperTrigger className="flex items-center gap-3 text-left w-full p-2.5 rounded-xl hover:bg-[#faf9f7] transition-all cursor-pointer group border border-transparent data-[state=active]:bg-[#faf9f7] data-[state=active]:border-[#efefef]">
                      <StepperIndicator className="size-7 text-xs font-bold border border-[#e5e7eb] bg-[#f3f4f6] text-[#6b7280] data-[state=active]:bg-[#121722] data-[state=active]:text-white data-[state=active]:border-[#121722] data-[state=completed]:bg-[#121722] data-[state=completed]:text-white data-[state=completed]:border-[#121722] transition-colors shrink-0 rounded-full shadow-2xs">
                        {index + 1}
                      </StepperIndicator>
                      <div className="flex flex-col min-w-0">
                        <StepperTitle className="text-sm font-bold text-[#121722] leading-snug">
                          {step.title}
                        </StepperTitle>
                        <StepperDescription className="text-[10px] text-[#777c86] font-medium tracking-tight mt-0.5 truncate">
                          {step.description}
                        </StepperDescription>
                      </div>
                    </StepperTrigger>
                  </StepperItem>

                  {/* Clean line segment placed ONLY between steps, never above step 1 or below step 3 */}
                  {index < steps.length - 1 && (
                    <div className="ml-[23px] my-1.5 w-[2px] flex-1 bg-[#e5e7eb] min-h-[20px]" />
                  )}
                </React.Fragment>
              ))}
            </StepperNav>
          </div>

          {/* RIGHT CONTENT AREA */}
          <StepperPanel className="flex-1 w-full min-w-0 self-stretch flex flex-col min-h-[520px] md:h-[520px]">
            {/* STEP 1: SELECT AI EVALUATOR */}
            <StepperContent value={1} className="h-full flex flex-col flex-1">
              <div className="bg-white border border-[#efefef] rounded-2xl p-5 sm:p-6 shadow-2xs h-full md:h-[520px] flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                <div className="shrink-0 pb-1 flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-[#121722]">
                      Select AI Evaluator
                    </h3>
                    <p className="text-xs text-[#777c86] mt-0.5">
                      Browse and select a specialized domain evaluator to review your resume against job criteria.
                    </p>
                  </div>
                  {onViewHistory && (
                    <button
                      onClick={onViewHistory}
                      className="text-xs font-medium text-[#0068f9] hover:text-[#0052cc] transition-colors underline underline-offset-2 cursor-pointer"
                    >
                      Evaluate History
                    </button>
                  )}
                </div>

                <PersonaOrbCarousel
                  selectedRoleId={targetRole}
                  onSelectRole={(roleId) => setTargetRole(roleId)}
                  onContinue={() => setCurrentStep(2)}
                />
              </div>
            </StepperContent>

            {/* STEP 2: UPLOAD CV */}
            <StepperContent value={2} className="h-full flex flex-col flex-1">
              <div className="bg-white border border-[#efefef] rounded-2xl p-5 sm:p-6 shadow-2xs h-full md:h-[520px] flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#efefef] pb-3 shrink-0">
                    <div>
                      <h3 className="text-base font-bold text-[#121722]">
                        Upload your CV
                      </h3>
                      <p className="text-xs text-[#777c86] mt-0.5">
                        Upload a PDF CV or paste raw text.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[#faf9f7] p-1 border border-[#efefef] rounded-full text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setCvInputMode('upload')}
                          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${cvInputMode === 'upload' ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' : 'text-[#777c86]'}`}
                        >
                          PDF upload
                        </button>
                        <button
                          type="button"
                          onClick={() => setCvInputMode('text')}
                          className={`px-3 py-1 rounded-full transition-all cursor-pointer ${cvInputMode === 'text' ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' : 'text-[#777c86]'}`}
                        >
                          Paste text
                        </button>
                      </div>
                    </div>
                  </div>

                  {cvInputMode === 'upload' ? (
                    <div className="flex-1 flex flex-col justify-center my-2 min-h-0">
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex-1 flex flex-col items-center justify-center min-h-[220px] ${
                          cvFile ? 'border-emerald-400 bg-emerald-50/20' : 'border-[#efefef] hover:border-[#0068f9] bg-[#faf9f7]'
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          disabled={isDemo}
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                          className="hidden"
                          id="cv-file-upload"
                        />
                        <label htmlFor="cv-file-upload" className={`${isDemo ? 'cursor-not-allowed' : 'cursor-pointer'} block my-auto`}>
                          <div className="w-12 h-12 rounded-full bg-[#faf9f7] border border-[#efefef] text-[#0068f9] flex items-center justify-center mx-auto mb-3">
                            {isExtractingPdf ? (
                              <RefreshCw size={24} className="animate-spin text-[#0068f9]" />
                            ) : (
                              <Upload size={24} className={isDemo ? 'opacity-50' : ''} />
                            )}
                          </div>
                          {cvFile ? (
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-[#121722] flex items-center justify-center gap-1.5 max-w-full px-2">
                                <FileCheck size={18} className="text-emerald-600 shrink-0" />
                                <span className="truncate max-w-[260px] sm:max-w-[320px]">{cvFile.name}</span>
                              </p>
                              <p className="text-xs text-[#777c86]">
                                {(cvFile.size / 1024).toFixed(1)} KB • {cvText ? `${cvText.length} characters parsed` : 'Ready'}
                              </p>

                              {/* ACTION BUTTONS: REMOVE OR REPLACE PDF */}
                              <div className="flex items-center justify-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={handleRemoveCvFile}
                                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                  title="Delete uploaded PDF"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete PDF</span>
                                </button>
                                <label
                                  htmlFor="cv-file-upload"
                                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#0068f9] bg-white hover:bg-blue-50 border border-[#efefef] transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                  title="Upload a different PDF file"
                                >
                                  <Upload size={13} />
                                  <span>Replace PDF</span>
                                </label>
                              </div>
                            </div>
                          ) : isDemo ? (
                            <div className="space-y-1">
                              <div className="mb-2 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-[11px] font-semibold text-amber-800 inline-flex items-center gap-1.5 mx-auto">
                                <Info size={13} className="text-amber-600 shrink-0" />
                                <span>PDF Upload Banned in Demo Mode</span>
                              </div>
                              <p className="text-sm font-semibold text-[#121722]">
                                Sample CV text is pre-loaded for demonstration
                              </p>
                              <p className="text-xs text-[#777c86] mt-1 max-w-sm mx-auto">
                                Switch to "Paste text" mode above to edit CV details or click "Continue to Job Description".
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-semibold text-[#121722]">
                                Click to upload or drag & drop your PDF CV
                              </p>
                              <p className="text-xs text-[#a5a5a5] mt-1">PDF format supported up to 10MB</p>
                            </div>
                          )}
                        </label>
                      </div>

                      {cvText && (
                        <div className="mt-2 text-right shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowCvTextPreview(!showCvTextPreview)}
                            className="text-xs font-medium text-[#0068f9] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileText size={12} />
                            <span>{showCvTextPreview ? 'Hide extracted CV text' : 'View extracted CV text'}</span>
                          </button>
                          {showCvTextPreview && (
                            <textarea
                              readOnly
                              value={cvText}
                              rows={4}
                              className="w-full mt-2 p-3 text-xs bg-[#faf9f7] border border-[#efefef] rounded-2xl text-[#121722] font-mono"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col my-2 min-h-0">
                      <textarea
                        value={cvText}
                        onChange={(e) => setCvText(e.target.value)}
                        placeholder="Paste your resume or CV experience bullet points here..."
                        className="w-full flex-1 min-h-[220px] p-3.5 text-xs bg-white border border-[#efefef] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0068f9] text-[#121722] placeholder:text-[#a5a5a5] resize-none"
                      />
                    </div>
                  )}

                <div className="pt-3 border-t border-[#efefef] flex items-center justify-between shrink-0 mt-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="h-11 w-[100px] rounded-full border border-[#efefef] bg-white hover:bg-[#faf9f7] text-[#121722] font-medium text-xs transition-all flex items-center justify-center cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={!validateStep(2)}
                    className="h-11 w-[260px] px-6 rounded-full bg-[#0068f9] hover:bg-[#024bb1] text-white font-medium text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Continue to Job Description</span>
                  </button>
                </div>
              </div>
            </StepperContent>

            {/* STEP 3: JOB DESCRIPTION */}
            <StepperContent value={3} className="h-full flex flex-col flex-1">
              <div className="bg-white border border-[#efefef] rounded-2xl p-5 sm:p-6 shadow-2xs h-full md:h-[520px] flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#efefef] pb-3 shrink-0">
                    <div>
                      <h3 className="text-base font-bold text-[#121722]">
                        Job Description
                      </h3>
                      <p className="text-xs text-[#777c86] mt-0.5">
                        Paste a target job posting or pick from your tracked Seekr applications.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-[#faf9f7] p-1 border border-[#efefef] rounded-full text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setJdSource('custom')}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${jdSource === 'custom' ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' : 'text-[#777c86]'}`}
                      >
                        Custom paste
                      </button>
                      <button
                        type="button"
                        onClick={() => setJdSource('application')}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${jdSource === 'application' ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' : 'text-[#777c86]'}`}
                      >
                        Tracked app
                      </button>
                    </div>
                  </div>

                  {jdSource === 'application' && (
                    <div className="space-y-1 my-2 shrink-0">
                      <label className="block text-xs font-medium text-[#777c86]">Choose from my tracked applications:</label>
                      <div className="relative">
                        <select
                          value={selectedAppId}
                          onChange={(e) => handleSelectApplication(e.target.value)}
                          className="w-full pl-3.5 pr-9 py-2 text-xs bg-[#faf9f7] border border-[#efefef] rounded-2xl focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] outline-none transition-all text-[#121722] appearance-none cursor-pointer font-medium"
                        >
                          <option value="">-- Choose a tracked application --</option>
                          {applications.map((app) => (
                            <option key={app.id} value={app.id}>
                              {app.position} at {app.company} ({app.status})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777c86] pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col my-2 min-h-0">
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the full job description, required skills, and key responsibilities here..."
                      className="w-full flex-1 min-h-[220px] p-3.5 text-xs bg-white border border-[#efefef] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0068f9] text-[#121722] placeholder:text-[#a5a5a5] resize-none"
                    />
                  </div>

                <div className="pt-3 border-t border-[#efefef] flex items-center justify-between shrink-0 mt-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="h-11 w-[100px] rounded-full border border-[#efefef] bg-white hover:bg-[#faf9f7] text-[#121722] font-medium text-xs transition-all flex items-center justify-center cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleAnalyzeMatch}
                    disabled={isLoading || isExtractingPdf || !validateStep(3)}
                    className="h-11 w-[260px] px-6 rounded-full bg-[#0068f9] hover:bg-[#024bb1] text-white font-medium text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <InlineLoader variant="spark" size={24} />
                        <span>{loadingText}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Generate match assessment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </StepperContent>
          </StepperPanel>
        </Stepper>
      )}
    </div>
  );
}
