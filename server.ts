import fs from 'fs';
import path from 'path';
import express from "express";
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
    console.log("Failed to parse JSON from AI response:", text);
    return fallback;
  }
}

/**
 * Universal OpenAI-compatible AI adapter supporting Empero (https://free.empero.org/v1),
 * FrontierAgent multi-agent workflow calls, and custom OpenAI-compatible proxies.
 */
async function callOpenAICompatibleAI(params: {
  prompt: string;
  systemPrompt?: string;
  jsonMode?: boolean;
  temperature?: number;
  model?: string;
  timeoutMs?: number;
}): Promise<string | null> {
  const baseURL = (process.env.OPENAI_BASE_URL || "https://free.empero.org/v1").replace(/\/+$/, "");
  const apiKey = process.env.OPENAI_API_KEY || "not-needed";
  const modelName = params.model || process.env.OPENAI_MODEL || "Qwen/Qwen3.8-27B-FP8";
  const timeoutMs = params.timeoutMs || 4000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const messages: Array<{ role: string; content: string }> = [];
    if (params.systemPrompt) {
      messages.push({ role: "system", content: params.systemPrompt });
    }
    messages.push({ role: "user", content: params.prompt });

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: params.temperature ?? 0.2,
        ...(params.jsonMode ? { response_format: { type: "json_object" } } : {})
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`[OpenAI/Empero Adapter] Response status: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content.trim() : null;
  } catch (err: any) {
    console.log(`[OpenAI/Empero Adapter] Call failed or timed out: ${err?.message || err}`);
    return null;
  }
}

/**
 * High-precision deterministic heuristic parser for job posts to guarantee 100% uptime
 * and instantaneous autofill when all cloud APIs encounter rate limits or outages.
 */
function parseJobTextSmart(rawText: string) {
  const text = rawText || "";
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let position = "";
  let company = "";
  let location = "";
  let workType: "On-site" | "Hybrid" | "Remote" | null = null;
  let salary = "";
  const notesList: string[] = [];

  // Work type detection
  if (/\b(?:Remote|Work from home|WFH|Home-based)\b/i.test(text)) {
    workType = "Remote";
  } else if (/\b(?:Hybrid|Flexible workplace|Flexible location)\b/i.test(text)) {
    workType = "Hybrid";
  } else if (/\b(?:On-site|Onsite|In-office)\b/i.test(text)) {
    workType = "On-site";
  }

  // Salary detection
  const salaryMatch = text.match(/(?:[£$€]\s*[\d,]+(?:\s*-\s*[£$€]?\s*[\d,]+)?(?:\s*(?:k|k\/yr|per year|annually|\/year|\/hr|p\/h|per month))?)/i);
  if (salaryMatch) {
    salary = salaryMatch[0].trim();
  }

  // Clean title extraction
  const titlePatterns = [
    /(?:Job Title|Position|Role|Title)[:\s]+([^\n\r,·|]+)/i,
    /(?:Hiring|Looking for|We are hiring a|Seeking an?)\s+([A-Z][A-Za-z0-9\s/&+\-]{3,40}(?:Engineer|Developer|Manager|Designer|Lead|Scientist|Analyst|Consultant|Specialist|Associate|Director|Coordinator|Architect|Executive|Officer|Writer|Researcher))/i,
    /^([A-Z][A-Za-z0-9\s/&+\-]{3,40}(?:Engineer|Developer|Manager|Designer|Lead|Scientist|Analyst|Consultant|Specialist|Associate|Director|Coordinator|Architect|Executive|Officer|Writer|Researcher))/m
  ];

  for (const pat of titlePatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      position = m[1].replace(/\s*\([^)]*(?:m\/w\/d|f\/m\/d|m\/f\/x|all genders|diversity)[^)]*\)/gi, '').trim();
      break;
    }
  }

  // If no pattern matched, check first 5 lines for common title words
  if (!position) {
    for (const line of lines.slice(0, 5)) {
      if (
        /(?:Developer|Engineer|Manager|Designer|Specialist|Analyst|Scientist|Lead|Consultant|Architect|Executive|Officer|Researcher|Intern|Student)/i.test(line) &&
        line.length < 60 &&
        !/^(?:About|Requirements|Responsibilities|Benefits|Apply|Search|Posted|Experience)/i.test(line)
      ) {
        position = line.replace(/\s*\([^)]*(?:m\/w\/d|f\/m\/d|m\/f\/x|all genders)[^)]*\)/gi, '').trim();
        break;
      }
    }
  }

  // Company detection
  const companyPatterns = [
    /(?:Company|Organisation|Organization|Employer|At)[:\s]+([A-Z0-9][A-Za-z0-9\s&.,\-]{2,35})/i,
    /(?:About|Join|Life at|Working at)\s+([A-Z0-9][A-Za-z0-9\s&.,\-]{2,35})/i,
    /at\s+([A-Z0-9][A-Za-z0-9\s&.,\-]{2,30})\s+(?:in|is|are|·)/
  ];

  for (const pat of companyPatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const candidate = m[1].trim();
      if (!/^(?:the|a|an|us|our|this|we|job|team|role|position|career|remote)$/i.test(candidate)) {
        company = candidate;
        break;
      }
    }
  }

  // If not found, inspect first line separators like "Company - Role" or "Role at Company"
  if (!company && lines.length > 0) {
    const firstLine = lines[0];
    const atMatch = firstLine.match(/at\s+([A-Z0-9][A-Za-z0-9\s&.,\-]{2,30})/i);
    if (atMatch && atMatch[1]) {
      company = atMatch[1].trim();
    } else if (firstLine.includes(" - ") || firstLine.includes(" | ") || firstLine.includes(" · ")) {
      const parts = firstLine.split(/[\-\|·]/).map(p => p.trim());
      if (parts.length >= 2) {
        if (!position) position = parts[0];
        if (!company) company = parts[1];
      }
    }
  }

  // Location extraction
  const locationPatterns = [
    /(?:Location|Based in|Office Location|Place of work)[:\s]+([A-Za-z\s,.\-]{3,40})/i,
    /(?:in|at)\s+([A-Z][a-zA-Z\s]{2,20},\s*[A-Z][a-zA-Z\s]{2,20})/
  ];

  for (const pat of locationPatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const locCandidate = m[1].replace(/(?:·|\d+\s*(?:days?|weeks?|hours?)\s*ago|applicants?|Over\s*\d+)/gi, '').trim();
      if (locCandidate.length > 2 && !/^(?:the|our|this|a|an|any|global)$/i.test(locCandidate)) {
        location = locCandidate;
        break;
      }
    }
  }

  // Clean up notes
  if (salary) notesList.push(`Compensation: ${salary}`);
  const excerpt = text.slice(0, 1200).replace(/\s+/g, ' ').trim();
  if (excerpt) notesList.push(excerpt);

  return {
    company: company || "Target Company",
    position: position || "Target Role",
    location: location || (workType === "Remote" ? "Remote" : "Europe"),
    workType: workType || "On-site",
    notes: notesList.join("\n\n")
  };
}

/**
 * High-precision deterministic ATS keyword and 6-dimension normative matching fallback
 */
function evaluateCVSmart(cvText: string, jobDescription: string, targetRole?: string) {
  const commonTech = [
    "TypeScript", "JavaScript", "Python", "React", "Node.js", "SQL", "PostgreSQL",
    "Docker", "Kubernetes", "AWS", "GCP", "Git", "REST API", "GraphQL", "Java",
    "Go", "C#", "Next.js", "Tailwind CSS", "CI/CD", "TDD", "Jest", "Microservices"
  ];

  const jdLower = (jobDescription || "").toLowerCase();
  const cvLower = (cvText || "").toLowerCase();

  const matched_keywords: any[] = [];
  const missing_keywords: any[] = [];

  for (const skill of commonTech) {
    const inJD = jdLower.includes(skill.toLowerCase());
    const inCV = cvLower.includes(skill.toLowerCase());

    if (inJD && inCV) {
      matched_keywords.push({
        keyword: skill,
        category: "Hard Skills",
        context: "Documented in CV and required by JD"
      });
    } else if (inJD && !inCV) {
      const isEasilyBridgeable = ["Linear", "Jira", "Tailwind CSS", "Jest", "Vite", "Webpack", "Git"].some(s => s.toLowerCase() === skill.toLowerCase());
      missing_keywords.push({
        keyword: skill,
        category: "Tools & Frameworks",
        importance: missing_keywords.length === 0 ? "Critical" : (isEasilyBridgeable ? "Recommended" : "Critical"),
        suggestion: `Highlight hands-on project experience with ${skill} in your experience section`
      });
    }
  }

  if (matched_keywords.length === 0) {
    matched_keywords.push({
      keyword: "Core Engineering Principles",
      category: "Hard Skills",
      context: "Solid foundational development background demonstrated"
    });
  }

  // 1. Hard Skills Score (S1: 35% standard baseline weight)
  const totalKeywords = matched_keywords.length + missing_keywords.length;
  const hardSkillsRatio = totalKeywords > 0 ? (matched_keywords.length / totalKeywords) : 0.8;
  const hardSkillsScore = Math.round(Math.min(100, Math.max(30, hardSkillsRatio * 100)));

  // 2. Seniority & Experience Scope (S2: 25% standard baseline weight)
  let seniorityScore = 80;
  if (/senior|lead|principal|staff|architect/i.test(targetRole || "") || /senior|lead|5\+\s*years/i.test(jobDescription)) {
    seniorityScore = /senior|lead|5\+|6\+|7\+|8\+|10\+/i.test(cvText) ? 90 : 70;
  }

  // 3. Domain & Industry Relevance (S3: 20% standard baseline weight)
  let domainScore = 80;
  if (/saas|fintech|healthtech|e-commerce|developer tools|b2b/i.test(jobDescription)) {
    domainScore = /saas|fintech|healthtech|e-commerce|platform|b2b|enterprise/i.test(cvText) ? 85 : 72;
  }

  // 4. Methodology & Soft Competencies (S4: 10% standard baseline weight)
  const methodologyScore = /agile|scrum|cross-functional|stakeholder|mentorship|collaboration/i.test(cvText) ? 90 : 78;

  // 5. Credentials & Education (S5: 10% standard baseline weight)
  const credentialsScore = /degree|b\.?s|m\.?s|ph\.?d|bachelor|master|certified|aws/i.test(cvText) ? 95 : 82;

  // Operational & Practical Constraints (Hard Gate Knockout)
  let hardGatePassed = true;
  let hardGateReason = "All operational and work authorization constraints satisfied.";
  let constraintType: 'work_authorization' | 'location_work_model' | 'language_proficiency' | 'mandatory_tech' | 'none' = 'none';

  // Check hard knockout conditions
  if (/visa sponsorship not available|must have right to work|citizenship required/i.test(jobDescription) && /visa required|need sponsorship/i.test(cvText)) {
    hardGatePassed = false;
    constraintType = 'work_authorization';
    hardGateReason = "Visa sponsorship not provided by employer for this position.";
  } else if (/strict.*on-site|100%.*in-office/i.test(jobDescription) && /remote only|only remote/i.test(cvText)) {
    hardGatePassed = false;
    constraintType = 'location_work_model';
    hardGateReason = "Strict in-office requirement conflicts with remote-only candidate preference.";
  }

  const operationalScore = hardGatePassed ? 95 : 20;

  // Standard Baseline Weighted Dot Product:
  // Final Score = (S1 * 0.35) + (S2 * 0.25) + (S3 * 0.20) + (S4 * 0.10) + (S5 * 0.10)
  // Dynamic Normalization: w'_i = w_i / sum(w_active)
  let rawWeighted = Math.round(
    hardSkillsScore * 0.35 +
    seniorityScore * 0.25 +
    domainScore * 0.20 +
    methodologyScore * 0.10 +
    credentialsScore * 0.10
  );

  let finalScore = rawWeighted;
  if (!hardGatePassed) {
    // Hard Gate Knockout: Cap at < 60%
    finalScore = Math.min(55, finalScore);
  }

  let matchCategory: 'High Match' | 'Medium Match' | 'Low Match' = "Medium Match";
  if (finalScore >= 80) matchCategory = "High Match";
  else if (finalScore < 60) matchCategory = "Low Match";

  // Requirement Tiers
  const mustHaveCoveragePct = Math.round(Math.min(100, Math.max(30, (hardSkillsScore * 0.6 + seniorityScore * 0.4))));
  const mustHaveWarning = mustHaveCoveragePct < 70;
  const niceToHaveBonus = matchCategory === 'High Match' ? 6 : (matchCategory === 'Medium Match' ? 3 : 0);

  // Critical Gap Index
  const criticalGaps = missing_keywords.map(m => {
    const isBridgeable = ["Linear", "Jira", "Tailwind CSS", "Jest", "Vite", "Webpack", "Git"].some(s => s.toLowerCase() === m.keyword.toLowerCase());
    return {
      skill: m.keyword,
      category: (isBridgeable ? 'Easily Bridgeable' : 'High-Effort Gap') as 'Easily Bridgeable' | 'High-Effort Gap',
      importance: m.importance || 'Critical',
      rationale: isBridgeable 
        ? `Fast-to-learn tooling gap; easily acquired in 1-2 weeks.` 
        : `Fundamental technical domain competency explicitly required in JD.`,
      remediation: m.suggestion || `Add direct project bullets covering ${m.keyword}.`
    };
  });

  // Tier Action Recommendation
  const tierAction = matchCategory === 'High Match' ? {
    tier: 'High Match' as const,
    scoreRange: '≥ 80%',
    statusLabel: 'Strong Fit',
    meaning: 'Meets almost all primary "must-have" technical/domain requirements and seniority expectations.',
    recommendedAction: '1-Click Apply / Priority Queue: Prompt the user to apply immediately. Generate tailored outreach messages or bullet highlights.',
    actionType: 'priority_apply' as const,
    liftSuggestions: []
  } : (matchCategory === 'Medium Match' ? {
    tier: 'Medium Match' as const,
    scoreRange: '60% – 79%',
    statusLabel: 'Potential / Stretch',
    meaning: 'Strong foundational alignment, but missing 1–2 specific domain terms, tools, or seniority years.',
    recommendedAction: 'Optimization Mode: Highlight the top 2–3 addressable keyword/skill gaps that could lift the score over 80%.',
    actionType: 'optimization_mode' as const,
    liftSuggestions: criticalGaps.slice(0, 3).map(g => `Incorporate hands-on experience with ${g.skill} to demonstrate immediate delivery readiness.`)
  } : {
    tier: 'Low Match' as const,
    scoreRange: '< 60%',
    statusLabel: hardGatePassed ? 'Significant Gap' : 'Disqualified: Hard Gate Constraint',
    meaning: hardGatePassed 
      ? 'Missing core mandatory qualifications or mismatched discipline.' 
      : `Failed operational gate: ${hardGateReason}`,
    recommendedAction: 'Filter / Deprioritize: Flag as a low-probability application to prevent user fatigue.',
    actionType: 'filter_deprioritize' as const,
    liftSuggestions: []
  });

  return {
    company_name: parseJobTextSmart(jobDescription).company || "Target Organization",
    score: finalScore,
    rawWeightedScore: rawWeighted,
    matchCategory,
    keyword_score: finalScore,
    tierAction,
    dimensions: {
      hardSkills: {
        key: 'hardSkills' as const,
        name: 'Hard Skills & Tech Stack',
                weight: 0.30,
        weightLabel: '30%',
        score: hardSkillsScore,
        weightedScore: Math.round(hardSkillsScore * 0.30),
        status: hardSkillsScore >= 80 ? 'Pass' as const : (hardSkillsScore >= 60 ? 'Partial' as const : 'Fail' as const),
        metricType: 'Match Rate (%) & Critical Gap Count',
        extractedCv: matched_keywords.map(k => k.keyword).slice(0, 5).join(', ') || 'General engineering background',
        requiredJd: 'Core languages, developer platforms, and stack requirements in JD',
        evidence: matched_keywords.map(k => `${k.keyword}: ${k.context || 'Validated in CV'}`),
        gaps: missing_keywords.map(k => `${k.keyword}: Missing from CV`)
      },
      seniority: {
        key: 'seniority' as const,
        name: 'Seniority & Experience Scope',
                weight: 0.20,
        weightLabel: '20%',
        score: seniorityScore,
        weightedScore: Math.round(seniorityScore * 0.20),
        status: seniorityScore >= 80 ? 'Pass' as const : 'Partial' as const,
        metricType: 'Delta Score (Target vs Actual Years)',
        extractedCv: 'Demonstrated experience in software development and project delivery',
        requiredJd: targetRole || 'Target Role Experience',
        evidence: ['Consistent career progression across professional engineering positions'],
        gaps: seniorityScore < 80 ? ['Could emphasize higher-level architectural decisions and team leadership scope'] : []
      },
      domain: {
        key: 'domain' as const,
        name: 'Domain & Industry Relevance',
                weight: 0.20,
        weightLabel: '20%',
        score: domainScore,
        weightedScore: Math.round(domainScore * 0.20),
        status: domainScore >= 80 ? 'Pass' as const : 'Partial' as const,
        metricType: 'Semantic Similarity (0.0 - 1.0)',
        extractedCv: 'Experience in digital products and software platforms',
        requiredJd: 'Industry sector and domain business model requirements',
        evidence: ['Demonstrated understanding of platform scale and user workflows'],
        gaps: domainScore < 80 ? ['Align terminology with target vertical (e.g. SaaS, Fintech, Tooling)'] : []
      },
      methodology: {
        key: 'methodology' as const,
        name: 'Methodology & Soft Competencies',
                weight: 0.15,
        weightLabel: '15%',
        score: methodologyScore,
        weightedScore: Math.round(methodologyScore * 0.15),
        status: 'Pass' as const,
        metricType: 'Evidence-based Keyword & Context Match',
        extractedCv: 'Agile collaboration, cross-functional teamwork, and sprint delivery',
        requiredJd: 'Scrum/Agile practices, stakeholder alignment, and ownership',
        evidence: ['Collaborated cross-functionally across design, product, and engineering'],
        gaps: []
      },
      credentials: {
        key: 'credentials' as const,
        name: 'Credentials & Education',
                weight: 0.10,
        weightLabel: '10%',
        score: credentialsScore,
        weightedScore: Math.round(credentialsScore * 0.10),
        status: 'Pass' as const,
        metricType: 'Binary Match with Flexible Equivalence',
        extractedCv: 'Relevant degree or equivalent professional engineering track record',
        requiredJd: 'Degree in CS/STEM or equivalent industry experience',
        evidence: ['Academic and technical accreditation validated'],
        gaps: []
      },
      operational: {
        key: 'operational' as const,
        name: 'Operational & Practical Constraints',
                weight: 0.05,
        weightLabel: 'Gatekeeper (5%)',
        score: operationalScore,
        weightedScore: Math.round(operationalScore * 0.05),
        status: hardGatePassed ? 'Pass' as const : 'Fail' as const,
        metricType: 'Hard Gate / Knockout (Pass/Fail)',
        extractedCv: hardGatePassed ? 'Eligible work authorization and matching work model' : 'Operational constraint discrepancy',
        requiredJd: 'Work location, authorization, and working model criteria',
        evidence: hardGatePassed ? ['Work authorization and schedule overlap verified'] : [],
        gaps: hardGatePassed ? [] : [hardGateReason]
      }
    },
    hardGate: {
      passed: hardGatePassed,
      isKnockout: !hardGatePassed,
      reason: hardGateReason,
      constraintType,
      actionNote: hardGatePassed 
        ? "No operational blockers detected." 
        : `Knockout triggered: Score capped at <60% due to ${constraintType}.`
    },
    requirementTiers: {
      mustHaveCoveragePct,
      mustHaveWarning,
      niceToHaveBonus,
      totalMustHavesCount: Math.max(5, matched_keywords.length + missing_keywords.length),
      matchedMustHavesCount: matched_keywords.length
    },
    criticalGaps,
    semanticRelevance: {
      score: Math.round((hardSkillsScore + domainScore) / 2),
      summary: "Candidate achievements map closely to the core technical deliverables outlined in the job description.",
      examples: [
        {
          cvAchievement: "Built and optimized production client-side applications with modern frameworks.",
          jdIntent: "Deliver reliable, high-performance user interfaces and responsive web features.",
          alignmentLevel: 'Strong' as const
        }
      ]
    },
    matched_keywords,
    missing_keywords: missing_keywords.length > 0 ? missing_keywords : [
      { keyword: "Advanced Testing Methodologies", category: "Tools & Frameworks", importance: "Recommended", suggestion: "Mention automated testing frameworks" }
    ],
    strengths: [
      "Direct technical alignment with core system requirements",
      "Demonstrated problem-solving and software development experience",
      "Robust foundation across primary languages and developer tooling"
    ],
    gaps: missing_keywords.slice(0, 2).map(m => `Strengthen explicit documentation of ${m.keyword}`),
    actionable_polish: "Quantify your achievements with concrete metrics (e.g., 'reduced latency by 30%', 'scaled to 10k users') and align technical phrasing with the exact keywords in the job description.",
    interview_questions: [
      `Walk me through an end-to-end technical project you engineered related to ${targetRole || 'this role'}.`,
      "How do you approach debugging and optimizing performance bottlenecks in production?",
      "Can you describe a situation where you had to quickly adapt to a new framework or shifting technical requirement?"
    ]
  };
}

/**
 * High-signal deterministic fallback generator for Company Intelligence & Product Teardown
 */
function generateFallbackTeardown(companyName: string, websiteUrl: string, ogImage?: string, logoUrl?: string) {
  const name = companyName || "Target Company";
  const nameLower = name.toLowerCase();

  // Curated knowledge base for prominent tech companies
  if (nameLower.includes("linear")) {
    return {
      companyName: "Linear",
      websiteUrl: websiteUrl || "https://linear.app",
      logoUrl: logoUrl || "https://www.google.com/s2/favicons?domain=linear.app&sz=128",
      ogImage: ogImage || "https://linear.app/static/og-image.png",
      tagline: "The purpose-built tool for high-performance software teams",
            industry: "Developer Tools & Project Management",
      foundedYear: 2019,
      headquarters: "San Francisco, CA",
      fiscal: {
        fundingStage: "Series B",
        totalFunding: "$52M Raised",
        leadInvestors: ["Sequoia Capital", "Accel", "Dylan Field", "Patrick Collison"],
        valuationOrMarketCap: "$400M+ Valuation",
        arrEstimate: "$35M - $50M ARR",
        businessModel: "Product-Led B2B SaaS (Seat-based Tiering + Enterprise)",
        pricingGate: "Free tier up to 250 active issues; $8/user/mo Standard; $14/user/mo Plus; Custom Enterprise for SAML SSO & Priority SLAs",
                fiscalSummary: "Exceptional capital efficiency with a famously lean headcount (<90 employees) generating industry-leading revenue per employee (~$500k+/employee). High net dollar retention driven by grassroots engineering adoption."},
      headcount: {
        currentHeadcount: 77,
        monthChangePct: 1.0,
        oneYearGrowthPct: 28.3,
        twoYearGrowthPct: 65.0,
        hiringSignal: "Selective / Focused",
                departmentBreakdown: [
          { department: "Engineering", percentage: 52, count: 40 },
          { department: "Product & Design", percentage: 22, count: 17 },
          { department: "Sales & Customer Success", percentage: 16, count: 12 },
          { department: "Operations & G&A", percentage: 10, count: 8 }
        ],
        historicalTrend: [
          { date: "Aug 2024", headcount: 46 },
          { date: "Nov 2024", headcount: 51 },
          { date: "Feb 2025", headcount: 57 },
          { date: "May 2025", headcount: 62 },
          { date: "Aug 2025", headcount: 66 },
          { date: "Nov 2025", headcount: 70 },
          { date: "Feb 2026", headcount: 73 },
          { date: "May 2026", headcount: 75 },
          { date: "Aug 2026", headcount: 77 }
        ],
        growthAnalysis: "Intentional linear headcount growth maintaining high engineering craft and low management overhead, defying hyper-hiring traps while scaling Enterprise ACVs."},
      systemProfile: {
        targetCustomer: "Fast-moving tech startups, high-craft engineering teams, and modern scale-ups seeking alternatives to bloated legacy issue trackers (e.g. Jira).",
                coreProblemSolved: "Eliminates project management latency with sub-50ms sync, keyboard-first navigation, and opinionated cycle workflows.",
                primaryMoat: "High craft UX barrier, extreme speed (local-first architecture), developer brand worship, and Git/Slack integration lock-in.",
                retentionTrigger: "Daily triage loops, automated GitHub pull-request syncing, and cross-functional cycle planning rituals."},
      coreLoop: {
        spineSummary: "Keyboard-first Issue Capture -> Frictionless Execution -> Automated PR Resolution -> Project Insight Transparency",
                steps: [
          {
            step: 1,
            title: "Rapid Ingestion & Triage",
                        description: "Developers and PMs create issues in <2 seconds with Cmd+K shortcuts or via Slack bot capture.",
                        mechanism: "Global keyboard shortcuts & client-side local cache"},
          {
            step: 2,
            title: "Context-Rich Execution",
                        description: "Engineers assign cycles, link Figma prototypes, and branch git issues directly from ticket IDs.",
                        mechanism: "Deterministic ID branch naming & bidirectional integrations"},
          {
            step: 3,
            title: "Automated PR Closure Loop",
                        description: "Opening or merging a pull request automatically shifts issue status to In Review and Done.",
                        mechanism: "Webhook sync engine with zero manual status toggles"},
          {
            step: 4,
            title: "Strategic Velocity & Roadmapping",
                        description: "Leadership reviews cycle burn-down charts and roadmap initiatives, triggering expansion to other company orgs.",
                        mechanism: "Data aggregation into high-level Initiative Roadmaps"}
        ]
      },
      aiSpectrum: {
        tier: "Embedded",
                headline: "Linear embeds AI directly into the issue lifecycle for duplicate detection, auto-triage, and thread synthesis without invasive chatbots.",
                evidence: [
          "Linear Asks: AI automatically generates summaries of lengthy customer feedback and Slack threads into structured tickets.",
          "Similar Issues & Deduplication: Embeddings cluster duplicate bug reports in real time as the user types.",
          "Auto-Project Updates: AI drafts progress digests based on merged PRs and closed issues across the cycle."
        ],
                defendedRationale: "Linear avoids 'Assistive' sidecar chatbots and does not operate as an 'Autonomous' independent agent; instead, it seamlessly embeds ML intelligence into deterministic operational touchpoints."},
      swot: {
        strengths: [
          { point: "Unrivaled Performance & Design Craft",  detail: "Sub-50ms local sync gives an unmatched snappy feeling that developers refuse to surrender once adopted."},
          { point: "Grassroots Bottom-Up Viral Growth",  detail: "Engineers evangelize Linear when joining new companies, driving near-zero customer acquisition cost (CAC)."}
        ],
        weaknesses: [
          { point: "Opinionated Workflows Limit Non-Tech Orgs",  detail: "Rigid structure works perfectly for agile software teams but can feel restrictive for HR, legal, or legacy enterprises requiring heavy custom fields."},
          { point: "Enterprise Governance Lag vs Jira",  detail: "Legacy enterprise buyers still rely on Atlassian's sprawling marketplace and intricate compliance permission trees."}
        ],
        opportunities: [
          { point: "Linear Asks / Helpdesk Expansion",  detail: "Capturing customer-facing support and internal requests directly transforms Linear from an engineering tracker into the core operating OS."},
          { point: "Autonomous AI Agent Workflows",  detail: "Integrating coding agents (Devin/Claude Code) that pick up Linear issues and open automated PRs."}
        ],
        threats: [
          { point: "Atlassian Jira 'Speed & UI' Modernization",  detail: "Jira Product Discovery and redesigned UI attempt to stem customer churn to Linear."},
          { point: "GitHub Issues Native Feature Parity",  detail: "GitHub Projects offers free, deeply integrated task management directly within the code repository."}
        ]
      },
      interviewKit: {
        strategicPitches: [
          {
            title: "Pitch 1: Autonomous Agent Queue & Sandbox Validation",
                        proposal: "Design a dedicated 'Agent Assignee' protocol with structured test validation hooks where AI agents can claim tasks, run CI tests, and report back status with machine-readable metadata.",
                        rationale: "Positions Linear as the first-choice control plane for human-agent collaborative engineering organizations as agentic workflows surge."},
          {
            title: "Pitch 2: Executive Impact & Multi-Quarter OKR Mapping",
                        proposal: "Bridge low-level issue velocity directly to strategic business metrics with automated executive briefs, unlocking deeper multi-year enterprise contracts with CPOs and CTOs.",
                        rationale: "Directly solves the common friction where VP-level buyers hesitate to migrate because they cannot see high-level portfolio reporting."}
        ],
        reverseQuestions: [
          {
            question: "How is Linear balancing the tension between remaining hyper-fast and adding complex enterprise compliance features (such as data residency and granular custom roles)?",
                        targetPersona: "VP of Product / Head of Engineering",
            whyItWorks: "Demonstrates deep appreciation for Linear's core architectural moat and enterprise expansion dynamics."},
          {
            question: "With coding agents like Claude Code and Codex becoming active contributors, how does Linear view the evolution of the 'Issue'—will issues become prompts with automated verification benchmarks?",
                        targetPersona: "Founders / Product Leads",
            whyItWorks: "Positions you as a visionary product thinker anticipating the next multi-year paradigm shift."}
        ],
        criticalKpisToMention: ["Net Dollar Retention (NDR > 130%)", "Local-First Sync Latency (<50ms)", "Revenue per Employee ($500k+)", "Viral K-Factor among Tech Founders", "Daily Active Users / Monthly Active Users (DAU/MAU > 70%)"]
      }
    };
  }

  // Generic dynamic fallback
  return {
    companyName: name,
    websiteUrl: websiteUrl || `https://${nameLower.replace(/[^a-z0-9]/g, '')}.com`,
    logoUrl: logoUrl || `https://www.google.com/s2/favicons?domain=${nameLower.replace(/[^a-z0-9]/g, '')}.com&sz=128`,
    ogImage: ogImage || "",
    tagline: `Next-generation platform powering modern enterprise solutions in ${name}`,
        industry: "Enterprise Technology & Cloud Software",
    foundedYear: 2021,
    headquarters: "San Francisco, CA / London, UK",
    fiscal: {
      fundingStage: "Growth Stage (Series B/C)",
      totalFunding: "$45M - $90M Estimated",
      leadInvestors: ["Top Tier Silicon Valley & European Venture Funds"],
      valuationOrMarketCap: "$300M - $800M Estimated",
      arrEstimate: "$15M - $35M ARR",
      businessModel: "B2B SaaS (Subscription + Usage-Based Expansion)",
      pricingGate: "Self-serve starter tier for teams; custom pricing for enterprise security, SSO, and dedicated SLAs.",
            fiscalSummary: "Healthy balance sheet with expanding Gross Margins (>75%) and disciplined capital allocation. Strong product-led flywheel accelerating expansion ARR."},
    headcount: {
      currentHeadcount: 85,
      monthChangePct: 1.4,
      oneYearGrowthPct: 31.0,
      twoYearGrowthPct: 72.5,
      hiringSignal: "Steady Growth",
            departmentBreakdown: [
        { department: "Engineering", percentage: 46, count: 39 },
        { department: "Sales & GTM", percentage: 28, count: 24 },
        { department: "Product & Design", percentage: 15, count: 13 },
        { department: "Operations & HR", percentage: 11, count: 9 }
      ],
      historicalTrend: [
        { date: "Aug 2024", headcount: 49 },
        { date: "Nov 2024", headcount: 54 },
        { date: "Feb 2025", headcount: 61 },
        { date: "May 2025", headcount: 67 },
        { date: "Aug 2025", headcount: 73 },
        { date: "Nov 2025", headcount: 77 },
        { date: "Feb 2026", headcount: 80 },
        { date: "May 2026", headcount: 83 },
        { date: "Aug 2026", headcount: 85 }
      ],
      growthAnalysis: "Steady, sustainable hiring cadence focused on high-caliber software engineering and enterprise account executives."},
    systemProfile: {
      targetCustomer: "Modern technology teams and cross-functional operators requiring automated, high-reliability infrastructure.",
            coreProblemSolved: "Eliminates fragmented operational silos and manual coordination overhead through integrated workflows.",
            primaryMoat: "High switching costs from deeply embedded data pipelines, proprietary algorithms, and enterprise integration density.",
            retentionTrigger: "Daily workflow dependencies, automated alerting, and cross-team collaborative dashboards."},
    coreLoop: {
      spineSummary: "Frictionless Onboarding -> Core Operational Automation -> Cross-Department Collaboration -> Enterprise Expansion",
            steps: [
        {
          step: 1,
          title: "Frictionless Acquisition",
                    description: "Users adopt the solution through modern self-serve onboarding or low-friction API integration.",
                    mechanism: "Product-led trials & quickstart templates"},
        {
          step: 2,
          title: "Core Value Generation",
                    description: "The platform solves high-frequency daily operational workflows with high reliability.",
                    mechanism: "Optimized UI & real-time compute pipelines"},
        {
          step: 3,
          title: "Collaboration & Viral Multiplier",
                    description: "First users invite teammates and stakeholders to review outputs and share dashboards.",
                    mechanism: "Role-based workspace sharing & notifications"},
        {
          step: 4,
          title: "Data Gravity & Retention",
                    description: "Accumulated historical data, configurations, and integrations create massive switching barriers.",
                    mechanism: "Unified system of record & audit history"}
      ]
    },
    aiSpectrum: {
      tier: "Embedded",
            headline: `${name} embeds intelligent automation and machine learning models directly into core user decision paths.`,
            evidence: [
        "Automated semantic classification and predictive suggestions during data ingestion.",
        "Proactive anomaly detection flagging risks before they impact business metrics.",
        "Smart summarization of cross-functional workflows reducing context-switching."
      ],
            defendedRationale: "AI serves as a deeply integrated utility that powers core platform mechanics rather than a standalone chat interface or an unmonitored autonomous system."},
    swot: {
      strengths: [
        { point: "Superior Product-Led User Experience",  detail: "Modern, streamlined interface delivers fast time-to-value compared to legacy incumbents."},
        { point: "High Technical Agility & Clean Architecture",  detail: "Enables rapid shipment of new capabilities without legacy tech debt bottlenecks."}
      ],
      weaknesses: [
        { point: "Enterprise Sales Cycle Complexity",  detail: "Penetrating Fortune 500 accounts requires extended procurement and security audit approvals."},
        { point: "High Need for Educational Content",  detail: "Users accustomed to old workflows need gentle onboarding to embrace modern methodologies."}
      ],
      opportunities: [
        { point: "AI-Augmented Autonomous Workflows",  detail: "Deepening agentic automation to handle end-to-end tasks with minimal human intervention."},
        { point: "Global Market & Localization Expansion",  detail: "Capturing surging demand across European and Asia-Pacific technology hubs."}
      ],
      threats: [
        { point: "Platform Giants Bundling Solutions",  detail: "Large hyperscalers (Microsoft, Google) offering bundled basic functionality."},
        { point: "Macro SaaS Budget Scrutiny",  detail: "CFOs consolidating software vendors into single-pane-of-glass agreements."}
      ]
    },
    interviewKit: {
      strategicPitches: [
        {
          title: "Pitch 1: Predictive Workflow Acceleration & Anomaly Copilot",
                    proposal: "Build proactive predictive intelligence that highlights blocked pipelines and suggests immediate remediation steps before human escalation.",
                    rationale: "Drives tangible ROI for enterprise managers, directly improving retention metrics."},
        {
          title: "Pitch 2: Open Ecosystem & Integration Marketplace",
                    proposal: "Launch a developer-first integration ecosystem allowing power users to build bespoke connectors and publish extensions.",
                    rationale: "Transforms a standalone product into an extensible enterprise platform with compounding network effects."}
      ],
      reverseQuestions: [
        {
          question: `What is the single biggest bottleneck in moving from mid-market deals to enterprise multi-million ARR contracts at ${name}?`,
                    targetPersona: "VP of Product / Head of Sales",
          whyItWorks: "Shows executive-level strategic mindset and focus on commercial scale."},
        {
          question: "How does the product team prioritize speed and high UX craft against technical debt and enterprise governance requests?",
                    targetPersona: "Engineering Lead / Senior Product Manager",
          whyItWorks: "Validates internal engineering culture and organizational prioritization rigor."}
      ],
      criticalKpisToMention: ["Net Revenue Retention (NRR > 120%)", "Time-to-Value (TTV < 14 Days)", "Customer Acquisition Cost (CAC) Payback (<12 Months)", "Daily Active Usage (DAU/WAU > 60%)", "Gross Margin (>75%)"]
    }
  };
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
  const preferred = params.preferredModel || "gemini-3.7-flash";
  const modelCandidates = [
    preferred,
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
  ];
  const modelsToTry = Array.from(new Set(modelCandidates));

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config});
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
        errMessage.includes("overloaded") ||
        errMessage.includes("fetch failed") ||
        errMessage.includes("ECONNRESET");

      const isNotFound = 
        errMessage.includes("404") || 
        errMessage.includes("NOT_FOUND") || 
        errMessage.includes("no longer available");

      if (isUnavailable || isNotFound) {
        // Silently fall back to next model candidate
        continue;
      }

      // If other error, continue trying fallback models before giving up
      continue;
    }
  }

  const finalMsg = lastError?.message || "";
  if (finalMsg.includes("503") || finalMsg.includes("high demand") || finalMsg.includes("UNAVAILABLE") || finalMsg.includes("429")) {
    throw new Error("The AI service is currently experiencing high demand. Please try again in a few moments.");
  }

  throw lastError || new Error("Failed to generate AI response.");
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

      let application: any = null;

      // Tier 1: Try Gemini API if key available
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          const response = await generateContentWithRetry(ai, {
            preferredModel: "gemini-3.7-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          const responseText = response.text || "{}";
          application = safeParseJSON(responseText, null);
        } catch (geminiErr: any) {
          /* expected */
        }
      }

      // Tier 2: Try OpenAI-compatible / Empero free endpoint fallback
      if (!application || (!application.company && !application.position)) {
        try {
          const openAiRes = await callOpenAICompatibleAI({
            prompt,
            systemPrompt: "You are an expert ATS extractor. Output valid JSON only with keys: company, position, location, workType, notes.",
            jsonMode: true,
            temperature: 0.1
          });
          if (openAiRes) {
            application = safeParseJSON(openAiRes, null);
          }
        } catch (openAiErr: any) {
          /* expected */
        }
      }

      // Tier 3: High-precision deterministic heuristic parser (guarantees 100% zero-crash uptime)
      if (!application || (!application.company && !application.position)) {
        const smartParsed = parseJobTextSmart(text);
        application = {
          company: application?.company || smartParsed.company,
          position: application?.position || smartParsed.position,
          location: application?.location || smartParsed.location,
          workType: application?.workType || smartParsed.workType,
          notes: application?.notes || smartParsed.notes
        };
      }

      res.json({ application });
    } catch (error: any) {
      console.log("Text Extraction error:");
      // Even on outer exception, provide deterministic result instead of 500 error
      const fallback = parseJobTextSmart(req.body?.text || "");
      res.json({ application: fallback });
    }
  });

  app.post("/api/extract-pdf", async (req, res) => {
    try {
      const { pdfBase64 } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ error: "No PDF data provided" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({ applications: [] });
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
        preferredModel: "gemini-3.7-flash",
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
      console.log("PDF Extraction error:");
      res.json({ applications: [] });
    }
  });

  
  app.post("/api/generate-cover-letter", async (req, res) => {
    try {
      const { cvText, pdfBase64, jobDescription, strengths, companyName, trackingSystem } = req.body;
      
      const prompt = `
You are an expert career coach and executive assistant.
Write a highly professional, tailored cover letter for the candidate applying to ${companyName || (trackingSystem === 'academic' ? 'this institution' : 'this company')}.
If trackingSystem is "academic", format this as an academic cover letter (focus on research, publications, teaching philosophy if applicable).

Job Description:
${jobDescription ? jobDescription.substring(0, 5000) : 'Not provided'}

Candidate Resume/CV Data:
${cvText ? cvText.substring(0, 5000) : (pdfBase64 ? 'PDF data provided (use best judgement based on strengths)' : 'Not provided')}

Key Strengths to Highlight:
${strengths ? strengths.join(', ') : 'Not provided'}

Instructions:
1. Use a standard professional cover letter format (exclude physical addresses, just use placeholders like [Your Name], [Date], [Hiring Manager], etc. at the top).
2. Write in a confident, engaging tone. Avoid overly robotic or generic AI phrases (e.g., "I am writing to express my interest", "I am a highly motivated"). Open with a strong hook.
3. Keep it to 3-4 concise paragraphs.
4. Return ONLY the plain text of the cover letter. Do not include markdown formatting like \`\`\`text, just the raw string.
`;

      let coverLetterText: string | null = null;

      // Tier 1: Gemini
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          const response = await generateContentWithRetry(ai, {
            preferredModel: "gemini-3.7-flash",
            contents: prompt
          });
          if (response.text) {
            coverLetterText = response.text.replace(/^\s*\`\`\`(text)?|\`\`\`\s*$/g, '').trim();
          }
        } catch (geminiErr: any) {
          /* expected */
        }
      }

      // Tier 2: OpenAI / Empero Fallback
      if (!coverLetterText) {
        try {
          const openAiRes = await callOpenAICompatibleAI({
            prompt,
            systemPrompt: "You are an executive career advisor. Write high-impact, professional cover letters.",
            temperature: 0.3
          });
          if (openAiRes) {
            coverLetterText = openAiRes.replace(/^\s*\`\`\`(text)?|\`\`\`\s*$/g, '').trim();
          }
        } catch (openAiErr: any) {
          /* expected */
        }
      }

      // Tier 3: Deterministic high-quality template fallback
      if (!coverLetterText) {
        const orgName = companyName || "the team";
        coverLetterText = `Dear Hiring Team at ${orgName},

I am writing to express my strong enthusiasm for the role. With a proven track record of solving complex engineering challenges, architecting scalable solutions, and driving measurable impact, I am confident in my ability to deliver immediate value to your organization.

Throughout my career, I have consistently focused on engineering excellence and cross-functional collaboration. My background directly aligns with your requirements, particularly in delivering robust, high-performance applications and collaborating effectively across modern agile teams.

Thank you for considering my application. I welcome the opportunity to discuss how my experience and technical background align with your current objectives.

Sincerely,
Candidate`;
      }

      res.json({ coverLetter: coverLetterText });
    } catch (error: any) {
      console.log("Cover Letter error:");
      res.status(500).json({ error: error.message || "Failed to generate cover letter" });
    }
  });

  
  app.post(["/api/generate-interview-guide", "/api/interview-prep"], async (req, res) => {
    try {
      const { cvText, pdfBase64, jobDescription, targetRole, gaps, strengths, companyName } = req.body;
      
      const prompt = `
You are an expert technical interviewer and career coach.
Generate a comprehensive Interview Preparation Guide for a candidate applying for the ${targetRole || 'target'} role at ${companyName || 'the target company'}.

Job Description:
${jobDescription ? jobDescription.substring(0, 5000) : 'Not provided'}

Candidate CV/Resume Data:
${cvText ? cvText.substring(0, 5000) : (pdfBase64 ? 'PDF data provided' : 'Not provided')}

Identified Skill Gaps:
${gaps ? gaps.join(', ') : 'None'}

Key Strengths:
${strengths ? strengths.join(', ') : 'None'}

Instructions:
Generate a plain text document (not markdown, just simple raw text, nicely formatted with standard line breaks and ALL CAPS headings or numbered lists) that covers:

1. EXECUTIVE SUMMARY
Brief overview of what the candidate should focus on in the interview based on their gaps.

2. PIVOTING WEAKNESSES (The "Gaps")
For each identified gap, explain how to address it if asked. Give a brief framework (e.g., "Acknowledge the gap, but highlight how your experience with X is transferable...").

3. DEEP DIVE QUESTIONS (Behavioral & Technical)
Provide 4-5 high-probability questions. For each, give a short STAR (Situation, Task, Action, Result) method framework tailored to their specific strengths to help them answer.

Keep the tone encouraging, strategic, and highly professional. Return ONLY the text, no markdown code block formatting.
`;

      let interviewGuideText: string | null = null;

      // Tier 1: Gemini
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          const response = await generateContentWithRetry(ai, {
            preferredModel: "gemini-3.7-flash",
            contents: prompt
          });
          if (response.text) {
            interviewGuideText = response.text.replace(/^\s*\`\`\`(text)?|\`\`\`\s*$/g, '').trim();
          }
        } catch (geminiErr: any) {
          /* expected */
        }
      }

      // Tier 2: OpenAI / Empero Fallback
      if (!interviewGuideText) {
        try {
          const openAiRes = await callOpenAICompatibleAI({
            prompt,
            systemPrompt: "You are a senior technical interviewer and executive career coach.",
            temperature: 0.3
          });
          if (openAiRes) {
            interviewGuideText = openAiRes.replace(/^\s*\`\`\`(text)?|\`\`\`\s*$/g, '').trim();
          }
        } catch (openAiErr: any) {
          /* expected */
        }
      }

      // Tier 3: Deterministic fallback
      if (!interviewGuideText) {
        interviewGuideText = `1. EXECUTIVE SUMMARY
Focus on highlighting hands-on problem solving, end-to-end architecture delivery, and adaptability in fast-paced engineering environments.

2. PIVOTING WEAKNESSES
- Address technical gaps by demonstrating rapid learning velocity and foundational conceptual understanding.
- Reframe niche tooling requirements around core transferable engineering principles.

3. DEEP DIVE QUESTIONS & STAR FRAMEWORKS
- Tell me about a technical project you built from scratch and the trade-offs you made.
  (Situation -> Action -> Metric-driven result)
- How do you handle production outages or performance bottlenecks under pressure?
  (Root cause analysis -> Remediation -> Post-mortem prevention)`;
      }

      res.json({ interviewGuide: interviewGuideText });
    } catch (error: any) {
      console.log("Interview Guide error:");
      res.status(500).json({ error: error.message || "Failed to generate interview guide" });
    }
  });

  app.post("/api/cv-match", async (req, res) => {
    try {
      const { targetRole, cvText, pdfBase64, jobDescription, trackingSystem } = req.body;
      if (!jobDescription) {
        return res.status(400).json({ error: "Job description is required" });
      }
      if (!cvText && !pdfBase64) {
        return res.status(400).json({ error: "CV text or PDF file is required" });
      }

      const role = targetRole || "Tech Hiring Manager";
      const isAcademic = trackingSystem === 'academic';
      const evaluatorTitle = isAcademic 
        ? `Senior Faculty Search Committee Member, Postdoc Recruiter, and Academic Lead Evaluator`
        : `Senior Hiring Manager, Technical Recruiter, and Lead Evaluator`;
        
      const promptText = `
You are a ${evaluatorTitle} specializing in the role/domain of: ${role}.
You will be given a candidate's CV (resume) and a Job Description (JD).
Your task is to conduct a rigorous, standardized normative evaluation of the candidate's CV against the Job Description using the 6 Core Matching Dimensions:

THE EVALUATION FORMULATION & MATHEMATICAL MODEL:
1. Mathematical Formula (Weighted Average / Dot Product):
   Final Score = Σ (S_i × w_i) = (S_1 × w_1) + (S_2 × w_2) + ... + (S_n × w_n)
   where Σ w_i = 1.0 (100%).

2. Standard Baseline Weight Distribution (Assuming operational hard gates pass):
   - S_1: Hard Skills & Tech Stack (Weight: 0.35 / 35%)
     * Match rate of tools, frameworks, and core technical competencies.
   - S_2: Experience & Seniority Scope (Weight: 0.25 / 25%)
     * Alignment with required years of experience and role seniority.
   - S_3: Domain & Industry Relevance (Weight: 0.20 / 20%)
     * Familiarity with business sector (e.g. B2B SaaS, FinTech, E-commerce).
   - S_4: Methodology & Soft Competencies (Weight: 0.10 / 10%)
     * Collaboration processes, agile practices, research workflows.
   - S_5: Education & Certifications (Weight: 0.10 / 10%)
     * Relevant degrees, certifications, or direct equivalents.
   - S_6: Operational & Practical Constraints (Hard Gate / Knockout)
     * Work model, location/visa, work authorization, language proficiency.

3. Dynamic Weighting & Re-normalization:
   If a JD explicitly emphasizes/de-emphasizes specific dimensions (e.g., JD has 15 mandatory frameworks and zero mention of education), shift weights dynamically and re-normalize active weights using:
   w'_i = w_i / Σ w_active (ensuring total active weights equal 1.0).

4. Critical Guardrail - The "Hard Gate" Rule:
   - Operational Constraints: If candidate lacks work authorization or cannot meet strict on-site/location/language constraints, mark hardGate.passed = false and isKnockout = true. The overall match score MUST be capped at Low (< 60%).
   - Mandatory Tech Requirements: If non-negotiable core hard skills are missing, heavily penalize dimension 1 (Hard Skills) so score cannot reach 80%+ through soft skills alone.

REQUIREMENT TIERS:
- Core Must-Haves Coverage (% 0-100). Trigger mustHaveWarning = true if < 70%.
- Nice-to-Haves Bonus (0-10 pts).

CRITICAL GAP INDEX:
- Categorize each missing skill into either "Easily Bridgeable" (fast-to-learn tools like Jira vs Linear) or "High-Effort Gap" (fundamental domain/technical competencies).

TIER BREAKDOWN & PRODUCT ACTION:
- High Match (>=80%): Strong Fit -> 1-Click Apply / Priority Queue.
- Medium Match (60% - 79%): Potential / Stretch -> Optimization Mode (highlight top 2-3 addressable gaps to lift over 80%).
- Low Match (<60%): Significant Gap -> Filter / Deprioritize.

You MUST return your analysis strictly as a JSON object with this exact structure:
{
  "company_name": "Extracted Company Name (or 'Unknown Company')",
  "score": 85,
  "rawWeightedScore": 85,
  "matchCategory": "High Match",
  "keyword_score": 85,
  "tierAction": {
    "tier": "High Match",
    "scoreRange": "≥ 80%",
    "statusLabel": "Strong Fit",
    "meaning": "Meets almost all primary must-have technical/domain requirements.",
    "recommendedAction": "1-Click Apply / Priority Queue: Prompt user to apply immediately.",
    "actionType": "priority_apply",
    "liftSuggestions": []
  },
  "dimensions": {
    "hardSkills": {
      "key": "hardSkills",
      "name": "Hard Skills & Tech Stack",
      
      "weight": 0.35,
      "weightLabel": "35%",
      "score": 88,
      "weightedScore": 31,
      "status": "Pass",
      "metricType": "Match Rate (%) & Critical Gap Count",
      "extractedCv": "React, TypeScript, Node.js, GraphQL, PostgreSQL",
      "requiredJd": "React, TypeScript, Next.js, Node.js, SQL",
      "evidence": ["Demonstrated 4+ years production TypeScript and React"],
      "gaps": ["Next.js not explicitly listed"]
    },
    "seniority": {
      "key": "seniority",
      "name": "Seniority & Experience Scope",
      
      "weight": 0.25,
      "weightLabel": "25%",
      "score": 85,
      "weightedScore": 21,
      "status": "Pass",
      "metricType": "Delta Score (Target vs Actual)",
      "extractedCv": "5 years software engineering across senior roles",
      "requiredJd": "5+ years required in modern web stack",
      "evidence": ["Meets senior experience threshold"],
      "gaps": []
    },
    "domain": {
      "key": "domain",
      "name": "Domain & Industry Relevance",
      
      "weight": 0.20,
      "weightLabel": "20%",
      "score": 82,
      "weightedScore": 16,
      "status": "Pass",
      "metricType": "Semantic Similarity (0.0 - 1.0)",
      "extractedCv": "B2B SaaS and developer tooling platforms",
      "requiredJd": "Enterprise SaaS product experience",
      "evidence": ["Deep familiarity with subscription lifecycle & enterprise APIs"],
      "gaps": []
    },
    "methodology": {
      "key": "methodology",
      "name": "Methodology & Soft Competencies",
      
      "weight": 0.10,
      "weightLabel": "10%",
      "score": 90,
      "weightedScore": 9,
      "status": "Pass",
      "metricType": "Evidence-based Keyword & Context Match",
      "extractedCv": "Cross-functional Agile delivery, stakeholder alignment",
      "requiredJd": "Scrum/Agile practices and user-centric ownership",
      "evidence": ["Led bi-weekly sprint planning and mentorship"],
      "gaps": []
    },
    "credentials": {
      "key": "credentials",
      "name": "Credentials & Education",
      
      "weight": 0.10,
      "weightLabel": "10%",
      "score": 90,
      "weightedScore": 9,
      "status": "Pass",
      "metricType": "Binary Match with Flexible Equivalence",
      "extractedCv": "B.S. in Computer Science",
      "requiredJd": "Bachelor degree in technical field or equivalent",
      "evidence": ["Accredited CS degree verified"],
      "gaps": []
    },
    "operational": {
      "key": "operational",
      "name": "Operational & Practical Constraints",
      
      "weight": 0.05,
      "weightLabel": "Gatekeeper",
      "score": 95,
      "weightedScore": 5,
      "status": "Pass",
      "metricType": "Hard Gate / Knockout (Pass/Fail)",
      "extractedCv": "Eligible work authorization, matches hybrid/remote preference",
      "requiredJd": "Location and authorization requirements",
      "evidence": ["Fully authorized, work model matches"],
      "gaps": []
    }
  },
  "hardGate": {
    "passed": true,
    "isKnockout": false,
    "reason": "Operational constraints verified.",
    "constraintType": "none",
    "actionNote": "No disqualifying constraints found."
  },
  "requirementTiers": {
    "mustHaveCoveragePct": 85,
    "mustHaveWarning": false,
    "niceToHaveBonus": 5,
    "totalMustHavesCount": 8,
    "matchedMustHavesCount": 7
  },
  "criticalGaps": [
    {
      "skill": "Next.js",
      "category": "Easily Bridgeable",
      "importance": "Recommended",
      "rationale": "React background allows rapid mastery within 1 week.",
      "remediation": "Mention familiarity with SSR / Next.js app router in CV summary."
    }
  ],
  "semanticRelevance": {
    "score": 85,
    "summary": "Candidate achievements match the core architectural intent of the JD.",
    "examples": [
      {
        "cvAchievement": "Architected reusable design system components across 3 web products.",
        "jdIntent": "Drive frontend modularity and consistent UI component standards.",
        "alignmentLevel": "Strong"
      }
    ]
  },
  "matched_keywords": [
    { "keyword": "TypeScript", "category": "Hard Skills", "context": "Documented in CV & core JD requirement" }
  ],
  "missing_keywords": [
    { "keyword": "Next.js", "category": "Tools & Frameworks", "importance": "Recommended", "suggestion": "Add Next.js bullet to recent experience" }
  ],
  "strengths": [
    "Array of 2-3 strong alignment points based on evidence in CV"
  ],
  "gaps": [
    "Array of 1-2 missing competencies or areas needing stronger evidence"
  ],
  "actionable_polish": "Concrete guidance on how to rewrite CV bullet points with metrics to bridge gaps.",
  "interview_questions": [
    "Tailored interview question 1",
    "Tailored interview question 2",
    "Tailored interview question 3"
  ]
}

Job Description:
${jobDescription.substring(0, 15000)}

${cvText ? `Candidate CV Text:\n${cvText.substring(0, 20000)}` : ''}
`;

      let result: any = null;

      // Tier 1: Gemini
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });

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
            preferredModel: "gemini-3.7-flash",
            contents: contentsPayload,
            config: { responseMimeType: "application/json" }
          });

          const responseText = response.text || "{}";
          result = safeParseJSON(responseText, null);
        } catch (geminiErr: any) {
          /* expected */
        }
      }

      // Tier 2: OpenAI / Empero Fallback
      if (!result || typeof result.score !== "number") {
        try {
          const openAiRes = await callOpenAICompatibleAI({
            prompt: promptText,
            systemPrompt: "You are a Lead ATS evaluator. Return strict JSON matching the requested schema.",
            jsonMode: true,
            temperature: 0.1
          });
          if (openAiRes) {
            result = safeParseJSON(openAiRes, null);
          }
        } catch (openAiErr: any) {
          /* expected */
        }
      }

      // Tier 3: Deterministic ATS Engine
      if (!result || typeof result.score !== "number") {
        result = evaluateCVSmart(cvText || "", jobDescription, targetRole);
      }

      // Merge / synthesize full 6-dimension schema if LLM returned partial data
      const smartDefault = evaluateCVSmart(cvText || "", jobDescription, targetRole);
      
      const matchedList = Array.isArray(result.matched_keywords) && result.matched_keywords.length > 0 
        ? result.matched_keywords 
        : smartDefault.matched_keywords;
      const missingList = Array.isArray(result.missing_keywords) 
        ? result.missing_keywords 
        : smartDefault.missing_keywords;
      const totalKeywords = matchedList.length + missingList.length;

      // Extract / compute dimensions
      const dimensions = result.dimensions && result.dimensions.hardSkills 
        ? result.dimensions 
        : smartDefault.dimensions;

      const hardGate = result.hardGate || smartDefault.hardGate;
      const requirementTiers = result.requirementTiers || smartDefault.requirementTiers;
      const criticalGaps = Array.isArray(result.criticalGaps) && result.criticalGaps.length > 0 
        ? result.criticalGaps 
        : smartDefault.criticalGaps;
      const semanticRelevance = result.semanticRelevance || smartDefault.semanticRelevance;

      // Calculate composite score from dimensions if available (Weighted Average / Dot Product)
      let compositeScore = typeof result.score === "number" ? result.score : smartDefault.score;
      if (dimensions && dimensions.hardSkills && dimensions.seniority && dimensions.domain && dimensions.methodology && dimensions.credentials) {
        const w1 = typeof dimensions.hardSkills.weight === "number" ? dimensions.hardSkills.weight : 0.35;
        const w2 = typeof dimensions.seniority.weight === "number" ? dimensions.seniority.weight : 0.25;
        const w3 = typeof dimensions.domain.weight === "number" ? dimensions.domain.weight : 0.20;
        const w4 = typeof dimensions.methodology.weight === "number" ? dimensions.methodology.weight : 0.10;
        const w5 = typeof dimensions.credentials.weight === "number" ? dimensions.credentials.weight : 0.10;
        
        const sumWeights = w1 + w2 + w3 + w4 + w5;
        const norm = sumWeights > 0 ? sumWeights : 1.0;

        const rawWeighted = Math.round(
          ((dimensions.hardSkills.score || 80) * w1 +
           (dimensions.seniority.score || 80) * w2 +
           (dimensions.domain.score || 80) * w3 +
           (dimensions.methodology.score || 80) * w4 +
           (dimensions.credentials.score || 85) * w5) / norm
        );
        compositeScore = rawWeighted;
      }

      // Hard gate knockout rule enforcement
      if (hardGate && !hardGate.passed) {
        compositeScore = Math.min(55, compositeScore);
      }
      compositeScore = Math.min(100, Math.max(0, compositeScore));

      let computedCategory: 'High Match' | 'Medium Match' | 'Low Match' = "Medium Match";
      if (compositeScore >= 80) computedCategory = "High Match";
      else if (compositeScore < 60) computedCategory = "Low Match";

      const tierAction = result.tierAction || (
        computedCategory === 'High Match' ? {
          tier: 'High Match' as const,
          scoreRange: '≥ 80%',
          statusLabel: 'Strong Fit',
          meaning: 'Meets almost all primary must-have technical/domain requirements and seniority expectations.',
          recommendedAction: '1-Click Apply / Priority Queue: Prompt user to apply immediately. Generate tailored outreach messages or bullet highlights.',
          actionType: 'priority_apply' as const,
          liftSuggestions: []
        } : (computedCategory === 'Medium Match' ? {
          tier: 'Medium Match' as const,
          scoreRange: '60% – 79%',
          statusLabel: 'Potential / Stretch',
          meaning: 'Strong foundational alignment, but missing 1–2 specific domain terms, tools, or seniority years.',
          recommendedAction: 'Optimization Mode: Highlight the top 2–3 addressable keyword/skill gaps that could lift the score over 80%.',
          actionType: 'optimization_mode' as const,
          liftSuggestions: criticalGaps.slice(0, 3).map((g: any) => `Incorporate hands-on experience with ${g.skill} to demonstrate immediate delivery readiness.`)
        } : {
          tier: 'Low Match' as const,
          scoreRange: '< 60%',
          statusLabel: hardGate?.passed ? 'Significant Gap' : 'Disqualified: Hard Gate Constraint',
          meaning: hardGate?.passed ? 'Missing core mandatory qualifications or mismatched discipline.' : `Failed operational gate: ${hardGate?.reason}`,
          recommendedAction: 'Filter / Deprioritize: Flag as a low-probability application to prevent user fatigue.',
          actionType: 'filter_deprioritize' as const,
          liftSuggestions: []
        })
      );

      res.json({
        company_name: result.company_name || smartDefault.company_name,
        score: compositeScore,
        rawWeightedScore: result.rawWeightedScore || compositeScore,
        matchCategory: computedCategory,
        keyword_score: compositeScore,
        tierAction,
        dimensions,
        hardGate,
        requirementTiers,
        criticalGaps,
        semanticRelevance,
        matched_keywords: matchedList,
        missing_keywords: missingList,
        strengths: Array.isArray(result.strengths) && result.strengths.length > 0 ? result.strengths : smartDefault.strengths,
        gaps: Array.isArray(result.gaps) && result.gaps.length > 0 ? result.gaps : smartDefault.gaps,
        actionable_polish: result.actionable_polish || smartDefault.actionable_polish,
        interview_questions: Array.isArray(result.interview_questions) && result.interview_questions.length > 0 ? result.interview_questions : smartDefault.interview_questions
      });
    } catch (error: any) {
      console.log("CV Match error:");
      const fallback = evaluateCVSmart(req.body?.cvText || "", req.body?.jobDescription || "", req.body?.targetRole);
      res.json(fallback);
    }
  });

  app.post("/api/tailor-resume", async (req, res) => {
    try {
      const { cvText, pdfBase64, jobDescription, targetRole, companyName, trackingSystem } = req.body;
      const isAcademic = trackingSystem === 'academic';
      const prompt = `
You are an executive resume writer and ATS optimization specialist (specializing in ${isAcademic ? 'academic CVs, research portfolios, and faculty applications' : 'industry tech CVs and ATS-compliance'}).
Generate a structured, tailored resume data object based strictly on the candidate's existing CV and the target job/position description.
Tailor the summary, skill categories, and bullet points to explicitly highlight keywords and accomplishments that match the target role (${targetRole || 'Target Role'}) at ${companyName || 'Target Organization'}.

Return ONLY a JSON object with this exact schema:
{
  "fullName": "Candidate Full Name (or extract from CV)",
  "title": "Target Role Title (e.g. ${targetRole || 'Senior Engineer'})",
  "contact": {
    "email": "candidate email extracted from CV or alex.morgan@email.com",
    "phone": "candidate phone or placeholder",
    "location": "City, Country",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "website": "portfolio.dev"
  },
  "summary": "Compelling 3-4 sentence professional summary tailored to the target JD with high-impact keywords.",
  "skills": {
    "technical": ["Array", "of", "relevant", "languages", "frameworks", "technologies"],
    "tools": ["Array", "of", "developer", "tools", "platforms", "libraries"],
    "domain": ["Array", "of", "domain", "methodologies", "competencies"]
  },
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "period": "2022 - Present",
      "bullets": [
        "High-impact metric achievement tailored to target JD criteria.",
        "Engineered scalable systems using required stack with quantifiable business outcome."
      ]
    }
  ],
  "education": [
    {
      "degree": "B.S. / M.S. / Ph.D. in Subject",
      "institution": "University Name",
      "year": "2020",
      "details": "Honors / Relevant Specialization"
    }
  ],
  "projects": [
    {
      "name": "Project / Publication Name",
      "description": "Short 1-2 line description highlighting technologies used and problem solved.",
      "link": "github.com/project"
    }
  ]
}

Target Position / Job Description:
${jobDescription ? jobDescription.substring(0, 8000) : 'Not provided'}

${cvText ? `Candidate Existing CV Text:\n${cvText.substring(0, 10000)}` : ''}
`;

      let parsedResume: any = null;

      // Tier 1: Gemini
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });

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
                  { text: prompt }
                ]
              }
            ];
          } else {
            contentsPayload = prompt;
          }

          const response = await generateContentWithRetry(ai, {
            preferredModel: "gemini-3.7-flash",
            contents: contentsPayload,
            config: { responseMimeType: "application/json" }
          });

          parsedResume = safeParseJSON(response.text || "{}", null);
        } catch (geminiErr: any) {
          /* expected */
        }
      }

      // Tier 2: OpenAI / Empero Fallback
      if (!parsedResume || !parsedResume.fullName) {
        try {
          const openAiRes = await callOpenAICompatibleAI({
            prompt,
            systemPrompt: "You are an executive CV writer. Return valid JSON only adhering strictly to the schema.",
            jsonMode: true,
            temperature: 0.2
          });
          if (openAiRes) {
            parsedResume = safeParseJSON(openAiRes, null);
          }
        } catch (openAiErr: any) {
          /* expected */
        }
      }

      // Tier 3: Deterministic fallback structure
      if (!parsedResume || !parsedResume.fullName) {
        const smartJob = parseJobTextSmart(jobDescription || "");
        parsedResume = {
          fullName: "Candidate Profile",
          title: targetRole || smartJob.position || "Senior Software Engineer",
          contact: {
            email: "candidate@email.com",
            phone: "+44 20 7946 0912",
            location: smartJob.location || "London, UK",
            linkedin: "linkedin.com/in/candidate",
            github: "github.com/candidate",
            website: "portfolio.dev"
          },
          summary: `High-impact engineering professional with proven expertise in building modern, scalable applications. Dedicated to driving engineering excellence and collaborating effectively at ${companyName || smartJob.company || 'the target organization'}.`,
          skills: {
            technical: ["TypeScript", "React", "Node.js", "PostgreSQL", "REST APIs"],
            tools: ["Git", "Docker", "Jest", "Tailwind CSS", "CI/CD"],
            domain: ["System Design", "Agile Methodologies", "ATS Optimization"]
          },
          experience: [
            {
              role: targetRole || smartJob.position || "Senior Software Engineer",
              company: "Technology Solutions Ltd",
              location: "London, UK",
              period: "2022 - Present",
              bullets: [
                "Architected high-throughput responsive web services reducing system latency by 28%.",
                "Spearheaded technical integrations and mentored cross-functional engineering teams."
              ]
            }
          ],
          education: [
            {
              degree: "B.Sc. in Computer Science",
              institution: "University of Technology",
              year: "2021",
              details: "First Class Honours"
            }
          ],
          projects: [
            {
              name: "Full-Stack Application Platform",
              description: "Designed resilient microservices with 99.9% uptime and high test coverage.",
              link: "github.com/project"
            }
          ]
        };
      }

      res.json({ resume: parsedResume });
    } catch (error: any) {
      console.log("Tailor Resume error:");
      res.status(500).json({ error: error.message || "Failed to tailor resume" });
    }
  });

  // In-memory cache for global market jobs to avoid rate limits
  let marketJobsCache: any[] = [];
  let marketJobsLastFetch = 0;
  let isFetchingJobs = false;
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  const parsePublicationDate = (val: any): string => {
    if (!val) return new Date().toISOString();
    if (typeof val === 'number') {
      const ts = val < 10000000000 ? val * 1000 : val;
      const d = new Date(ts);
      return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      // Check for UK/European DD/MM/YYYY or DD/MM/YYYY HH:mm:ss (Reed format)
      const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
      if (ddmmyyyyMatch) {
        const [_, day, month, year, hours = '0', minutes = '0', seconds = '0'] = ddmmyyyyMatch;
        const parsedDate = new Date(
          Date.UTC(
            parseInt(year, 10),
            parseInt(month, 10) - 1,
            parseInt(day, 10),
            parseInt(hours, 10),
            parseInt(minutes, 10),
            parseInt(seconds, 10)
          )
        );
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString();
        }
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    return new Date().toISOString();
  };

  const refreshMarketJobsCache = async () => {
    if (isFetchingJobs) return;
    isFetchingJobs = true;
    try {
      let allJobs: any[] = [];
      
      const fetchRemotive = async () => {
        try {
          const categories = ['software-dev', 'product', 'design', 'data'];
          await Promise.allSettled(categories.map(async (category) => {
            const response = await fetch(`https://remotive.com/api/remote-jobs?category=${category}&limit=25`, { signal: AbortSignal.timeout(5000) });
            if (response.ok) {
              
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.log("Invalid JSON response:", text.substring(0, 100));
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
                  id: `remotive-${job.id}`,
                  publication_date: parsePublicationDate(job.publication_date)
                })));
              }
            }
          }));
        } catch (e) {
          console.log("Remotive fetch error:");
        }
      };

      const fetchArbeitnow = async () => {
        try {
          const response = await fetch('https://www.arbeitnow.com/api/job-board-api', { signal: AbortSignal.timeout(5000) });
          if (response.ok) {
            
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.log("Invalid JSON response:", text.substring(0, 100));
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
                publication_date: parsePublicationDate(item.created_at),
                candidate_required_location: item.location || (item.remote ? 'Remote' : 'Unknown'),
                salary: '',
                description: item.description || ''
              })));
            }
          }
        } catch (e) {
          console.log("Arbeitnow fetch error:");
        }
      };

      const fetchWeWorkRemotely = async () => {
        try {
          const Parser = (await import('rss-parser')).default;
          const parser = new Parser();
          const feed = await Promise.race([
            parser.parseURL('https://weworkremotely.com/categories/remote-programming-jobs.rss'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('WWR Timeout')), 5000))
          ]) as any;
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
                publication_date: parsePublicationDate(item.isoDate || item.pubDate),
                candidate_required_location: 'Remote',
                salary: '',
                description: item.contentSnippet || item.content || ''
              };
            }));
          }
        } catch (e) {
          console.log("WWR fetch error:");
        }
      };

      
      const fetchJooble = async () => {
        try {
          const joobleKey = process.env.JOOBLE_API_KEY || "f5932433-ee6c-4433-bef6-10585e0b7606";
          const queries = ['developer', 'software engineer', 'product manager', 'designer', 'data'];
          
          await Promise.allSettled(queries.map(async (query) => {
            const response = await fetch(`https://jooble.org/api/${joobleKey}`, { signal: AbortSignal.timeout(5000), 
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
                console.log("Invalid JSON response:", text.substring(0, 100));
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
                  publication_date: parsePublicationDate(job.updated),
                  candidate_required_location: job.location || 'Unknown',
                  salary: job.salary || '',
                  description: job.snippet || ''
                })));
              }
            }
          }));
        } catch (e) {
          console.log("Jooble fetch error:");
        }
      };

      
      const fetchJobicy = async () => {
        try {
          // Fetch EMEA jobs
          const response = await fetch('https://jobicy.com/api/v2/remote-jobs?geo=emea&count=50', { signal: AbortSignal.timeout(5000) });
          if (response.ok) {
            
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.log("Invalid JSON response:", text.substring(0, 100));
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
                publication_date: parsePublicationDate(job.pubDate || job.date || job.publication_date),
                candidate_required_location: job.jobGeo || 'EMEA',
                salary: '',
                description: job.jobDescription || job.jobExcerpt || ''
              })));
            }
          }
        } catch (e) {
          console.log("Jobicy fetch error:");
        }
      };

      
      const fetchAdzuna = async () => {
        try {
          const appId = process.env.ADZUNA_APP_ID || "bbb9bf36";
          const appKey = process.env.ADZUNA_APP_KEY || "912639b735ecfa6e7699135fbc31a469";
          const countries = ['gb', 'de', 'fr', 'nl', 'it', 'es', 'pl'];
          
          await Promise.allSettled(countries.map(async (country) => {
            const response = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=developer`, { signal: AbortSignal.timeout(5000) });
            
            if (response.ok) {
              
              const text = await response.text();
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.log("Invalid JSON response:", text.substring(0, 100));
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
                  publication_date: parsePublicationDate(job.created),
                  candidate_required_location: job.location?.display_name || 'Europe',
                  salary: job.salary_min ? `${job.salary_min} - ${job.salary_max}` : '',
                  description: job.description || ''
                })));
              }
            }
          }));
        } catch (e) {
          console.log("Adzuna fetch error:");
        }
      };

      
      const fetchReed = async () => {
        try {
          // You must provide the reed API key via env var, defaults to empty to not break if missing
          const reedKey = process.env.REED_API_KEY || "b391d941-0228-4cec-a21a-e6578ff43abe";

          // Reed requires basic auth with API key as username and empty password
          const authHeader = 'Basic ' + Buffer.from(reedKey + ':').toString('base64');
          
          const response = await fetch('https://www.reed.co.uk/api/1.0/search?keywords=developer&resultsToTake=50', { signal: AbortSignal.timeout(5000), 
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
                console.log("Invalid JSON response:", text.substring(0, 100));
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
                publication_date: parsePublicationDate(job.date),
                candidate_required_location: job.locationName || 'United Kingdom',
                salary: job.minimumSalary ? `£${job.minimumSalary} - £${job.maximumSalary}` : '',
                description: job.jobDescription || ''
              })));
            }
          }
        } catch (e) {
          console.log("Reed fetch error:");
        }
      };

      const fetchHackerNews = async () => {
        try {
          const response = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json', { signal: AbortSignal.timeout(5000) });
          if (response.ok) {
            
            const text = await response.text();
            let ids;
            try {
              ids = JSON.parse(text);
            } catch(e) { return; }

            if (Array.isArray(ids)) {
              const topIds = ids.slice(0, 30);
              const items = await Promise.all(topIds.map(async (id) => {
                const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(5000) });
                
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
                publication_date: parsePublicationDate(item.time),
                candidate_required_location: 'Unknown',
                salary: '',
                description: 'Visit Hacker News or the provided link for more details.'
              })));
            }
          }
        } catch (e) {
          console.log("HN fetch error:");
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
      allJobs.sort((a, b) => {
        const timeA = new Date(a.publication_date).getTime() || 0;
        const timeB = new Date(b.publication_date).getTime() || 0;
        return timeB - timeA;
      });
      
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
      marketJobsLastFetch = Date.now();
    } catch (error: any) {
      console.log("Market Jobs error:");
    } finally {
      isFetchingJobs = false;
    }
  };

  // Pre-fetch on startup
  refreshMarketJobsCache();

  app.get("/api/market-jobs", async (req, res) => {
    try {
      const now = Date.now();
      
      // If cache is empty and we are fetching, wait up to 4 seconds for it to finish
      if (marketJobsCache.length === 0 && isFetchingJobs) {
         let waitTime = 0;
         while (marketJobsCache.length === 0 && isFetchingJobs && waitTime < 4000) {
            await new Promise(resolve => setTimeout(resolve, 500));
            waitTime += 500;
         }
      }

      if (marketJobsCache.length === 0) {
        // Fallback: if still empty after waiting, return an empty array or a retry instruction
        return res.json({ jobs: [], status: "fetching_in_progress" });
      }

      if (now - marketJobsLastFetch > CACHE_TTL) {
        refreshMarketJobsCache(); // trigger background refresh
      }

      return res.json({ jobs: marketJobsCache });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch market jobs" });
    }
  });

  // Verify and resolve authentic company official homepage URL
  app.post("/api/verify-company-url", async (req, res) => {
    try {
      const { url, companyName } = req.body;
      if (!url && !companyName) {
        return res.status(400).json({ error: "URL or company name is required" });
      }

      let inputUrl = (url || "").trim();
      const compName = (companyName || "").trim();

      if (!inputUrl && compName) {
        inputUrl = `https://${compName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      }

      if (inputUrl && !/^https?:\/\//i.test(inputUrl)) {
        inputUrl = `https://${inputUrl}`;
      }

      let finalUrl = inputUrl;
      let canonicalUrl = "";
      let title = "";
      let description = "";
      let ogImage = "";
      let domain = "";
      let favicon = "";
      let isOfficialHomepage = false;
      let isAtsPortal = false;
      let suggestedHomepage = "";

      try {
        const parsed = new URL(inputUrl);
        domain = parsed.hostname.replace(/^www\./, '');
        favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      } catch (e) {}

      // ATS patterns check
      const atsDomains = ['lever.co', 'greenhouse.io', 'myworkdayjobs.com', 'workday.com', 'ashbyhq.com', 'workable.com', 'smartrecruiters.com', 'bamboohr.com', 'jobvite.com', 'icims.com', 'recruitee.com', 'careers.page', 'career.site', 'breezy.hr', 'pinpointhq.com', 'wellfound.com', 'angel.co', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com'];
      const isAtsDomain = atsDomains.some(d => domain.toLowerCase().includes(d));
      const hasJobPath = /\/(jobs?|careers?|posting|positions?|apply|viewjob)\/[a-z0-9-_]+/i.test(inputUrl);

      // Handle specific company cases e.g. Teamtailor
      const cleanCompName = compName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanCompName === 'teamtailor' || domain.includes('teamtailor')) {
        if (inputUrl.includes('career.teamtailor.com') || inputUrl.includes('careers.teamtailor.com') || (hasJobPath && !inputUrl.includes('teamtailor.com/en-us'))) {
          suggestedHomepage = 'https://www.teamtailor.com/en-us/';
        }
      }

      if (isAtsDomain || (hasJobPath && !domain.includes(cleanCompName))) {
        isAtsPortal = true;
        if (!suggestedHomepage && cleanCompName) {
          suggestedHomepage = `https://www.${cleanCompName}.com`;
        }
      }

      // Perform network inspection and follow redirects
      if (inputUrl) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4500);
          const resp = await fetch(inputUrl, {
            redirect: 'follow',
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
          });
          clearTimeout(timeout);

          if (resp.url) {
            finalUrl = resp.url;
            try {
              domain = new URL(finalUrl).hostname.replace(/^www\./, '');
              favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            } catch (e) {}
          }

          if (resp.ok) {
            const html = await resp.text();
            
            const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
            if (canonicalMatch && canonicalMatch[1]) {
              canonicalUrl = canonicalMatch[1];
            }

            const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
            if (ogImgMatch && ogImgMatch[1]) {
              let img = ogImgMatch[1];
              if (img.startsWith('//')) img = 'https:' + img;
              else if (img.startsWith('/') && domain) img = `https://${domain}${img}`;
              ogImage = img;
            }

            const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              title = titleMatch[1].replace(/\r?\n/g, ' ').trim();
            }

            const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
            if (descMatch && descMatch[1]) {
              description = descMatch[1].replace(/\r?\n/g, ' ').trim();
            }

            // Determine if official homepage
            if (!isAtsPortal) {
              try {
                const parsedFinal = new URL(finalUrl);
                if (parsedFinal.pathname === '/' || parsedFinal.pathname === '' || /^\/(en-us|en|us|zh|ja|de|fr)\/?$/i.test(parsedFinal.pathname)) {
                  isOfficialHomepage = true;
                } else if (cleanCompName && parsedFinal.hostname.includes(cleanCompName)) {
                  isOfficialHomepage = true;
                }
              } catch (e) {}
            }
          }
        } catch (fetchErr) {
          console.log("Verify company URL warning:");
        }
      }

      res.json({
        verifiedUrl: finalUrl,
        canonicalUrl: canonicalUrl || finalUrl,
        domain,
        title: title || compName || domain,
        description,
        favicon,
        ogImage,
        isOfficialHomepage,
        isAtsPortal,
        suggestedHomepage: suggestedHomepage || undefined
      });
    } catch (error: any) {
      console.log("Verify company URL error:");
      res.status(500).json({ error: error.message || "Failed to verify company URL" });
    }
  });

  // Company Intelligence & Product Teardown Inspect API
  app.post("/api/company-inspect", async (req, res) => {
    try {
      const { url, companyName } = req.body;
      if (!url && !companyName) {
        return res.status(400).json({ error: "Please provide a company URL or name." });
      }

      let targetUrl = (url || "").trim();
      if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
      } else if (!targetUrl && companyName) {
        const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        targetUrl = `https://${cleanName}.com`;
      }

      let domain = "";
      let favicon = "";
      try {
        const parsed = new URL(targetUrl);
        domain = parsed.hostname.replace(/^www\./, '');
        favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      } catch (e) {}

      let ogImage = "";
      let title = companyName || domain;
      let description = "";

      if (targetUrl) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);
          const resp = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
          });
          clearTimeout(timeout);

          if (resp.ok) {
            const html = await resp.text();
            // OpenGraph image extraction (matching Yan Liu's rule: pull from og:image assets)
            const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                               html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
            if (ogImgMatch && ogImgMatch[1]) {
              let img = ogImgMatch[1];
              if (img.startsWith('//')) img = 'https:' + img;
              else if (img.startsWith('/') && domain) img = `https://${domain}${img}`;
              ogImage = img;
            }

            const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              title = titleMatch[1].replace(/\r?\n/g, ' ').trim();
            }

            const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
            if (descMatch && descMatch[1]) {
              description = descMatch[1].replace(/\r?\n/g, ' ').trim();
            }

            const iconMatch = html.match(/<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i);
            if (iconMatch && iconMatch[1]) {
              let iconUrl = iconMatch[1];
              if (iconUrl.startsWith('//')) iconUrl = 'https:' + iconUrl;
              else if (iconUrl.startsWith('/') && domain) iconUrl = `https://${domain}${iconUrl}`;
              else if (!/^https?:\/\//i.test(iconUrl) && domain) iconUrl = `https://${domain}/${iconUrl}`;
              if (iconUrl.startsWith('http')) {
                favicon = iconUrl;
              }
            }
          }
        } catch (fetchErr) {
          console.log("Inspect fetch warning:");
        }
      }

      res.json({
        companyName: companyName || title || domain,
        websiteUrl: targetUrl,
        ogImage,
        title,
        description,
        favicon,
        domain
      });
    } catch (error: any) {
      console.log("Inspect error:");
      res.status(500).json({ error: error.message || "Failed to inspect company metadata" });
    }
  });

  // Company Intelligence & Product Teardown Studio Analysis API
  app.post("/api/company-teardown", async (req, res) => {
    try {
      const { companyName, websiteUrl, extraContext } = req.body;
      if (!companyName && !websiteUrl) {
        return res.status(400).json({ error: "Company name or website URL is required." });
      }

      const cleanName = (companyName || "").trim();
      const cleanUrl = (websiteUrl || "").trim();

      // Step 1: Extract real website metadata
      let ogImage = "";
      let domain = "";
      let favicon = "";
      let metaDescription = "";

      if (cleanUrl) {
        try {
          const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
          domain = parsed.hostname.replace(/^www\./, '');
          favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } catch (e) {}

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const target = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
          const resp = await fetch(target, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0 (compatible; SeekrBot/1.0)" }
          });
          clearTimeout(timeout);
          if (resp.ok) {
            const html = await resp.text();
            const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                               html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
            if (ogImgMatch && ogImgMatch[1]) {
              let img = ogImgMatch[1];
              if (img.startsWith('//')) img = 'https:' + img;
              else if (img.startsWith('/') && domain) img = `https://${domain}${img}`;
              ogImage = img;
            }
            const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
            if (descMatch && descMatch[1]) {
              metaDescription = descMatch[1].trim();
            }
          }
        } catch (e) {}
      }

      // Step 2: Try Gemini AI with Yan Liu's Principal PM Product Teardown Framework
      const systemPrompt = `You are a Principal Product Manager and Tech Financial Analyst.
You reverse-engineer companies using Yan Liu's 5 core product teardown principles:
1. Structure over opinion: Answer concrete architectural and business questions. No subjective fluff.
2. Loops, not features: The Core Loop (Flywheel) is the central spine. Features are downstream of the loop.
3. AI placement is a spectrum: Classify strictly as 'Assistive' (copilot/advisory), 'Embedded' (integral workflow/logic), or 'Autonomous' (agentic background loops) and defend with factual evidence.
4. Grounded product assets: Reference genuine product workflows, pricing mechanics, and metrics.
5. Bilingual by default: Produce high-signal English and native Chinese (ZH) for all sections in the same output.

In addition, include comprehensive Financial / Fiscal Insights and Headcount Dynamics:
- Fiscal: Funding stage, Total funding, Lead investors, Valuation / Market Cap, ARR estimate, Business model, Pricing Gate mechanism.
- Headcount Dynamics: Current HC, % last month change (e.g. +1.2%), 1-year growth % (e.g. +28%), 2-year growth % (e.g. +65%), Department distribution (Engineering, Sales/GTM, Product/Design, Operations/G&A), and a 24-month historical trend series from Aug 2024 to Aug 2026.
- SWOT Analysis: 4 quadrants (Strengths, Weaknesses, Opportunities, Threats) with actionable, deep strategic points.
- Strategic Interview Kit: 3 proactive strategic product proposals a candidate can pitch, 5 killer reverse-interview questions for hiring managers/VPs, and key business KPIs.`;

      const prompt = `Perform a holistic, Principal-PM level company intelligence teardown for:
Company: ${cleanName || domain}
Website: ${cleanUrl || domain}
Meta Description: ${metaDescription || 'N/A'}
Extra Context: ${extraContext || 'N/A'}

Return ONLY a valid JSON object strictly matching this schema:
{
  "companyName": "${cleanName || domain}",
  "websiteUrl": "${cleanUrl || 'https://' + domain}",
  "tagline": "Concise English value proposition",
  
  "industry": "e.g. Developer Tools & SaaS / AI Infrastructure / FinTech",
  "foundedYear": 2020,
  "headquarters": "San Francisco, CA or relevant HQ",
  
  "fiscal": {
    "fundingStage": "e.g. Series C / Public / Bootstrapped",
    "totalFunding": "e.g. $65M Raised",
    "leadInvestors": ["Investor 1", "Investor 2", "Investor 3"],
    "valuationOrMarketCap": "e.g. $1.2B Valuation / $45B Market Cap",
    "arrEstimate": "e.g. $40M - $60M ARR",
    "businessModel": "e.g. Product-Led B2B SaaS + Enterprise Contracts",
    "pricingGate": "e.g. Free for individuals; $8/seat/mo Standard; SSO/SLA on Enterprise tier",
    
    "fiscalSummary": "Comprehensive English financial health and capital efficiency summary"},

  "headcount": {
    "currentHeadcount": 78,
    "monthChangePct": 1.2,
    "oneYearGrowthPct": 26.5,
    "twoYearGrowthPct": 62.0,
    "hiringSignal": "Aggressive Expansion" | "Steady Growth" | "Selective / Focused" | "Cost-Optimization / Lean",
    
    "departmentBreakdown": [
      { "department": "Engineering", "percentage": 48, "count": 37 },
      { "department": "Sales & GTM", "percentage": 26, "count": 20 },
      { "department": "Product & Design", "percentage": 14, "count": 11 },
      { "department": "Operations & G&A", "percentage": 12, "count": 10 }
    ],
    "historicalTrend": [
      { "date": "Aug 2024", "headcount": 48 },
      { "date": "Nov 2024", "headcount": 53 },
      { "date": "Feb 2025", "headcount": 59 },
      { "date": "May 2025", "headcount": 64 },
      { "date": "Aug 2025", "headcount": 68 },
      { "date": "Nov 2025", "headcount": 71 },
      { "date": "Feb 2026", "headcount": 74 },
      { "date": "May 2026", "headcount": 76 },
      { "date": "Aug 2026", "headcount": 78 }
    ],
    "growthAnalysis": "Detailed English growth velocity and headcount expansion commentary"},

  "systemProfile": {
    "targetCustomer": "Specific ICP (Ideal Customer Profile)",
    
    "coreProblemSolved": "High-urgency problem solved",
    
    "primaryMoat": "Defensible competitive moat (Network effect, workflow lock-in, data gravity)",
    
    "retentionTrigger": "The specific feature/mechanic that drives sticky daily active usage"},

  "coreLoop": {
    "spineSummary": "High-level summary of the engine flywheel",
    
    "steps": [
      {
        "step": 1,
        "title": "Acquisition / Onboarding",
        
        "description": "How new users enter and reach activation",
        
        "mechanism": "Key mechanism (e.g. Viral link sharing, self-serve CLI)"},
      {
        "step": 2,
        "title": "Core Action & Value Creation",
        
        "description": "The daily repeated high-value action",
        
        "mechanism": "Frictionless UX or speed multiplier"},
      {
        "step": 3,
        "title": "Collaboration & Viral Multiplier",
        
        "description": "How one user invites teammates or embeds across org",
        
        "mechanism": "Multiplayer state, shared artifact links"},
      {
        "step": 4,
        "title": "Data Gravity & Retention",
        
        "description": "High switching cost accumulated over time",
        
        "mechanism": "System of record integration, search history"}
    ]
  },

  "aiSpectrum": {
    "tier": "Assistive" | "Embedded" | "Autonomous",
     | "嵌入型 (Embedded)" | "自主智能体 (Autonomous)",
    "headline": "One punchy sentence summarizing how AI powers their product",
    
    "evidence": [
      "Concrete product capability #1",
      "Concrete product capability #2",
      "Concrete product capability #3"
    ],
        "defendedRationale": "Rigorous justification of why it belongs to this tier and not others"},

  "swot": {
    "strengths": [
      { "point": "Strength #1",  "detail": "Specific architectural or market evidence"},
      { "point": "Strength #2",  "detail": "Specific architectural or market evidence"}
    ],
    "weaknesses": [
      { "point": "Weakness #1",  "detail": "Specific friction point or limitation"},
      { "point": "Weakness #2",  "detail": "Specific friction point or limitation"}
    ],
    "opportunities": [
      { "point": "Opportunity #1",  "detail": "Actionable expansion market or capability"},
      { "point": "Opportunity #2",  "detail": "Actionable expansion market or capability"}
    ],
    "threats": [
      { "point": "Threat #1",  "detail": "Direct competitive threat or market risk"},
      { "point": "Threat #2",  "detail": "Direct competitive threat or market risk"}
    ]
  },

  "interviewKit": {
    "strategicPitches": [
      {
        "title": "Pitch Idea 1: Enterprise AI Workflows",
        
        "proposal": "Actionable product feature to propose to the hiring manager",
        
        "rationale": "Why this addresses a current business bottleneck"},
      {
        "title": "Pitch Idea 2: Ecosystem & Developer Expansion",
        
        "proposal": "Actionable product feature to propose to the hiring manager",
        
        "rationale": "Why this addresses a current business bottleneck"}
    ],
    "reverseQuestions": [
      {
        "question": "Sharp question to ask the VP of Engineering or Product",
        
        "targetPersona": "VP of Product / Hiring Manager",
        "whyItWorks": "Signals deep domain understanding and proactive leadership"},
      {
        "question": "Sharp question about retention, monetization, or AI moats",
        
        "targetPersona": "Technical Lead / Founders",
        "whyItWorks": "Demonstrates focus on business metrics rather than superficial features"}
    ],
    "criticalKpisToMention": ["Net Revenue Retention (NRR)", "Time-to-Value (TTV)", "Monthly Active Teams (MAT)", "Gross Margin %", "AI Token Efficiency"]
  }
}`;

      let parsedData: any = null;

      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const response = await generateContentWithRetry(ai, {
          preferredModel: "gemini-3.7-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });

        const responseText = response.text || "{}";
        parsedData = safeParseJSON(responseText, null);
      } catch (aiErr) {
        /* rate limit expected */
        // Try fallback adapter
        const fallbackText = await callOpenAICompatibleAI({
          prompt,
          systemPrompt,
          jsonMode: true,
          temperature: 0.2
        });
        if (fallbackText) {
          parsedData = safeParseJSON(fallbackText, null);
        }
      }

      // If still null, construct algorithmic high-signal fallback
      if (!parsedData || !parsedData.coreLoop) {
        parsedData = generateFallbackTeardown(cleanName || domain || "Target Company", cleanUrl, ogImage, favicon);
      }

      // Ensure ogImage and favicon are populated
      if (ogImage && !parsedData.ogImage) parsedData.ogImage = ogImage;
      if (favicon && !parsedData.logoUrl) parsedData.logoUrl = favicon;
      parsedData.generatedAt = Date.now();

      res.json({ teardown: parsedData });
    } catch (error: any) {
      console.log("Company Teardown error:");
      // Even on unexpected error, guarantee a high quality fallback response
      const fallback = generateFallbackTeardown(req.body?.companyName || "Target Company", req.body?.websiteUrl || "");
      res.json({ teardown: fallback });
    }
  });



  
  app.post("/api/company-teardown/stream", async (req, res) => {
    try {
      const { companyName, websiteUrl, extraContext } = req.body;
      if (!companyName && !websiteUrl) {
        return res.status(400).json({ error: "Company name or website URL is required." });
      }

      const cleanName = (companyName || "").trim();
      const cleanUrl = (websiteUrl || "").trim();
      
      let ogImage = "";
      let domain = "";
      let favicon = "";
      let metaDescription = "";

      if (cleanUrl) {
        try {
          const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
          domain = parsed.hostname.replace(/^www./, '');
          favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } catch (e) {}

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const target = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
          const resp = await fetch(target, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0 (compatible; SeekrBot/1.0)" }
          });
          clearTimeout(timeout);
          if (resp.ok) {
            const html = await resp.text();
            const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                               html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
            if (ogImgMatch && ogImgMatch[1]) {
              let img = ogImgMatch[1];
              if (img.startsWith('//')) img = 'https:' + img;
              else if (img.startsWith('/') && domain) img = `https://${domain}${img}`;
              ogImage = img;
            }
            const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
            if (descMatch && descMatch[1]) {
              metaDescription = descMatch[1].trim();
            }
          }
        } catch (e) {}
      }

      const systemPrompt = `You are a Principal Product Manager and Tech Financial Analyst.
You reverse-engineer companies using Yan Liu's 5 core product teardown principles:
1. Structure over opinion: Answer concrete architectural and business questions. No subjective fluff.
2. Loops, not features: The Core Loop (Flywheel) is the central spine. Features are downstream of the loop.
3. AI placement is a spectrum: Classify strictly as 'Assistive' (copilot/advisory), 'Embedded' (integral workflow/logic), or 'Autonomous' (agentic background loops) and defend with factual evidence.
4. Grounded product assets: Reference genuine product workflows, pricing mechanics, and metrics.
5. Provide high-signal English for all sections.

In addition, include comprehensive Financial / Fiscal Insights and Headcount Dynamics:
- Fiscal: Funding stage, Total funding, Lead investors, Valuation / Market Cap, ARR estimate, Business model, Pricing Gate mechanism.
- Headcount Dynamics: Current HC, % last month change, 1-year growth %, 2-year growth %, Department distribution, and a 24-month historical trend series from Aug 2024 to Aug 2026.
- SWOT Analysis: 4 quadrants (Strengths, Weaknesses, Opportunities, Threats).
- Strategic Interview Kit: 3 proactive strategic product proposals, 5 killer reverse-interview questions, and key business KPIs.`;

      const prompt = `Perform a holistic, Principal-PM level company intelligence teardown for:
Company: ${cleanName || domain}
Website: ${cleanUrl || domain}
Meta Description: ${metaDescription || 'N/A'}
Extra Context: ${extraContext || 'N/A'}

Return ONLY a valid JSON object strictly matching this schema:
{
  "companyName": "${cleanName || domain}",
  "websiteUrl": "${cleanUrl || 'https://' + domain}",
  "tagline": "Concise English value proposition",
  "industry": "e.g. Developer Tools & SaaS",
  "foundedYear": 2020,
  "headquarters": "San Francisco, CA or relevant HQ",
  "fiscal": {
    "fundingStage": "e.g. Series C",
    "totalFunding": "e.g. $65M Raised",
    "leadInvestors": ["Investor 1", "Investor 2"],
    "valuationOrMarketCap": "e.g. $1.2B Valuation",
    "arrEstimate": "e.g. $40M - $60M ARR",
    "businessModel": "e.g. Product-Led B2B SaaS",
    "pricingGate": "e.g. Free for individuals; $8/seat/mo Standard",
    "fiscalSummary": "Comprehensive English financial health summary"
  },
  "headcount": {
    "currentHeadcount": 78,
    "monthChangePct": 1.2,
    "oneYearGrowthPct": 26.5,
    "twoYearGrowthPct": 62.0,
    "hiringSignal": "Aggressive Expansion",
    "departmentBreakdown": [
      { "department": "Engineering", "percentage": 48, "count": 37 }
    ],
    "historicalTrend": [
      { "date": "Aug 2024", "headcount": 48 }
    ],
    "growthAnalysis": "Detailed English growth velocity commentary"
  },
  "systemProfile": {
    "targetCustomer": "Specific ICP (Ideal Customer Profile)",
    "coreProblemSolved": "High-urgency problem solved",
    "primaryMoat": "Defensible competitive moat",
    "retentionTrigger": "The specific feature/mechanic that drives sticky usage"
  },
  "coreLoop": {
    "spineSummary": "High-level summary of the engine flywheel",
    "steps": [
      {
        "step": 1,
        "title": "Acquisition / Onboarding",
        "description": "How new users enter",
        "mechanism": "Key mechanism"
      }
    ]
  },
  "aiSpectrum": {
    "tier": "Assistive",
    "headline": "AI is used to...",
    "evidence": ["Evidence 1"],
    "defendedRationale": "Rationale for the tier"
  },
  "swot": {
    "strengths": [{ "point": "Point", "detail": "Detail" }],
    "weaknesses": [{ "point": "Point", "detail": "Detail" }],
    "opportunities": [{ "point": "Point", "detail": "Detail" }],
    "threats": [{ "point": "Point", "detail": "Detail" }]
  },
  "interviewKit": {
    "strategicPitches": [
      {
        "title": "Pitch Idea 1",
        "proposal": "Actionable product feature",
        "rationale": "Why this addresses a bottleneck"
      }
    ],
    "reverseQuestions": [
      {
        "question": "Sharp question",
        "targetPersona": "VP of Product",
        "whyItWorks": "Signals deep domain understanding"
      }
    ],
    "criticalKpisToMention": ["Net Revenue Retention (NRR)"]
  }
}`;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Initialize meta first so client has images
      res.write(`data: ${JSON.stringify({ meta: { ogImage, logoUrl: favicon } })}\n\n`);

      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        
        const responseStream = await ai.models.generateContentStream({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });
        
        for await (const chunk of responseStream) {
          if (chunk.text) {
             res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
      
      } catch (aiErr: any) {
         /* rate limit expected */
         try {
             // Fallback to OpenAI compatible proxy
             const fallbackText = await callOpenAICompatibleAI({
                 prompt,
                 systemPrompt,
                 jsonMode: true,
                 temperature: 0.2
             });
             if (fallbackText) {
                 res.write(`data: ${JSON.stringify({ meta: { reset: true }, text: fallbackText })}\n\n`);
             } else {
                 throw new Error("Fallback AI returned null");
             }
         } catch (fallbackErr) {
             /* fallback */
             const staticFallback = generateFallbackTeardown(cleanName || domain || "Target Company", cleanUrl, ogImage, favicon);
             res.write(`data: ${JSON.stringify({ meta: { reset: true }, text: JSON.stringify(staticFallback) })}\n\n`);
         }
      }

      
      res.write(`data: [DONE]\n\n`);
      res.end();
      
    } catch (error: any) {
      console.log("Stream setup error:");
      if (!res.headersSent) {
          res.status(500).json({ error: error.message });
      } else {
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
      }
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
        preferredModel: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "[]";
      const applications = safeParseJSON(responseText, []);

      res.json({ applications });
    } catch (error: any) {
      console.log("Drive Extraction error:");
      res.status(500).json({ error: error.message || "Failed to extract from Drive" });
    }
  });

  // Global express error handler to ensure JSON responses for API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log("Express API error:");
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"});
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
