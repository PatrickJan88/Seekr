import React, { useState, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { getEvaluations, deleteEvaluation } from '../db/evaluations';
import { CVEvaluation, JobApplication, TailoredResumeData } from '../types';
import { AgentAvatar } from './AgentAvatar';
import { KeywordHighlightPanel } from './KeywordHighlightPanel';
import { CoverLetterStudio } from './CoverLetterStudio';
import { InterviewPrepStudio } from './InterviewPrepStudio';
import { ResumeTemplateStudio } from './ResumeTemplateStudio';
import { toast } from 'sonner';

interface EvaluateHistoryPageProps {
  onBack: () => void;
  applications?: JobApplication[];
  onAddToWishlist?: (app: Partial<JobApplication>) => void;
  setNestedBreadcrumb?: (crumb: {label: string, onBack: () => void} | null) => void;
}

export function EvaluateHistoryPage({ onBack, applications = [], onAddToWishlist, setNestedBreadcrumb }: EvaluateHistoryPageProps) {
  const [evaluations, setEvaluations] = useState<CVEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<CVEvaluation | null>(null);
  const [copiedPolish, setCopiedPolish] = useState(false);

  // Studios Modal State
  const [coverLetterText, setCoverLetterText] = useState<string | null>(null);
  const [interviewGuideText, setInterviewGuideText] = useState<string | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeData | null>(null);
  const [studioTargetRole, setStudioTargetRole] = useState('');
  const [studioCompanyName, setStudioCompanyName] = useState('');

  // Generation loading states
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [isGeneratingInterviewGuide, setIsGeneratingInterviewGuide] = useState(false);
  const [isTailoringResume, setIsTailoringResume] = useState(false);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    if (!auth.currentUser) {
      // Fallback sample evaluations for unauthenticated or demo mode
      const cached = localStorage.getItem('demo_evaluations_cache');
      if (cached) {
        try {
          setEvaluations(JSON.parse(cached));
        } catch {
          setEvaluations([]);
        }
      }
      setLoading(false);
      return;
    }

    try {
      const data = await getEvaluations(auth.currentUser.uid);
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
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ringColor: '#10b981',
      textColor: 'text-emerald-700',
      label: 'High Match'
    };
    if (score >= 60) return {
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      ringColor: '#f59e0b',
      textColor: 'text-amber-700',
      label: 'Medium Match'
    };
    return {
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      ringColor: '#f43f5e',
      textColor: 'text-rose-700',
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

  // Launch Studio Actions for an evaluation
  const handleOpenCoverLetter = async (ev: CVEvaluation) => {
    const targetRole = ev.role || 'Professional Role';
    const company = ev.result?.company_name || 'Target Company';
    setStudioTargetRole(targetRole);
    setStudioCompanyName(company);

    setIsGeneratingCoverLetter(true);
    try {
      const res = await fetch('/api/generate-cover-letter', {
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
      });

      if (!res.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const data = await res.json();
      setCoverLetterText(data.coverLetter);
    } catch {
      // Fallback template
      setCoverLetterText(`Dear Hiring Team at ${company},\n\nI am writing to express my strong enthusiasm for the ${targetRole} position. With my background aligning directly with your requirements, I am confident in my ability to deliver immediate value.\n\nThroughout my career, I have cultivated deep expertise in ${ev.result?.matched_keywords?.slice(0, 3).map((k: any) => k.keyword).join(', ') || 'key engineering domains'}. I welcome the opportunity to discuss how my contributions will advance ${company}'s goals.\n\nSincerely,\nCandidate`);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleOpenInterviewGuide = async (ev: CVEvaluation) => {
    const targetRole = ev.role || 'Professional Role';
    const company = ev.result?.company_name || 'Target Company';
    setStudioTargetRole(targetRole);
    setStudioCompanyName(company);

    setIsGeneratingInterviewGuide(true);
    try {
      const res = await fetch('/api/interview-prep', {
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
      });

      if (!res.ok) {
        throw new Error('Failed to generate guide');
      }

      const data = await res.json();
      setInterviewGuideText(data.interviewGuide);
    } catch {
      // Fallback interview preparation guide
      const questionsList = (ev.result?.interview_questions || [
        `Describe a key challenge you overcame in ${targetRole}.`,
        `How do you prioritize technical trade-offs?`,
        `Walk me through your most impactful achievement.`
      ]).map((q: string, i: number) => `### Question ${i + 1}: ${q}\n**Recommended Strategy:** Use the STAR method (Situation, Task, Action, Result) highlighting quantified business impact.\n`).join('\n');

      setInterviewGuideText(`# Interview Preparation Master Guide: ${targetRole}\nTarget Company: ${company}\n\n## 1. Key Alignment Summary\n${ev.result?.actionable_polish || 'Focus on demonstrating mastery of required competencies.'}\n\n## 2. Forecasted Questions & Tactical Frameworks\n${questionsList}`);
    } finally {
      setIsGeneratingInterviewGuide(false);
    }
  };

  const handleOpenResumeStudio = async (ev: CVEvaluation) => {
    const targetRole = ev.role || 'Target Role';
    const company = ev.result?.company_name || 'Target Company';
    setStudioTargetRole(targetRole);
    setStudioCompanyName(company);

    setIsTailoringResume(true);
    try {
      const res = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          cvText: '',
          jobDescription: ev.jobDescription || '',
          companyName: company,
          trackingSystem: ev.trackingSystem || 'industry'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to tailor resume');
      }

      const data = await res.json();
      if (data.resume && data.resume.fullName) {
        setTailoredResume(data.resume);
      } else {
        throw new Error('Invalid structure');
      }
    } catch {
      const matched = (ev.result?.matched_keywords || []).map((k: any) => k.keyword);
      setTailoredResume({
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
          technical: matched.length > 0 ? matched.slice(0, 5) : ["Core Architecture", "TypeScript", "React", "System Design"],
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
      });
    } finally {
      setIsTailoringResume(false);
    }
  };

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative divide-y divide-[#efefef] overflow-y-auto custom-scrollbar">
        
        {/* Top Header / First Blank Space Header */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white">
          {selectedEval ? (
            /* Selected Evaluation Header: Left Back button with same size as Add to Wishlist, Right Add to Wishlist button */
            <div className="w-full flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setSelectedEval(null)}
                className="px-4 py-1.5 rounded-full border border-[#efefef] bg-white text-[#121722] hover:bg-[#faf9f7] text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <span>Back</span>
              </button>

              {onAddToWishlist && (
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
                  className="px-4 py-1.5 rounded-full border border-[#0068f9]/20 bg-[#e8f1ff] text-[#0068f9] hover:bg-[#d1e4ff] text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  <span>Add to Wishlist</span>
                </button>
              )}
            </div>
          ) : (
            /* Evaluations List Header: Left Disclaimer, Right Total count and New Evaluation button */
            <>
              <div className="space-y-1">
                <p className="text-xs text-[#777c86]">
                  The AI evaluator may produce results that contain mistakes. Please always review the content carefully.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-[#777c86] text-sm whitespace-nowrap font-medium pr-2">
                  Total: {evaluations.length} {evaluations.length === 1 ? 'evaluation' : 'evaluations'}
                </div>

                <button
                  type="button"
                  onClick={onBack}
                  className="px-3.5 py-1.5 rounded-full border border-[#efefef] bg-white text-[#121722] hover:bg-[#faf9f7] text-xs font-semibold transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  <span>New Evaluation</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Body Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#777c86]">
            <Loader2 size={24} className="animate-spin mb-4 text-[#0068f9]" />
            <p className="text-sm font-medium">Loading evaluation history...</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#777c86] p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#faf9f7] border border-[#efefef] flex items-center justify-center mb-4 text-[#0068f9]">
              <Sparkles size={24} />
            </div>
            <h3 className="text-[#121722] font-semibold mb-1">No evaluations yet</h3>
            <p className="text-sm text-[#777c86] max-w-sm mb-4">
              Use the AI Match Evaluator to review your CV against target job postings.
            </p>
            <button
              onClick={onBack}
              className="px-5 py-2 bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-bold rounded-full transition-all shadow-2xs cursor-pointer"
            >
              Start New Evaluation
            </button>
          </div>
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
                  <p className="text-[11px] text-[#777c86]">Tailored to role & competencies</p>
                </div>
                <button
                  onClick={() => handleOpenCoverLetter(selectedEval)}
                  disabled={isGeneratingCoverLetter}
                  className="w-full py-2 px-3 bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-semibold rounded-full transition-all flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-70"
                >
                  <span>Open Cover Letter Studio</span>
                </button>
              </div>

              <div className="bg-[#faf9f7] border border-[#efefef] hover:border-[#0068f9]/50 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#121722]">Interview Preparation</h4>
                  <p className="text-[11px] text-[#777c86]">STAR-framework tactical guide</p>
                </div>
                <button
                  onClick={() => handleOpenInterviewGuide(selectedEval)}
                  disabled={isGeneratingInterviewGuide}
                  className="w-full py-2 px-3 bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-semibold rounded-full transition-all flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-70"
                >
                  <span>Open Prep Studio</span>
                </button>
              </div>

              <div className="bg-[#faf9f7] border border-[#efefef] hover:border-[#0068f9]/50 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#121722]">4 Resume Templates</h4>
                  <p className="text-[11px] text-[#777c86]">ATS-optimized & PDF Export</p>
                </div>
                <button
                  onClick={() => handleOpenResumeStudio(selectedEval)}
                  disabled={isTailoringResume}
                  className="w-full py-2 px-3 bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-semibold rounded-full transition-all flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-70"
                >
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
                  <span className="text-xs font-bold text-[#777c86]">Score overview</span>
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
                        <span className="text-[11px] font-semibold text-[#777c86]">ATS Match rate</span>
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
                    <div className="w-7 h-7 rounded-full bg-[#e8f1ff] border border-[#0068f9]/20 flex items-center justify-center text-[#0068f9]">
                      <Sparkles size={15} />
                    </div>
                    <h4 className="text-sm font-bold text-[#121722]">Actionable bullet-point polish</h4>
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
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-[#121722]">Strongest technical alignments</h4>
                </div>
                <ul className="space-y-2">
                  {(selectedEval.result?.strengths || []).map((s: string, i: number) => (
                    <li key={i} className="text-xs text-[#121722] bg-white border border-[#efefef] rounded-xl p-2.5 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                      <span className="font-medium">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps (Col 6) */}
              <div className="md:col-span-6 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-[#efefef] pb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-[#121722]">Competency & evidence gaps</h4>
                </div>
                <ul className="space-y-2">
                  {(selectedEval.result?.gaps || []).map((g: string, i: number) => (
                    <li key={i} className="text-xs text-[#121722] bg-white border border-[#efefef] rounded-xl p-2.5 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                      <span className="font-medium">{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Forecasted Interview Questions (Col 12) */}
              {selectedEval.result?.interview_questions && selectedEval.result.interview_questions.length > 0 && (
                <div className="md:col-span-12 bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#efefef] pb-3">
                    <div className="w-7 h-7 rounded-full bg-[#f4f0ff] text-[#6736eb] flex items-center justify-center">
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
            {evaluations.map((ev) => {
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
                            <span className="px-2 py-0.5 rounded-full bg-[#faf9f7] border border-[#efefef] text-[11px] font-semibold text-[#121722] flex items-center gap-1">
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
                        <Tag size={13} className="text-[#16a34a]" />
                        <span className="text-xs font-bold text-[#121722]">Job Match Skills & Competencies:</span>
                        {totalKws > 0 && (
                          <span className="text-[11px] text-[#777c86]">
                            ({matchedKws.length}/{totalKws} ATS keywords matched)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Matched Skill Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {matchedKws.length > 0 ? (
                        matchedKws.slice(0, 6).map((kw: any, idx: number) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 text-[11px] font-semibold rounded-lg shadow-2xs"
                          >
                            <Check size={11} className="text-emerald-600" />
                            <span>{kw.keyword}</span>
                          </span>
                        ))
                      ) : (ev.result?.strengths && ev.result.strengths.length > 0) ? (
                        ev.result.strengths.slice(0, 3).map((st: string, idx: number) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#efefef] text-[#121722] text-[11px] font-medium rounded-lg"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="truncate max-w-[200px]">{st}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-[#777c86] italic">Full competency evaluation available inside.</span>
                      )}

                      {matchedKws.length > 6 && (
                        <span className="px-2 py-1 bg-white border border-[#efefef] text-[#777c86] text-[11px] font-medium rounded-lg">
                          +{matchedKws.length - 6} more skills
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive Quick Action Buttons in list card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#efefef]/60">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCoverLetter(ev);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#f4f8ff] border border-[#efefef] hover:border-[#0068f9]/30 text-[#121722] text-xs font-semibold transition-all inline-flex items-center justify-center shadow-2xs cursor-pointer"
                      >
                        <span>Cover Letter</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInterviewGuide(ev);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#f4f8ff] border border-[#efefef] hover:border-[#0068f9]/30 text-[#121722] text-xs font-semibold transition-all inline-flex items-center justify-center shadow-2xs cursor-pointer"
                      >
                        <span>Interview Prep</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenResumeStudio(ev);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#f4f8ff] border border-[#efefef] hover:border-[#0068f9]/30 text-[#121722] text-xs font-semibold transition-all inline-flex items-center justify-center shadow-2xs cursor-pointer"
                      >
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
                          className="px-3.5 py-1.5 rounded-full bg-[#f0f5ff] hover:bg-[#e0edff] text-[#0068f9] text-xs font-semibold transition-all inline-flex items-center justify-center cursor-pointer"
                        >
                          <span>Add to Wishlist</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedEval(ev)}
                      className="px-3.5 py-1.5 rounded-full bg-[#0068f9] hover:bg-[#024bb1] text-white text-xs font-bold transition-all inline-flex items-center justify-center shadow-2xs cursor-pointer ml-auto"
                    >
                      <span>View Full Assessment</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Modals for Cover Letter, Interview Prep, and Resume Templates */}
      {coverLetterText && (
        <CoverLetterStudio
          initialText={coverLetterText}
          companyName={studioCompanyName}
          targetRole={studioTargetRole}
          onClose={() => setCoverLetterText(null)}
        />
      )}

      {interviewGuideText && (
        <InterviewPrepStudio
          initialText={interviewGuideText}
          companyName={studioCompanyName}
          targetRole={studioTargetRole}
          onClose={() => setInterviewGuideText(null)}
        />
      )}

      {tailoredResume && (
        <ResumeTemplateStudio
          initialData={tailoredResume}
          targetRole={studioTargetRole}
          companyName={studioCompanyName}
          onClose={() => setTailoredResume(null)}
        />
      )}
    </div>
  );
}
