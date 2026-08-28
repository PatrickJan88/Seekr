/**
 * AI Evaluator Mechanism Norms & Dimension Definitions
 * Standardized data models, dimension weights, and scoring rules for JobFlow AI Evaluator.
 */

export interface DimensionNormMeta {
  key: string;
  name: string;
  weight: number; // e.g. 0.30
  weightLabel: string; // e.g. "30%"
  metricType: string;
  description: string;
  whatToExtract: string;
}

export const EVALUATOR_DIMENSIONS_NORM: DimensionNormMeta[] = [
  {
    key: 'hardSkills',
    name: 'Hard Skills & Tech Stack',
    weight: 0.35,
    weightLabel: '35%',
    metricType: 'Match Rate (%) & Critical Gap Count',
    description: 'Specific tools, programming languages, platforms, and methodologies substantiated in CV vs JD.',
    whatToExtract: 'React, TypeScript, Figma, SQL, CI/CD, Cloud Architecture, etc.',
  },
  {
    key: 'seniority',
    name: 'Seniority & Experience Scope',
    weight: 0.25,
    weightLabel: '25%',
    metricType: 'Delta Score (Target vs Actual Years & Complexity)',
    description: 'Total relevant years, title level (Junior/Senior/Lead), team size managed, and past project scale.',
    whatToExtract: 'Years of direct domain experience, scope of technical leadership, and system scale.',
  },
  {
    key: 'domain',
    name: 'Domain & Industry Relevance',
    weight: 0.20,
    weightLabel: '20%',
    metricType: 'Semantic Similarity (0.0 to 1.0 / %)',
    description: 'Familiarity with business models or sector nuances (B2B SaaS, FinTech, Developer Tools, HealthTech).',
    whatToExtract: 'Business models, revenue drivers, user archetypes, and industry compliance standards.',
  },
  {
    key: 'methodology',
    name: 'Methodology & Soft Competencies',
    weight: 0.10,
    weightLabel: '10%',
    metricType: 'Evidence-based Keyword & Context Match',
    description: 'Collaboration style, Agile/Scrum, stakeholder alignment, user research, and problem-solving.',
    whatToExtract: 'Cross-functional leadership, sprint execution, code review culture, and user-centricity.',
  },
  {
    key: 'credentials',
    name: 'Credentials & Education',
    weight: 0.10,
    weightLabel: '10%',
    metricType: 'Binary Match with Flexible Equivalence',
    description: 'Degrees, certifications, licenses (e.g. AWS Certified, PMP, relevant degrees).',
    whatToExtract: 'B.S./M.S./Ph.D. programs, professional certs, patents, and official accreditations.',
  },
  {
    key: 'operational',
    name: 'Operational & Practical Constraints',
    weight: 0.00,
    weightLabel: 'Gatekeeper (Hard Gate)',
    metricType: 'Hard Gate / Knockout (Binary: Pass/Fail)',
    description: 'Work model (Remote/Hybrid/On-site), location/time zone, work authorization, and language fluency.',
    whatToExtract: 'Legal work authorization, commute feasibility, language requirements, time zone overlap.',
  }
];

/**
 * Standard Baseline Dot-Product Formulation & Dynamic Normalization
 */
export const EVALUATOR_FORMULATION = {
  formula: 'Final Score = Σ (S_i × w_i) = (S_1 × w_1) + (S_2 × w_2) + ... + (S_n × w_n)',
  weightsSum: 'Σ w_i = 1.0 (100%)',
  baselineWeights: {
    hardSkills: 0.35,
    seniority: 0.25,
    domain: 0.20,
    methodology: 0.10,
    credentials: 0.10
  },
  dynamicNormalizationFormula: "w'_i = w_i / Σ w_active",
  hardGateRule: 'If operational knockout triggers (authorization/location), score is capped at < 60% with Disqualified status.'
};

export interface TierActionDefinition {
  tier: 'High Match' | 'Medium Match' | 'Low Match';
  scoreRange: string;
  statusLabel: string;
  meaning: string;
  recommendedAction: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
}

export const TIER_ACTION_NORMS: Record<'High Match' | 'Medium Match' | 'Low Match', TierActionDefinition> = {
  'High Match': {
    tier: 'High Match',
    scoreRange: '≥ 80%',
    statusLabel: 'Strong Fit',
    meaning: 'Meets almost all primary "must-have" technical/domain requirements and seniority expectations.',
    recommendedAction: '1-Click Apply / Priority Queue: Prompt user to apply immediately and export tailored cover letter.',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-500'
  },
  'Medium Match': {
    tier: 'Medium Match',
    scoreRange: '60% – 79%',
    statusLabel: 'Potential / Stretch',
    meaning: 'Strong foundational alignment (e.g. correct tech stack), but missing 1–2 specific domain terms, tools, or seniority years.',
    recommendedAction: 'Optimization Mode: Highlight top 2–3 addressable keyword/skill gaps that could lift score over 80%.',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-500'
  },
  'Low Match': {
    tier: 'Low Match',
    scoreRange: '< 60%',
    statusLabel: 'Significant Gap',
    meaning: 'Missing core mandatory qualifications, mismatched discipline, or failing a hard operational constraint.',
    recommendedAction: 'Filter / Deprioritize: Flag as a low-probability application to prevent candidate fatigue.',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-500'
  }
};
