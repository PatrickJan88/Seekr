import React, { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Search, MapPin, Briefcase, Clock, Building2, Plus, Sparkles, Info, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import locationsData from '../data/locations.json';
import { UserResume } from '../types';
import { getUserResume, getStoredLocalResume, saveUserResume, RESUME_UPDATED_EVENT } from '../db/resumes';
import { auth } from '../lib/firebase';
import { extractTextFromPDF, fileToBase64 } from '../lib/pdf';
import { extractCVProfile, scoreJobMatch, CVProfile, JobMatchScore } from '../lib/cvJobMatcher';

const getContinent = (countryName: string) => {
    if (!countryName) return 'Other';
    const cLower = countryName.toLowerCase();
    
    const europe = ['united kingdom', 'germany', 'france', 'spain', 'italy', 'netherlands', 'sweden', 'norway', 'denmark', 'finland', 'ireland', 'switzerland', 'belgium', 'austria', 'poland', 'portugal', 'greece', 'czech republic', 'romania', 'hungary', 'ukraine', 'russia', 'bulgaria', 'serbia', 'slovakia', 'croatia', 'lithuania', 'slovenia', 'latvia', 'estonia', 'cyprus', 'luxembourg', 'malta', 'iceland', 'andorra', 'monaco', 'liechtenstein', 'san marino'];
    const americas = ['united states', 'canada', 'brazil', 'mexico', 'argentina', 'colombia', 'chile', 'peru', 'cuba', 'venezuela', 'ecuador', 'guatemala', 'bolivia', 'haiti', 'dominican republic', 'honduras', 'paraguay', 'nicaragua', 'el salvador', 'costa rica', 'panama', 'uruguay', 'jamaica', 'trinidad and tobago', 'bahamas', 'belize', 'barbados', 'saint lucia', 'grenada', 'saint vincent and the grenadines', 'antigua and barbuda', 'dominica', 'saint kitts and nevis'];
    const asia = ['china', 'india', 'japan', 'south korea', 'indonesia', 'pakistan', 'bangladesh', 'philippines', 'vietnam', 'turkey', 'iran', 'thailand', 'myanmar', 'iraq', 'afghanistan', 'saudi arabia', 'uzbekistan', 'malaysia', 'yemen', 'nepal', 'north korea', 'sri lanka', 'kazakhstan', 'syria', 'cambodia', 'jordan', 'azerbaijan', 'united arab emirates', 'tajikistan', 'israel', 'laos', 'lebanon', 'kyrgyzstan', 'turkmenistan', 'singapore', 'oman', 'state of palestine', 'kuwait', 'georgia', 'mongolia', 'armenia', 'qatar', 'bahrain', 'timor-leste', 'cyprus', 'bhutan', 'maldives', 'brunei', 'taiwan', 'hong kong', 'macau'];
    const oceania = ['australia', 'papua new guinea', 'new zealand', 'fiji', 'solomon islands', 'micronesia', 'vanuatu', 'samoa', 'kiribati', 'tonga', 'marshall islands', 'palau', 'tuvalu', 'nauru'];
    const africa = ['nigeria', 'ethiopia', 'egypt', 'democratic republic of the congo', 'tanzania', 'south africa', 'kenya', 'uganda', 'algeria', 'sudan', 'morocco', 'angola', 'mozambique', 'ghana', 'madagascar', 'cameroon', 'cote d\'ivoire', 'niger', 'burkina faso', 'mali', 'malawi', 'zambia', 'senegal', 'chad', 'somalia', 'zimbabwe', 'guinea', 'rwanda', 'benin', 'burundi', 'tunisia', 'south sudan', 'togo', 'sierra leone', 'libya', 'congo', 'liberia', 'central african republic', 'mauritania', 'eritrea', 'namibia', 'gambia', 'botswana', 'gabon', 'lesotho', 'guinea-bissau', 'equatorial guinea', 'mauritius', 'eswatini', 'djibouti', 'comoros', 'cabo verde', 'sao tome and principe', 'seychelles'];

    if (europe.includes(cLower) || ['europe', 'emea', 'eu', 'dach'].includes(cLower)) return 'Europe';
    if (asia.includes(cLower) || ['asia', 'apac'].includes(cLower)) return 'Asia';
    if (americas.includes(cLower) || ['americas', 'north america', 'south america', 'latam', 'na', 'usa'].includes(cLower)) return 'Americas';
    if (africa.includes(cLower) || ['africa'].includes(cLower)) return 'Africa';
    if (oceania.includes(cLower) || ['oceania', 'australasia'].includes(cLower)) return 'Oceania';
    if (cLower.includes('remote') || cLower.includes('global')) return 'Remote / Global';

    return 'Other';
};


import { NestedLocationMenu } from './NestedLocationMenu';
import { NestedRoleMenu } from './NestedRoleMenu';
import { DateFilterMenu } from './DateFilterMenu';
import { NoDataState } from './NoDataState';


const ROLE_CATEGORIES_ACADEMIC = {
  "Academic & Research": [
    { label: "Postdoctoral Researcher", value: "postdoc" },
    { label: "PhD Candidate", value: "phd" },
    { label: "Assistant Professor", value: "assistant professor" },
    { label: "Lecturer", value: "lecturer" },
    { label: "Research Scientist", value: "research scientist" },
    { label: "Teaching Fellow", value: "teaching fellow" }
  ]
};

const ROLE_CATEGORIES_INDUSTRY = {
  "Development & Engineering": [
    { label: "Front-End Developer", value: "front-end" },
    { label: "Back-End Developer", value: "back-end" },
    { label: "Full-Stack Developer", value: "full-stack" },
    { label: "Mobile App Developer", value: "mobile" },
    { label: "Game Developer", value: "game" },
    { label: "Embedded Systems Engineer", value: "embedded" },
    { label: "AI/LLM Engineer", value: "ai llm engineer" },
    { label: "Machine Learning (ML) Engineer", value: "machine learning" },
    { label: "Agent Systems Engineer", value: "agent systems engineer" },
    { label: "Fine-Tuning & Optimization Engineer", value: "fine-tuning optimization" },
  ],
  "Data": [
    { label: "Data Scientist", value: "data scientist" },
    { label: "Data Analyst", value: "data analyst" },
    { label: "Data Architect", value: "data architect" },
    { label: "Database Administrator (DBA)", value: "database" },
    { label: "Business Intelligence (BI) Analyst", value: "business intelligence" },
  ],
  "Infrastructure & Reliability": [
    { label: "DevOps Engineer", value: "devops" },
    { label: "Cloud Engineer", value: "cloud" },
    { label: "Site Reliability Engineer (SRE)", value: "site reliability" },
    { label: "MLOps / Platform Engineer", value: "mlops platform" },
    { label: "AI Reliability Engineer (SRE)", value: "ai reliability" },
    { label: "AI Safety & Evaluation Engineer", value: "ai safety" },
    { label: "Systems Administrator", value: "systems administrator" },
    { label: "Network Engineer", value: "network engineer" },
  ],
  "Product & Design": [
    { label: "Product/Program Manager", value: "product manager" },
    { label: "AI Product Manager", value: "ai product manager" },
    { label: "UX / UI Designer", value: "ux ui designer" },
  ],
  "Governance": [
    { label: "AI Ethics & Compliance Officer", value: "ai ethics" },
  ],
  "QA": [
    { label: "QA Engineer", value: "qa" },
  ],
  "Security & Support": [
    { label: "Security Professionals", value: "security" },
    { label: "IT Support Specialist", value: "support" },
  ]
};

interface MarketJob {
  id: string | number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  parsed_location?: { continent: string, country: string, city: string };
  salary: string;
  description: string;
}

interface GlobalMarketProps {
  trackingSystem?: 'industry' | 'academic';
  isDemo: boolean;
  onAddToWishlist?: (app: any) => void;
}


const ACADEMIC_JOBS: any[] = [];

export function GlobalMarket({ isDemo, onAddToWishlist, trackingSystem = 'industry' }: GlobalMarketProps) {
  const [jobs, setJobs] = useState<MarketJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [continentFilter, setContinentFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // CV & Matched Up state
  const [storedResume, setStoredResume] = useState<UserResume | null>(() => getStoredLocalResume(auth.currentUser?.uid));
  const [isMatchedUpActive, setIsMatchedUpActive] = useState<boolean>(false);
  const [isCalculatingMatches, setIsCalculatingMatches] = useState<boolean>(false);
  const [showCVProfileInfo, setShowCVProfileInfo] = useState<boolean>(false);
  const [showNoCvNotice, setShowNoCvNotice] = useState<boolean>(false);
  const [isUploadingCv, setIsUploadingCv] = useState<boolean>(false);

  useEffect(() => {
    const fetchResume = async () => {
      const resume = await getUserResume(auth.currentUser?.uid || 'guest');
      if (resume) {
        setStoredResume(resume);
      }
    };
    fetchResume();

    const handleResumeUpdated = (e: any) => {
      const updated = e.detail as UserResume | null;
      setStoredResume(updated);
      if (!updated?.cvText?.trim()) {
        setIsMatchedUpActive(false);
      }
    };

    window.addEventListener(RESUME_UPDATED_EVENT, handleResumeUpdated);
    return () => {
      window.removeEventListener(RESUME_UPDATED_EVENT, handleResumeUpdated);
    };
  }, [auth.currentUser?.uid]);

  // Determine effective CV profile from uploaded CV only (no default UI/UX designer fallback)
  const effectiveProfile = React.useMemo<CVProfile | null>(() => {
    if (storedResume?.cvText?.trim()) {
      return extractCVProfile(storedResume.cvText);
    }
    return null;
  }, [storedResume?.cvText]);

  // Direct CV upload handler from the Matched Up notice popover
  const handleDirectCvUpload = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF format CV.');
      return;
    }

    setIsUploadingCv(true);
    toast.loading('Reading & extracting CV text...', { id: 'market-cv-upload' });

    try {
      let extractedText = '';
      let base64 = '';
      try {
        extractedText = await extractTextFromPDF(file);
      } catch (err) {
        console.warn('PDF text extraction error:', err);
      }

      try {
        base64 = await fileToBase64(file);
      } catch (err) {
        console.warn('PDF base64 conversion error:', err);
      }

      const saved = await saveUserResume(auth.currentUser?.uid || 'guest', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/pdf',
        cvText: extractedText,
        pdfBase64: base64,
      });

      setStoredResume(saved);
      setShowNoCvNotice(false);

      if (extractedText?.trim()) {
        const profile = extractCVProfile(extractedText);
        setIsMatchedUpActive(true);
        toast.success(`CV uploaded! Matched Up active, ranked by your ${profile.detectedRole} background.`, { id: 'market-cv-upload' });
      } else {
        toast.success('CV uploaded and saved to My Resume.', { id: 'market-cv-upload' });
      }
    } catch (err: any) {
      console.error('Failed to upload CV in GlobalMarket:', err);
      toast.error('Failed to upload CV: ' + (err.message || 'unknown error'), { id: 'market-cv-upload' });
    } finally {
      setIsUploadingCv(false);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/market-jobs?t=' + Date.now());
        if (!response.ok) {
          throw new Error('Failed to fetch global market jobs.');
        }
                const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse market jobs. Server returned:", text.substring(0, 500));
          throw new Error(`Failed to parse server response: ${text.substring(0, 50)}`);
        }
        setJobs(data.jobs || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while fetching jobs.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Location Parsing Logic
  const stripHtml = (html: string) => {
    if (!html) return 'No description available.';
    // First pass: decodes HTML entities (e.g. &lt;div&gt; to <div>)
    const doc1 = new DOMParser().parseFromString(html, 'text/html');
    const decodedHtml = doc1.body.textContent || "";
    
    // Second pass: parses the actual HTML tags and extracts pure text content
    const doc2 = new DOMParser().parseFromString(decodedHtml, 'text/html');
    const finalString = doc2.body.textContent || doc2.body.innerText || 'No description available.';
    
    return finalString.trim().substring(0, 1000) + (finalString.length > 1000 ? '...' : '');
  };

  const locationTree = React.useMemo(() => {
    const tree = new Map<string, Map<string, Set<string>>>();
    
    // Remote option at the top
    tree.set("Remote / Global", new Map([["Remote / Global", new Set(["Remote"])]]));

    for (const [country, cities] of Object.entries(locationsData)) {
        const continent = getContinent(country);
        if (!tree.has(continent)) tree.set(continent, new Map());
        const continentMap = tree.get(continent)!;
        if (!continentMap.has(country)) continentMap.set(country, new Set());
        for (const city of (cities as string[])) {
            if (city) continentMap.get(country)!.add(city);
        }
    }
    return tree;
  }, []);

  // Reset city filter when parent changes
  useEffect(() => {
    setCountryFilter('');
    setCityFilter('');
  }, [continentFilter]);

  useEffect(() => {
    setCityFilter('');
  }, [countryFilter]);

  // Search matching logic aligned with whole site
  const scoreMatch = (text: string | undefined, q: string) => {
    if (!text || !q) return 0;
    const lowerText = text.toLowerCase().trim();
    const lowerQ = q.trim();
    if (!lowerQ) return 0;
    
    if (lowerText === lowerQ) return 4;
    if (lowerText.startsWith(lowerQ)) return 3;
    if (lowerText.includes(` ${lowerQ}`)) return 2;
    if (lowerText.includes(lowerQ)) return 1;
    
    // Check if all words match
    const words = lowerQ.split(/\s+/);
    if (words.length > 1 && words.every(w => lowerText.includes(w))) return 0.5;
    
    return 0;
  };

  // Helper to parse dates reliably across formats (ISO, timestamps, DD/MM/YYYY)
  const parseJobDate = (dateStr: string | number | undefined): number => {
    if (!dateStr) return NaN;
    if (typeof dateStr === 'number') {
      return dateStr < 10000000000 ? dateStr * 1000 : dateStr;
    }
    const str = String(dateStr).trim();
    // Check for UK/European DD/MM/YYYY or DD/MM/YYYY HH:mm:ss
    const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (ddmmyyyy) {
      const [_, day, month, year, hours = '0', minutes = '0', seconds = '0'] = ddmmyyyy;
      return Date.UTC(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hours, 10),
        parseInt(minutes, 10),
        parseInt(seconds, 10)
      );
    }
    const parsed = new Date(str).getTime();
    return isNaN(parsed) ? NaN : parsed;
  };

  // Map of scores for all jobs computed against user's CV profile
  const jobScoresMap = React.useMemo(() => {
    const map = new Map<string | number, JobMatchScore>();
    if (!effectiveProfile || !isMatchedUpActive) return map;

    const baseJobs = trackingSystem === 'academic' ? ACADEMIC_JOBS : jobs;
    for (const job of baseJobs) {
      const score = scoreJobMatch(job, effectiveProfile);
      map.set(job.id, score);
    }
    return map;
  }, [jobs, effectiveProfile, trackingSystem, isMatchedUpActive]);

  const handleToggleMatchedUp = async () => {
    if (isMatchedUpActive) {
      setIsMatchedUpActive(false);
      setShowNoCvNotice(false);
      toast.info('Standard chronological sorting restored.');
      return;
    }

    setIsCalculatingMatches(true);

    // Read the user's CV text freshly from Firestore or local storage first
    let currentResume = storedResume;
    try {
      const latest = await getUserResume(auth.currentUser?.uid || 'guest');
      if (latest) {
        currentResume = latest;
        setStoredResume(latest);
      }
    } catch {
      // fallback to current storedResume in memory
    }

    if (!currentResume?.cvText?.trim()) {
      setIsCalculatingMatches(false);
      setShowNoCvNotice(true);
      toast.info('Please upload your CV first to enable Matched Up sorting.');
      return;
    }

    // Parse the candidate's real CV profile (supporting any tech or academic role)
    const profile = extractCVProfile(currentResume.cvText);

    setTimeout(() => {
      setIsCalculatingMatches(false);
      setShowNoCvNotice(false);
      setIsMatchedUpActive(true);
      toast.success(`Matched Up active! Ranked by your CV (${profile.detectedRole}) background & skills.`);
    }, 150);
  };

  const processedJobs = React.useMemo(() => {
    let baseJobs = trackingSystem === 'academic' ? ACADEMIC_JOBS : jobs;
    let result = baseJobs.filter((job) => {
      // 1. Location match
      const { continent, country, city } = job.parsed_location || { continent: "Other", country: "Other", city: "" };
      let matchesLocation = true;
      if (continentFilter && continentFilter !== continent) matchesLocation = false;
      if (countryFilter && countryFilter !== country) matchesLocation = false;
      if (cityFilter && city !== cityFilter) matchesLocation = false;
      
      // Date match
      let matchesDate = true;
      if (dateFilter) {
        if (!job.publication_date) {
          matchesDate = false;
        } else {
          const jobTimestamp = parseJobDate(job.publication_date);
          if (isNaN(jobTimestamp)) {
            matchesDate = false;
          } else {
            const now = Date.now();
            const diffHours = (now - jobTimestamp) / (1000 * 60 * 60);
            
            // Exclude erroneous future dates (> 24h into future)
            if (diffHours < -24) {
              matchesDate = false;
            } else if (dateFilter === '24h') {
              matchesDate = diffHours <= 24;
            } else if (dateFilter === '7d') {
              matchesDate = diffHours <= 24 * 7;
            } else if (dateFilter === '15d') {
              matchesDate = diffHours <= 24 * 15;
            } else if (dateFilter === '30d') {
              matchesDate = diffHours <= 24 * 30;
            }
          }
        }
      }

      // 2. Type match
      let matchesType = true;
      if (typeFilter) {
        const typeLower = typeFilter.toLowerCase();
        matchesType = 
          (job.category && job.category.toLowerCase().includes(typeLower)) || 
          (job.job_type && job.job_type.toLowerCase().includes(typeLower)) ||
          (job.title && job.title.toLowerCase().includes(typeLower)) ||
          (job.tags && job.tags.some(t => t.toLowerCase().includes(typeLower)));
      }

      return matchesLocation && matchesType && matchesDate;
    });

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const scored = result.map(job => {
        const titleScore = scoreMatch(job.title, q);
        const companyScore = scoreMatch(job.company_name, q);
        const maxScore = Math.max(titleScore, companyScore);
        return { job, score: maxScore };
      });
      result = scored.filter(item => item.score > 0).sort((a, b) => b.score - a.score).map(item => item.job);
    }

    // Automatically sort by CV match score from most matched to least matched when Matched Up is active
    if (isMatchedUpActive && effectiveProfile) {
      result = [...result].sort((a, b) => {
        const scoreA = jobScoresMap.get(a.id)?.totalScore ?? 0;
        const scoreB = jobScoresMap.get(b.id)?.totalScore ?? 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA; // Highest match first
        }
        const timeA = parseJobDate(a.publication_date) || 0;
        const timeB = parseJobDate(b.publication_date) || 0;
        return timeB - timeA;
      });
    }
    
    return result;
  }, [jobs, countryFilter, cityFilter, typeFilter, dateFilter, searchTerm, isMatchedUpActive, effectiveProfile, jobScoresMap]);

  return (
    <div className="relative w-full flex-1 flex flex-col min-h-[500px]">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#efefef] shadow-2xs w-full flex-1 min-h-[500px] flex flex-col relative">
      <div className="pb-4 sm:pb-6 border-b border-[#efefef] shrink-0">
        
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 xl:gap-3 w-full min-w-0">
          {/* Matched Up Button - arranged before all locations */}
          <div className="relative shrink-0 w-full sm:w-auto z-50">
            <button
              type="button"
              id="matched-up-sort-btn"
              onClick={handleToggleMatchedUp}
              disabled={isCalculatingMatches}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 h-10 sm:h-11 px-3 sm:px-3.5 xl:px-4 rounded-full text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer select-none w-full sm:w-auto shrink-0 ${
                isMatchedUpActive
                  ? 'bg-[#0068f9] text-white hover:bg-[#024bb1] border border-[#0068f9] shadow-sm'
                  : 'bg-white text-[#121722] border border-[#efefef] hover:bg-[#faf9f7] hover:border-[#0068f9]/40'
              }`}
              title={
                isMatchedUpActive
                  ? 'Matched Up active: Click to restore standard chronological sorting'
                  : storedResume?.cvText?.trim()
                  ? `Matched Up: Auto-rank by your ${effectiveProfile?.detectedRole || 'CV'} background & skills`
                  : 'Upload your CV to activate tailored Matched Up ranking'
              }
            >
              {isCalculatingMatches ? (
                <Loader2 size={15} className="animate-spin text-current shrink-0" />
              ) : (
                <Sparkles size={15} className={`shrink-0 ${isMatchedUpActive ? 'text-amber-300' : 'text-[#0068f9]'}`} />
              )}
              <span className="font-semibold whitespace-nowrap">Matched Up</span>
              {isMatchedUpActive && (
                <span className="ml-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/25 text-white leading-none">
                  ON
                </span>
              )}
            </button>

            {/* Encouraging Notice with the button if user has not uploaded a CV yet */}
            {showNoCvNotice && !storedResume?.cvText?.trim() && (
              <div 
                id="matched-up-upload-notice"
                className="absolute left-0 top-full mt-2.5 w-[320px] sm:w-[380px] bg-white border border-[#efefef] rounded-2xl shadow-xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0068f9]/10 text-[#0068f9] flex items-center justify-center shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#121722]">Upload your CV to activate Matched Up</h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNoCvNotice(false)}
                    className="text-[#a5a5a5] hover:text-[#121722] p-1 rounded-md transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                <p className="text-xs text-[#777c86] leading-relaxed mb-4">
                  Seekr reads your CV background, skills, previous experience, and sector (tech or academic) to automatically rank opportunities from most matched to least matched for you.
                </p>

                <label
                  htmlFor="market-cv-upload-input"
                  className={`border-2 border-dashed border-[#d0e1fd] hover:border-[#0068f9] bg-[#f5f9ff]/70 hover:bg-[#edf5ff] rounded-xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center block ${
                    isUploadingCv ? 'opacity-70 pointer-events-none' : ''
                  }`}
                >
                  <input
                    id="market-cv-upload-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    disabled={isUploadingCv}
                    onChange={(e) => e.target.files?.[0] && handleDirectCvUpload(e.target.files[0])}
                  />
                  <div className="w-10 h-10 rounded-full bg-white border border-[#d0e1fd] text-[#0068f9] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    {isUploadingCv ? (
                      <Loader2 size={20} className="animate-spin text-[#0068f9]" />
                    ) : (
                      <Upload size={18} />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#121722] block">
                    {isUploadingCv ? 'Reading & extracting CV text...' : 'Upload your CV (PDF)'}
                  </span>
                  <span className="text-[11px] text-[#777c86] mt-0.5 block">
                    PDF up to 10MB • Saved to My Resume
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* All Locations - auto-reduces width to fit */}
          <div className="min-w-0 flex-1 sm:flex-initial sm:w-auto z-50">
            <NestedLocationMenu
              locationTree={locationTree}
              continentFilter={continentFilter}
              countryFilter={countryFilter}
              cityFilter={cityFilter}
              onSelectContinent={setContinentFilter}
              onSelectCountry={setCountryFilter}
              onSelectCity={setCityFilter}
            />
          </div>

          {/* All Roles - auto-reduces width to fit */}
          <div className="min-w-0 flex-1 sm:flex-initial sm:w-auto z-50">
            <NestedRoleMenu
              roleCategories={trackingSystem === 'academic' ? ROLE_CATEGORIES_ACADEMIC : ROLE_CATEGORIES_INDUSTRY}
              typeFilter={typeFilter}
              onSelectType={setTypeFilter}
            />
          </div>

          {/* Date Posted - auto-reduces width to fit */}
          <div className="min-w-0 flex-1 sm:flex-initial sm:w-auto z-50">
            <DateFilterMenu
              dateFilter={dateFilter}
              onSelectDate={setDateFilter}
            />
          </div>

          {/* Expanded Width Search Box & Results Counter */}
          <div className="relative flex-1 min-w-[80px] sm:min-w-[100px] max-w-full flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-[#a5a5a5]" size={15} />
              <input
                type="text"
                placeholder="Search market"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 h-10 sm:h-11 bg-white border border-[#efefef] rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0068f9] transition-all shadow-2xs hover:bg-[#faf9f7] truncate"
              />
            </div>
          </div>

          <div className="text-[#777c86] text-xs sm:text-sm whitespace-nowrap font-medium shrink-0 px-0.5">
            <span>{processedJobs.length > 99 ? '99+' : processedJobs.length}</span>
            <span className="hidden min-[480px]:inline"> results</span>
          </div>
        </div>

        {/* Matched Up Information Banner */}
        {isMatchedUpActive && effectiveProfile && (
          <div className="mt-3.5 px-4 py-2.5 bg-[#e8f1ff]/60 border border-[#0068f9]/20 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs text-[#121722] animate-in fade-in duration-200">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 font-bold text-[#0068f9]">
                <Sparkles size={14} className="text-[#0068f9]" />
                <span>Matched Up Active</span>
              </div>
              <span className="text-[#a5a5a5]">•</span>
              <span>
                Ranked by <strong className="font-semibold text-[#121722]">{effectiveProfile.detectedRole}</strong> ({effectiveProfile.seniority}) background, skills & experience
              </span>
              {storedResume?.fileName && (
                <span className="text-[#777c86] bg-white px-2 py-0.5 rounded-md border border-[#efefef]">
                  CV: {storedResume.fileName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCVProfileInfo(!showCVProfileInfo)}
                className="text-[11px] font-semibold text-[#0068f9] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Info size={12} />
                <span>{showCVProfileInfo ? 'Hide Signals' : 'View Matching Signals'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMatchedUpActive(false);
                  toast.info('Standard chronological sorting restored');
                }}
                className="text-[11px] text-[#777c86] hover:text-[#121722] hover:underline cursor-pointer ml-2"
              >
                Reset
              </button>
            </div>

            {showCVProfileInfo && (
              <div className="w-full pt-2 border-t border-[#0068f9]/10 mt-1 flex flex-wrap gap-1.5 items-center">
                <span className="text-[#777c86] text-[11px]">Match Signals:</span>
                {effectiveProfile.skills.slice(0, 10).map((skill) => (
                  <span key={skill} className="px-2 py-0.5 rounded-md bg-white border border-[#0068f9]/20 text-[11px] font-medium text-[#0068f9]">
                    {skill}
                  </span>
                ))}
                {effectiveProfile.softSkills.slice(0, 4).map((soft) => (
                  <span key={soft} className="px-2 py-0.5 rounded-md bg-white border border-[#efefef] text-[11px] text-[#777c86]">
                    {soft}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-transparent relative pt-4 sm:pt-6 custom-scrollbar">
        {(loading && trackingSystem !== 'academic') ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#777c86]">
            <Loader2 className="animate-spin mb-3 text-[#0068f9]" size={32} />
            <p className="text-sm font-medium">Fetching live market data...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
            <p className="text-sm font-medium bg-red-50 border border-red-100 p-4 rounded-xl">{error}</p>
          </div>
        ) : processedJobs.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <NoDataState icon="/icons/crunch.svg" title="No data available" />
          </div>
        ) : (
          <div className="flex flex-col w-full min-h-max pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {processedJobs.map((job) => {
              const matchScore = isMatchedUpActive ? jobScoresMap.get(job.id) : null;
              return (
              <div key={job.id} className="bg-[#faf9f7] border border-[#efefef] rounded-2xl p-5 hover:border-[#0068f9]/30 hover:shadow-md transition-all flex flex-col h-full group relative w-full">
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 rounded-2xl" aria-label={`View ${job.title} job at ${job.company_name}`} />
                <div className="flex items-start justify-between w-full mb-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {job.company_logo ? (
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#efefef] shrink-0 bg-white flex items-center justify-center shadow-xs">
                        <img src={job.company_logo} alt={`${job.company_name} logo`} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl border border-[#efefef] bg-[#faf9f7] shrink-0 flex items-center justify-center text-[#a5a5a5] shadow-xs">
                        <Building2 size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#121722] text-[15px] truncate group-hover:text-[#0068f9] transition-colors">{job.title}</h3>
                      <p className="text-sm text-[#777c86] font-medium truncate">{job.company_name}</p>
                    </div>
                  </div>
                  <div className="shrink-0 z-20 flex items-center gap-2">
                    {isMatchedUpActive && matchScore && (
                      <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shadow-2xs shrink-0 ${
                        matchScore.totalScore >= 85
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : matchScore.totalScore >= 70
                          ? 'bg-blue-50 text-[#0068f9] border-blue-200'
                          : 'bg-neutral-50 text-[#777c86] border-[#efefef]'
                      }`}>
                        <Sparkles size={11} className={matchScore.totalScore >= 70 ? 'text-current' : 'text-[#a5a5a5]'} />
                        <span>{matchScore.totalScore}%</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToWishlist?.({
                          company: job.company_name,
                          position: job.title,
                          location: job.candidate_required_location || 'Remote',
                          workType: 'Remote',
                          status: 'Wishlist',
                          notes: `Added from Job Market.\nJob Link: ${job.url}\n\nDescription:\n${stripHtml(job.description)}`
                        });
                      }}
                      className="w-8 h-8 rounded-full border border-[#efefef] bg-white flex items-center justify-center text-[#a5a5a5] hover:text-[#0068f9] hover:border-[#0068f9]/30 hover:bg-blue-50 transition-all shadow-xs cursor-pointer"
                      title="Add to Wishlist"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Match signals chips when Matched Up is active */}
                {isMatchedUpActive && matchScore && matchScore.matchedKeywords.length > 0 && (
                  <div className="mb-3 flex flex-wrap items-center gap-1.5 z-10 relative">
                    <span className="text-[10px] text-[#777c86] font-medium">Matched:</span>
                    {matchScore.matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] font-semibold bg-[#e8f1ff] text-[#0068f9] px-2 py-0.5 rounded-md border border-[#0068f9]/15"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-auto space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#777c86]">
                    <MapPin size={14} className="shrink-0" />
                    <span className="truncate">{job.candidate_required_location || 'Remote'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#777c86]">
                      <Clock size={14} className="shrink-0" />
                      <span>{(() => {
                        const ts = parseJobDate(job.publication_date);
                        return isNaN(ts) ? 'Recently' : new Date(ts).toLocaleDateString();
                      })()}</span>
                    </div>
                    {job.salary && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                        {job.salary}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
            </div>
            {processedJobs.length > 0 && (
              <div className="text-center text-[#a5a5a5] text-sm py-8 border-t border-[#efefef]">
                The end.
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
