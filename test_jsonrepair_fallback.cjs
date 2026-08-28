const { jsonrepair } = require('jsonrepair');
const staticFallback = {
    companyName: "Target Company",
    websiteUrl: "https://targetcompany.com",
    logoUrl: "https://www.google.com/s2/favicons?domain=targetcompany.com&sz=128",
    ogImage: "",
    tagline: "Concise English value proposition",
    industry: "e.g. Developer Tools & SaaS",
    foundedYear: 2020,
    headquarters: "San Francisco, CA or relevant HQ",
    fiscal: {
      fundingStage: "e.g. Series C",
      totalFunding: "e.g. $65M Raised",
      leadInvestors: ["Investor 1", "Investor 2"],
      valuationOrMarketCap: "e.g. $1.2B Valuation",
      arrEstimate: "e.g. $40M - $60M ARR",
      businessModel: "e.g. Product-Led B2B SaaS",
      pricingGate: "e.g. Free for individuals; $8/seat/mo Standard",
      fiscalSummary: "Comprehensive English financial health summary"
    },
    headcount: {
      currentHeadcount: 78,
      monthChangePct: 1.2,
      oneYearGrowthPct: 26.5,
      twoYearGrowthPct: 62.0,
      hiringSignal: "Aggressive Expansion",
      departmentBreakdown: [
        { department: "Engineering", percentage: 45, count: 35 },
        { department: "Sales & Marketing", percentage: 25, count: 19 },
        { department: "Product & Design", percentage: 20, count: 15 },
        { department: "Operations", percentage: 10, count: 8 }
      ],
      historicalTrend: [
        { date: "Aug 2024", headcount: 45 },
        { date: "Nov 2024", headcount: 52 },
        { date: "Feb 2025", headcount: 60 },
        { date: "May 2025", headcount: 68 },
        { date: "Aug 2025", headcount: 74 },
        { date: "Nov 2025", headcount: 78 },
        { date: "Feb 2026", headcount: 78 },
        { date: "May 2026", headcount: 78 },
        { date: "Aug 2026", headcount: 78 }
      ],
      growthAnalysis: "Analyzed hiring trajectory indicating rapid engineering scale-up consistent with post-Series A/B product expansion."
    },
    systemProfile: {
      targetCustomer: "Who specifically buys this? e.g. Mid-market CTOs and VP Eng.",
      coreProblemSolved: "What painful problem is solved? e.g. Eliminates manual CI/CD maintenance.",
      primaryMoat: "What makes it defensible? e.g. Deep integration with existing GitHub workflows.",
      retentionTrigger: "Why do they stay? e.g. Daily usage by all developers."
    },
    coreLoop: {
      spineSummary: "How the product grows itself.",
      steps: [
        { step: 1, title: "Discovery", description: "How users find the product.", mechanism: "e.g. SEO & Word of mouth" },
        { step: 2, title: "Activation", description: "The aha moment.", mechanism: "e.g. 5-minute setup" },
        { step: 3, title: "Engagement", description: "Habit forming action.", mechanism: "e.g. Daily notifications" },
        { step: 4, title: "Expansion", description: "Inviting others or upgrading.", mechanism: "e.g. Collaboration limits" }
      ]
    },
    aiSpectrum: {
      tier: "Bolt-On",
      headline: "How is AI used?",
      evidence: ["Feature 1", "Feature 2", "Feature 3"],
      defendedRationale: "Why this tier?"
    },
    swot: {
      strengths: [{ point: "Strength 1", detail: "Detail 1" }, { point: "Strength 2", detail: "Detail 2" }],
      weaknesses: [{ point: "Weakness 1", detail: "Detail 1" }, { point: "Weakness 2", detail: "Detail 2" }],
      opportunities: [{ point: "Opportunity 1", detail: "Detail 1" }, { point: "Opportunity 2", detail: "Detail 2" }],
      threats: [{ point: "Threat 1", detail: "Detail 1" }, { point: "Threat 2", detail: "Detail 2" }]
    },
    interviewKit: {
      strategicPitches: [
        { title: "Pitch 1", proposal: "Proposal 1", rationale: "Rationale 1" },
        { title: "Pitch 2", proposal: "Proposal 2", rationale: "Rationale 2" }
      ],
      reverseQuestions: [
        { question: "Question 1", targetPersona: "Persona 1", whyItWorks: "Why 1" },
        { question: "Question 2", targetPersona: "Persona 2", whyItWorks: "Why 2" }
      ],
      criticalKpisToMention: ["KPI 1", "KPI 2", "KPI 3"]
    }
  };

const str = JSON.stringify(staticFallback);
console.log("String length:", str.length);
try {
  const repaired = jsonrepair(str);
  const parsed = JSON.parse(repaired);
  console.log("Parsed company name:", parsed.companyName);
} catch (e) {
  console.error("Error repairing:", e);
}
