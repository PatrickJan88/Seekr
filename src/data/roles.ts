export interface RoleOption {
  label: string;
  value: string;
}

export const ROLE_CATEGORIES_ACADEMIC: Record<string, RoleOption[]> = {
  "Academic & Research": [
    { label: "Postdoctoral Researcher", value: "postdoc" },
    { label: "PhD Candidate", value: "phd" },
    { label: "Assistant Professor", value: "assistant professor" },
    { label: "Lecturer", value: "lecturer" },
    { label: "Research Scientist", value: "research scientist" },
    { label: "Teaching Fellow", value: "teaching fellow" }
  ]
};

export const ROLE_CATEGORIES_INDUSTRY: Record<string, RoleOption[]> = {
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

export const ROLE_KEYWORDS: Record<string, string[]> = {
  // Industry
  "front-end": ["front-end", "frontend", "front end", "react", "vue", "angular", "ui engineer", "web developer"],
  "back-end": ["back-end", "backend", "back end", "node", "python", "java", "golang", "api", "microservice"],
  "full-stack": ["full-stack", "fullstack", "full stack", "software engineer"],
  "mobile": ["mobile", "ios", "android", "swift", "kotlin", "react native", "flutter"],
  "game": ["game", "unity", "unreal", "gameplay", "graphics engineer"],
  "embedded": ["embedded", "firmware", "c++", "c/c++", "iot", "hardware", "microcontroller"],
  "ai llm engineer": ["ai engineer", "llm", "genai", "generative ai", "prompt engineer", "ai/llm", "foundation model"],
  "machine learning": ["machine learning", "ml engineer", "deep learning", "nlp", "computer vision", "pytorch", "tensorflow"],
  "agent systems engineer": ["agent", "multi-agent", "agentic", "ai workflow", "langchain", "autogen"],
  "fine-tuning optimization": ["fine-tuning", "fine tuning", "rlhf", "model optimization", "quantization", "distillation"],
  "data scientist": ["data scientist", "data science", "statistician", "applied scientist"],
  "data analyst": ["data analyst", "data analytics", "bi analyst", "business intelligence"],
  "data architect": ["data architect", "data lake", "data warehouse", "data platform"],
  "database": ["database administrator", "dba", "db admin", "database engineer", "sql", "postgres"],
  "business intelligence": ["business intelligence", "bi analyst", "tableau", "power bi", "analytics"],
  "devops": ["devops", "ci/cd", "infrastructure", "terraform", "ansible"],
  "cloud": ["cloud engineer", "aws", "azure", "gcp", "cloud architect"],
  "site reliability": ["site reliability", "sre", "reliability engineer", "observability"],
  "mlops platform": ["mlops", "ai platform", "model deployment", "kubeflow", "ml engineer"],
  "ai reliability": ["ai reliability", "model evaluation", "guardrails", "ai eval"],
  "ai safety": ["ai safety", "alignment", "ethics", "red teaming", "red-teaming"],
  "systems administrator": ["systems administrator", "sysadmin", "system administrator", "linux administrator"],
  "network engineer": ["network engineer", "networking", "cisco", "network architect"],
  "product manager": ["product manager", "program manager", "product lead", "group product manager", "product owner"],
  "ai product manager": ["ai product manager", "ai pm", "product manager - ai", "generative ai product"],
  "ux ui designer": ["ux", "ui", "ux/ui", "ui/ux", "product designer", "user experience", "user interface", "interaction designer", "visual designer"],
  "ai ethics": ["ai ethics", "compliance", "ai governance", "responsible ai", "regulatory"],
  "qa": ["qa", "quality assurance", "test engineer", "automation engineer", "sdet", "tester"],
  "security": ["security", "cybersecurity", "infosec", "appsec", "penetration tester", "security engineer"],
  "support": ["it support", "technical support", "help desk", "desktop support", "service desk"],

  // Academic
  "postdoc": ["postdoc", "postdoctoral", "research fellow", "postdoctoral fellow", "post-doctoral"],
  "phd": ["phd", "doctoral", "phd candidate", "phd student", "graduate research assistant", "graduate researcher"],
  "assistant professor": ["assistant professor", "tenure-track", "adjunct professor", "associate professor", "faculty"],
  "lecturer": ["lecturer", "senior lecturer", "instructor", "teaching fellow", "faculty lecturer", "adjunct lecturer"],
  "research scientist": ["research scientist", "staff scientist", "scientific researcher", "principal investigator"],
  "teaching fellow": ["teaching fellow", "teaching assistant", "course instructor", "academic tutor"]
};

export function getRoleCategories(trackingSystem: 'industry' | 'academic' = 'industry') {
  return trackingSystem === 'academic' ? ROLE_CATEGORIES_ACADEMIC : ROLE_CATEGORIES_INDUSTRY;
}

export function getRoleLabel(roleValue: string, trackingSystem: 'industry' | 'academic' = 'industry'): string {
  if (!roleValue) return "All Roles";
  const categories = getRoleCategories(trackingSystem);
  for (const list of Object.values(categories)) {
    const found = list.find(r => r.value === roleValue);
    if (found) return found.label;
  }
  // Check other category as fallback
  const altCategories = trackingSystem === 'academic' ? ROLE_CATEGORIES_INDUSTRY : ROLE_CATEGORIES_ACADEMIC;
  for (const list of Object.values(altCategories)) {
    const found = list.find(r => r.value === roleValue);
    if (found) return found.label;
  }
  return roleValue;
}

export function isRoleInTrackingSystem(roleValue: string, trackingSystem: 'industry' | 'academic'): boolean {
  if (!roleValue) return true;
  const categories = getRoleCategories(trackingSystem);
  for (const list of Object.values(categories)) {
    if (list.some(r => r.value === roleValue)) return true;
  }
  return false;
}

export function matchJobRole(job: { title?: string; category?: string; job_type?: string; tags?: string[]; description?: string }, roleValue: string): boolean {
  if (!roleValue) return true;
  const valLower = roleValue.toLowerCase();

  // 1. Direct contains check
  if (
    (job.category && job.category.toLowerCase().includes(valLower)) || 
    (job.job_type && job.job_type.toLowerCase().includes(valLower)) ||
    (job.title && job.title.toLowerCase().includes(valLower)) ||
    (job.tags && job.tags.some(t => t.toLowerCase().includes(valLower)))
  ) {
    return true;
  }

  // 2. Keyword synonyms matching
  const keywords = ROLE_KEYWORDS[valLower] || [valLower];
  const combinedText = `${job.title || ''} ${job.category || ''} ${job.job_type || ''} ${(job.tags || []).join(' ')}`.toLowerCase();

  return keywords.some(k => {
    const escaped = k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(combinedText) || combinedText.includes(k.toLowerCase());
  });
}
