import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getEvaluations } from '../db/evaluations';
import { CVEvaluation, JobApplication } from '../types';

interface EvaluateHistoryPageProps {
  onBack: () => void;
  applications?: JobApplication[];
  onAddToWishlist?: (app: Partial<JobApplication>) => void;
}

export function EvaluateHistoryPage({ onBack, applications = [], onAddToWishlist }: EvaluateHistoryPageProps) {
  const [evaluations, setEvaluations] = useState<CVEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<CVEvaluation | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    getEvaluations(auth.currentUser.uid).then((data) => {
      setEvaluations(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleBack = () => {
    if (selectedEval) {
      setSelectedEval(null);
    } else {
      onBack();
    }
  };

  const getCategoryStyles = (score: number) => {
    if (score >= 80) return {
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ringColor: 'text-emerald-500',
      textColor: 'text-emerald-700',
      label: 'High Match'
    };
    if (score >= 60) return {
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      ringColor: 'text-amber-500',
      textColor: 'text-amber-700',
      label: 'Medium Match'
    };
    return {
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      ringColor: 'text-rose-500',
      textColor: 'text-rose-700',
      label: 'Low Match'
    };
  };

  return (
    <div className="w-full h-full max-w-5xl mx-auto flex flex-col pt-6 pb-20 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-white rounded-full transition-colors flex items-center gap-2 text-[#777c86] hover:text-[#121722] border border-transparent hover:border-[#efefef] cursor-pointer"
          >
            <ArrowLeft size={20} />
            <span className="font-medium text-xs">{selectedEval ? 'Back to History' : 'Back to Dashboard'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#efefef] shadow-2xs overflow-hidden flex-1 flex flex-col divide-y divide-[#efefef]">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-[#121722] flex items-center gap-3">
              <Sparkles className="text-[#0068f9]" />
              {selectedEval ? 'Evaluation Details' : 'Evaluation History'}
            </h1>
            <p className="text-[#777c86] text-xs mt-1">
              {selectedEval ? `Reviewing assessment for ${selectedEval.role}` : 'Review your past AI assessments'}
            </p>
          </div>
          
          {selectedEval && onAddToWishlist && (
            <button
              onClick={() => {
                let company = selectedEval.result.company_name;
                if (!company) {
                  // Fallback heuristic for older history
                  const jd = selectedEval.jobDescription || '';
                  const match = jd.match(/Why\s+([A-Z][A-Za-z0-9&.-]+)\?/) || jd.match(/About\s+([A-Z][A-Za-z0-9&.-]+)/) || jd.match(/at\s+([A-Z][A-Za-z0-9&.-]+)/);
                  company = (match && match[1] && !['The', 'Us', 'Our'].includes(match[1])) ? match[1] : 'Unknown Company';
                }
                onAddToWishlist({
                  company,
                  position: selectedEval.role,
                  status: 'Wishlist',
                  notes: `Added from CV Evaluation. Score: ${selectedEval.result.score}%`,
                });
              }}
              className="px-4 py-2 rounded-full border border-[#0068f9]/20 bg-[#e8f1ff] text-[#0068f9] hover:bg-[#d1e4ff] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles size={14} />
              <span>Add to Wishlist</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#777c86]">
            <Loader2 size={24} className="animate-spin mb-4" />
            <p className="text-sm font-medium">Loading history...</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#777c86]">
            <div className="w-12 h-12 rounded-full bg-[#faf9f7] flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-[#0068f9]" />
            </div>
            <h3 className="text-[#121722] font-semibold mb-1">No evaluations yet</h3>
            <p className="text-sm text-center max-w-sm">
              Use the AI Evaluator to review your resume against job requirements.
            </p>
          </div>
        ) : selectedEval ? (
          <div className="p-6 overflow-y-auto max-h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#faf9f7] border border-[#efefef] rounded-2xl p-6 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-[#777c86] mb-4">Score overview</span>
                
                {(() => {
                  const styles = getCategoryStyles(selectedEval.result.score);
                  const strokeDasharray = 283;
                  const strokeDashoffset = strokeDasharray - (strokeDasharray * selectedEval.result.score) / 100;
                  return (
                    <div className="relative w-40 h-40 flex items-center justify-center my-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" className="text-[#f2f2f2]" strokeWidth="10" stroke="currentColor" fill="transparent" />
                        <circle cx="50" cy="50" r="42" strokeWidth="10" stroke="currentColor" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" className={`transition-all duration-1000 ease-out ${styles.ringColor}`} />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className={`text-4xl font-extrabold tracking-tight ${styles.textColor}`}>
                          {selectedEval.result.score}%
                        </span>
                      </div>
                    </div>
                  );
                })()}
                
                <span className={`mt-4 text-xs font-bold px-2.5 py-0.5 rounded-full border ${getCategoryStyles(selectedEval.result.score).badgeBg}`}>
                  {selectedEval.result.matchCategory}
                </span>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white border border-[#efefef] rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center gap-2 border-b border-[#efefef] pb-3 mb-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={14} />
                    </div>
                    <h4 className="text-xs font-bold text-[#121722]">Strengths</h4>
                  </div>
                  <ul className="space-y-2">
                    {selectedEval.result.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-[#121722] bg-[#faf9f7] rounded p-2 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white border border-[#efefef] rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center gap-2 border-b border-[#efefef] pb-3 mb-3">
                    <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                      <AlertTriangle size={14} />
                    </div>
                    <h4 className="text-xs font-bold text-[#121722]">Gaps</h4>
                  </div>
                  <ul className="space-y-2">
                    {selectedEval.result.gaps.map((g, i) => (
                      <li key={i} className="text-xs text-[#121722] bg-[#faf9f7] rounded p-2 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1"></span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-[#f4f8ff] border border-[#0068f9]/20 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-[#121722] mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-[#0068f9]" /> Actionable Polish
              </h4>
              <p className="text-xs sm:text-sm text-[#121722] leading-relaxed">
                {selectedEval.result.actionable_polish}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#efefef] overflow-y-auto max-h-full">
            {evaluations.map((ev) => (
              <div 
                key={ev.id} 
                onClick={() => setSelectedEval(ev)}
                className="p-4 sm:p-6 hover:bg-[#faf9f7] transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start cursor-pointer"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#121722]">{ev.role}</span>
                    <span className="text-xs text-[#777c86]">
                      {new Date(ev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-[#777c86] line-clamp-2">
                    {ev.jobDescription || 'No job description provided'}
                  </div>
                </div>
                
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#121722]">{ev.result.score}%</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ev.result.matchCategory === 'High Match' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ev.result.matchCategory === 'Medium Match' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {ev.result.matchCategory}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
