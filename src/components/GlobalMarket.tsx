import React, { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Search, MapPin, Briefcase, Clock, Building2, Plus } from 'lucide-react';
import locationsData from '../data/locations.json';

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

const ROLE_CATEGORIES = {
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
  isDemo: boolean;
  onAddToWishlist?: (app: any) => void;
}

export function GlobalMarket({ isDemo, onAddToWishlist }: GlobalMarketProps) {
  const [jobs, setJobs] = useState<MarketJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [continentFilter, setContinentFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

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
    if (!text) return 0;
    const lowerText = text.toLowerCase();
    if (lowerText === q) return 4;
    if (lowerText.startsWith(q)) return 3;
    if (lowerText.includes(` ${q}`)) return 2;
    if (lowerText.includes(q)) return 1;
    return 0;
  };

  const processedJobs = React.useMemo(() => {
    let result = jobs.filter((job) => {
      // 1. Location match
      const { continent, country, city } = job.parsed_location || { continent: "Other", country: "Other", city: "" };
      let matchesLocation = true;
      if (continentFilter && continentFilter !== continent) matchesLocation = false;
      if (countryFilter && countryFilter !== country) matchesLocation = false;
      if (cityFilter && city !== cityFilter) matchesLocation = false;
      
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

      return matchesLocation && matchesType;
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
    
    return result;
  }, [jobs, countryFilter, cityFilter, typeFilter, searchTerm]);

  return (
    <div className="flex-grow flex flex-col h-full bg-white rounded-2xl border border-[#efefef] shadow-2xs overflow-hidden">
      <div className="p-6 border-b border-[#efefef] shrink-0">
        <h2 className="text-xl font-bold text-[#121722] mb-1">Job Market</h2>
        <p className="text-[#777c86] text-sm mb-6">Explore the latest tech roles aggregated from open global sources. Refreshes every 24 hours.</p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="shrink-0 w-full sm:w-auto z-50">
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
          <div className="shrink-0 w-full sm:w-auto z-50">
            <NestedRoleMenu
              roleCategories={ROLE_CATEGORIES}
              typeFilter={typeFilter}
              onSelectType={setTypeFilter}
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a5a5a5]" size={16} />
            <input
              type="text"
              placeholder="Search roles or companies in market"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 h-11 bg-white border border-[#efefef] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0068f9] transition-all shadow-2xs hover:bg-[#faf9f7]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#faf9f7] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#777c86]">
            <Loader2 className="animate-spin mb-3 text-[#0068f9]" size={32} />
            <p className="text-sm font-medium">Fetching live market data...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
            <p className="text-sm font-medium bg-red-50 border border-red-100 p-4 rounded-xl">{error}</p>
          </div>
        ) : processedJobs.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#777c86]">
            <p className="text-sm font-medium">No jobs found</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {processedJobs.map((job) => (
              <div key={job.id} className="bg-white border border-[#efefef] rounded-2xl p-5 hover:border-[#0068f9]/30 hover:shadow-md transition-all flex flex-col h-full group relative w-full">
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 rounded-2xl" aria-label={`View ${job.title} job at ${job.company_name}`} />
                <div className="flex items-start justify-between w-full mb-4 gap-3">
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
                  <div className="shrink-0 z-20">
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
                
                <div className="mt-auto space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#777c86]">
                    <MapPin size={14} className="shrink-0" />
                    <span className="truncate">{job.candidate_required_location || 'Remote'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#777c86]">
                      <Clock size={14} className="shrink-0" />
                      <span>{new Date(job.publication_date).toLocaleDateString()}</span>
                    </div>
                    {job.salary && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                        {job.salary}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
