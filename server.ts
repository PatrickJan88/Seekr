import fs from 'fs';
import path from 'path';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

function safeParseJSON(text: string, fallback: any) {
  if (!text) return fallback;
  let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = clean.search(/[\{\[]/);
  const lastBrace = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response:", text);
    return fallback;
  }
}

/**
 * Resilient helper to execute Gemini API calls with automatic retries and fallback models
 * when encountering temporary 503 high demand, rate limits (429), or capacity issues.
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const modelsToTry = [
    params.preferredModel || "gemini-3.6-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro"
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || JSON.stringify(err) || "";
        const isUnavailable =
          errMessage.includes("503") ||
          errMessage.includes("UNAVAILABLE") ||
          errMessage.includes("high demand") ||
          errMessage.includes("429") ||
          errMessage.includes("RESOURCE_EXHAUSTED") ||
          errMessage.includes("overloaded");
          
        const isNotFound = 
          errMessage.includes("404") || 
          errMessage.includes("NOT_FOUND") || 
          errMessage.includes("no longer available");

        if (isUnavailable) {
          console.warn(`Model '${model}' high demand / 503 error (attempt ${attempt + 1}). Retrying...`);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        
        if (isNotFound) {
          console.warn(`Model '${model}' not found or deprecated. Falling back to next model...`);
          break; // Break the attempt loop to immediately try the next model
        }

        // For other non-transient errors (like bad request), throw immediately
        throw err;
      }
    }
  }

  const finalMsg = lastError?.message || "";
  if (finalMsg.includes("503") || finalMsg.includes("high demand") || finalMsg.includes("UNAVAILABLE")) {
    throw new Error("The AI service is currently experiencing high demand across all models. Please wait a few seconds and try again.");
  }

  throw lastError;
}

async function startServer() {
  


const locationsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'locations.json'), 'utf8'));

const countryMap = new Map<string, string>();
const cityMap = new Map<string, { city: string, country: string }>();

for (const [country, cities] of Object.entries(locationsData)) {
    countryMap.set(country.toLowerCase(), country);
    for (const city of (cities as string[])) {
        const key = city.toLowerCase();
        if (!cityMap.has(key)) {
            cityMap.set(key, { city, country });
        }
    }
}
countryMap.set('usa', countryMap.get('united states')!);
countryMap.set('us', countryMap.get('united states')!);
countryMap.set('uk', countryMap.get('united kingdom')!);
countryMap.set('england', countryMap.get('united kingdom')!);
countryMap.set('northern ireland', countryMap.get('united kingdom')!);
countryMap.set('scotland', countryMap.get('united kingdom')!);
countryMap.set('wales', countryMap.get('united kingdom')!);
countryMap.set('deutschland', countryMap.get('germany')!);
countryMap.set('de', countryMap.get('germany')!);

cityMap.set('london', { city: 'London', country: 'United Kingdom' });
cityMap.set('paris', { city: 'Paris', country: 'France' });
cityMap.set('berlin', { city: 'Berlin', country: 'Germany' });
cityMap.set('belfast', { city: 'Belfast', country: 'United Kingdom' });
cityMap.set('edinburgh', { city: 'Edinburgh', country: 'United Kingdom' });
cityMap.set('new york', { city: 'New York', country: 'United States' });
cityMap.set('san francisco', { city: 'San Francisco', country: 'United States' });
cityMap.set('amsterdam', { city: 'Amsterdam', country: 'Netherlands' });
cityMap.set('toronto', { city: 'Toronto', country: 'Canada' });
cityMap.set('manchester', { city: 'Manchester', country: 'United Kingdom' });
if (cityMap.has('munich')) cityMap.set('münchen', cityMap.get('munich')!);
if (cityMap.has('cologne')) cityMap.set('köln', cityMap.get('cologne')!);


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
    if (cLower.includes('remote') || cLower.includes('global')) return 'Remote';

    return 'Other';
};

const parseLocation = (loc: string) => {
    let raw = loc || '';
    let lower = raw.toLowerCase();
    
    if (!raw || lower === 'remote' || lower === 'anywhere' || lower === 'worldwide' || lower === 'unknown' || lower === 'homeoffice' || lower.includes('remote job')) {
      return { continent: 'Remote', country: 'Remote', city: '' };
    }
    
    if (lower.includes('europe, emea, uk, germany, france')) return { continent: 'Europe', country: 'Multiple Locations', city: 'Europe (Multiple)' };
    if (lower.includes('northern america, europe, uk, france')) return { continent: 'Multiple Continents', country: 'Multiple Locations', city: 'US & Europe' };
    if (lower.includes('usa, canada, usa timezones')) return { continent: 'Americas', country: 'Multiple Locations', city: 'US & Canada' };
    if (lower.includes('americas, europe, asia, africa, oceania')) return { continent: 'Remote', country: 'Remote', city: 'Worldwide' };
    if (lower.includes('americas, europe, israel')) return { continent: 'Multiple Continents', country: 'Multiple Locations', city: 'Americas, Europe, Israel' };
    if (lower.includes('mobiles arbeiten - deutschland') || lower.includes('deutschlandweit')) return { continent: 'Europe', country: 'Germany', city: 'Germany (Remote)' };

    raw = raw.replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '').trim(); 
    raw = raw.replace(/\([^)]+\)/g, '').trim();
    raw = raw.replace(/\bHQ\b/gi, '').trim();
    raw = raw.replace(/\boffice\b/gi, '').trim(); 
    raw = raw.replace(/\bhybrid\b/gi, '').trim(); 
    raw = raw.replace(/^-|-$/g, '').trim(); 
    
    if (raw.includes(';') || raw.includes('/')) {
       return { continent: 'Multiple Continents', country: 'Multiple Locations', city: raw };
    }

    let parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    let single = parts[0] || '';
    let singleLower = single.toLowerCase();
    
    if (parts.length >= 2) {
      let potentialCountry = parts[parts.length - 1];
      let pLower = potentialCountry.toLowerCase();
      let cName = countryMap.get(pLower);
      if (cName) {
         let country = cName;
         let city = parts.slice(0, parts.length - 1).join(', ');
         if (countryMap.has(city.toLowerCase())) {
             let temp = country;
             country = countryMap.get(city.toLowerCase())!;
             city = temp;
         }
         return { continent: getContinent(country), country, city };
      }
      
      // Check if any part is a known city
      for (const part of parts) {
         let p = part.toLowerCase();
         let cityObj = cityMap.get(p);
         if (cityObj) {
            let countryName = cityObj.country;
            if (countryName) return { continent: getContinent(countryName), country: countryName, city: cityObj.city };
         }
      }
    }
    
    if (!single) return { continent: 'Other', country: 'Other', city: '' };
    
    let cName = countryMap.get(singleLower);
    if (cName) return { continent: getContinent(cName), country: cName, city: '' };
    
    let cityObj = cityMap.get(singleLower);
    if (cityObj) {
       let countryName = cityObj.country;
       if (countryName) return { continent: getContinent(countryName), country: countryName, city: cityObj.city };
    }
    
    if (['europe', 'emea', 'eu'].includes(singleLower)) return { continent: 'Europe', country: 'Europe', city: '' };
    if (['asia', 'apac'].includes(singleLower)) return { continent: 'Asia', country: 'Asia', city: '' };
    if (['americas'].includes(singleLower)) return { continent: 'Americas', country: 'Americas', city: '' };
    if (singleLower.includes('remote')) return { continent: 'Remote', country: 'Remote', city: single };

    return { continent: getContinent(single), country: single, city: '' };
};

const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  app.post("/api/extract-text", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `
        You are an expert job description data extraction assistant.
        Extract the job application information from this text carefully.
        IMPORTANT: The text might be a messy copy-paste from a job board (like LinkedIn or Indeed) and may contain UI artifacts (e.g., "company logo", "star rating", foreign language UI text like "Ansökan har skickats" or "recensioner"). 
        You MUST STILL identify the core job details and NOT just dump everything into the notes field. Do your best to find the role and company from the text.

        Guidelines:
        - "position": Clean job title. Omit gender/diversity suffixes such as (m/w/d), (f/m/d), (m/f/x), (d/f/m), (all genders), etc. If you see something like "Student Worker Part Time", the position is "Student Worker" or "Student Worker Part Time".
        - "company": The company, team, or department name (e.g. "Bosch Group"). If a line lists "Company/Team · Location (Mode)" or "Company - Location", extract ONLY the company name. Strip locations, work modes, and posting metadata from the company name.
        - "location": The physical geographic job location ONLY (city, region, country), e.g. "Berlin, Germany", "Luxembourg", "San Francisco, CA", "London, UK", "Lund, Skåne län".
          STRICT REQUIREMENTS FOR LOCATION:
          1. Extract ONLY valid physical geographic locations (city, region, country).
          2. You MUST strictly exclude and strip non-location metadata such as posting dates/times ("2 days ago", "1 week ago", "Posted yesterday"), applicant counts ("Over 100 applicants", "50+ applicants", "23 applicants"), or work mode tags ("On-site", "Hybrid", "Remote").
          3. Example: If the text is "Berlin, Germany · 2 days ago · Over 100 applicants", extract ONLY "Berlin, Germany" as "location", and put posting metadata ("Posted 2 days ago · Over 100 applicants") into "notes".
        - "workType": Workplace model policy if mentioned in text e.g. "On-site", "Hybrid", or "Remote". Must strictly be one of: "On-site", "Hybrid", "Remote", or null if not mentioned.
        - "notes": Summary of key details, responsibilities, job post metadata (such as "2 days ago", "Over 100 applicants"), or salary if mentioned. Do NOT put the company or position in here if they can be identified.

        Return ONLY a JSON object with this schema:
        {
          "company": "Company Name",
          "position": "Clean Job Title",
          "location": "Clean Physical Location e.g. Luxembourg or Berlin, Germany",
          "workType": "On-site" | "Hybrid" | "Remote" | null,
          "notes": "Relevant details / notes including posting date and applicant counts"
        }

        Job Description Text:
        ${text.substring(0, 15000)}
      `;

      const response = await generateContentWithRetry(ai, {
        preferredModel: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const application = safeParseJSON(responseText, {});

      res.json({ application });
    } catch (error: any) {
      console.error("Text Extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract text" });
    }
  });

  app.post("/api/extract-pdf", async (req, res) => {
    try {
      const { pdfBase64 } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ error: "No PDF data provided" });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `
        You are a data extraction assistant.
        Extract all job applications mentioned in this PDF.
        Return ONLY a JSON array of objects with the following schema:
        [
          {
            "company": "Company Name",
            "position": "Job Title",
            "status": "Saved" | "Applied" | "Screening" | "Technical" | "Final" | "Offer" | "Rejected" | "Ghosted",
            "notes": "Any other details, salary, etc."
          }
        ]
        If no applications are found, return [].
      `;

      const response = await generateContentWithRetry(ai, {
        preferredModel: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: pdfBase64,
                  mimeType: "application/pdf"
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "[]";
      const applications = safeParseJSON(responseText, []);

      res.json({ applications });
    } catch (error: any) {
      console.error("PDF Extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract PDF" });
    }
  });

  app.post("/api/cv-match", async (req, res) => {
    try {
      const { targetRole, cvText, pdfBase64, jobDescription } = req.body;
      if (!jobDescription) {
        return res.status(400).json({ error: "Job description is required" });
      }
      if (!cvText && !pdfBase64) {
        return res.status(400).json({ error: "CV text or PDF file is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const role = targetRole || "Tech Hiring Manager";

      const promptText = `
You are a Senior Hiring Manager, Technical Recruiter, and Lead Evaluator specializing in the role of: ${role}.
You will be given a candidate's CV (resume) and a Job Description (JD).
Your task is to conduct a rigorous, intelligent evaluation of the candidate's CV against the Job Description specifically through the technical and domain lens of a ${role}.

Methodology & Rules:
1. Evaluate using ABDUCTIVE REASONING:
   - Do NOT just perform basic keyword matching.
   - Observe the underlying evidence in the candidate's past projects, architecture, tools, metrics, leadership, and experience.
   - Intelligently infer their true capability, technical depth, and potential to fulfill the required duties in the JD.

2. Score & Category Definition:
   - 80 to 100: "High Match" (Strong alignment, fulfills key requirements with high technical evidence)
   - 60 to 79: "Medium Match" (Solid baseline, but has notable competency gaps or framing issues)
   - Below 60: "Low Match" (Significant missing technical or domain competencies)

3. Actionable Polish:
   - Provide concrete, strategic guidance on how to rewrite bullet points in the candidate's CV to elevate their experience, reframe basic work into high-impact accomplishments, and bridge missing gaps for this specific JD.

4. Forecasted Interview Questions:
   - Provide 3 realistic, high-probability interview questions that a top interviewer for this role would ask based on the candidate's CV and this JD.

You MUST return your analysis strictly as a JSON object with this exact structure:
{
  "company_name": "Extracted Company Name from Job Description (or 'Unknown Company' if not found)",
  "score": 85,
  "matchCategory": "High Match",
  "strengths": [
    "Array of 2-3 strong alignment points based on evidence in CV"
  ],
  "gaps": [
    "Array of 1-2 missing competencies or areas needing stronger evidence"
  ],
  "actionable_polish": "Specific instruction on how to rewrite CV bullet points to elevate experience and address gaps.",
  "interview_questions": [
    "Tailored question 1",
    "Tailored question 2",
    "Tailored question 3"
  ]
}

Job Description:
${jobDescription.substring(0, 15000)}

${cvText ? `Candidate CV Text:\n${cvText.substring(0, 20000)}` : ''}
`;

      let contentsPayload: any;
      if (pdfBase64 && !cvText) {
        contentsPayload = [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: pdfBase64,
                  mimeType: "application/pdf"
                }
              },
              { text: promptText }
            ]
          }
        ];
      } else {
        contentsPayload = promptText;
      }

      const response = await generateContentWithRetry(ai, {
        preferredModel: "gemini-3.6-flash",
        contents: contentsPayload,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const result = safeParseJSON(responseText, {});

      // Calculate matchCategory if missing or out of sync
      const rawScore = typeof result.score === "number" ? result.score : 70;
      let computedCategory = "Medium Match";
      if (rawScore >= 80) computedCategory = "High Match";
      else if (rawScore < 60) computedCategory = "Low Match";

      res.json({
        company_name: result.company_name || "Unknown Company",
        score: Math.min(100, Math.max(0, rawScore)),
        matchCategory: result.matchCategory || computedCategory,
        strengths: Array.isArray(result.strengths) ? result.strengths : ["Good background alignment"],
        gaps: Array.isArray(result.gaps) ? result.gaps : ["Ensure all key technical keywords from JD are explicitly documented"],
        actionable_polish: result.actionable_polish || "Reframe past bullet points with quantified metrics and explicit technical tools mentioned in the job description.",
        interview_questions: Array.isArray(result.interview_questions) ? result.interview_questions : [
          "Walk me through a complex technical challenge from your past experience.",
          "How do you handle scope changes or tight deadlines?",
          "What is your approach to system quality and scalability?"
        ]
      });
    } catch (error: any) {
      console.error("CV Match error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze CV match" });
    }
  });

  // In-memory cache for global market jobs to avoid rate limits
  let marketJobsCache: any[] = [];
  let marketJobsLastFetch = 0;
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  app.get("/api/market-jobs", async (req, res) => {
    try {
      const now = Date.now();
      if (marketJobsCache.length > 0 && (now - marketJobsLastFetch < CACHE_TTL)) {
        return res.json({ jobs: marketJobsCache });
      }

      // Aggregate from multiple sources
      let allJobs: any[] = [];
      
      const fetchRemotive = async () => {
        try {
          const categories = ['software-dev', 'product', 'design', 'data'];
          for (const category of categories) {
            const response = await fetch(`https://remotive.com/api/remote-jobs?category=${category}&limit=25`);
            if (response.ok) {
              
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.error("Invalid JSON response:", text.substring(0, 100));
                return;
              }

              if (data.jobs && Array.isArray(data.jobs)) {
                // Focus: Specifically for remote tech jobs in Europe or UK
                const filteredJobs = data.jobs.filter((job: any) => {
                  const loc = (job.candidate_required_location || '').toLowerCase();
                  return loc.includes('europe') || loc.includes('uk') || loc.includes('emea') || loc.includes('worldwide') || loc.includes('global') || loc.includes('anywhere');
                });
                
                allJobs = allJobs.concat(filteredJobs.map((job: any) => ({
                  ...job,
                  id: `remotive-${job.id}`
                })));
              }
            }
          }
        } catch (e) {
          console.error("Remotive fetch error:", e);
        }
      };

      const fetchArbeitnow = async () => {
        try {
          const response = await fetch('https://www.arbeitnow.com/api/job-board-api');
          if (response.ok) {
            
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.error("Invalid JSON response:", text.substring(0, 100));
                return;
              }

            if (data.data && Array.isArray(data.data)) {
              allJobs = allJobs.concat(data.data.map((item: any) => ({
                id: `arbeitnow-${item.slug || Date.now()}`,
                url: item.url,
                title: item.title,
                company_name: item.company_name,
                company_logo: '',
                category: 'software-dev', // Default mapping
                tags: item.tags || [],
                job_type: item.job_types?.[0] || 'full_time',
                publication_date: new Date(item.created_at * 1000).toISOString(),
                candidate_required_location: item.location || (item.remote ? 'Remote' : 'Unknown'),
                salary: '',
                description: item.description || ''
              })));
            }
          }
        } catch (e) {
          console.error("Arbeitnow fetch error:", e);
        }
      };

      const fetchWeWorkRemotely = async () => {
        try {
          const Parser = (await import('rss-parser')).default;
          const parser = new Parser();
          const feed = await parser.parseURL('https://weworkremotely.com/categories/remote-programming-jobs.rss');
          if (feed.items && Array.isArray(feed.items)) {
            allJobs = allJobs.concat(feed.items.map((item: any) => {
              const titleParts = item.title?.split(':') || [];
              const company_name = titleParts.length > 1 ? titleParts[0].trim() : 'Unknown Company';
              const title = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : item.title;
              return {
                id: `wwr-${item.guid || Date.now()}`,
                url: item.link,
                title: title,
                company_name: company_name,
                company_logo: '',
                category: 'software-dev',
                tags: ['remote'],
                job_type: 'full_time',
                publication_date: item.isoDate || new Date().toISOString(),
                candidate_required_location: 'Remote',
                salary: '',
                description: item.contentSnippet || item.content || ''
              };
            }));
          }
        } catch (e) {
          console.error("WWR fetch error:", e);
        }
      };

      
      const fetchJooble = async () => {
        try {
          const joobleKey = process.env.JOOBLE_API_KEY || "f5932433-ee6c-4433-bef6-10585e0b7606";
          const queries = ['developer', 'software engineer', 'product manager', 'designer', 'data'];
          
          for (const query of queries) {
            const response = await fetch(`https://jooble.org/api/${joobleKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keywords: query, location: 'Europe' })
            });
            
            if (response.ok) {
              
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.error("Invalid JSON response:", text.substring(0, 100));
                return;
              }

              if (data.jobs && Array.isArray(data.jobs)) {
                allJobs = allJobs.concat(data.jobs.map((job: any) => ({
                  id: `jooble-${job.id}`,
                  url: job.link,
                  title: job.title,
                  company_name: job.company || 'Unknown',
                  company_logo: '',
                  category: query === 'designer' ? 'design' : (query === 'data' ? 'data' : (query === 'product manager' ? 'product' : 'software-dev')),
                  tags: ['jooble', 'europe'],
                  job_type: job.type || 'full_time',
                  publication_date: job.updated ? new Date(job.updated).toISOString() : new Date().toISOString(),
                  candidate_required_location: job.location || 'Unknown',
                  salary: job.salary || '',
                  description: job.snippet || ''
                })));
              }
            }
          }
        } catch (e) {
          console.error("Jooble fetch error:", e);
        }
      };

      
      const fetchJobicy = async () => {
        try {
          // Fetch EMEA jobs
          const response = await fetch('https://jobicy.com/api/v2/remote-jobs?geo=emea&count=50');
          if (response.ok) {
            
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.error("Invalid JSON response:", text.substring(0, 100));
                return;
              }

            if (data.jobs && Array.isArray(data.jobs)) {
              allJobs = allJobs.concat(data.jobs.map((job: any) => ({
                id: `jobicy-${job.id}`,
                url: job.url,
                title: job.jobTitle,
                company_name: job.companyName || 'Unknown',
                company_logo: job.companyLogo || '',
                category: 'software-dev', // Default mapping
                tags: job.jobIndustry || [],
                job_type: job.jobType?.[0] || 'full_time',
                publication_date: new Date().toISOString(), // Jobicy lastUpdate or fallback
                candidate_required_location: job.jobGeo || 'EMEA',
                salary: '',
                description: job.jobDescription || job.jobExcerpt || ''
              })));
            }
          }
        } catch (e) {
          console.error("Jobicy fetch error:", e);
        }
      };

      
      const fetchAdzuna = async () => {
        try {
          const appId = process.env.ADZUNA_APP_ID || "bbb9bf36";
          const appKey = process.env.ADZUNA_APP_KEY || "912639b735ecfa6e7699135fbc31a469";
          const countries = ['gb', 'de', 'fr', 'nl', 'it', 'es', 'pl'];
          
          for (const country of countries) {
            const response = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=developer`);
            
            if (response.ok) {
              
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.error("Invalid JSON response:", text.substring(0, 100));
                return;
              }

              if (data.results && Array.isArray(data.results)) {
                allJobs = allJobs.concat(data.results.map((job: any) => ({
                  id: `adzuna-${job.id}`,
                  url: job.redirect_url,
                  title: job.title,
                  company_name: job.company?.display_name || 'Unknown',
                  company_logo: '',
                  category: 'software-dev',
                  tags: ['adzuna', 'europe'],
                  job_type: job.contract_type || 'full_time',
                  publication_date: job.created || new Date().toISOString(),
                  candidate_required_location: job.location?.display_name || 'Europe',
                  salary: job.salary_min ? `${job.salary_min} - ${job.salary_max}` : '',
                  description: job.description || ''
                })));
              }
            }
          }
        } catch (e) {
          console.error("Adzuna fetch error:", e);
        }
      };

      
      const fetchReed = async () => {
        try {
          // You must provide the reed API key via env var, defaults to empty to not break if missing
          const reedKey = process.env.REED_API_KEY || "b391d941-0228-4cec-a21a-e6578ff43abe";

          // Reed requires basic auth with API key as username and empty password
          const authHeader = 'Basic ' + Buffer.from(reedKey + ':').toString('base64');
          
          const response = await fetch('https://www.reed.co.uk/api/1.0/search?keywords=developer&resultsToTake=50', {
            headers: {
              'Authorization': authHeader
            }
          });
          
          if (response.ok) {
            
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.error("Invalid JSON response:", text.substring(0, 100));
                return;
              }

            if (data.results && Array.isArray(data.results)) {
              allJobs = allJobs.concat(data.results.map((job: any) => ({
                id: `reed-${job.jobId}`,
                url: job.jobUrl,
                title: job.jobTitle,
                company_name: job.employerName || 'Unknown',
                company_logo: '',
                category: 'software-dev',
                tags: ['reed', 'uk'],
                job_type: job.contractType === 'Permanent' ? 'full_time' : 'contract',
                publication_date: job.date || new Date().toISOString(),
                candidate_required_location: job.locationName || 'United Kingdom',
                salary: job.minimumSalary ? `£${job.minimumSalary} - £${job.maximumSalary}` : '',
                description: job.jobDescription || ''
              })));
            }
          }
        } catch (e) {
          console.error("Reed fetch error:", e);
        }
      };

      const fetchHackerNews = async () => {
        try {
          const response = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json');
          if (response.ok) {
            
            const text = await response.text();
            let ids;
            try {
              ids = JSON.parse(text);
            } catch(e) { return; }

            if (Array.isArray(ids)) {
              const topIds = ids.slice(0, 30);
              const items = await Promise.all(topIds.map(async (id) => {
                const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                
                if (itemRes.ok) {
                  const itemText = await itemRes.text();
                  try {
                    return JSON.parse(itemText);
                  } catch(e) { return null; }
                }

                return null;
              }));
              
              allJobs = allJobs.concat(items.filter(Boolean).map((item: any) => ({
                id: `hn-${item.id}`,
                url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
                title: item.title,
                company_name: item.by || 'Hacker News User',
                company_logo: 'https://news.ycombinator.com/y18.svg',
                category: 'software-dev',
                tags: ['yc', 'startup'],
                job_type: 'full_time',
                publication_date: item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString(),
                candidate_required_location: 'Unknown',
                salary: '',
                description: 'Visit Hacker News or the provided link for more details.'
              })));
            }
          }
        } catch (e) {
          console.error("HN fetch error:", e);
        }
      };

      // Run all fetches in parallel
      await Promise.allSettled([
        fetchRemotive(),
        fetchArbeitnow(),
        fetchWeWorkRemotely(),
        fetchHackerNews(),
        fetchAdzuna(),
        fetchJobicy(),
        fetchJooble(),
        fetchReed()
      ]);

      // Sort by newest first
      allJobs.sort((a, b) => new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime());
      
      // Deduplicate by ID
      const seenIds = new Set();
      const uniqueJobs = [];
      
      for (const job of allJobs) {
        if (!seenIds.has(job.id)) {
          seenIds.add(job.id);
          job.parsed_location = parseLocation(job.candidate_required_location);
          uniqueJobs.push(job);
        }
      }
      
// Update cache
      marketJobsCache = uniqueJobs;
      marketJobsLastFetch = now;

      res.json({ jobs: marketJobsCache });
    } catch (error: any) {
      console.error("Market Jobs error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch market jobs" });
    }
  });

  app.post("/api/extract-drive", async (req, res) => {
    try {
      const { fileId, accessToken } = req.body;
      if (!fileId || !accessToken) {
        return res.status(400).json({ error: "Missing fileId or accessToken" });
      }

      const metaResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!metaResponse.ok) {
        const errText = await metaResponse.text();
        throw new Error(`Failed to fetch file metadata: ${errText}`);
      }
      
      const meta: any = await metaResponse.json();
      let fileText = "";
      
      if (meta.mimeType === "application/vnd.google-apps.document") {
        const exportResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
           headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!exportResponse.ok) throw new Error("Failed to export Google Doc");
        fileText = await exportResponse.text();
      } else {
        const dlResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
           headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!dlResponse.ok) throw new Error("Failed to download file content (unsupported format for direct text extraction)");
        fileText = await dlResponse.text();
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `
        You are a data extraction assistant.
        Extract all job applications mentioned in this document.
        Return ONLY a JSON array of objects with the following schema:
        [
          {
            "company": "Company Name",
            "position": "Job Title",
            "status": "Saved" | "Applied" | "Screening" | "Technical" | "Final" | "Offer" | "Rejected" | "Ghosted",
            "notes": "Any other details, salary, etc."
          }
        ]
        If no applications are found, return [].
        
        Document Content:
        ${fileText.substring(0, 50000)}
      `;

      const response = await generateContentWithRetry(ai, {
        preferredModel: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "[]";
      const applications = safeParseJSON(responseText, []);

      res.json({ applications });
    } catch (error: any) {
      console.error("Drive Extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract from Drive" });
    }
  });

  // Global express error handler to ensure JSON responses for API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express API error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
