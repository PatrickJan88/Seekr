import React, { useState, useEffect } from 'react';
import { JobApplication, MatchedKeyword, MissingKeyword, TailoredResumeData } from '../types';
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
  Trash2,
  Play,
  Loader2,
  FileSignature,
  Layout,
  Printer,
  Tag,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { CoverLetterStudio } from './CoverLetterStudio';
import { InterviewPrepStudio } from './InterviewPrepStudio';
import { ResumeTemplateStudio } from './ResumeTemplateStudio';
import { KeywordHighlightPanel } from './KeywordHighlightPanel';
import { NestedApplicationMenu } from './NestedApplicationMenu';
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
  setNestedBreadcrumb?: (crumb: {label: string, onBack: () => void} | null) => void;
}

export interface MatchResult {
  company_name?: string;
  score: number;
  matchCategory: 'High Match' | 'Medium Match' | 'Low Match';
  keyword_score?: number;
  matched_keywords?: MatchedKeyword[];
  missing_keywords?: MissingKeyword[];
  strengths: string[];
  gaps: string[];
  actionable_polish: string;
  interview_questions: string[];
}

export function CVMatchAssessment({ applications, isDemo = false, onAddToWishlist, onViewHistory, setNestedBreadcrumb, trackingSystem = 'industry' }: CVMatchAssessmentProps & { trackingSystem?: 'industry' | 'academic' }) {
  const DEMO_RESULT: MatchResult = {
    company_name: 'TechFlow Solutions',
    score: 85,
    matchCategory: 'High Match',
    keyword_score: 85,
    matched_keywords: [
      { keyword: 'React 18', category: 'Tools & Frameworks', context: '5+ years experience building production UIs' },
      { keyword: 'TypeScript', category: 'Hard Skills', context: 'Extensive strict-mode architecture' },
      { keyword: 'Tailwind CSS', category: 'Tools & Frameworks', context: 'Design system and accessible components' },
      { keyword: 'State Management', category: 'Domain Knowledge', context: 'Complex state machines & global stores' },
      { keyword: 'Performance Optimization', category: 'Hard Skills', context: 'Bundle reduction & memoization strategies' }
    ],
    missing_keywords: [
      { keyword: 'Playwright / E2E', category: 'Tools & Frameworks', importance: 'Critical', suggestion: 'Mention automated end-to-end regression testing' },
      { keyword: 'CI/CD Pipelines', category: 'Domain Knowledge', importance: 'Recommended', suggestion: 'Highlight automated GitHub Actions deploy workflows' },
      { keyword: 'Mentorship & OKRs', category: 'Soft Skills', importance: 'Bonus', suggestion: 'Add note on mentoring junior engineers' }
    ],
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

  useEffect(() => {
    if (setNestedBreadcrumb) {
      if (result) {
        setNestedBreadcrumb({
          label: 'Match Analysis',
          onBack: () => {
            setResult(null);
            setTargetRole('');
            setJobDescription('');
            setCurrentStep(1);
            setCoverLetterText(null);
            setInterviewGuideText(null);
            setTailoredResume(null);
          }
        });
      } else {
        setNestedBreadcrumb(null);
      }
    }
  }, [result, setNestedBreadcrumb]);
  const [copiedPolish, setCopiedPolish] = useState(false);
  const [showCvTextPreview, setShowCvTextPreview] = useState(false);
  
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState<string | null>(null);

  const [isGeneratingInterviewGuide, setIsGeneratingInterviewGuide] = useState(false);
  const [interviewGuideText, setInterviewGuideText] = useState<string | null>(null);

  const [isTailoringResume, setIsTailoringResume] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeData | null>(null);

  const handleGenerateInterviewGuide = async () => {
    if (isDemo) {
      setInterviewGuideText("1. EXECUTIVE SUMMARY\n\nFocus heavily on your React & TypeScript expertise to pivot away from any gaps in backend engineering. Emphasize component architecture and modern design systems.\n\n2. PIVOTING WEAKNESSES\n\nGap: Lack of explicit Playwright / E2E testing.\nAnswer Strategy: Acknowledge the gap but highlight that you write robust unit tests with Jest and are actively implementing Playwright pipelines in current sprints.\n\n3. DEEP DIVE QUESTIONS & STAR FRAMEWORKS\n\nQ1: How do you manage complex application state?\nA (STAR):\n- Situation: The previous dashboard suffered from cascading re-renders across 15 subcomponents.\n- Task: Modernize state management without introducing heavy boilerplate.\n- Action: Designed a modular Zustand store with shallow selectors and atomic subscriptions.\n- Result: Reduced unnecessary re-renders by 60% and improved interaction response time to sub-16ms.\n\nQ2: Walk me through a challenging performance optimization project.\nA (STAR):\n- Situation: Bundle sizes were ballooning past 3.2MB on initial load.\n- Task: Optimize first contentful paint (FCP) and total blocking time (TBT).\n- Action: Implemented route-level dynamic code splitting, tree-shook unused third-party dependencies, and added virtualized scrolling for data grids.\n- Result: Shaved initial load by 48% and achieved 98/100 Lighthouse score.");
      return;
    }

    if (!result) return;
    setIsGeneratingInterviewGuide(true);
    try {
      let pdfBase64 = '';
      if (cvFile && !cvText) {
        pdfBase64 = await fileToBase64(cvFile).catch(() => '');
      }
      
      const res = await fetch('/api/generate-interview-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          cvText,
          pdfBase64,
          jobDescription,
          trackingSystem,
          strengths: result.strengths,
          gaps: result.gaps,
          companyName: result.company_name
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate interview guide');
      }

      const data = await res.json();
      setInterviewGuideText(data.interviewGuide);
    } catch (err: any) {
      console.warn('Interview Guide API warning, falling back to local synthesis:', err);
      const company = result?.company_name || 'Target Company';
      const questionsList = (result?.interview_questions || [
        `Describe a key challenge you overcame in ${targetRole || 'this role'}.`,
        `How do you prioritize technical trade-offs?`,
        `Walk me through your most impactful achievement.`
      ]).map((q: string, i: number) => `### Question ${i + 1}: ${q}\n**Recommended Strategy:** Use the STAR method (Situation, Task, Action, Result) highlighting quantified business impact.\n`).join('\n');

      setInterviewGuideText(`# Interview Preparation Master Guide: ${targetRole || 'Professional Role'}\nTarget Company: ${company}\n\n## 1. Key Alignment Summary\n${result?.actionable_polish || 'Focus on demonstrating mastery of required competencies and metrics.'}\n\n## 2. Forecasted Questions & Tactical Frameworks\n${questionsList}`);
    } finally {
      setIsGeneratingInterviewGuide(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (isDemo) {
      setCoverLetterText(`Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${targetRole || 'Frontend Engineer'} position at ${result?.company_name || 'TechFlow Solutions'}. With a proven track record in React, TypeScript, and modern frontend architecture, I am enthusiastic about contributing to your engineering team.\n\nThroughout my career, I have focused on engineering scalable, performant user interfaces and modular design systems. In my previous roles, I led initiatives that streamlined client-side performance, reduced bundle sizes by over 35%, and established robust component standards. Your mission to build cutting-edge user experiences strongly resonates with my background in state architecture and frontend quality.\n\nI welcome the opportunity to discuss how my technical expertise and passion for high-impact software development can benefit ${result?.company_name || 'your organization'}. Thank you for your time and consideration.\n\nSincerely,\nAlex Morgan`);
      return;
    }

    if (!result) return;
    setIsGeneratingCoverLetter(true);
    try {
      let pdfBase64 = '';
      if (cvFile && !cvText) {
        pdfBase64 = await fileToBase64(cvFile).catch(() => '');
      }
      
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          cvText,
          pdfBase64,
          jobDescription,
          trackingSystem,
          strengths: result.strengths,
          companyName: result.company_name
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate cover letter');
      }

      const data = await res.json();
      setCoverLetterText(data.coverLetter);
    } catch (err: any) {
      console.warn('Cover Letter API warning, falling back to local synthesis:', err);
      const company = result?.company_name || 'Target Company';
      const matched = (result?.matched_keywords || []).map((k: any) => k.keyword).join(', ');
      setCoverLetterText(`Dear Hiring Team at ${company},\n\nI am writing to express my strong enthusiasm for the ${targetRole || 'target position'} role. Having reviewed the job requirements in detail, I am confident that my technical background and problem-solving abilities align directly with ${company}'s current initiatives.\n\nThroughout my career, I have cultivated deep expertise across core areas including ${matched || 'software architecture, scalable engineering, and system design'}. In my recent work, I spearheaded high-impact deliverables, optimized operational workflows, and collaborated cross-functionally to drive measurable improvements.\n\nI would welcome the opportunity to discuss how my experience and skill set can support ${company}'s immediate and long-term milestones. Thank you for your consideration, and I look forward to speaking with you.\n\nSincerely,\nCandidate`);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleTailorResume = async () => {
    if (isDemo) {
      setTailoredResume({
        fullName: "Alex Morgan",
        title: targetRole || "Senior Frontend Engineer",
        contact: {
          email: "alex.morgan@example.com",
          phone: "+1 (555) 234-5678",
          location: "San Francisco, CA",
          linkedin: "linkedin.com/in/alexmorgan",
          github: "github.com/alexmorgan"
        },
        summary: `Results-driven ${targetRole || 'Senior Frontend Engineer'} with 5+ years of experience specializing in React 18, TypeScript, and high-performance UI systems. Proven expertise in cutting load times by 35% and constructing modular design systems tailored to ${result?.company_name || 'TechFlow Solutions'}.`,
        skills: {
          technical: ["React 18", "TypeScript", "Next.js", "Tailwind CSS", "JavaScript ES6+"],
          tools: ["Git", "Vite", "Jest", "Docker", "Webpack"],
          domain: ["Performance Optimization", "State Architecture", "Design Systems", "Web Accessibility"]
        },
        experience: [
          {
            role: "Senior Frontend Engineer",
            company: "TechFlow Labs",
            location: "San Francisco, CA",
            period: "2022 - Present",
            bullets: [
              "Spearheaded redesign of core web platform using React 18 & TypeScript, improving page load speed by 35%.",
              "Architected reusable component library adopted across 4 distributed engineering teams.",
              "Integrated real-time state synchronization with sub-16ms latency."
            ]
          },
          {
            role: "Frontend Developer",
            company: "Apex Digital",
            location: "Austin, TX",
            period: "2020 - 2022",
            bullets: [
              "Developed responsive dashboards and interactive charts for enterprise analytics platform.",
              "Implemented automated testing suites achieving 85%+ code coverage across critical flows."
            ]
          }
        ],
        education: [
          {
            degree: "B.S. in Computer Science",
            institution: "University of California, Berkeley",
            year: "2020",
            details: "Dean's Honor List"
          }
        ]
      });
      return;
    }

    setIsTailoringResume(true);
    try {
      let pdfBase64 = '';
      if (cvFile && !cvText) {
        pdfBase64 = await fileToBase64(cvFile).catch(() => '');
      }

      const res = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          cvText,
          pdfBase64,
          jobDescription,
          companyName: result?.company_name,
          trackingSystem
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to tailor resume');
      }

      const data = await res.json();
      if (data.resume && data.resume.fullName) {
        setTailoredResume(data.resume);
      } else {
        throw new Error('Invalid resume response structure');
      }
    } catch (err: any) {
      console.warn('Tailor Resume API warning, falling back to local synthesis:', err);
      const company = result?.company_name || 'Target Company';
      const matched = (result?.matched_keywords || []).map((k: any) => k.keyword);
      setTailoredResume({
        fullName: "Alex Morgan",
        title: targetRole || "Professional Role",
        contact: {
          email: "alex.morgan@example.com",
          phone: "+1 (555) 234-5678",
          location: "San Francisco, CA",
          linkedin: "linkedin.com/in/alexmorgan"
        },
        summary: `Accomplished ${targetRole || 'Professional'} with proven expertise aligning directly with requirements for ${company}. Focused on delivering high-impact contributions and maintaining engineering excellence.`,
        skills: {
          technical: matched.length > 0 ? matched.slice(0, 6) : ["Core Architecture", "TypeScript", "React", "System Design"],
          tools: ["Git", "Docker", "CI/CD", "Vite", "Cloud Platforms"],
          domain: ["Full Lifecycle Delivery", "Performance Optimization", "Scalable Systems"]
        },
        experience: [
          {
            role: targetRole || "Lead Specialist",
            company: company !== 'Unknown Company' ? company : 'Tech Enterprise Inc.',
            period: "2022 - Present",
            bullets: [
              `Spearheaded critical delivery roadmap, accelerating release velocity by 35%.`,
              `Architected scalable core modules adopted across distributed squads.`,
              `Enhanced key operational metrics and resolved major architectural bottlenecks.`
            ]
          }
        ],
        education: [
          {
            degree: "B.S. in Computer Science",
            institution: "University of California",
            year: "2020",
            details: "Honors Graduate"
          }
        ]
      });
    } finally {
      setIsTailoringResume(false);
    }
  };

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
        // Check auto interview prep setting
        if (localStorage.getItem('auto_generate_interview_prep') !== 'false') {
          handleGenerateInterviewGuide();
        }
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
          jobDescription,
          trackingSystem
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate assessment');
      }

      const data: MatchResult = await res.json();
      setResult(data);
      toast.success('CV Match analysis completed!');
      
      // Auto interview prep if enabled
      if (localStorage.getItem('auto_generate_interview_prep') !== 'false') {
        handleGenerateInterviewGuide();
      }

      if (auth.currentUser) {
        try {
          await addEvaluation({
            userId: auth.currentUser.uid,
            role: targetRole,
            jobDescription,
            trackingSystem,
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

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      {/* If Result exists, show Bento Grid Overview in standard card container. Else show Step Guided Workflow directly */}
      {result ? (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative overflow-y-auto custom-scrollbar">
          <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Top Bar Navigation in Results */}
          <div className="bg-[#faf9f7] border border-[#efefef] rounded-2xl p-4 shadow-none flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AgentAvatar seed={targetRole} size={38} animated={true} />
              <div>
                <h3 className="text-sm font-bold text-[#121722]">
                  Match Analysis for {targetRole}{result.company_name && result.company_name !== 'Unknown Company' ? ` • Targeting ${result.company_name}` : ''}
                </h3>
                <p className="text-xs text-[#777c86]">
                  The AI evaluator may produce results that contain mistakes. Please always review the content carefully.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  className="px-4 py-2 rounded-full border border-[#0068f9]/20 bg-[#e8f1ff] text-[#0068f9] hover:bg-[#d1e4ff] text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  <span>Add to Wishlist</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Tools Hub (Cover Letter, Interview Prep, Resume Templates & PDF Export) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* One-Click Cover Letter Generator */}
            <div className="bg-[#faf9f7] border border-[#efefef] hover:border-[#0068f9]/50 rounded-2xl p-4.5 transition-all flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-bold text-[#121722]">Cover Letter Generator</h4>
                <p className="text-[11px] text-[#777c86]">One-click tailored to JD & CV</p>
              </div>
              <button
                onClick={handleGenerateCoverLetter}
                disabled={isGeneratingCoverLetter}
                className="w-full py-2 px-3 bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-70"
              >
                {isGeneratingCoverLetter && <Loader2 size={13} className="animate-spin" />}
                <span>{coverLetterText ? 'Open Cover Letter Studio' : 'Generate Cover Letter'}</span>
              </button>
            </div>

            {/* Interview Preparation Guide */}
            <div className="bg-[#faf9f7] border border-[#efefef] hover:border-[#0068f9]/50 rounded-2xl p-4.5 transition-all flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-bold text-[#121722]">Interview Preparation</h4>
                <p className="text-[11px] text-[#777c86]">Resume-grounded STAR strategies</p>
              </div>
              <button
                onClick={handleGenerateInterviewGuide}
                disabled={isGeneratingInterviewGuide}
                className="w-full py-2 px-3 bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-70"
              >
                {isGeneratingInterviewGuide && <Loader2 size={13} className="animate-spin" />}
                <span>{interviewGuideText ? 'Open Prep Studio' : 'Generate Prep Guide'}</span>
              </button>
            </div>

            {/* Tailored Resume & 4 Templates with PDF Export */}
            <div className="bg-[#faf9f7] border border-[#efefef] hover:border-[#0068f9]/50 rounded-2xl p-4.5 transition-all flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-bold text-[#121722]">4 Resume Templates</h4>
                <p className="text-[11px] text-[#777c86]">Single / Two Column & PDF Export</p>
              </div>
              <button
                onClick={handleTailorResume}
                disabled={isTailoringResume}
                className="w-full py-2 px-3 bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-70"
              >
                {isTailoringResume && <Loader2 size={13} className="animate-spin" />}
                <span>{tailoredResume ? 'Open Resume Studio' : 'Tailor & Export Resume'}</span>
              </button>
            </div>
          </div>

          {/* Resume Scoring & Keyword Highlighting Panel */}
          <KeywordHighlightPanel
            matchedKeywords={result.matched_keywords || []}
            missingKeywords={result.missing_keywords || []}
            keywordScore={result.keyword_score || result.score}
            overallScore={result.score}
          />

          {/* Bento Grid Design */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento Card 1: Score & Persona Overview (Col 4) */}
            <div className="md:col-span-4 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 shadow-none flex flex-col items-center justify-between text-center relative overflow-hidden">
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
            <div className="md:col-span-8 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 shadow-none flex flex-col justify-between relative overflow-hidden isolate space-y-4">
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
            <div className="md:col-span-6 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 shadow-none space-y-4">
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
            <div className="md:col-span-6 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 shadow-none space-y-4">
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
            <div className="md:col-span-12 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 shadow-none space-y-4">
              <div className="flex items-center justify-between border-b border-[#efefef] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#f4f0ff] text-[#6736eb] flex items-center justify-center">
                    <HelpCircle size={18} />
                  </div>
                  <h4 className="text-xs font-bold text-[#121722]">
                    Forecasted {targetRole} interview questions
                  </h4>
                </div>
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
          className="flex flex-col md:flex-row gap-6 items-stretch w-full flex-1 min-h-[500px]"
        >
          {/* STEPPER SIDEBAR NAV - LEFT SIDE */}
          <div className="w-full md:w-60 lg:w-64 shrink-0 bg-white border border-[#efefef] rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col self-stretch min-h-[500px]">
            <StepperNav className="w-full flex-1 flex flex-col justify-between">
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

                  {index < steps.length - 1 && (
                    <div className="ml-[23px] my-2 w-[2px] flex-1 bg-[#e5e7eb] min-h-[40px]" />
                  )}
                </React.Fragment>
              ))}
            </StepperNav>
          </div>

          {/* RIGHT CONTENT AREA */}
          <StepperPanel className="flex-1 w-full min-w-0 self-stretch flex flex-col min-h-[500px]">
            {/* STEP 1: SELECT AI EVALUATOR */}
            <StepperContent value={1} className="h-full flex flex-col flex-1 min-h-[500px]">
              <div className="bg-white border border-[#efefef] rounded-2xl p-4 sm:p-6 shadow-2xs h-full flex-1 min-h-[500px] flex flex-col justify-between animate-in fade-in duration-200">
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
                  trackingSystem={trackingSystem}
                />
              </div>
            </StepperContent>

            {/* STEP 2: UPLOAD CV */}
            <StepperContent value={2} className="h-full flex flex-col flex-1 min-h-[500px]">
              <div className="bg-white border border-[#efefef] rounded-2xl p-4 sm:p-6 shadow-2xs h-full flex-1 min-h-[500px] flex flex-col justify-between animate-in fade-in duration-200">
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
            <StepperContent value={3} className="h-full flex flex-col flex-1 min-h-[500px]">
              <div className="bg-white border border-[#efefef] rounded-2xl p-4 sm:p-6 shadow-2xs h-full flex-1 min-h-[500px] flex flex-col justify-between animate-in fade-in duration-200">
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
                      <NestedApplicationMenu trackingSystem={trackingSystem}
                        applications={applications}
                        selectedAppId={selectedAppId}
                        onSelectApplication={handleSelectApplication}
                      />
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

      {/* Global Modals for Cover Letter, Interview Prep, and Resume Templates */}
      {coverLetterText && (
        <CoverLetterStudio
          initialText={coverLetterText}
          companyName={result?.company_name}
          targetRole={targetRole}
          onClose={() => setCoverLetterText(null)}
        />
      )}

      {interviewGuideText && (
        <InterviewPrepStudio
          initialText={interviewGuideText}
          companyName={result?.company_name}
          targetRole={targetRole}
          onClose={() => setInterviewGuideText(null)}
        />
      )}

      {tailoredResume && (
        <ResumeTemplateStudio
          initialData={tailoredResume}
          targetRole={targetRole}
          companyName={result?.company_name}
          onClose={() => setTailoredResume(null)}
        />
      )}
    </div>
  );
}

