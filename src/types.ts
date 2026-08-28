export interface Attachment {
  name: string;
  url: string;
}

export interface ApplicationLink {
  id?: string;
  title: string;
  url: string;
}

export type JobStatus = 'Wishlist' | 'Applied' | 'Screening' | 'Technical' | 'Final' | 'Offer' | 'Rejected' | 'Ghosted';

export type WorkType = 'On-site' | 'Hybrid' | 'Remote';

export const getWorkTypeBadgeStyle = (workType?: WorkType | string) => {
  switch (workType) {
    case 'On-site':
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    case 'Hybrid':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    case 'Remote':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  location?: string;
  workType?: WorkType;
  status: JobStatus;
  appliedDate: string; // ISO date string
  nextInterviewDate?: string; // ISO date string
  contactName?: string;
  contactEmail?: string;
  companyUrl?: string;
  notes?: string;
  resumeUrl?: string; // base64 or link
  coverLetterUrl?: string; // base64 or link
  attachments?: Attachment[];
  links?: ApplicationLink[];
  linkUrl?: string;
  reminder?: string;
  customReminderDate?: string;
  customReminderEndDate?: string;
  reminderSent?: boolean;
  createdAt: number;
  updatedAt: number;
  trackingSystem?: 'industry' | 'academic';
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  unread: boolean;
}

export type EvaluatorDimensionKey = 'hardSkills' | 'seniority' | 'domain' | 'methodology' | 'credentials' | 'operational';

export interface DimensionEvaluation {
  key: EvaluatorDimensionKey;
  name: string;
  weight: number; // e.g. 0.30
  weightLabel: string; // e.g. "30%"
  score: number; // 0-100
  weightedScore: number; // score * weight
  status: 'Pass' | 'Fail' | 'Partial' | 'Exceeds';
  metricType: string;
  extractedCv: string;
  requiredJd: string;
  evidence: string[];
  gaps: string[];
}

export interface HardGateEvaluation {
  passed: boolean;
  isKnockout: boolean;
  reason?: string;
  constraintType?: 'work_authorization' | 'location_work_model' | 'language_proficiency' | 'mandatory_tech' | 'none';
  actionNote?: string;
}

export interface CriticalGapItem {
  skill: string;
  category: 'Easily Bridgeable' | 'High-Effort Gap';
  importance: 'Critical' | 'Recommended' | 'Bonus';
  rationale: string;
  remediation: string;
}

export interface RequirementTiers {
  mustHaveCoveragePct: number; // 0-100
  mustHaveWarning: boolean; // true if < 70%
  niceToHaveBonus: number; // 0-10 points bonus
  totalMustHavesCount: number;
  matchedMustHavesCount: number;
}

export interface SemanticRelevanceInsight {
  score: number; // 0-100
  summary: string;
  examples: Array<{
    cvAchievement: string;
    jdIntent: string;
    alignmentLevel: 'Strong' | 'Moderate' | 'Weak';
  }>;
}

export interface EvaluatorTierAction {
  tier: 'High Match' | 'Medium Match' | 'Low Match';
  scoreRange: string;
  statusLabel: string;
  meaning: string;
  recommendedAction: string;
  actionType: 'priority_apply' | 'optimization_mode' | 'filter_deprioritize';
  liftSuggestions?: string[];
}

export interface MatchResult {
  company_name?: string;
  score: number; // Composite 0-100
  rawWeightedScore?: number;
  matchCategory: 'High Match' | 'Medium Match' | 'Low Match';
  keyword_score?: number;
  tierAction?: EvaluatorTierAction;
  dimensions?: {
    hardSkills: DimensionEvaluation;
    seniority: DimensionEvaluation;
    domain: DimensionEvaluation;
    methodology: DimensionEvaluation;
    credentials: DimensionEvaluation;
    operational: DimensionEvaluation;
  };
  hardGate?: HardGateEvaluation;
  requirementTiers?: RequirementTiers;
  criticalGaps?: CriticalGapItem[];
  semanticRelevance?: SemanticRelevanceInsight;
  matched_keywords?: MatchedKeyword[];
  missing_keywords?: MissingKeyword[];
  strengths: string[];
  gaps: string[];
  actionable_polish: string;
  interview_questions: string[];
}

export interface CVEvaluation {
  id: string;
  userId: string;
  role: string;
  jobDescription: string;
  result: MatchResult;
  createdAt: number;
  trackingSystem?: 'industry' | 'academic';
}

export type KeywordCategory = 'Hard Skills' | 'Soft Skills' | 'Tools & Frameworks' | 'Domain Knowledge';

export interface MatchedKeyword {
  keyword: string;
  category: KeywordCategory;
  context?: string;
  countInCv?: number;
  countInJd?: number;
}

export interface MissingKeyword {
  keyword: string;
  category: KeywordCategory;
  importance: 'Critical' | 'Recommended' | 'Bonus';
  suggestion?: string;
}

export interface TailoredResumeExperience {
  role: string;
  company: string;
  location?: string;
  period: string;
  bullets: string[];
}

export interface TailoredResumeEducation {
  degree: string;
  institution: string;
  year: string;
  details?: string;
}

export interface TailoredResumeProject {
  name: string;
  description: string;
  link?: string;
}

export interface TailoredResumeData {
  fullName: string;
  title: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  skills: {
    technical: string[];
    tools: string[];
    domain: string[];
  };
  experience: TailoredResumeExperience[];
  education: TailoredResumeEducation[];
  projects?: TailoredResumeProject[];
}

export type ResumeTemplateId = 'classic-single' | 'modern-single' | 'classic-two' | 'modern-two';

export interface ResumeTemplateMeta {
  id: ResumeTemplateId;
  name: string;
  previewLabel: string;
  description: string;
}

export interface HeadcountPoint {
  date: string; // e.g. "Aug 2024", "Aug 2025", "Aug 2026"
  headcount: number;
}

export interface DepartmentDistribution {
  department: string;
  percentage: number;
  count: number;
}

export interface CoreLoopStep {
  step: number;
  title: string;
  description: string;
  mechanism: string;
}

export interface CompanyTeardownData {
  id?: string;
  companyName: string;
  websiteUrl: string;
  logoUrl?: string;
  ogImage?: string;
  tagline: string;
  industry: string;
  foundedYear?: string | number;
  headquarters?: string;

  // Fiscal Report & Business Health
  fiscal: {
    fundingStage: string;
    totalFunding: string;
    leadInvestors: string[];
    valuationOrMarketCap: string;
    arrEstimate: string;
    businessModel: string;
    pricingGate: string;
    fiscalSummary: string;
  };

  // Headcount & Growth Dynamics (LinkedIn Insights style)
  headcount: {
    currentHeadcount: number;
    monthChangePct: number;
    oneYearGrowthPct: number;
    twoYearGrowthPct: number;
    hiringSignal: 'Aggressive Expansion' | 'Steady Growth' | 'Selective / Focused' | 'Cost-Optimization / Lean';
    departmentBreakdown: DepartmentDistribution[];
    historicalTrend: HeadcountPoint[];
    growthAnalysis: string;
  };

  // System Profile (Structure over opinion)
  systemProfile: {
    targetCustomer: string;
    coreProblemSolved: string;
    primaryMoat: string;
    retentionTrigger: string;
  };

  // Core Flywheel / Growth Loop
  coreLoop: {
    spineSummary: string;
    steps: CoreLoopStep[];
  };

  // AI Placement Spectrum
  aiSpectrum: {
    tier: 'Assistive' | 'Embedded' | 'Autonomous';
    headline: string;
    evidence: string[];
    defendedRationale: string;
  };

  // SWOT Matrix
  swot: {
    strengths: { point: string; detail: string; }[];
    weaknesses: { point: string; detail: string; }[];
    opportunities: { point: string; detail: string; }[];
    threats: { point: string; detail: string; }[];
  };

  // Interview & Executive Strategy Kit
  interviewKit: {
    strategicPitches: { title: string; proposal: string; rationale: string; }[];
    reverseQuestions: { question: string; targetPersona: string; whyItWorks: string; }[];
    criticalKpisToMention: string[];
  };

  generatedAt: number;
}

