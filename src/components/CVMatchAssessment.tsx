import React, { useState } from 'react';
import { JobApplication } from '../types';
import { extractTextFromPDF, fileToBase64 } from '../lib/pdf';
import AgentAvatar from './AgentAvatar';
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
  UserCheck, 
  Briefcase, 
  ArrowRight,
  RefreshCw,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface CVMatchAssessmentProps {
  applications: JobApplication[];
  isDemo?: boolean;
}

export interface MatchResult {
  score: number;
  matchCategory: 'High Match' | 'Medium Match' | 'Low Match';
  strengths: string[];
  gaps: string[];
  actionable_polish: string;
  interview_questions: string[];
}

const TECH_ROLES = [
  { id: 'Product Manager', label: 'Product Manager', icon: '🎯', desc: 'Focus: Strategy, Roadmap, User Metrics, Agile Delivery' },
  { id: 'UX/UI Designer', label: 'UX/UI Designer', icon: '🎨', desc: 'Focus: Design Systems, Prototyping, Figma, User Research' },
  { id: 'Frontend Developer', label: 'Frontend Developer', icon: '💻', desc: 'Focus: React, TypeScript, State, Performance, CSS Architecture' },
  { id: 'Backend Developer', label: 'Backend Developer', icon: '⚙️', desc: 'Focus: APIs, Microservices, Databases, Concurrency, Scaling' },
  { id: 'Fullstack Developer', label: 'Fullstack Developer', icon: '⚡', desc: 'Focus: End-to-End Delivery, DB Schema, Frontend & Node/Python' },
  { id: 'AI Engineer', label: 'AI Engineer', icon: '🧠', desc: 'Focus: Model Tuning, PyTorch, RAG, Inference, GenAI Systems' },
  { id: 'LLM Engineer', label: 'LLM Engineer', icon: '🤖', desc: 'Focus: Prompting, Agentic Workflows, Fine-Tuning, Guardrails' },
  { id: 'Data Analyst', label: 'Data Analyst', icon: '📊', desc: 'Focus: SQL, Visualization, Funnel Metrics, Experimentation' },
  { id: 'QA Engineer', label: 'QA Engineer', icon: '🧪', desc: 'Focus: Automation, Integration Tests, CI/CD Pipelines' },
  { id: 'Systems Architect', label: 'Systems Architect', icon: '🏗️', desc: 'Focus: Distributed Infrastructure, Cloud Security, High Availability' }
];

export function CVMatchAssessment({ applications, isDemo = false }: CVMatchAssessmentProps) {
  const DEMO_RESULT: MatchResult = {
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
  const [result, setResult] = useState<MatchResult | null>(isDemo ? DEMO_RESULT : null);
  const [copiedPolish, setCopiedPolish] = useState(false);
  const [showCvTextPreview, setShowCvTextPreview] = useState(false);

  // Handle PDF Upload
  const handleFileUpload = async (file: File) => {
    if (isDemo) {
      toast.info('Demo Mode: File upload is strictly read-only in this preview.');
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
      toast.info('Demo Mode: Strictly read-only preview active.');
      setResult(DEMO_RESULT);
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

  const stepsList = [
    { step: 1, label: 'Select Evaluator', icon: UserCheck, desc: 'Target Persona' },
    { step: 2, label: 'Upload CV', icon: FileText, desc: 'PDF or Raw Text' },
    { step: 3, label: 'Job Description', icon: Briefcase, desc: 'JD Analysis' },
  ];

  const selectedRoleObj = TECH_ROLES.find(r => r.id === targetRole);

  return (
    <div className="w-full pb-12 space-y-6">
      {isDemo && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-amber-600 shrink-0" />
            <span><strong>Demo Mode (Read-Only):</strong> AI Evaluator is in demonstration mode. Pre-loaded sample AI assessment displayed with strictly read-only permissions.</span>
          </div>
          <span className="font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full text-[11px] shrink-0">Read-Only</span>
        </div>
      )}

      {/* If Result exists, show Bento Grid Overview. Else show Step Guided Workflow */}
      {result ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Bar Navigation in Results */}
          <div className="bg-white border border-[#efefef] rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AgentAvatar seed={targetRole} size={38} animated={true} />
              <div>
                <h3 className="text-sm font-bold text-[#121722] flex items-center gap-2">
                  <span>Match Analysis for {targetRole}</span>
                  <span className="text-xs font-normal text-[#777c86]">({selectedRoleObj?.icon})</span>
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
        /* STEPPER GUIDED FORM WORKFLOW - EQUAL HEIGHT CARDS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT STEPPER PROGRESS SIDEBAR (CARD 1) */}
          <div className="lg:col-span-4 bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-6 min-h-[500px]">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#121722]">
                  AI Evaluator Assessment
                </h3>
                <p className="text-xs text-[#777c86] mt-1 leading-relaxed">
                  Complete the 3 quick steps below to generate an AI domain assessment.
                </p>
              </div>

              {/* Stepper list */}
              <div className="space-y-3 relative">
                {stepsList.map((st) => {
                  const isCompleted = currentStep > st.step;
                  const isCurrent = currentStep === st.step;
                  const Icon = st.icon;

                  return (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() => {
                        if (st.step <= currentStep || validateStep(currentStep)) {
                          setCurrentStep(st.step);
                        }
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                        isCurrent
                          ? 'border-[#0068f9] bg-[#faf9f7] shadow-2xs'
                          : isCompleted
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-[#efefef] bg-[#faf9f7] hover:bg-white'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isCurrent
                            ? 'bg-[#0068f9] text-white font-bold'
                            : isCompleted
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-[#efefef] text-[#777c86]'
                        }`}
                      >
                        {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${isCurrent ? 'text-[#0068f9]' : 'text-[#121722]'}`}>
                            {st.label}
                          </p>
                          <span className="text-xs text-[#777c86] font-semibold">
                            {st.step} of 3
                          </span>
                        </div>
                        <p className="text-xs text-[#777c86] truncate mt-0.5">{st.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Selections Summary Card */}
            <div className="p-4 bg-[#faf9f7] border border-[#efefef] rounded-2xl space-y-2 text-xs mt-auto">
              <p className="font-bold text-[#121722] flex items-center justify-between">
                <span>Summary selection</span>
                <Sparkles size={14} className="text-[#0068f9]" />
              </p>
              <div className="space-y-1 text-[#777c86] text-xs">
                <p>• Role: <span className="font-semibold text-[#121722]">{targetRole || 'Not selected'}</span></p>
                <p>• CV: <span className="font-semibold text-[#121722]">{cvFile || cvText ? 'Done' : 'Not added'}</span></p>
                <p>• JD: <span className="font-semibold text-[#121722]">{jobDescription ? 'Done' : 'Not added'}</span></p>
              </div>
            </div>
          </div>

          {/* RIGHT STEP CONTENT AREA (CARD 2 - EQUAL HEIGHT) */}
          <div className="lg:col-span-8 bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col justify-between min-h-[500px] space-y-6">
            
            {/* STEP 1: SELECT AI EVALUATOR PERSONA */}
            {currentStep === 1 && (
              <div className="flex flex-col justify-between h-full space-y-5 animate-in fade-in duration-200">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[#efefef] pb-4">
                    <div>
                      <h3 className="text-base font-bold text-[#121722]">
                        Select AI Evaluator Persona
                      </h3>
                      <p className="text-xs text-[#777c86] mt-0.5">
                        Each role activates dedicated domain knowledge and evaluation criteria.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-[#faf9f7] text-[#0068f9] rounded-full border border-[#efefef]">
                      Step 1 of 3
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TECH_ROLES.map((role) => {
                      const isSelected = targetRole === role.id;
                      return (
                        <div key={role.id} className="relative group">
                          {/* Hover Popover displaying all focus content */}
                          <div className="hidden group-hover:block absolute z-30 bottom-full left-0 mb-2 w-full p-3 bg-[#121722] text-white text-xs rounded-2xl shadow-lg pointer-events-none animate-in fade-in duration-150 border border-[#efefef]/20">
                            <div className="font-bold flex items-center gap-1.5 mb-1 text-[#0068f9]">
                              <span>{role.icon}</span>
                              <span>{role.label}</span>
                            </div>
                            <p className="text-slate-200 text-xs leading-relaxed font-normal">{role.desc}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setTargetRole(role.id)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected 
                                ? 'border-[#0068f9] bg-[#faf9f7] shadow-2xs' 
                                : 'border-[#efefef] bg-white hover:border-[#a5a5a5] hover:bg-[#faf9f7]'
                            }`}
                          >
                            <div className="shrink-0 relative">
                              <AgentAvatar seed={role.id} size={42} animated={isSelected} />
                              {isSelected && (
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0068f9] text-white rounded-full flex items-center justify-center text-xs ring-2 ring-white font-bold">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-[#0068f9]' : 'text-[#121722]'}`}>
                                  {role.label}
                                </h4>
                                <span className="text-xs">{role.icon}</span>
                              </div>
                              <p className="text-xs text-[#777c86] line-clamp-1 mt-0.5">{role.desc}</p>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#efefef] flex justify-end mt-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={!validateStep(1)}
                    className="py-2.5 px-6 rounded-full bg-[#0068f9] hover:bg-[#024bb1] text-white font-medium text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#0068f9]"
                  >
                    <span>Continue to Upload CV</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: UPLOAD CV */}
            {currentStep === 2 && (
              <div className="flex flex-col justify-between h-full flex-1 space-y-5 animate-in fade-in duration-200">
                <div className="space-y-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#efefef] pb-4">
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
                    <div className="flex-1 flex flex-col justify-center">
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex-1 flex flex-col items-center justify-center min-h-[250px] ${
                          cvFile ? 'border-emerald-400 bg-emerald-50/20' : 'border-[#efefef] hover:border-[#0068f9] bg-[#faf9f7]'
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                          className="hidden"
                          id="cv-file-upload"
                        />
                        <label htmlFor="cv-file-upload" className="cursor-pointer block my-auto">
                          <div className="w-12 h-12 rounded-full bg-[#faf9f7] border border-[#efefef] text-[#0068f9] flex items-center justify-center mx-auto mb-3">
                            {isExtractingPdf ? (
                              <RefreshCw size={24} className="animate-spin text-[#0068f9]" />
                            ) : (
                              <Upload size={24} />
                            )}
                          </div>
                          {cvFile ? (
                            <div>
                              <p className="text-sm font-bold text-[#121722] flex items-center justify-center gap-1.5">
                                <FileCheck size={16} className="text-emerald-600" />
                                <span>{cvFile.name}</span>
                              </p>
                              <p className="text-xs text-[#777c86] mt-1">
                                {(cvFile.size / 1024).toFixed(1)} KB • {cvText ? `${cvText.length} characters parsed` : 'Ready'}
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
                        <div className="mt-3 text-right">
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
                              rows={5}
                              className="w-full mt-2 p-3 text-xs bg-[#faf9f7] border border-[#efefef] rounded-2xl text-[#121722] font-mono"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <textarea
                        value={cvText}
                        onChange={(e) => setCvText(e.target.value)}
                        placeholder="Paste your resume or CV experience bullet points here..."
                        className="w-full flex-1 min-h-[250px] p-3.5 text-xs bg-white border border-[#efefef] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0068f9] text-[#121722] placeholder:text-[#a5a5a5] resize-none"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#efefef] flex items-center justify-between mt-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="py-2.5 px-5 rounded-full border border-[#efefef] bg-white hover:bg-[#faf9f7] text-[#121722] font-medium text-xs transition-all cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={!validateStep(2)}
                    className="py-2.5 px-6 rounded-full bg-[#0068f9] hover:bg-[#024bb1] text-white font-medium text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Continue to Job Description</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: JOB DESCRIPTION */}
            {currentStep === 3 && (
              <div className="flex flex-col justify-between h-full flex-1 space-y-5 animate-in fade-in duration-200">
                <div className="space-y-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#efefef] pb-4">
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
                    <div className="space-y-1">
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

                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the full job description, required skills, and key responsibilities here..."
                      className="w-full flex-1 min-h-[230px] p-3.5 text-xs bg-white border border-[#efefef] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0068f9] text-[#121722] placeholder:text-[#a5a5a5] resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#efefef] flex items-center justify-between mt-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="py-2.5 px-5 rounded-full border border-[#efefef] bg-white hover:bg-[#faf9f7] text-[#121722] font-medium text-xs transition-all cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleAnalyzeMatch}
                    disabled={isLoading || isExtractingPdf || !validateStep(3)}
                    className="py-2.5 px-6 rounded-full bg-[#0068f9] hover:bg-[#024bb1] text-white font-medium text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <InlineLoader variant="spark" size={24} />
                        <span>Evaluating CV with AI...</span>
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
            )}

          </div>

        </div>
      )}
    </div>
  );
}
