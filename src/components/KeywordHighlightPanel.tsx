import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Search, Sparkles, Tag, Layers, ArrowUpRight, HelpCircle, Check, Copy } from 'lucide-react';
import { MatchedKeyword, MissingKeyword, KeywordCategory } from '../types';
import { toast } from 'sonner';

interface KeywordHighlightPanelProps {
  matchedKeywords: MatchedKeyword[];
  missingKeywords: MissingKeyword[];
  keywordScore?: number;
  overallScore: number;
}

const CATEGORIES: ('All' | KeywordCategory)[] = [
  'All',
  'Hard Skills',
  'Tools & Frameworks',
  'Domain Knowledge',
  'Soft Skills'
];

export function KeywordHighlightPanel({
  matchedKeywords = [],
  missingKeywords = [],
  keywordScore = 80,
  overallScore = 85
}: KeywordHighlightPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | KeywordCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'matched' | 'missing'>('all');

  const filteredMatched = useMemo(() => {
    return matchedKeywords.filter(k => {
      const matchCat = selectedCategory === 'All' || k.category === selectedCategory;
      const matchSearch = !searchQuery || k.keyword.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [matchedKeywords, selectedCategory, searchQuery]);

  const filteredMissing = useMemo(() => {
    return missingKeywords.filter(k => {
      const matchCat = selectedCategory === 'All' || k.category === selectedCategory;
      const matchSearch = !searchQuery || k.keyword.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [missingKeywords, selectedCategory, searchQuery]);

  const totalMatched = matchedKeywords.length;
  const totalMissing = missingKeywords.length;
  const totalKeywords = totalMatched + totalMissing;
  const matchRatio = totalKeywords > 0 ? Math.round((totalMatched / totalKeywords) * 100) : keywordScore;

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    toast.success(`Copied "${kw}" to clipboard`);
  };

  return (
    <div className="bg-white border border-[#efefef] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header & Match Score Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#efefef] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#e8f1ff] text-[#0068f9] flex items-center justify-center">
              <Tag size={16} />
            </div>
            <h4 className="text-sm font-bold text-[#121722]">
              Resume Scoring & Keyword Highlighting
            </h4>
          </div>
          <p className="text-xs text-[#777c86] mt-0.5">
            ATS keyword density and competency extraction from Resume-Matcher engine.
          </p>
        </div>

        {/* Score Pill Breakdown */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#faf9f7] border border-[#efefef] flex items-center gap-2">
            <span className="text-xs font-semibold text-[#777c86]">Keywords Matched:</span>
            <span className="text-xs font-bold text-[#0068f9]">{totalMatched}</span>
            <span className="text-xs text-[#777c86]">/ {totalKeywords}</span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#121722] text-white shadow-2xs font-semibold'
                  : 'bg-[#faf9f7] text-[#777c86] hover:bg-[#efefef] border border-[#efefef]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input & Tab Toggles */}
        <div className="flex items-center gap-2">
          <div className="relative w-44 sm:w-52">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777c86]" />
            <input
              type="text"
              placeholder="Filter keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#faf9f7] border border-[#efefef] rounded-full focus:outline-none focus:ring-2 focus:ring-[#0068f9]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#faf9f7] p-0.5 border border-[#efefef] rounded-full text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === 'all' ? 'bg-white text-[#121722] shadow-2xs' : 'text-[#777c86]'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('matched')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === 'matched' ? 'bg-white text-[#0068f9] shadow-2xs' : 'text-[#777c86]'}`}
            >
              Matched ({totalMatched})
            </button>
            <button
              onClick={() => setActiveTab('missing')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === 'missing' ? 'bg-white text-red-600 shadow-2xs' : 'text-[#777c86]'}`}
            >
              Missing ({totalMissing})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Matched and Missing Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Matched Keywords Box */}
        {(activeTab === 'all' || activeTab === 'matched') && (
          <div className="bg-[#faf9f7] border border-[#0068f9]/20 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#0068f9]" />
                <h5 className="text-xs font-bold text-[#121722]">
                  Matched in Resume ({filteredMatched.length})
                </h5>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f1ff] text-[#0068f9]">
                Verified
              </span>
            </div>

            {filteredMatched.length === 0 ? (
              <p className="text-xs text-[#777c86] italic py-2">No matched keywords found with current filter.</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {filteredMatched.map((kw, idx) => (
                  <div
                    key={idx}
                    onClick={() => copyKeyword(kw.keyword)}
                    title={kw.context || 'Matched keyword in CV'}
                    className="group px-2.5 py-1.5 bg-white border border-[#0068f9]/20 text-[#121722] rounded-xl text-xs flex items-center gap-1.5 hover:border-[#0068f9] hover:shadow-2xs transition-all cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0068f9] shrink-0"></span>
                    <span className="font-semibold text-xs">{kw.keyword}</span>
                    <span className="text-[10px] text-[#777c86] bg-[#f4f4f4] px-1.5 py-0.2 rounded font-medium">
                      {kw.category}
                    </span>
                    <Copy size={11} className="text-[#a5a5a5] opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Missing Keywords Box */}
        {(activeTab === 'all' || activeTab === 'missing') && (
          <div className="bg-[#faf9f7] border border-red-200/70 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                <h5 className="text-xs font-bold text-[#121722]">
                  Missing / Recommended Keywords ({filteredMissing.length})
                </h5>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                Add to Resume
              </span>
            </div>

            {filteredMissing.length === 0 ? (
              <p className="text-xs text-[#777c86] italic py-2">No missing keywords found for this selection.</p>
            ) : (
              <div className="space-y-2 pt-1">
                {filteredMissing.map((kw, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-red-100 rounded-xl text-xs flex flex-col gap-1 hover:border-red-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                        <span className="font-bold text-xs text-[#121722]">{kw.keyword}</span>
                        <span className="text-[10px] text-[#777c86] bg-[#f4f4f4] px-1.5 py-0.2 rounded font-medium">
                          {kw.category}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        kw.importance === 'Critical'
                          ? 'bg-red-50 text-red-700 border border-red-200/60'
                          : 'bg-[#f4f4f4] text-[#555] border border-[#e5e5e5]'
                      }`}>
                        {kw.importance}
                      </span>
                    </div>
                    {kw.suggestion && (
                      <p className="text-xs text-[#555] pl-3.5 leading-relaxed">
                        {kw.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
