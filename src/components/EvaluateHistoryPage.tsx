import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  Copy, 
  Tag, 
  Building2, 
  Calendar, 
  HelpCircle, 
  FileText, 
  Trash2, 
  Layers, 
  Printer, 
  ExternalLink,
  ChevronRight,
  Info,
  Search
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { getEvaluations, deleteEvaluation, updateEvaluation } from '../db/evaluations';
import { CVEvaluation, JobApplication, TailoredResumeData } from '../types';
import { AgentAvatar } from './AgentAvatar';
import { KeywordHighlightPanel } from './KeywordHighlightPanel';
import { CoverLetterStudio } from './CoverLetterStudio';
import { InterviewPrepStudio } from './InterviewPrepStudio';
import { ResumeTemplateStudio } from './ResumeTemplateStudio';
import { toast } from 'sonner';
import { NoDataState } from './NoDataState';

interface EvaluateHistoryPageProps {
  onBack: () => void;
  applications?: JobApplication[];
  onAddToWishlist?: (app: Partial<JobApplication>) => void;
  setNestedBreadcrumb?: (crumb: {label: string, onBack: () => void} | null) => void;
  isDemo?: boolean;
}

export function EvaluateHistoryPage({ onBack, applications = [], onAddToWishlist, setNestedBreadcrumb, isDemo = false }: EvaluateHistoryPageProps) {
  const [evaluations, setEvaluations] = useState<CVEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<CVEvaluation | null>(null);
  const [copiedPolish, setCopiedPolish] = useState(false);

  // Studios Modal State with explicit mutual exclusion
  const [activeStudio, setActiveStudio] = useState<{
    type: 'cover' | 'interview' | 'resume';
    evalKey: string;
  } | null>(null);
  const activeStudioRef = useRef<{ type: 'cover' | 'interview' | 'resume'; evalKey: string } | null>(null);

  const [coverLetterText, setCoverLetterText] = useState<string | null>(null);
  const [interviewGuideText, setInterviewGuideText] = useState<string | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeData | null>(null);
  const [studioTargetRole, setStudioTargetRole] = useState('');
  const [studioCompanyName, setStudioCompanyName] = useState('');
  const [studioEvalId, setStudioEvalId] = useState<string | null>(null);

  // Search & Match Category Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCategoryFilter, setMatchCategoryFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const handleCloseStudio = () => {
    setActiveStudio(null);
    activeStudioRef.current = null;
    setCoverLetterText(null);
    setInterviewGuideText(null);
    setTailoredResume(null);
    setStudioEvalId(null);
  };

  // Cached studios per evaluation ID
  const [cachedCoverLetters, setCachedCoverLetters] = useState<Record<string, string>>({});
  const [cachedInterviewGuides, setCachedInterviewGuides] = useState<Record<string, string>>({});
  const [cachedResumes, setCachedResumes] = useState<Record<string, TailoredResumeData>>({});

  // Active loading state per eval & action
  const [loadingAction, setLoadingAction] = useState<{ evalId: string; type: 'cover' | 'interview' | 'resume' } | null>(null);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setEvaluations([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getEvaluations(uid);
      setEvaluations(data);
    } catch (err) {
      console.error('Failed to load evaluation history:', err);
      toast.error('Could not load evaluation history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEval = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isDemo) {
      toast.info('Demo Mode: Deleting evaluations is restricted in this view-only portfolio preview.');
      return;
    }
    try {
      await deleteEvaluation(id);
      setEvaluations(prev => prev.filter(ev => ev.id !== id));
      if (selectedEval?.id === id) {
        setSelectedEval(null);
      }
      toast.success('Evaluation deleted from history');
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      toast.error('Failed to delete evaluation');
    }
  };

  const getCategoryStyles = (score: number) => {
    if (score >= 80) return {
      badgeBg: 'bg-[#e8f1ff] text-[#0068f9] border-[#0068f9]/20',
      ringColor: '#0068f9',
      textColor: 'text-[#0068f9]',
      label: 'High Match'
    };
    if (score >= 60) return {
      badgeBg: 'bg-[#faf9f7] text-[#121722] border-[#efefef]',
      ringColor: '#121722',
      textColor: 'text-[#121722]',
      label: 'Medium Match'
    };
    return {
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      ringColor: '#ef4444',
      textColor: 'text-red-600',
      label: 'Low Match'
    };
  };

  const copyPolishToClipboard = (polishText: string) => {
    if (!polishText) return;
    navigator.clipboard.writeText(polishText);
    setCopiedPolish(true);
    toast.success('Actionable Polish guidelines copied to clipboard!');
    setTimeout(() => setCopiedPolish(false), 2000);
  };

  // Launch Studio Actions for an evaluation with strict activeStudio gating
  const handleOpenCoverLetter = async (ev: CVEvaluation) => {
    const targetRole = ev.role || 'Professional Role';
    const company = ev.result?.company_name || 'Target Company';
    const evalKey = ev.id || `${targetRole}-${company}`;

    setStudioEvalId(ev.id || null);
    setStudioTargetRole(targetRole);
    setStudioCompanyName(company);
    setActiveStudio({ type: 'cover', evalKey });
    activeStudioRef.current = { type: 'cover', evalKey };

    // 1. If stored in Firestore evaluation document, prioritize it
    if (ev.coverLetter) {
      setCoverLetterText(ev.coverLetter);
      setCachedCoverLetters(prev => ({ ...prev, [evalKey]: ev.coverLetter! }));
      return;
    }

    // 2. If stored in localStorage for this evaluation, prioritize it
    const localDraft = localStorage.getItem(`studio_cl_${evalKey}`) || (ev.id ? localStorage.getItem(`studio_cl_${ev.id}`) : null);
    if (localDraft && localDraft.trim().length > 10) {
      setCoverLetterText(localDraft);
      setCachedCoverLetters(prev => ({ ...prev, [evalKey]: localDraft }));
      return;
    }

    // 3. If already generated and cached in memory, open immediately
    if (cachedCoverLetters[evalKey]) {
      setCoverLetterText(cachedCoverLetters[evalKey]);
      return;
    }

    // Generate immediate high quality cover letter
    const matchedStr = ev.result?.matched_keywords?.slice(0, 3).map((k: any) => k.keyword).join(', ') || 'modern industry standards and domain expertise';
    const initialText = `Dear Hiring Team at ${company},\n\nI am writing to express my strong enthusiasm for the ${targetRole} position. With my extensive background aligning directly with your requirements, I am confident in my ability to deliver immediate, measurable value to your team.\n\nThroughout my career, I have cultivated deep expertise in ${matchedStr}. My track record demonstrates a consistent commitment to engineering excellence, scalable execution, and collaborative problem-solving. I welcome the opportunity to discuss how my background and skills will advance ${company}'s key objectives.\n\nThank you for your time and consideration.\n\nSincerely,\nCandidate`;

    setCoverLetterText(initialText);
    setCachedCoverLetters(prev => ({ ...prev, [evalKey]: initialText }));

    // Refine asynchronously in background without blocking modal
    fetch('/api/generate-cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetRole,
        cvText: '',
        jobDescription: ev.jobDescription || '',
        trackingSystem: ev.trackingSystem || 'industry',
        strengths: ev.result?.strengths || [],
        companyName: company
      })
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.coverLetter) {
          setCachedCoverLetters(prev => ({ ...prev, [evalKey]: data.coverLetter }));
          // CRITICAL: Only update displayed text if user hasn't already customized this draft
          const currentLocal = localStorage.getItem(`studio_cl_${evalKey}`) || (ev.id ? localStorage.getItem(`studio_cl_${ev.id}`) : null);
          if (activeStudioRef.current?.type === 'cover' && activeStudioRef.current?.evalKey === evalKey && (!currentLocal || currentLocal === initialText)) {
            setCoverLetterText(data.coverLetter);
          }
        }
      })
      .catch(() => {});
  };

  const handleOpenInterviewGuide = async (ev: CVEvaluation) => {
    const targetRole = ev.role || 'Professional Role';
    const company = ev.result?.company_name || 'Target Company';
    const evalKey = ev.id || `${targetRole}-${company}`;

    setStudioEvalId(ev.id || null);
    setStudioTargetRole(targetRole);
    setStudioCompanyName(company);
    setActiveStudio({ type: 'interview', evalKey });
    activeStudioRef.current = { type: 'interview', evalKey };

    // 1. If stored in Firestore evaluation document, prioritize it
    if (ev.interviewGuide) {
      setInterviewGuideText(ev.interviewGuide);
      setCachedInterviewGuides(prev => ({ ...prev, [evalKey]: ev.interviewGuide! }));
      return;
    }

    // 2. If stored in localStorage for this evaluation, prioritize it
    const localDraft = localStorage.getItem(`studio_interview_prep_${evalKey}`) || (ev.id ? localStorage.getItem(`studio_interview_prep_${ev.id}`) : null);
    if (localDraft && localDraft.trim().length > 10) {
      setInterviewGuideText(localDraft);
      setCachedInterviewGuides(prev => ({ ...prev, [evalKey]: localDraft }));
      return;
    }

    // 3. If already generated and cached in memory, open immediately
    if (cachedInterviewGuides[evalKey]) {
      setInterviewGuideText(cachedInterviewGuides[evalKey]);
      return;
    }

    // Instant interview guide
    const questionsList = (ev.result?.interview_questions || [
      `Describe a key challenge you overcame in ${targetRole}.`,
      `How do you prioritize technical trade-offs?`,
      `Walk me through your most impactful achievement.`
    ]).map((q: string, i: number) => `### Question ${i + 1}: ${q}\n**Recommended Strategy:** Use the STAR method (Situation, Task, Action, Result) highlighting quantified business impact.\n`).join('\n');

    const initialText = `# Interview Preparation Master Guide: ${targetRole}\nTarget Company: ${company}\n\n## 1. Key Alignment Summary\n${ev.result?.actionable_polish || 'Focus on demonstrating mastery of required competencies and alignment with organizational goals.'}\n\n## 2. Forecasted Questions & Tactical Frameworks\n${questionsList}`;

    setInterviewGuideText(initialText);
    setCachedInterviewGuides(prev => ({ ...prev, [evalKey]: initialText }));

    // Refine asynchronously in background
    fetch('/api/interview-prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetRole,
        cvText: '',
        jobDescription: ev.jobDescription || '',
        trackingSystem: ev.trackingSystem || 'industry',
        interviewQuestions: ev.result?.interview_questions || [],
        strengths: ev.result?.strengths || [],
        gaps: ev.result?.gaps || []
      })
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.interviewGuide) {
          setCachedInterviewGuides(prev => ({ ...prev, [evalKey]: data.interviewGuide }));
          // CRITICAL: Only update displayed text if user hasn't customized the draft
          const currentLocal = localStorage.getItem(`studio_interview_prep_${evalKey}`) || (ev.id ? localStorage.getItem(`studio_interview_prep_${ev.id}`) : null);
          if (activeStudioRef.current?.type === 'interview' && activeStudioRef.current?.evalKey === evalKey && (!currentLocal || currentLocal === initialText)) {
            setInterviewGuideText(data.interviewGuide);
          }
        }
      })
      .catch(() => {});
  };

  const handleOpenResumeStudio = async (ev: CVEvaluation) => {
    const targetRole = ev.role || 'Target Role';
    const company = ev.result?.company_name || 'Target Company';
    const evalKey = ev.id || `${targetRole}-${company}`;

    setStudioEvalId(ev.id || null);
    setStudioTargetRole(targetRole);
    setStudioCompanyName(company);
    setActiveStudio({ type: 'resume', evalKey });
    activeStudioRef.current = { type: 'resume', evalKey };

    // 1. If stored in Firestore evaluation document, prioritize it
    if (ev.tailoredResume) {
      setTailoredResume(ev.tailoredResume);
      setCachedResumes(prev => ({ ...prev, [evalKey]: ev.tailoredResume! }));
      return;
    }

    // 2. If stored in localStorage for this evaluation, prioritize it
    const localDraft = localStorage.getItem(`studio_resume_${evalKey}`) || (ev.id ? localStorage.getItem(`studio_resume_${ev.id}`) : null);
    if (localDraft) {
      try {
        const parsed = JSON.parse(localDraft);
        if (parsed && typeof parsed === 'object') {
          setTailoredResume(parsed);
          setCachedResumes(prev => ({ ...prev, [evalKey]: parsed }));
          return;
        }
      } catch (e) {}
    }

    // 3. If already generated and cached in memory, open immediately
    if (cachedResumes[evalKey]) {
      setTailoredResume(cachedResumes[evalKey]);
      return;
    }

    const matched = (ev.result?.matched_keywords || []).map((k: any) => k.keyword);
    const initialResume: TailoredResumeData = {
      fullName: "Alex Morgan",
      title: targetRole,
      contact: {
        email: "alex.morgan@example.com",
        phone: "+1 (555) 234-5678",
        location: "San Francisco, CA",
        linkedin: "linkedin.com/in/alexmorgan"
      },
      summary: `Accomplished ${targetRole} with proven background in driving high-impact initiatives and applying modern standards for ${company}.`,
      skills: {
        technical: matched.length > 0 ? matched.slice(0, 6) : ["Core Architecture", "TypeScript", "React", "System Design"],
        tools: ["Git", "Docker", "CI/CD", "Vite", "Cloud Platforms"],
        domain: ["Full Lifecycle Delivery", "Performance Optimization", "Scalable Systems"]
      },
      experience: [
        {
          role: targetRole,
          company: company !== 'Unknown Company' ? company : 'Tech Enterprise Inc.',
          period: "2022 - Present",
          bullets: [
            `Spearheaded critical engineering roadmap, accelerating key release velocity by 35%.`,
            `Architected scalable core modules adopted across distributed engineering squads.`,
            `Enhanced performance metrics and eliminated major workflow bottlenecks.`
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
    };

    // Open immediately without blocking modal view
    setCachedResumes(prev => ({ ...prev, [evalKey]: initialResume }));
    setTailoredResume(initialResume);

    // Asynchronously enhance via backend LLM if available
    fetch('/api/tailor-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetRole,
        cvText: '',
        jobDescription: ev.jobDescription || '',
        companyName: company,
        trackingSystem: ev.trackingSystem || 'industry'
      })
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.resume && data.resume.fullName) {
          setCachedResumes(prev => ({ ...prev, [evalKey]: data.resume }));
          // CRITICAL: Only update displayed text if user hasn't already edited the resume
          const currentLocal = localStorage.getItem(`studio_resume_${evalKey}`) || (ev.id ? localStorage.getItem(`studio_resume_${ev.id}`) : null);
          if (activeStudioRef.current?.type === 'resume' && activeStudioRef.current?.evalKey === evalKey && !currentLocal) {
            setTailoredResume(data.resume);
          }
        }
      })
      .catch(() => {});
  };

  // Auto-Save handlers for studios: update local state, local cache, and persist to Firestore
  const handleSaveCoverLetter = useCallback((savedText: string) => {
    setCoverLetterText(savedText);
    const key = activeStudio?.evalKey || studioEvalId;
    if (key) {
      setCachedCoverLetters(prev => ({ ...prev, [key]: savedText }));
      try {
        localStorage.setItem(`studio_cl_${key}`, savedText);
      } catch {}
    }
    if (studioEvalId) {
      setEvaluations(prev => prev.map(ev => ev.id === studioEvalId ? { ...ev, coverLetter: savedText } : ev));
      if (selectedEval?.id === studioEvalId) {
        setSelectedEval(prev => prev ? { ...prev, coverLetter: savedText } : null);
      }
      updateEvaluation(studioEvalId, { coverLetter: savedText }).catch(err => {
        console.error('Failed to update cover letter in evaluation:', err);
      });
    }
  }, [activeStudio?.evalKey, studioEvalId, selectedEval?.id]);

  const handleSaveInterviewGuide = useCallback((savedText: string) => {
    setInterviewGuideText(savedText);
    const key = activeStudio?.evalKey || studioEvalId;
    if (key) {
      setCachedInterviewGuides(prev => ({ ...prev, [key]: savedText }));
      try {
        localStorage.setItem(`studio_interview_prep_${key}`, savedText);
      } catch {}
    }
    if (studioEvalId) {
      setEvaluations(prev => prev.map(ev => ev.id === studioEvalId ? { ...ev, interviewGuide: savedText } : ev));
      if (selectedEval?.id === studioEvalId) {
        setSelectedEval(prev => prev ? { ...prev, interviewGuide: savedText } : null);
      }
      updateEvaluation(studioEvalId, { interviewGuide: savedText }).catch(err => {
        console.error('Failed to update interview guide in evaluation:', err);
      });
    }
  }, [activeStudio?.evalKey, studioEvalId, selectedEval?.id]);

  const handleSaveResume = useCallback((savedData: TailoredResumeData) => {
    setTailoredResume(savedData);
    const key = activeStudio?.evalKey || studioEvalId;
    if (key) {
      setCachedResumes(prev => ({ ...prev, [key]: savedData }));
      try {
        localStorage.setItem(`studio_resume_${key}`, JSON.stringify(savedData));
      } catch {}
    }
    if (studioEvalId) {
      setEvaluations(prev => prev.map(ev => ev.id === studioEvalId ? { ...ev, tailoredResume: savedData } : ev));
      if (selectedEval?.id === studioEvalId) {
        setSelectedEval(prev => prev ? { ...prev, tailoredResume: savedData } : null);
      }
      updateEvaluation(studioEvalId, { tailoredResume: savedData }).catch(err => {
        console.error('Failed to update resume in evaluation:', err);
      });
    }
  }, [activeStudio?.evalKey, studioEvalId, selectedEval?.id]);

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative divide-y divide-[#efefef] overflow-y-auto custom-scrollbar">
        
        {/* Top Header / Header Controls with unified h-[38px] heights */}
        <div className="p-4 sm:p-5 flex flex-col gap-3 shrink-0 bg-white">
          {selectedEval ? (
            /* Selected Evaluation Header: Left Back button with same size as Add to Wishlist, Middle AI disclaimer, Right Add to Wishlist button */
            <div className="w-full flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setSelectedEval(null)}
                className="h-[38px] px-4 rounded-full border border-[#efefef] bg-white text-[#121722] hover:bg-[#faf9f7] text-sm font-medium transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <span>Back</span>
              </button>

              <p className="hidden md:flex items-center gap-1.5 text-xs text-[#777c86] text-center">
                <Info size={14} className="shrink-0 text-[#a5a5a5]" />
                AI evaluations may contain inaccuracies; always review the results.
              </p>

              {onAddToWishlist ? (
                <button
                  type="button"
                  onClick={() => {
                    let company = selectedEval.result?.company_name;
                    if (!company || company === 'Unknown Company') {
                      const jd = selectedEval.jobDescription || '';
                      const match = jd.match(/Why\s+([A-Z][A-Za-z0-9&.-]+)\?/) || jd.match(/About\s+([A-Z][A-Za-z0-9&.-]+)/) || jd.match(/at\s+([A-Z][A-Za-z0-9&.-]+)/);
                      company = (match && match[1] && !['The', 'Us', 'Our'].includes(match[1])) ? match[1] : 'Unknown Company';
                    }
                    const finalScore = selectedEval.result?.keyword_score ?? selectedEval.result?.score ?? 0;
                    onAddToWishlist({
                      company,
                      position: selectedEval.role,
                      status: 'Wishlist',
                      notes: `Added from CV Evaluation. ATS Match: ${finalScore}%`,
                    });
                  }}
                  className="h-[38px] px-4 rounded-full border border-[#0068f9]/20 bg-[#e8f1ff] text-[#0068f9] hover:bg-[#d1e4ff] text-sm font-semibold transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  <span>Add to Wishlist</span>
                </button>
              ) : (
                <div className="w-16" />
              )}
            </div>
          ) : (
            /* Evaluations List Header: Filter Buttons, Search Box, Counter, New Evaluation button (all matching h-[38px]) */
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Left: Filter Buttons matching Active Progress / Closed / Wishlist */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-[#faf9f7] p-1 rounded-full border border-[#efefef] shadow-2xs overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setMatchCategoryFilter('all')}
                    className={`h-[38px] flex items-center justify-center px-4 rounded-full font-medium text-sm transition-all cursor-pointer whitespace-nowrap ${
                      matchCategoryFilter === 'all'
                        ? 'bg-white text-[#121722] shadow-2xs'
                        : 'text-[#777c86] hover:text-[#121722]'
                    }`}
                  >
                    All
                    {evaluations.length > 0 && (
                      <span className="ml-1.5 text-xs text-[#777c86] font-normal">
                        ({evaluations.length})
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchCategoryFilter('high')}
                    className={`h-[38px] flex items-center justify-center px-4 rounded-full font-medium text-sm transition-all cursor-pointer whitespace-nowrap ${
                      matchCategoryFilter === 'high'
                        ? 'bg-white text-[#121722] shadow-2xs'
                        : 'text-[#777c86] hover:text-[#121722]'
                    }`}
                  >
                    High Match
                    {evaluations.filter(ev => (ev.result?.keyword_score ?? ev.result?.score ?? 0) >= 80).length > 0 && (
                      <span className="ml-1.5 text-xs text-[#777c86] font-normal">
                        ({evaluations.filter(ev => (ev.result?.keyword_score ?? ev.result?.score ?? 0) >= 80).length})
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchCategoryFilter('medium')}
                    className={`h-[38px] flex items-center justify-center px-4 rounded-full font-medium text-sm transition-all cursor-pointer whitespace-nowrap ${
                      matchCategoryFilter === 'medium'
                        ? 'bg-white text-[#121722] shadow-2xs'
                        : 'text-[#777c86] hover:text-[#121722]'
                    }`}
                  >
                    Medium Match
                    {evaluations.filter(ev => {
                      const s = ev.result?.keyword_score ?? ev.result?.score ?? 0;
                      return s >= 60 && s < 80;
                    }).length > 0 && (
                      <span className="ml-1.5 text-xs text-[#777c86] font-normal">
                        ({evaluations.filter(ev => {
                          const s = ev.result?.keyword_score ?? ev.result?.score ?? 0;
                          return s >= 60 && s < 80;
                        }).length})
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchCategoryFilter('low')}
                    className={`h-[38px] flex items-center justify-center px-4 rounded-full font-medium text-sm transition-all cursor-pointer whitespace-nowrap ${
                      matchCategoryFilter === 'low'
                        ? 'bg-white text-[#121722] shadow-2xs'
                        : 'text-[#777c86] hover:text-[#121722]'
                    }`}
                  >
                    Low Match
                    {evaluations.filter(ev => (ev.result?.keyword_score ?? ev.result?.score ?? 0) < 60).length > 0 && (
                      <span className="ml-1.5 text-xs text-[#777c86] font-normal">
                        ({evaluations.filter(ev => (ev.result?.keyword_score ?? ev.result?.score ?? 0) < 60).length})
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Middle & Right: Search Box, Counter & New Evaluation Button */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[140px] sm:min-w-[180px] max-w-sm flex items-center">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a5a5a5]" size={15} />
                    <input
                      type="text"
                      placeholder="Search evaluations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 h-[38px] bg-white border border-[#efefef] rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0068f9] transition-all shadow-2xs hover:bg-[#faf9f7] truncate placeholder:font-normal placeholder:text-[#a5a5a5]"
                    />
                  </div>
                </div>

                <div className="text-[#777c86] text-xs sm:text-sm whitespace-nowrap font-medium hidden sm:inline">
                  {evaluations.filter(ev => {
                    const role = (ev.role || '').toLowerCase();
                    const company = (ev.result?.company_name || '').toLowerCase();
                    const q = searchQuery.toLowerCase().trim();
                    if (q && !role.includes(q) && !company.includes(q)) return false;
                    if (matchCategoryFilter !== 'all') {
                      const score = ev.result?.keyword_score ?? ev.result?.score ?? 0;
                      if (matchCategoryFilter === 'high' && score < 80) return false;
                      if (matchCategoryFilter === 'medium' && (score < 60 || score >= 80)) return false;
                      if (matchCategoryFilter === 'low' && score >= 60) return false;
                    }
                    return true;
                  }).length} evaluations
                </div>

                {evaluations.length > 0 && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-[38px] px-4 rounded-full border border-[#efefef] bg-white text-[#121722] hover:bg-[#faf9f7] text-sm font-medium transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
                  >
                    <span>New Evaluation</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Disclaimer subheader */}
        {!selectedEval && (
          <div className="px-5 py-2 bg-[#faf9f7]/60 flex items-center gap-1.5 text-xs text-[#777c86]">
            <Info size={13} className="shrink-0 text-[#a5a5a5]" />
            <span>AI evaluations may contain inaccuracies; always review the results.</span>
          </div>
        )}

        {/* Body Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#777c86]">
            <Loader2 size={24} className="animate-spin mb-4 text-[#0068f9]" />
            <p className="text-sm font-medium">Loading evaluation history...</p>
          </div>
        ) : evaluations.length === 0 ? (
          <NoDataState
            icon="/icons/crunch.svg"
            title="No data available"
            description="Use the AI Match Evaluator to review your CV against target job postings."
            actionText="Start New Evaluation"
            onAction={onBack}
          />
        ) : selectedEval ? (
          /* DETAILED EVALUATION VIEW */
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-full animate-in fade-in duration-200">
            
            {/* Target Header Banner */}
            <div className="bg-[#faf9f7] border border-[#efefef] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AgentAvatar seed={selectedEval.role} size={40} animated={true} />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-[#121722]">{selectedEval.role}</h4>
                    {selectedEval.result?.company_name && selectedEval.result.company_name !== 'Unknown Company' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#efefef] text-[11px] font-semibold text-[#121722]">
                        {selectedEval.result.company_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#777c86] mt-0.5 flex items-center gap-2">
                    <span>Evaluated on {new Date(selectedEval.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedEval.trackingSystem || 'Industry'} Lens</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getCategoryStyles(selectedEval.result?.score || 0).badgeBg}`}>
                  {selectedEval.result?.matchCategory || getCategoryStyles(selectedEval.result?.score || 0).label}
                </span>
              </div>
            </div>

            {/* Quick Action Studio Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#faf9f7] border border-[#efefef] hover:border-[#0068f9]/50 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#121722]">Cover Letter Generator</h4>
                  <p className="text-xs text-[#777c86]">Tailored to role & competencies</p>
                </div>
                <button
                  onClick={() => handleOpenCoverLetter(selectedEval)}
                  disabled={loadingAction?.evalId === (selectedEval.id || `${selectedEval.role}-${selectedEval.result?.company_name}`)}
                  className="w-full py-2 px-3 bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-70"
                >
                  {loadingAction?.evalId === (selectedEval.id || `${selectedEval.role}-${selectedEval.result?.company_name}`) && loadingAction.type === 'cover' && (
                    <Loader2 size={13} className="animate-spin" />
                  )}
                  <span>Open Cover Letter Studio</span>
                </button>
              </div>

              <div className="bg-[#faf9f7] border border-[#efefef] hover:border-[#0068f9]/50 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#121722]">Interview Preparation</h4>
                  <p className="text-xs text-[#777c86]">STAR-framework tactical guide</p>
                </div>
                <button
                  onClick={() => handleOpenInterviewGuide(selectedEval)}
                  disabled={loadingAction?.evalId === (selectedEval.id || `${selectedEval.role}-${selectedEval.result?.company_name}`)}
                  className="w-full py-2 px-3 bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-70"
                >
                  {loadingAction?.evalId === (selectedEval.id || `${selectedEval.role}-${selectedEval.result?.company_name}`) && loadingAction.type === 'interview' && (
                    <Loader2 size={13} className="animate-spin" />
                  )}
                  <span>Open Prep Studio</span>
                </button>
              </div>

              <div className="bg-[#faf9f7] border border-[#efefef] hover:border-[#0068f9]/50 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#121722]">4 Resume Templates</h4>
                  <p className="text-xs text-[#777c86]">ATS-optimized & PDF Export</p>
                </div>
                <button
                  onClick={() => handleOpenResumeStudio(selectedEval)}
                  disabled={loadingAction?.evalId === (selectedEval.id || `${selectedEval.role}-${selectedEval.result?.company_name}`)}
                  className="w-full py-2 px-3 bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-70"
                >
                  {loadingAction?.evalId === (selectedEval.id || `${selectedEval.role}-${selectedEval.result?.company_name}`) && loadingAction.type === 'resume' && (
                    <Loader2 size={13} className="animate-spin" />
                  )}
                  <span>Tailor & Export Resume</span>
                </button>
              </div>
            </div>

            {/* Keyword Highlighting & ATS Scoring Panel */}
            <KeywordHighlightPanel
              matchedKeywords={selectedEval.result?.matched_keywords || []}
              missingKeywords={selectedEval.result?.missing_keywords || []}
              keywordScore={selectedEval.result?.keyword_score ?? selectedEval.result?.score ?? 75}
              overallScore={selectedEval.result?.keyword_score ?? selectedEval.result?.score ?? 75}
            />

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Score Ring (Col 4) */}
              <div className="md:col-span-4 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 flex flex-col items-center justify-between text-center">
                <div className="w-full flex items-center justify-between border-b border-[#efefef] pb-3 mb-4">
                  <h4 className="text-xs font-bold text-[#121722]">Score overview</h4>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getCategoryStyles(selectedEval.result?.keyword_score ?? selectedEval.result?.score ?? 0).badgeBg}`}>
                    {selectedEval.result?.matchCategory || getCategoryStyles(selectedEval.result?.keyword_score ?? selectedEval.result?.score ?? 0).label}
                  </span>
                </div>

                {(() => {
                  const score = selectedEval.result?.keyword_score ?? selectedEval.result?.score ?? 0;
                  const styles = getCategoryStyles(score);
                  const strokeDasharray = 283;
                  const strokeDashoffset = strokeDasharray - (strokeDasharray * score) / 100;
                  return (
                    <div className="relative w-36 h-36 flex items-center justify-center my-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" className="text-[#f2f2f2]" strokeWidth="10" stroke="currentColor" fill="transparent" />
                        <circle cx="50" cy="50" r="42" strokeWidth="10" stroke={styles.ringColor} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" className="transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className={`text-3xl font-black ${styles.textColor}`}>
                          {score}%
                        </span>
                        <span className="text-xs font-semibold text-[#777c86]">ATS Match rate</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4 pt-4 border-t border-[#efefef] w-full flex items-center justify-center gap-2">
                  <AgentAvatar seed={selectedEval.role} size={24} />
                  <span className="text-xs font-bold text-[#121722]">{selectedEval.role}</span>
                </div>
              </div>

              {/* Actionable Polish (Col 8) */}
              <div className="md:col-span-8 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#e8f1ff] text-[#0068f9] flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                    <h4 className="text-xs font-bold text-[#121722]">Actionable bullet-point polish</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyPolishToClipboard(selectedEval.result?.actionable_polish || '')}
                    className="text-xs font-medium text-[#121722] bg-white hover:bg-[#faf9f7] border border-[#efefef] shadow-2xs px-3.5 py-1.5 rounded-full transition-all flex items-center justify-center cursor-pointer"
                  >
                    <span>{copiedPolish ? 'Copied' : 'Copy guidelines'}</span>
                  </button>
                </div>

                <div className="bg-[#f4f8ff] border border-[#0068f9]/20 rounded-2xl p-4 text-[#121722] text-xs sm:text-sm leading-relaxed">
                  {selectedEval.result?.actionable_polish || 'No polish notes available.'}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#777c86] font-medium">
                  <Info size={14} className="text-[#0068f9]" />
                  <span>Reframe basic task descriptions into high-impact metric accomplishments.</span>
                </div>
              </div>

              {/* Strongest Technical Alignments (Col 6) */}
              <div className="md:col-span-6 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-[#efefef] pb-3">
                  <div className="w-6 h-6 rounded-full bg-[#e8f1ff] text-[#0068f9] flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-[#121722]">Strongest technical alignments</h4>
                </div>
                <ul className="space-y-2">
                  {(selectedEval.result?.strengths || []).map((s: string, i: number) => (
                    <li key={i} className="text-xs text-[#121722] bg-white border border-[#efefef] rounded-xl p-2.5 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0068f9] shrink-0 mt-1.5"></span>
                      <span className="font-medium text-xs">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps (Col 6) - Warning / Reminder Box in Minimal Red */}
              <div className="md:col-span-6 bg-[#faf9f7] border border-red-200/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-red-100 pb-3">
                  <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                    <AlertTriangle size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-[#121722]">Competency & evidence gaps</h4>
                </div>
                <ul className="space-y-2">
                  {(selectedEval.result?.gaps || []).map((g: string, i: number) => (
                    <li key={i} className="text-xs text-[#121722] bg-white border border-red-100 rounded-xl p-2.5 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5"></span>
                      <span className="font-medium text-xs">{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Forecasted Interview Questions (Col 12) */}
              {selectedEval.result?.interview_questions && selectedEval.result.interview_questions.length > 0 && (
                <div className="md:col-span-12 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#efefef] pb-3">
                    <div className="w-7 h-7 rounded-full bg-[#e8f1ff] text-[#0068f9] flex items-center justify-center">
                      <HelpCircle size={17} />
                    </div>
                    <h4 className="text-xs font-bold text-[#121722]">
                      Forecasted {selectedEval.role} interview questions
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedEval.result.interview_questions.map((q: string, idx: number) => (
                      <div key={idx} className="bg-white border border-[#efefef] rounded-2xl p-4 space-y-2 hover:border-[#0068f9]/40 transition-all">
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
              )}

            </div>
          </div>
        ) : (
          /* EVALUATIONS LIST VIEW */
          <div className="divide-y divide-[#efefef] overflow-y-auto max-h-full">
            {(() => {
              const filteredList = evaluations.filter(ev => {
                const role = (ev.role || '').toLowerCase();
                const company = (ev.result?.company_name || '').toLowerCase();
                const q = searchQuery.toLowerCase().trim();
                if (q && !role.includes(q) && !company.includes(q)) return false;

                if (matchCategoryFilter !== 'all') {
                  const score = ev.result?.keyword_score ?? ev.result?.score ?? 0;
                  if (matchCategoryFilter === 'high' && score < 80) return false;
                  if (matchCategoryFilter === 'medium' && (score < 60 || score >= 80)) return false;
                  if (matchCategoryFilter === 'low' && score >= 60) return false;
                }

                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <Search size={28} className="text-[#a5a5a5]" />
                    <p className="text-sm font-semibold text-[#121722]">No evaluations match your filters</p>
                    <p className="text-xs text-[#777c86]">
                      {searchQuery ? `No results found for "${searchQuery}"` : 'No evaluations in this score category'}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setMatchCategoryFilter('all'); }}
                      className="h-[38px] px-4 rounded-full border border-[#efefef] bg-white text-[#121722] hover:bg-[#faf9f7] text-sm font-medium transition-all shadow-2xs cursor-pointer mt-2"
                    >
                      Clear Filters
                    </button>
                  </div>
                );
              }

              return filteredList.map((ev) => {
                const score = ev.result?.keyword_score ?? ev.result?.score ?? 0;
                const styles = getCategoryStyles(score);
                const matchedKws = ev.result?.matched_keywords || [];
                const missingKws = ev.result?.missing_keywords || [];
                const totalKws = matchedKws.length + missingKws.length;
                const company = ev.result?.company_name || 'Target Role Assessment';

                return (
                  <div 
                    key={ev.id} 
                    onClick={() => setSelectedEval(ev)}
                    className="p-5 sm:p-6 hover:bg-[#faf9f7]/60 transition-colors flex flex-col gap-4 cursor-pointer group"
                  >
                    {/* Top Bar of the Card: Role, Company, Date, Score */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        <AgentAvatar seed={ev.role} size={36} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#121722] group-hover:text-[#0068f9] transition-colors">
                              {ev.role}
                            </span>
                            {ev.result?.company_name && ev.result.company_name !== 'Unknown Company' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#faf9f7] border border-[#efefef] text-xs font-semibold text-[#121722] flex items-center gap-1">
                                <Building2 size={11} className="text-[#777c86]" />
                                <span>{ev.result.company_name}</span>
                              </span>
                            )}
                            <span className="text-xs text-[#777c86] flex items-center gap-1">
                              <Calendar size={11} />
                              <span>{new Date(ev.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                          <p className="text-xs text-[#777c86] mt-0.5 line-clamp-1">
                            {ev.jobDescription?.slice(0, 120) || 'Job Description attached'}...
                          </p>
                        </div>
                      </div>

                      {/* Score badge & Delete */}
                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className={`text-xl font-black ${styles.textColor}`}>{score}%</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.badgeBg}`}>
                            {ev.result?.matchCategory || styles.label}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteEval(e, ev.id)}
                          className="p-2 text-[#a5a5a5] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                          title="Delete Evaluation"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Job Match Skills Section & Analysis Chips */}
                    <div className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-3.5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Tag size={13} className="text-[#0068f9]" />
                          <span className="text-xs font-bold text-[#121722]">Job Match Skills & Competencies:</span>
                          {totalKws > 0 && (
                            <span className="text-xs text-[#777c86]">
                              ({matchedKws.length}/{totalKws} ATS keywords matched)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Matched Skill Pills (All unified with primary blue span) */}
                      <div className="flex flex-wrap gap-1.5">
                        {matchedKws.length > 0 ? (
                          matchedKws.slice(0, 6).map((kw: any, idx: number) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e8f1ff] border border-[#0068f9]/20 text-[#0068f9] text-xs font-semibold rounded-lg shadow-2xs"
                            >
                              <Check size={11} className="text-[#0068f9]" />
                              <span>{kw.keyword}</span>
                            </span>
                          ))
                        ) : (ev.result?.strengths && ev.result.strengths.length > 0) ? (
                          ev.result.strengths.slice(0, 3).map((st: string, idx: number) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e8f1ff] border border-[#0068f9]/20 text-[#0068f9] text-xs font-medium rounded-lg"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0068f9]"></span>
                              <span className="truncate max-w-[200px]">{st}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#777c86] italic">Full competency evaluation available inside.</span>
                        )}

                        {matchedKws.length > 6 && (
                          <span className="px-2.5 py-1 bg-white border border-[#efefef] text-[#777c86] text-xs font-medium rounded-lg">
                            +{matchedKws.length - 6} more skills
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interactive Quick Action Buttons in list card - vertically centered and balanced */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-[#efefef]/80 mt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCoverLetter(ev);
                          }}
                          disabled={loadingAction?.evalId === (ev.id || `${ev.role}-${ev.result?.company_name}`)}
                          className="h-[34px] px-3.5 rounded-full bg-white hover:bg-[#f4f8ff] border border-[#efefef] hover:border-[#0068f9]/30 text-[#121722] text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-70"
                        >
                          {loadingAction?.evalId === (ev.id || `${ev.role}-${ev.result?.company_name}`) && loadingAction.type === 'cover' && (
                            <Loader2 size={12} className="animate-spin text-[#0068f9]" />
                          )}
                          <span>Cover Letter</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInterviewGuide(ev);
                          }}
                          disabled={loadingAction?.evalId === (ev.id || `${ev.role}-${ev.result?.company_name}`)}
                          className="h-[34px] px-3.5 rounded-full bg-white hover:bg-[#f4f8ff] border border-[#efefef] hover:border-[#0068f9]/30 text-[#121722] text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-70"
                        >
                          {loadingAction?.evalId === (ev.id || `${ev.role}-${ev.result?.company_name}`) && loadingAction.type === 'interview' && (
                            <Loader2 size={12} className="animate-spin text-[#0068f9]" />
                          )}
                          <span>Interview Prep</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenResumeStudio(ev);
                          }}
                          disabled={loadingAction?.evalId === (ev.id || `${ev.role}-${ev.result?.company_name}`)}
                          className="h-[34px] px-3.5 rounded-full bg-white hover:bg-[#f4f8ff] border border-[#efefef] hover:border-[#0068f9]/30 text-[#121722] text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-70"
                        >
                          {loadingAction?.evalId === (ev.id || `${ev.role}-${ev.result?.company_name}`) && loadingAction.type === 'resume' && (
                            <Loader2 size={12} className="animate-spin text-[#0068f9]" />
                          )}
                          <span>Resume Studio</span>
                        </button>

                        {onAddToWishlist && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToWishlist({
                                company: ev.result?.company_name || 'Target Company',
                                position: ev.role,
                                status: 'Wishlist',
                                notes: `Added from Evaluation History. ATS Match: ${score}%`,
                              });
                            }}
                            className="h-[34px] px-3.5 rounded-full bg-[#f0f5ff] hover:bg-[#e0edff] text-[#0068f9] text-xs font-semibold transition-all inline-flex items-center justify-center cursor-pointer"
                          >
                            <span>Add to Wishlist</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedEval(ev)}
                        className="h-[34px] px-4 rounded-full bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-bold transition-all inline-flex items-center justify-center shadow-2xs cursor-pointer ml-auto sm:ml-0"
                      >
                        <span>Full Assessment</span>
                      </button>
                    </div>

                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Mutually Exclusive Modals: Only render the currently active studio */}
      {activeStudio?.type === 'cover' && coverLetterText && (
        <CoverLetterStudio
          initialText={coverLetterText}
          companyName={studioCompanyName}
          targetRole={studioTargetRole}
          onClose={handleCloseStudio}
          onSave={handleSaveCoverLetter}
          storageKey={studioEvalId ? `studio_cl_${studioEvalId}` : `studio_cl_${activeStudio.evalKey}`}
        />
      )}

      {activeStudio?.type === 'interview' && interviewGuideText && (
        <InterviewPrepStudio
          initialText={interviewGuideText}
          companyName={studioCompanyName}
          targetRole={studioTargetRole}
          onClose={handleCloseStudio}
          onSave={handleSaveInterviewGuide}
          storageKey={studioEvalId ? `studio_interview_prep_${studioEvalId}` : `studio_interview_prep_${activeStudio.evalKey}`}
        />
      )}

      {activeStudio?.type === 'resume' && tailoredResume && (
        <ResumeTemplateStudio
          initialData={tailoredResume}
          targetRole={studioTargetRole}
          companyName={studioCompanyName}
          onClose={handleCloseStudio}
          onSave={handleSaveResume}
          storageKey={studioEvalId ? `studio_resume_${studioEvalId}` : `studio_resume_${activeStudio.evalKey}`}
        />
      )}
    </div>
  );
}
