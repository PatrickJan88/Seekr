import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Globe, 
  Search, 
  Sparkles, 
  Loader2, 
  Check, 
  Copy, 
  Download, 
  ExternalLink, 
  ChevronRight, 
  Trash2, 
  Languages, 
  Printer, 
  PlusCircle, 
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Link2,
  CheckCircle2,
  RefreshCw,
  Layers,
  Info
} from 'lucide-react';
import { CompanyTeardownData, JobApplication } from '../types';
import { HeadcountTrendChart } from './HeadcountTrendChart';
import { auth } from '../lib/firebase';
import { getSavedTeardowns, saveTeardown, deleteSavedTeardown, SavedTeardownRecord } from '../db/teardowns';
import { jsonrepair } from 'jsonrepair';
import { toast } from 'sonner';
import { 
  findBestCompanyHomepageUrl, 
  classifyLink, 
  ClassifiedLink, 
  normalizeHttpUrl,
  isAtsOrJobPostingUrl
} from '../lib/linkUtils';

interface CompanyIntelligenceStudioProps {
  applications?: JobApplication[];
  onAddToWishlist?: (app: Partial<JobApplication>) => void;
  initialCompanyName?: string;
  initialWebsiteUrl?: string;
  isDemo?: boolean;
}

const PRESET_COMPANIES = [
  { name: 'Linear', url: 'https://linear.app' },
  { name: 'Stripe', url: 'https://stripe.com' },
  { name: 'Figma', url: 'https://figma.com' },
  { name: 'Notion', url: 'https://notion.so' },
  { name: 'Supabase', url: 'https://supabase.com' },
  { name: 'Mistral AI', url: 'https://mistral.ai' }
];

interface UrlVerificationState {
  isVerifying: boolean;
  verified: boolean;
  isAts: boolean;
  suggestedHomepage?: string;
  domain?: string;
  title?: string;
}

export const CompanyIntelligenceStudio: React.FC<CompanyIntelligenceStudioProps> = ({
  applications = [],
  onAddToWishlist,
  initialCompanyName = '',
  initialWebsiteUrl = '',
  isDemo = false
}) => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'history'>('explorer');
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);
  
  const [isLoading, setIsLoading] = useState(false);
  const [streamingRawJson, setStreamingRawJson] = useState("");
  const [currentTeardown, setCurrentTeardown] = useState<CompanyTeardownData | null>(null);

  // Classified links for currently selected app/target
  const [candidateLinks, setCandidateLinks] = useState<ClassifiedLink[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Link verification state
  const [verification, setVerification] = useState<UrlVerificationState>({
    isVerifying: false,
    verified: false,
    isAts: false
  });

  // History state
  const [savedRecords, setSavedRecords] = useState<SavedTeardownRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [auth.currentUser]);

  // If initial props are passed, auto-run or inspect
  useEffect(() => {
    if (initialCompanyName || initialWebsiteUrl) {
      setCompanyName(initialCompanyName);
      setWebsiteUrl(initialWebsiteUrl);
      verifyAndSetUrl(initialWebsiteUrl, initialCompanyName);
      handleGenerate(initialCompanyName, initialWebsiteUrl);
    }
  }, [initialCompanyName, initialWebsiteUrl]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const userId = auth.currentUser?.uid || 'guest_user';
    try {
      const records = await getSavedTeardowns(userId);
      setSavedRecords(records);
    } catch (e) {
      console.log('Error loading saved teardowns:');
    } finally {
      setLoadingHistory(false);
    }
  };

  /**
   * Intelligently selects a job application and verifies candidate links
   * Prioritizes the verified authentic official company homepage (never blindly picks links[0])
   */
  const handleSelectApp = (app: JobApplication) => {
    const name = app.company || '';
    setSelectedAppId(app.id);
    setCompanyName(name);

    // Verify all candidate links from the application
    const { bestUrl, classified } = findBestCompanyHomepageUrl(app.links, app.companyUrl, name);
    setCandidateLinks(classified);

    if (bestUrl) {
      setWebsiteUrl(bestUrl);
      verifyAndSetUrl(bestUrl, name);
    } else {
      setWebsiteUrl('');
      setVerification({ isVerifying: false, verified: false, isAts: false });
    }

    toast.info(`Selected ${name} — authentic company homepage resolved.`);
  };

  /**
   * Calls server verification endpoint to verify canonical homepage
   */
  const verifyAndSetUrl = async (urlToVerify: string, compName: string) => {
    if (!urlToVerify && !compName) return;

    setVerification(prev => ({ ...prev, isVerifying: true }));
    try {
      const resp = await fetch('/api/verify-company-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToVerify, companyName: compName })
      });

      if (resp.ok) {
        const data = await resp.json();
        setVerification({
          isVerifying: false,
          verified: true,
          isAts: data.isAtsPortal,
          suggestedHomepage: data.suggestedHomepage,
          domain: data.domain,
          title: data.title
        });

        // If the URL was a clean redirect to canonical homepage (e.g. teamtailor.com -> https://www.teamtailor.com/en-us/), update it
        if (data.verifiedUrl && data.isOfficialHomepage && data.verifiedUrl !== urlToVerify) {
          setWebsiteUrl(data.verifiedUrl);
        }
      } else {
        setVerification({
          isVerifying: false,
          verified: false,
          isAts: isAtsOrJobPostingUrl(urlToVerify, compName)
        });
      }
    } catch (e) {
      setVerification({
        isVerifying: false,
        verified: false,
        isAts: isAtsOrJobPostingUrl(urlToVerify, compName)
      });
    }
  };

  const handleUrlChange = (val: string) => {
    setWebsiteUrl(val);
    if (val.trim().length > 7) {
      // Re-classify candidate
      const isAts = isAtsOrJobPostingUrl(val, companyName);
      setVerification({
        isVerifying: false,
        verified: false,
        isAts
      });
    } else {
      setVerification({ isVerifying: false, verified: false, isAts: false });
    }
  };

  const handleGenerate = async (overrideName?: string, overrideUrl?: string) => {
    const targetName = (overrideName !== undefined ? overrideName : companyName).trim();
    let targetUrl = (overrideUrl !== undefined ? overrideUrl : websiteUrl).trim();

    if (!targetName && !targetUrl) {
      toast.error('Please enter a company name or website URL');
      return;
    }

    // If targetUrl is an ATS portal and a verified suggested homepage exists, offer the clean one
    if (verification.isAts && verification.suggestedHomepage) {
      targetUrl = verification.suggestedHomepage;
      setWebsiteUrl(targetUrl);
    }

    setIsLoading(true);
    try {
      
      // Switch to streaming endpoint
      
      setStreamingRawJson("");
      const resp = await fetch('/api/company-teardown/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: targetName,
          websiteUrl: targetUrl
        })
      });

      if (!resp.ok) {
        throw new Error('Failed to generate company analysis');
      }

      if (!resp.body) throw new Error('ReadableStream not supported');

      
      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let rawJsonStr = '';
      let metaData: any = {};
      
      setActiveTab('explorer');
      
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last line in the buffer as it might be incomplete
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: [DONE]')) {
             // force break
             break;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.error) {
                console.log("Stream reported error:");
                continue;
              }
              if (data.meta) {
                 metaData = { ...metaData, ...data.meta };
                 if (data.meta.reset) {
                    rawJsonStr = '';
                 }
              }
              if (data.text) {
                 rawJsonStr += data.text;
                 setStreamingRawJson(rawJsonStr);
              }
            } catch(e) {
               console.log("Error parsing SSE line:", line);
            }
          }
        }
      }

      // Final parse check
      let finalTeardown: CompanyTeardownData | null = null;
      try {
        finalTeardown = JSON.parse(jsonrepair(rawJsonStr));
      } catch (e) {
        throw new Error("Stream returned invalid or incomplete data.");
      }
      
      if (finalTeardown) {
         if (metaData.ogImage && !finalTeardown.ogImage) finalTeardown.ogImage = metaData.ogImage;
         if (metaData.logoUrl && !finalTeardown.logoUrl) finalTeardown.logoUrl = metaData.logoUrl;
         finalTeardown.generatedAt = Date.now();
         setCurrentTeardown(finalTeardown);
         
         const userId = auth.currentUser?.uid || 'guest_user';
         try {
           const saved = await saveTeardown(userId, finalTeardown);
           setSavedRecords(prev => [saved, ...prev.filter(r => r.id !== saved.id)]);
         } catch (saveErr) {
           console.log('Save teardown warning:');
         }
      }
toast.success('Company intelligence teardown ready!');
    } catch (err: any) {
      console.log('Teardown generate error:');
      const message = err?.message === 'Failed to fetch' 
        ? ('Network request timed out, please try again')
        : (err?.message || 'Failed to generate company analysis');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = auth.currentUser?.uid || 'guest_user';
    try {
      await deleteSavedTeardown(id, userId);
      setSavedRecords(prev => prev.filter(r => r.id !== id));
      if (selectedRecordId === id) {
        setSelectedRecordId(null);
      }
      toast.success('Deleted from history');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportPdf = () => {
    if (!currentTeardown) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups in your browser to print or export PDF.');
      return;
    }

    const t = currentTeardown;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t.companyName} - Intelligence Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; line-height: 1.5; padding: 40px; max-width: 850px; margin: 0 auto; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { margin: 0 0 10px 0; color: #121722; font-size: 28px; }
          .meta { font-size: 14px; color: #525866; display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-bottom: 15px; }
          .meta span { background: #f4f4f5; padding: 4px 10px; border-radius: 6px; border: 1px solid #efefef; }
          .tagline { font-style: italic; font-size: 16px; color: #333; }
          h2 { font-size: 20px; color: #121722; border-bottom: 1px solid #efefef; padding-bottom: 8px; margin-top: 40px; }
          h3 { font-size: 16px; color: #121722; margin-top: 25px; }
          p, li { font-size: 14px; color: #333; margin-bottom: 8px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .card { border: 1px solid #efefef; padding: 16px; border-radius: 8px; background: #faf9f7; break-inside: avoid; }
          .card h3 { margin-top: 0; color: #0068f9; font-size: 15px; }
          ul { padding-left: 20px; margin-top: 8px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background: #e8f1ff; color: #0068f9; border: 1px solid #cce0ff; margin-bottom: 10px; }
          @media print {
            body { padding: 0; }
            .card { border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t.companyName} Intelligence Teardown</h1>
          <div class="meta">
            <span><strong>URL:</strong> <a href="${t.websiteUrl}" target="_blank" style="color: inherit;">${t.websiteUrl}</a></span>
            <span><strong>Industry:</strong> ${t.industry}</span>
            <span><strong>HQ:</strong> ${t.headquarters || 'N/A'}</span>
            <span><strong>Founded:</strong> ${t.foundedYear || 'N/A'}</span>
          </div>
          <div class="tagline">"${t.tagline}"</div>
        </div>

        <h2>1. Fiscal Report & Business Health</h2>
        <div class="grid-2">
          <div class="card">
            <h3>Investment Metrics</h3>
            <ul>
              <li><strong>Funding Stage:</strong> ${t.fiscal.fundingStage}</li>
              <li><strong>Total Funding:</strong> ${t.fiscal.totalFunding}</li>
              <li><strong>Lead Investors:</strong> ${t.fiscal.leadInvestors?.join(', ')}</li>
              <li><strong>Valuation / Market Cap:</strong> ${t.fiscal.valuationOrMarketCap}</li>
            </ul>
          </div>
          <div class="card">
            <h3>Revenue & Pricing</h3>
            <ul>
              <li><strong>Estimated ARR:</strong> ${t.fiscal.arrEstimate}</li>
              <li><strong>Business Model:</strong> ${t.fiscal.businessModel}</li>
              <li><strong>Pricing Gate:</strong> ${t.fiscal.pricingGate}</li>
            </ul>
          </div>
        </div>
        <div class="card" style="margin-top: 20px;">
          <strong>Capital Efficiency Insight:</strong> ${t.fiscal.fiscalSummary}
        </div>

        <h2>2. Headcount Dynamics (LinkedIn Insights)</h2>
        <div class="card">
          <div class="badge">Hiring Signal: ${t.headcount.hiringSignal}</div>
          <ul>
            <li><strong>Current Headcount:</strong> ${t.headcount.currentHeadcount} (MoM: ${t.headcount.monthChangePct}%)</li>
            <li><strong>1-Year Growth:</strong> ${t.headcount.oneYearGrowthPct}%</li>
            <li><strong>2-Year Growth:</strong> ${t.headcount.twoYearGrowthPct}%</li>
          </ul>
          <p style="margin-top: 15px;"><strong>Analysis:</strong> ${t.headcount.growthAnalysis}</p>
        </div>

        <h2>3. The Core Loop (Flywheel Spine)</h2>
        <div class="card" style="margin-bottom: 20px;"><strong>Spine Summary:</strong> ${t.coreLoop.spineSummary}</div>
        <div class="grid-2">
          ${t.coreLoop.steps.map(s => `
            <div class="card">
              <h3>Step ${s.step}: ${s.title}</h3>
              <p><strong>Description:</strong> ${s.description}</p>
              <p><strong>Mechanism:</strong> ${s.mechanism}</p>
            </div>
          `).join('')}
        </div>

        <h2>4. AI Placement Spectrum</h2>
        <div class="card">
          <div class="badge">Tier: ${t.aiSpectrum.tier}</div>
          <p><strong>Headline:</strong> ${t.aiSpectrum.headline}</p>
          <p><strong>Rationale:</strong> ${t.aiSpectrum.defendedRationale}</p>
          <h3 style="margin-top: 15px;">Grounded Evidence:</h3>
          <ul>
            ${t.aiSpectrum.evidence.map(e => `<li>${e}</li>`).join('')}
          </ul>
        </div>

        <h2>5. SWOT Matrix</h2>
        <div class="grid-2">
          <div class="card">
            <h3>Strengths</h3>
            <ul>${t.swot.strengths.map(s => `<li><strong>${s.point}:</strong> ${s.detail}</li>`).join('')}</ul>
          </div>
          <div class="card">
            <h3>Weaknesses</h3>
            <ul>${t.swot.weaknesses.map(w => `<li><strong>${w.point}:</strong> ${w.detail}</li>`).join('')}</ul>
          </div>
          <div class="card">
            <h3>Opportunities</h3>
            <ul>${t.swot.opportunities.map(o => `<li><strong>${o.point}:</strong> ${o.detail}</li>`).join('')}</ul>
          </div>
          <div class="card">
            <h3>Threats</h3>
            <ul>${t.swot.threats.map(th => `<li><strong>${th.point}:</strong> ${th.detail}</li>`).join('')}</ul>
          </div>
        </div>

        <h2>6. Strategic Interview & Pitch Kit</h2>
        <div class="grid-2">
          <div class="card">
            <h3>Strategic Pitches</h3>
            <ul>${t.interviewKit.strategicPitches.map(p => `
              <li style="margin-bottom: 12px;">
                <strong>${p.title}:</strong> ${p.proposal}<br>
                <em>Rationale: ${p.rationale}</em>
              </li>
            `).join('')}</ul>
          </div>
          <div class="card">
            <h3>Reverse Questions</h3>
            <ul>${t.interviewKit.reverseQuestions.map(q => `
              <li style="margin-bottom: 12px;">
                <strong>To ${q.targetPersona}:</strong> "${q.question}"<br>
                <em>Why it works: ${q.whyItWorks}</em>
              </li>
            `).join('')}</ul>
          </div>
        </div>
        ${t.interviewKit.criticalKpisToMention && t.interviewKit.criticalKpisToMention.length > 0 ? `
          <div class="card" style="margin-top: 20px;">
            <h3>Critical KPIs to Mention</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              ${t.interviewKit.criticalKpisToMention.map(kpi => `<span style="background: #e8f1ff; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: bold;">${kpi}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Find matching application for one-click add
  const matchedApp = applications.find(a => 
    a.company.toLowerCase() === (currentTeardown?.companyName || '').toLowerCase()
  );

  const renderTabSwitcher = () => (
    <div className="flex items-center gap-1 bg-[#faf9f7] p-1 border border-[#efefef] rounded-full text-xs font-medium shrink-0">
      <button
        onClick={() => setActiveTab('explorer')}
        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
          activeTab === 'explorer' 
            ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' 
            : 'text-[#777c86] hover:text-[#121722] border border-transparent'
        }`}
      >
        {'Teardown'}
      </button>
      <button
        onClick={() => setActiveTab('history')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
          activeTab === 'history' 
            ? 'bg-white text-[#121722] shadow-2xs font-bold border border-[#efefef]' 
            : 'text-[#777c86] hover:text-[#121722] border border-transparent'
        }`}
      >
        <span>{'History'}</span>
        {savedRecords.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-blue-100 text-[10px] flex items-center justify-center font-bold text-blue-700 border border-blue-200">
            {savedRecords.length}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <div className="w-full flex-1 flex flex-col gap-6 pb-16 font-sans">
      {activeTab === 'explorer' ? (
        <>
          {/* Input & Search Section */}
          <div className="bg-white border border-[#efefef] rounded-2xl p-5 shadow-2xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#efefef]">
              <div>
                <h3 className="text-base font-bold text-[#121722]">
                  {'Analyze any company\'s core loop and product features.'}
                </h3>
              </div>
              {renderTabSwitcher()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4 relative">
                <label className="block text-[11px] font-bold text-[#777c86] mb-1.5">
                  {'Company Name'}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#a5a5a5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Linear, Stripe, Figma"
                    className="w-full pl-9 pr-3 h-10 text-sm bg-[#faf9f7] border border-[#efefef] rounded-xl text-[#121722] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="md:col-span-5 relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-[#777c86]">
                    {'Company Website'}
                  </label>
                </div>
                <div className="relative">
                  <Globe className="w-4 h-4 text-[#a5a5a5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.teamtailor.com/en-us/"
                    className="w-full pl-9 pr-8 h-10 text-sm bg-[#faf9f7] border border-[#efefef] rounded-xl text-[#121722] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  {verification.verified && !verification.isAts && (
                    <ShieldCheck className="w-4 h-4 text-blue-600 absolute right-3 top-1/2 -translate-y-1/2" title="Verified official homepage" />
                  )}
                </div>
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={() => handleGenerate()}
                  disabled={isLoading || (!companyName && !websiteUrl)}
                  className="w-full h-10 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{'Analyzing System...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-blue-200" />
                      <span>{'Generate Insight'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Smart ATS Warning / Link Switcher */}
            {verification.isAts && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-600 shrink-0" />
                  <span>
                    <strong>{'ATS Job Portal Link Detected:'}</strong>{' '}
                    {'Company intelligence works best with the authentic corporate homepage.'}
                  </span>
                </div>
                {verification.suggestedHomepage && (
                  <button
                    onClick={() => {
                      setWebsiteUrl(verification.suggestedHomepage!);
                      verifyAndSetUrl(verification.suggestedHomepage!, companyName);
                      toast.success(`Switched to official homepage: ${verification.suggestedHomepage}`);
                    }}
                    className="px-2.5 py-1 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 text-xs shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} />
                    <span>{`Use Official: ${verification.suggestedHomepage}`}</span>
                  </button>
                )}
              </div>
            )}

            {/* Candidate Links Badge Bar (when loaded from application) */}
            {candidateLinks.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#efefef]">
                <span className="text-[11px] font-bold text-[#777c86] uppercase flex items-center gap-1">
                  <Link2 size={12} className="text-blue-600" />
                  <span>{'Detected Links:'}</span>
                </span>
                {candidateLinks.map((lnk, idx) => {
                  const isCurrent = websiteUrl.toLowerCase().includes(lnk.domain);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setWebsiteUrl(lnk.normalizedUrl);
                        verifyAndSetUrl(lnk.normalizedUrl, companyName);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                          : 'bg-[#faf9f7] text-[#525866] border-[#efefef] hover:border-blue-200'
                      }`}
                    >
                      {lnk.type === 'homepage' && <CheckCircle2 size={12} className="text-blue-600" />}
                      <span>{lnk.title || lnk.domain}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded font-medium ${
                        lnk.type === 'homepage' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {lnk.type === 'homepage' ? 'Official Homepage' : lnk.type === 'ats_job_post' ? 'Job Post (ATS)' : 'Link'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#efefef]">
              <span className="text-xs text-[#777c86] font-medium">
                {'Sample Companies:'}
              </span>
              {PRESET_COMPANIES.map(p => (
                <button
                  key={p.name}
                  onClick={() => {
                    setCompanyName(p.name);
                    setWebsiteUrl(p.url);
                    verifyAndSetUrl(p.url, p.name);
                    handleGenerate(p.name, p.url);
                  }}
                  className="px-2.5 py-1 text-xs bg-[#faf9f7] hover:bg-blue-50 text-[#525866] hover:text-blue-700 border border-[#efefef] hover:border-blue-200 rounded-lg transition-all cursor-pointer font-medium"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          
          {/* Loading Skeleton Indicator */}
          {isLoading && (
            <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 border-b border-[#efefef] pb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-spin">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#121722]">
                    {'Synthesizing Company Intelligence...'}
                  </h3>
                  <p className="text-xs text-[#777c86]">
                    {'Extracting open-graph assets, mapping core loops, and reverse-engineering metrics.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                 <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                 <p className="text-xs text-blue-800/80 leading-relaxed">
                   Generating a company report may take longer. If the loading persists, you can simply regenerate it.
                 </p>
              </div>
            </div>
          )}
          
{/* Render Active Teardown Report */}
          {currentTeardown && !isLoading && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              {/* Report Header Card */}
              <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs overflow-hidden relative">
                {/* Visual OpenGraph Hero Banner */}
                {currentTeardown.ogImage && (
                  <div className="mb-6 rounded-xl overflow-hidden border border-[#efefef] bg-slate-900 max-h-56 relative group">
                    <img 
                      src={currentTeardown.ogImage} 
                      alt={`${currentTeardown.companyName} OG Marketing Banner`} 
                      className="w-full h-full object-cover object-center opacity-90 group-hover:opacity-100 transition-opacity"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {currentTeardown.logoUrl ? (
                      <img 
                        src={currentTeardown.logoUrl} 
                        alt={currentTeardown.companyName} 
                        className="w-14 h-14 rounded-2xl border border-[#efefef] p-1.5 bg-white shadow-2xs object-contain shrink-0" 
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xl shrink-0">
                        {currentTeardown.companyName.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-black text-[#121722] tracking-tight">
                          {currentTeardown.companyName}
                        </h2>
                        <a 
                          href={currentTeardown.websiteUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60"
                        >
                          <span>{currentTeardown.websiteUrl.replace(/^https?:\/\//, '')}</span>
                          <ArrowUpRight size={12} />
                        </a>
                      </div>

                      <p className="text-sm text-[#525866] mt-1 font-medium max-w-2xl">
                        {currentTeardown.tagline}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#777c86]">
                        <span className="font-semibold text-[#121722]">{currentTeardown.industry}</span>
                        {currentTeardown.headquarters && (
                          <>
                            <span>•</span>
                            <span>{currentTeardown.headquarters}</span>
                          </>
                        )}
                        {currentTeardown.foundedYear && (
                          <>
                            <span>•</span>
                            <span>{`Est. ${currentTeardown.foundedYear}`}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Header Controls */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    <button
                      onClick={handleExportPdf}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#525866] hover:text-[#121722] bg-[#faf9f7] hover:bg-[#f4f4f5] border border-[#efefef] rounded-xl transition-all cursor-pointer"
                      title="Export PDF Report"
                    >
                      <Download size={14} />
                      <span className="hidden sm:inline">Export</span>
                    </button>

                    {onAddToWishlist && !matchedApp && (
                      <button
                        onClick={() => {
                          onAddToWishlist({
                            company: currentTeardown.companyName,
                            companyUrl: currentTeardown.websiteUrl,
                            status: 'Wishlist',
                            role: 'Product / Engineering',
                            notes: `Auto-linked from Company Intelligence Studio:\n${currentTeardown.tagline}`
                          });
                          toast.success(`Added ${currentTeardown.companyName} to your Wishlist!`);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                      >
                        <PlusCircle size={14} />
                        <span>{'Add to Wishlist'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 1: Fiscal Insights & Headcount Dynamics (LinkedIn Curve) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Headcount Dynamics (7 Cols) */}
                <div className="lg:col-span-7 bg-white border border-[#efefef] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#121722]">
                          {'Headcount Dynamics & Growth Velocity'}
                        </h3>
                        <div className="relative group flex items-center">
                          <button type="button" className="text-[#a5a5a5] hover:text-blue-600 transition-colors cursor-help">
                            <Info size={14} />
                          </button>
                          <div className="absolute left-0 bottom-full mb-2 w-72 p-2.5 bg-[#121722] text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl pointer-events-none font-normal">
                            {currentTeardown.headcount.growthAnalysis}
                            <div className="absolute left-2 -bottom-1 border-4 border-transparent border-t-[#121722]"></div>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                        currentTeardown.headcount.hiringSignal.includes('Expansion') 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : currentTeardown.headcount.hiringSignal.includes('Selective')
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {currentTeardown.headcount.hiringSignal}
                      </span>
                    </div>

                    {/* Interactive Headcount Curve */}
                    <HeadcountTrendChart
                      data={currentTeardown.headcount.historicalTrend}
                      currentHeadcount={currentTeardown.headcount.currentHeadcount}
                      monthChangePct={currentTeardown.headcount.monthChangePct}
                      oneYearGrowthPct={currentTeardown.headcount.oneYearGrowthPct}
                      twoYearGrowthPct={currentTeardown.headcount.twoYearGrowthPct}
                      
                    />
                  </div>

                  {/* Department Distribution Progress Bars */}
                  {currentTeardown.headcount.departmentBreakdown?.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-[#efefef]">
                      <div className="text-[11px] font-bold text-[#777c86] uppercase mb-2.5">
                        {'Department Distribution'}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currentTeardown.headcount.departmentBreakdown.map((dept, i) => (
                          <div key={i} className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-2.5">
                            <div className="text-xs font-semibold text-[#121722] truncate">
                              {dept.department}
                            </div>
                            <div className="text-sm font-bold text-blue-600 mt-0.5">
                              {dept.percentage}%
                            </div>
                            <div className="w-full bg-[#e4e4e7] h-1.5 rounded-full overflow-hidden mt-1.5">
                              <div 
                                className="bg-blue-600 h-full rounded-full"
                                style={{ width: `${dept.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fiscal Report & Business Health (5 Cols) */}
                <div className="lg:col-span-5 bg-white border border-[#efefef] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-[#121722]">
                        {'Fiscal Report & Commercial Health'}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-3">
                        <div className="text-[10px] font-bold text-[#777c86] uppercase">
                          {'Stage'}
                        </div>
                        <div className="text-sm font-bold text-[#121722] mt-0.5">
                          {currentTeardown.fiscal.fundingStage}
                        </div>
                      </div>

                      <div className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-3">
                        <div className="text-[10px] font-bold text-[#777c86] uppercase">
                          {'Total Funding'}
                        </div>
                        <div className="text-sm font-bold text-[#121722] mt-0.5">
                          {currentTeardown.fiscal.totalFunding}
                        </div>
                      </div>

                      <div className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-3">
                        <div className="text-[10px] font-bold text-[#777c86] uppercase">
                          {'Valuation / Cap'}
                        </div>
                        <div className="text-sm font-bold text-[#121722] mt-0.5">
                          {currentTeardown.fiscal.valuationOrMarketCap}
                        </div>
                      </div>

                      <div className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-3">
                        <div className="text-[10px] font-bold text-[#777c86] uppercase">
                          {'Est. ARR'}
                        </div>
                        <div className="text-sm font-bold text-[#121722] mt-0.5">
                          {currentTeardown.fiscal.arrEstimate}
                        </div>
                      </div>
                    </div>

                    {/* Pricing Gate & Monetization Spine */}
                    <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 mb-3">
                      <div className="text-[11px] font-bold text-blue-900 uppercase">
                        <span>{'Pricing Gate & Monetization'}</span>
                      </div>
                      <p className="text-xs text-blue-950 mt-1 font-medium leading-relaxed">
                        {currentTeardown.fiscal.pricingGate}
                      </p>
                    </div>

                    {/* Capital Efficiency Summary */}
                    <div className="text-xs text-[#525866] leading-relaxed bg-[#faf9f7] border border-[#efefef] rounded-xl p-3">
                      <span className="font-bold text-[#121722] block mb-1">
                        {'Capital Efficiency Insight:'}
                      </span>
                      {currentTeardown.fiscal.fiscalSummary}
                    </div>
                  </div>

                  {/* Lead Investors */}
                  {currentTeardown.fiscal.leadInvestors?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#efefef]">
                      <span className="text-[11px] font-bold text-[#777c86] uppercase block mb-1.5">
                        {'Lead Investors'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentTeardown.fiscal.leadInvestors.map((inv, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white border border-[#efefef] rounded-md text-[11px] font-medium text-[#121722]">
                            {inv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 2: Core Loop Flywheel */}
              <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#121722] whitespace-nowrap">
                      {'The Core Loop (Flywheel Spine)'}
                    </h3>
                    <div className="relative group flex items-center">
                      <button type="button" className="text-[#a5a5a5] hover:text-blue-600 transition-colors cursor-help">
                        <Info size={14} />
                      </button>
                      <div className="absolute left-0 bottom-full mb-2 w-72 p-2.5 bg-[#121722] text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl pointer-events-none font-normal">
                        {'Principle 2: Loops, not features. The Core Loop is the central spine.'}
                        <div className="absolute left-2 -bottom-1 border-4 border-transparent border-t-[#121722]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      {currentTeardown.coreLoop.spineSummary}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative mt-6">
                  {currentTeardown.coreLoop.steps.map((step, idx) => (
                    <div 
                      key={step.step} 
                      className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-4 flex flex-col justify-between relative group hover:border-blue-300 hover:bg-white transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-full bg-[#121722] text-white flex items-center justify-center text-xs font-bold">
                          {step.step}
                        </span>
                        {idx < 3 && (
                          <ChevronRight className="w-4 h-4 text-[#a5a5a5] hidden md:block" />
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[#121722] mb-1">
                          {step.title}
                        </h4>
                        <p className="text-xs text-[#525866] leading-relaxed mb-3">
                          {step.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#efefef] mt-auto">
                        <span className="text-[10px] font-bold text-blue-600 uppercase block mb-0.5">
                          {'UX Lever & Mechanism'}
                        </span>
                        <span className="text-[11px] font-medium text-[#121722]">
                          {step.mechanism}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid 3: AI Placement Spectrum */}
              <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#121722]">
                      {'AI Placement Spectrum'}
                    </h3>
                    <div className="relative group flex items-center">
                      <button type="button" className="text-[#a5a5a5] hover:text-blue-600 transition-colors cursor-help">
                        <Info size={14} />
                      </button>
                      <div className="absolute left-0 bottom-full mb-2 w-72 p-2.5 bg-[#121722] text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl pointer-events-none font-normal">
                        {'Principle 3: Assistive vs. Embedded vs. Autonomous. Defended with evidence.'}
                        <div className="absolute left-2 -bottom-1 border-4 border-transparent border-t-[#121722]"></div>
                      </div>
                    </div>
                  </div>

                  {/* Spectrum Badge */}
                  <div className="flex items-center gap-1.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      currentTeardown.aiSpectrum.tier === 'Autonomous'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : currentTeardown.aiSpectrum.tier === 'Embedded'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {currentTeardown.aiSpectrum.tier}
                    </span>
                  </div>
                </div>

                <div className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-4 mb-4">
                  <div className="text-sm font-bold text-[#121722] mb-1">
                    {currentTeardown.aiSpectrum.headline}
                  </div>
                  <p className="text-xs text-[#525866] leading-relaxed">
                    <strong className="text-[#121722]">{'Defended Rationale: '}</strong>
                    {currentTeardown.aiSpectrum.defendedRationale}
                  </p>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#777c86] uppercase mb-2">
                    {'Grounded AI Capabilities & Evidence'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(currentTeardown.aiSpectrum.evidence).map((ev, i) => (
                      <div key={i} className="flex items-start gap-2 bg-white border border-[#efefef] rounded-xl p-3 shadow-2xs">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-xs text-[#121722] font-medium leading-relaxed">
                          {ev}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid 4: 2x2 SWOT Matrix */}
              <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs">
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#121722]">
                    {'High-Signal SWOT Strategic Matrix'}
                  </h3>
                  <div className="relative group flex items-center">
                    <button type="button" className="text-[#a5a5a5] hover:text-blue-600 transition-colors cursor-help">
                      <Info size={14} />
                    </button>
                    <div className="absolute left-0 bottom-full mb-2 w-72 p-2.5 bg-[#121722] text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl pointer-events-none font-normal">
                      {'Actionable deep analysis across internal capabilities and external market dynamics.'}
                      <div className="absolute left-2 -bottom-1 border-4 border-transparent border-t-[#121722]"></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase mb-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>{'Strengths · Moats & Network Gravity'}</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {currentTeardown.swot.strengths.map((s, i) => (
                        <div key={i} className="bg-white border border-emerald-100 rounded-lg p-3 shadow-2xs">
                          <div className="text-xs font-bold text-[#121722]">
                            {s.point}
                          </div>
                          <div className="text-xs text-[#525866] mt-1 leading-relaxed">
                            {s.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-rose-50/40 border border-rose-200/70 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase mb-2.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      <span>{'Weaknesses · Friction & Governance Gaps'}</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {currentTeardown.swot.weaknesses.map((w, i) => (
                        <div key={i} className="bg-white border border-rose-100 rounded-lg p-3 shadow-2xs">
                          <div className="text-xs font-bold text-[#121722]">
                            {w.point}
                          </div>
                          <div className="text-xs text-[#525866] mt-1 leading-relaxed">
                            {w.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase mb-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      <span>{'Opportunities · Expansion Vectors & Agents'}</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {currentTeardown.swot.opportunities.map((o, i) => (
                        <div key={i} className="bg-white border border-amber-100 rounded-lg p-3 shadow-2xs">
                          <div className="text-xs font-bold text-[#121722]">
                            {o.point}
                          </div>
                          <div className="text-xs text-[#525866] mt-1 leading-relaxed">
                            {o.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Threats */}
                  <div className="bg-purple-50/40 border border-purple-200/70 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 uppercase mb-2.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      <span>{'Threats · Big Tech Bundling & Macro Churn'}</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {currentTeardown.swot.threats.map((th, i) => (
                        <div key={i} className="bg-white border border-purple-100 rounded-lg p-3 shadow-2xs">
                          <div className="text-xs font-bold text-[#121722]">
                            {th.point}
                          </div>
                          <div className="text-xs text-[#525866] mt-1 leading-relaxed">
                            {th.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 5: Strategic Interview & Executive Pitch Kit */}
              <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#121722]">
                      {'Strategic Interview & Executive Pitch Kit'}
                    </h3>
                    <div className="relative group flex items-center">
                      <button type="button" className="text-[#a5a5a5] hover:text-blue-600 transition-colors cursor-help">
                        <Info size={14} />
                      </button>
                      <div className="absolute left-0 bottom-full mb-2 w-72 p-2.5 bg-[#121722] text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl pointer-events-none font-normal">
                        {'Propose high-impact product bets and ask sharp reverse-interview questions.'}
                        <div className="absolute left-2 -bottom-1 border-4 border-transparent border-t-[#121722]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strategic Product Proposals to Pitch */}
                  <div className="flex flex-col gap-3">
                    <div className="text-xs font-bold text-[#121722] uppercase tracking-wider">
                      <span>{'Strategic Product Proposals to Pitch'}</span>
                    </div>

                    {currentTeardown.interviewKit.strategicPitches.map((p, idx) => (
                      <div key={idx} className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#121722]">
                            {p.title}
                          </span>
                          <button
                            onClick={() => copyToClipboard(`${p.title}\n${p.proposal}`, `pitch_${idx}`)}
                            className="text-[#a5a5a5] hover:text-[#121722] p-1 cursor-pointer"
                            title="Copy Pitch"
                          >
                            {copiedKey === `pitch_${idx}` ? <Check size={14} className="text-blue-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                        <p className="text-xs text-[#525866] leading-relaxed">
                          {p.proposal}
                        </p>
                        <div className="text-[11px] font-medium text-blue-900 bg-blue-50/70 border border-blue-100 p-2 rounded-lg mt-1">
                          <strong>{'Why This Works: '}</strong>
                          {p.rationale}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reverse Questions for Interviewers */}
                  <div className="flex flex-col gap-3">
                    <div className="text-xs font-bold text-[#121722] uppercase tracking-wider">
                      <span>{'Sharp Reverse-Interview Questions'}</span>
                    </div>

                    {currentTeardown.interviewKit.reverseQuestions.map((q, idx) => (
                      <div key={idx} className="bg-[#faf9f7] border border-[#efefef] rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#121722] text-white">
                            To: {q.targetPersona}
                          </span>
                          <button
                            onClick={() => copyToClipboard(q.question, `q_${idx}`)}
                            className="text-[#a5a5a5] hover:text-[#121722] p-1 cursor-pointer"
                            title="Copy Question"
                          >
                            {copiedKey === `q_${idx}` ? <Check size={14} className="text-blue-600" /> : <Copy size={14} />}
                          </button>
                        </div>

                        <p className="text-xs font-semibold text-[#121722] italic leading-relaxed">
                          "{q.question}"
                        </p>

                        <div className="text-[11px] text-[#777c86] leading-relaxed mt-1">
                          <strong className="text-[#525866]">{'Tactical Value: '}</strong>
                          {q.whyItWorks}
                        </div>
                      </div>
                    ))}

                    {/* Critical KPIs to Drop */}
                    {currentTeardown.interviewKit.criticalKpisToMention?.length > 0 && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-1">
                        <span className="text-[11px] font-bold text-blue-900 uppercase block mb-1.5">
                          {'Critical Business KPIs to Drop in Discussion'}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentTeardown.interviewKit.criticalKpisToMention.map((kpi, kIdx) => (
                            <span key={kIdx} className="px-2 py-0.5 bg-white border border-blue-200 rounded-md text-[11px] font-semibold text-blue-700">
                              {kpi}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Saved Teardowns & History View (Inside Dedicated Tab) */
        <div className="bg-white border border-[#efefef] rounded-2xl p-6 shadow-2xs flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#efefef]">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#121722]">
                {'Company Search History'}
              </h2>
              <div className="relative group flex items-center">
                <button type="button" className="text-[#a5a5a5] hover:text-blue-600 transition-colors cursor-help">
                  <Info size={14} />
                </button>
                <div className="absolute left-0 bottom-full mb-2 w-72 p-2.5 bg-[#121722] text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl pointer-events-none font-normal">
                  {'All previously generated holistic teardowns are stored securely for instant review.'}
                  <div className="absolute left-2 -bottom-1 border-4 border-transparent border-t-[#121722]"></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#a5a5a5] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder={'Search company...'}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#faf9f7] border border-[#efefef] rounded-xl text-[#121722] focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
              {renderTabSwitcher()}
            </div>
          </div>

          {loadingHistory ? (
            <div className="py-16 text-center text-xs text-[#777c86] flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>{'Loading saved briefs...'}</span>
            </div>
          ) : savedRecords.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#777c86] flex flex-col items-center gap-2">
              <Building2 className="w-8 h-8 text-[#d1d5db]" />
              <span className="font-semibold text-sm text-[#121722]">
                {'No saved company teardowns yet'}
              </span>
              <p className="max-w-xs text-[#a5a5a5]">
                {'Enter any company name in the Teardown tab to generate your first analysis.'}
              </p>
              <button
                onClick={() => setActiveTab('explorer')}
                className="mt-2 px-3.5 py-1.5 bg-[#121722] text-white text-xs font-semibold rounded-xl hover:bg-[#232936] transition-all cursor-pointer"
              >
                {'Analyze a Company Now'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedRecords
                .filter(r => r.companyName.toLowerCase().includes(historySearch.toLowerCase()))
                .map((record) => (
                  <div
                    key={record.id}
                    onClick={() => {
                      setCurrentTeardown(record.teardown);
                      setActiveTab('explorer');
                    }}
                    className="bg-[#faf9f7] hover:bg-white border border-[#efefef] hover:border-blue-300 rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer shadow-2xs group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          {record.teardown.logoUrl ? (
                            <img src={record.teardown.logoUrl} alt={record.companyName} className="w-7 h-7 rounded-lg border border-[#efefef] bg-white p-0.5 object-contain shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                              {record.companyName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-[#121722] group-hover:text-blue-600 transition-colors">
                              {record.companyName}
                            </h4>
                            <span className="text-[11px] text-[#777c86]">
                              {record.teardown.industry}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteRecord(record.id, e)}
                          className="text-[#a5a5a5] hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Delete from history"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <p className="text-xs text-[#525866] line-clamp-2 mt-2 leading-relaxed">
                        {record.teardown.tagline}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#efefef] mt-3 flex items-center justify-between text-[11px] text-[#777c86]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                          {record.teardown.aiSpectrum.tier}
                        </span>
                        <span>HC: {record.teardown.headcount.currentHeadcount}</span>
                      </div>

                      <div className="flex items-center gap-1 font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                        <span>{'View'}</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
